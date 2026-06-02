const axios = require('axios');

exports.getLiveWeather = async (req, res) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const { lat, lon, city } = req.query;

  let url = '';
  if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  } else if (city) {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
  } else {
    // Default to New Delhi coordinates
    url = `https://api.openweathermap.org/data/2.5/weather?lat=28.6139&lon=77.2090&appid=${apiKey}&units=metric`;
  }

  try {
    const response = await axios.get(url);
    const wData = response.data;

    const temp_max = wData.main ? wData.main.temp_max : 25;
    const temp_min = wData.main ? wData.main.temp_min : 15;
    const windSpeedMps = wData.wind ? wData.wind.speed : 3;
    const windKmh = Number((windSpeedMps * 3.6).toFixed(1)); // Convert m/s to km/h

    let precipitation = 0;
    if (wData.rain) {
      precipitation = wData.rain['1h'] || wData.rain['3h'] || 0;
    }

    res.status(200).json({
      name: wData.name || 'Custom Location',
      temp_max: Number(temp_max.toFixed(1)),
      temp_min: Number(temp_min.toFixed(1)),
      wind: windKmh,
      precipitation: Number(precipitation.toFixed(1))
    });
  } catch (error) {
    console.error('Error fetching OpenWeather:', error.message);
    res.status(500).json({ error: 'Failed to fetch live weather from weather service' });
  }
};

exports.getWeeklyWeather = async (req, res) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const { lat, lon, city } = req.query;

  let url = '';
  if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  } else if (city) {
    url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
  } else {
    // Default to New Delhi coordinates
    url = `https://api.openweathermap.org/data/2.5/forecast?lat=28.6139&lon=77.2090&appid=${apiKey}&units=metric`;
  }

  try {
    const response = await axios.get(url);
    const wData = response.data;
    
    if (!wData.list || wData.list.length === 0) {
      throw new Error('No list in forecast data');
    }

    // Aggregate by day
    const dailyForecasts = {};
    wData.list.forEach(item => {
      // Extract date (YYYY-MM-DD)
      const dateStr = item.dt_txt.split(' ')[0];
      if (!dailyForecasts[dateStr]) {
        dailyForecasts[dateStr] = {
          date: dateStr,
          temp_max: -999,
          temp_min: 999,
          wind_speeds: [],
          precipitation: 0,
          weatherMain: item.weather[0] ? item.weather[0].main : 'Clear',
          weatherDesc: item.weather[0] ? item.weather[0].description : 'clear sky'
        };
      }

      const daily = dailyForecasts[dateStr];
      if (item.main.temp_max > daily.temp_max) daily.temp_max = item.main.temp_max;
      if (item.main.temp_min < daily.temp_min) daily.temp_min = item.main.temp_min;
      if (item.wind && item.wind.speed !== undefined) daily.wind_speeds.push(item.wind.speed);
      if (item.rain && item.rain['3h'] !== undefined) daily.precipitation += item.rain['3h'];
    });

    // Convert dailyForecasts object to array sorted by date
    const sortedDays = Object.values(dailyForecasts).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Limit to 5 days of actual forecast data (starting today)
    const forecastDays = sortedDays.slice(0, 5).map(day => {
      const avgWind = day.wind_speeds.length > 0
        ? day.wind_speeds.reduce((sum, w) => sum + w, 0) / day.wind_speeds.length
        : 3;
      const windKmh = Number((avgWind * 3.6).toFixed(1));
      return {
        date: day.date,
        temp_max: Number(day.temp_max.toFixed(1)),
        temp_min: Number(day.temp_min.toFixed(1)),
        wind: windKmh,
        precipitation: Number(day.precipitation.toFixed(1)),
        condition: day.weatherMain,
        description: day.weatherDesc
      };
    });

    // Call ML prediction model in parallel for each of the forecast days
    const predictionPromises = forecastDays.map(async (day) => {
      try {
        const mlResponse = await axios.post('http://localhost:5050/predict/weather', {
          precipitation: day.precipitation,
          temp_max: day.temp_max,
          temp_min: day.temp_min,
          wind: day.wind
        });
        return {
          ...day,
          predictedCondition: mlResponse.data.prediction,
          advice: mlResponse.data.advice
        };
      } catch (mlErr) {
        console.error(`ML prediction failed for date ${day.date}:`, mlErr.message);
        // Fallback prediction based on simple heuristics if ML fails
        let fallbackPred = 'Sun';
        let fallbackAdvice = 'Sunny conditions. Ideal for harvesting and irrigation.';
        if (day.precipitation > 2) {
          fallbackPred = 'Rain';
          fallbackAdvice = 'Heavy rainfall predicted. Postpone spraying and verify field drainage.';
        } else if (day.precipitation > 0) {
          fallbackPred = 'Drizzle';
          fallbackAdvice = 'Light drizzle expected. Monitor wind conditions before application.';
        }
        return {
          ...day,
          predictedCondition: fallbackPred,
          advice: fallbackAdvice
        };
      }
    });

    const resultDays = await Promise.all(predictionPromises);

    res.status(200).json({
      name: wData.city ? wData.city.name : (city || 'Custom Location'),
      forecast: resultDays
    });

  } catch (error) {
    console.error('Error fetching OpenWeather Weekly Forecast:', error.message);
    res.status(500).json({ error: 'Failed to fetch weekly forecast from weather service' });
  }
};
