import os
import requests
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

# Paths
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# Dataset URLs
WEATHER_URL = "https://raw.githubusercontent.com/vega/vega/main/docs/data/seattle-weather.csv"
FERTILIZER_URL = "https://raw.githubusercontent.com/Lanchavi/AgroTechh/main/Fertilizer%20Prediction.csv"
CROP_URL = "https://raw.githubusercontent.com/Gladiator07/Harvestify/master/Data-processed/crop_recommendation.csv"

def download_csv(url, filepath):
    print(f"Downloading dataset from {url}...")
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        with open(filepath, 'wb') as f:
            f.write(response.content)
        print(f"Saved to {filepath}")
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

def train_weather_model():
    print("\n--- Training Weather Prediction Model ---")
    local_csv = os.path.join(DATA_DIR, "seattle-weather.csv")
    if not download_csv(WEATHER_URL, local_csv):
        print("Failed to download weather data. Creating fallback synthetic data.")
        # Fallback synthetic data
        np.random.seed(42)
        n = 1000
        precipitation = np.random.exponential(scale=3, size=n)
        temp_max = np.random.normal(loc=16, scale=8, size=n)
        temp_min = temp_max - np.random.uniform(2, 12, size=n)
        wind = np.random.uniform(1, 8, size=n)
        weather = []
        for i in range(n):
            if precipitation[i] > 5 and temp_min[i] < 2:
                weather.append("snow")
            elif precipitation[i] > 2:
                weather.append("rain")
            elif temp_max[i] > 22 and wind[i] < 3:
                weather.append("sun")
            elif wind[i] > 5:
                weather.append("drizzle")
            else:
                weather.append("fog")
        df = pd.DataFrame({
            'precipitation': precipitation,
            'temp_max': temp_max,
            'temp_min': temp_min,
            'wind': wind,
            'weather': weather
        })
    else:
        df = pd.read_csv(local_csv)

    # Preprocessing
    df = df.dropna()
    X = df[['precipitation', 'temp_max', 'temp_min', 'wind']]
    y = df['weather']

    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=200, max_depth=12, min_samples_split=5, min_samples_leaf=2, random_state=42)
    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)
    print(f"Weather model trained with accuracy: {accuracy:.4f}")

    # Save
    joblib.dump(model, os.path.join(MODELS_DIR, "weather_model.joblib"))
    joblib.dump(le, os.path.join(MODELS_DIR, "weather_encoder.joblib"))
    print("Saved weather model and label encoder.")

def train_fertilizer_model():
    print("\n--- Training Fertilizer Recommendation Model ---")
    local_csv = os.path.join(DATA_DIR, "fertilizer_prediction.csv")
    if not download_csv(FERTILIZER_URL, local_csv):
        print("Failed to download fertilizer data. Creating fallback synthetic data.")
        # Fallback synthetic data
        np.random.seed(42)
        n = 500
        temp = np.random.uniform(15, 40, size=n)
        humidity = np.random.uniform(30, 90, size=n)
        moisture = np.random.uniform(20, 70, size=n)
        soil_type = np.random.choice(['Sandy', 'Loamy', 'Black', 'Red', 'Clayey'], size=n)
        crop_type = np.random.choice(['Sugarcane', 'Paddy', 'Wheat', 'Maize', 'Cotton'], size=n)
        n_ratio = np.random.uniform(10, 150, size=n)
        p_ratio = np.random.uniform(10, 100, size=n)
        k_ratio = np.random.uniform(10, 100, size=n)
        
        fertilizers = []
        for i in range(n):
            if n_ratio[i] > 100 and p_ratio[i] < 40:
                fertilizers.append("Urea")
            elif p_ratio[i] > 60 and n_ratio[i] < 50:
                fertilizers.append("DAP")
            elif k_ratio[i] > 50 and n_ratio[i] < 60:
                fertilizers.append("10-26-26")
            elif n_ratio[i] > 50 and p_ratio[i] > 50:
                fertilizers.append("NPK 14-35-14")
            else:
                fertilizers.append("17-17-17")
        df = pd.DataFrame({
            'Temparature': temp,
            'Humidity': humidity,
            'Moisture': moisture,
            'Soil Type': soil_type,
            'Crop Type': crop_type,
            'Nitrogen': n_ratio,
            'Phosphorous': p_ratio,
            'Potassium': k_ratio,
            'Fertilizer Name': fertilizers
        })
    else:
        df = pd.read_csv(local_csv)
        # Clean column names (strip trailing spaces)
        df.columns = [c.strip() for c in df.columns]

    # Preprocessing
    df = df.dropna()
    
    # Categorical encoders
    le_soil = LabelEncoder()
    df['Soil Type'] = le_soil.fit_transform(df['Soil Type'])

    le_crop = LabelEncoder()
    df['Crop Type'] = le_crop.fit_transform(df['Crop Type'])

    le_fert = LabelEncoder()
    y = le_fert.fit_transform(df['Fertilizer Name'])

    X = df[['Temparature', 'Humidity', 'Moisture', 'Soil Type', 'Crop Type', 'Nitrogen', 'Phosphorous', 'Potassium']]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=200, max_depth=12, min_samples_split=5, min_samples_leaf=2, random_state=42)
    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)
    print(f"Fertilizer model trained with accuracy: {accuracy:.4f}")

    # Save
    joblib.dump(model, os.path.join(MODELS_DIR, "fertilizer_model.joblib"))
    joblib.dump(le_soil, os.path.join(MODELS_DIR, "soil_encoder.joblib"))
    joblib.dump(le_crop, os.path.join(MODELS_DIR, "crop_encoder.joblib"))
    joblib.dump(le_fert, os.path.join(MODELS_DIR, "fertilizer_encoder.joblib"))
    print("Saved fertilizer model and categorical encoders.")

def train_crop_model():
    print("\n--- Training Crop Recommendation Model ---")
    local_csv = os.path.join(DATA_DIR, "crop_recommendation.csv")
    if not download_csv(CROP_URL, local_csv):
        print("Failed to download crop data. Creating fallback synthetic data.")
        # Fallback synthetic data
        np.random.seed(42)
        n = 500
        n_ratio = np.random.uniform(10, 140, size=n)
        p_ratio = np.random.uniform(10, 100, size=n)
        k_ratio = np.random.uniform(10, 100, size=n)
        temp = np.random.uniform(15, 38, size=n)
        hum = np.random.uniform(35, 95, size=n)
        ph = np.random.uniform(4.5, 8.5, size=n)
        rain = np.random.uniform(40, 250, size=n)
        
        crops = []
        for i in range(n):
            if rain[i] > 180:
                crops.append("rice")
            elif temp[i] > 30 and hum[i] < 50:
                crops.append("mango")
            elif ph[i] < 5.5:
                crops.append("tea")
            elif n_ratio[i] > 80:
                crops.append("maize")
            else:
                crops.append("wheat")
        df = pd.DataFrame({
            'N': n_ratio, 'P': p_ratio, 'K': k_ratio,
            'temperature': temp, 'humidity': hum, 'ph': ph, 'rainfall': rain,
            'label': crops
        })
    else:
        df = pd.read_csv(local_csv)

    # Preprocessing
    df = df.dropna()
    X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
    y = df['label']

    le_crop = LabelEncoder()
    y_encoded = le_crop.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=200, max_depth=12, min_samples_split=5, min_samples_leaf=2, random_state=42)
    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)
    print(f"Crop model trained with accuracy: {accuracy:.4f}")

    # Save
    joblib.dump(model, os.path.join(MODELS_DIR, "crop_model.joblib"))
    joblib.dump(le_crop, os.path.join(MODELS_DIR, "crop_rec_encoder.joblib"))
    print("Saved crop recommendation model and encoder.")

if __name__ == "__main__":
    train_weather_model()
    train_fertilizer_model()
    train_crop_model()
    print("\nAll models trained and ready!")
