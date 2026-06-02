const CropListing = require('../models/CropListing');
const Log = require('../models/Log');
const axios = require('axios');

// Allowed crop names from crop_recommendation.csv (in lowercase)
const ALLOWED_CROPS = [
  'rice', 'maize', 'chickpea', 'kidneybeans', 'pigeonpeas', 
  'mothbeans', 'mungbean', 'blackgram', 'lentil', 'pomegranate', 
  'banana', 'mango', 'grapes', 'watermelon', 'muskmelon', 
  'apple', 'orange', 'papaya', 'coconut', 'cotton', 'jute', 'coffee'
];

exports.createListing = async (req, res) => {
  const { cropName, category, quantity, price, imageUrl, farmerName, farmerPhone } = req.body;

  if (!cropName || !category || !quantity || !price || !farmerName || !farmerPhone) {
    return res.status(400).json({ message: 'All fields (except image) are required' });
  }

  const normalizedCrop = cropName.trim().toLowerCase();
  if (!ALLOWED_CROPS.includes(normalizedCrop)) {
    return res.status(400).json({ 
      message: `Invalid crop: "${cropName}". Crop must be one of: ${ALLOWED_CROPS.join(', ')}` 
    });
  }

  try {
    const newListing = await CropListing.create({
      cropName: cropName.trim(),
      category: category.trim(),
      quantity: Number(quantity),
      price: Number(price),
      imageUrl: imageUrl || '',
      farmerName: farmerName.trim(),
      farmerPhone: farmerPhone.trim(),
      userId: req.user.id
    });

    // Log this action
    await new Log({
      userId: req.user.id,
      action: `Listed crop for sale: ${cropName} (${quantity} kg @ Rs ${price}/kg)`
    }).save();

    res.status(201).json({ message: 'Crop listing created successfully', listing: newListing });
  } catch (error) {
    console.error('Error creating crop listing:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getListings = async (req, res) => {
  try {
    const listings = await CropListing.find({
      $or: [
        { approvalStatus: 'Approved' },
        { approvalStatus: { $exists: false } }
      ]
    }).sort({ createdAt: -1 });
    res.status(200).json({ listings });
  } catch (error) {
    console.error('Error fetching crop listings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteListing = async (req, res) => {
  try {
    const listing = await CropListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Only the farmer who created it or an admin can delete it
    if (listing.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await CropListing.findByIdAndDelete(req.params.id);

    // Log deletion
    await new Log({
      userId: req.user.id,
      action: `Deleted crop listing: ${listing.cropName}`
    }).save();

    res.status(200).json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting crop listing:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ────── Mandi Prices — Dual API with JSON Cache ──────

// API 1: "Current Daily Price of Various Commodities" — lowercase field names
const RESOURCE_CURRENT = '9ef84268-d588-465a-a308-a864a43d0070';
// API 2: "Variety-wise Daily Market Prices" — capitalized field names, has historical data
const RESOURCE_VARIETY = '35985678-0d79-46b4-9ed6-6f13308a1d24';

const fs = require('fs');
const path = require('path');
const CACHE_DIR = path.join(__dirname, '..', 'data');
const CACHE_PATH = path.join(CACHE_DIR, 'mandi_cache.json');

let mandiCache = null;

// Load cache from disk at startup if it exists
try {
  if (fs.existsSync(CACHE_PATH)) {
    mandiCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    console.log(`[Mandi Cache] Loaded ${mandiCache.records.length} records from disk.`);
  }
} catch (err) {
  console.error('[Mandi Cache] Failed to load cache from disk:', err.message);
}

// Format date as dd/MM/yyyy for the API
function formatDateForApi(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// Get IST "today" and recent fallback dates
function getRecentDates() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + (istOffset - now.getTimezoneOffset() * 60000));
  const dates = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(ist);
    d.setDate(d.getDate() - i);
    dates.push(formatDateForApi(d));
  }
  return dates;
}

// Title-case a string: "potato" → "Potato", "green peas" → "Green Peas"
function titleCase(str) {
  if (!str) return str;
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

// Common commodities list in Mandi prices to enable prefix/partial matching
const COMMON_COMMODITIES = [
  "Ajwan",
  "Amaranthus",
  "Amla(Nelli Kai)",
  "Amranthas Red",
  "Apple",
  "Apricot(Jardalu/Khumani)",
  "Arecanut(Betelnut/Supari)",
  "Arhar (Tur/Red Gram)(Whole)",
  "Ashgourd",
  "Baby Corn",
  "Bajra(Pearl Millet/Cumbu)",
  "Banana",
  "Banana - Green",
  "Barley(Jau)",
  "Beans",
  "Beetroot",
  "Bengal Gram Dal(Chana Dal)",
  "Bengal Gram(Gram)(Whole)",
  "Betal Leaves",
  "Bhindi(Ladies Finger)",
  "Bitter gourd",
  "Black Gram Dal(Urd Dal)",
  "Black Gram(Urd Beans)(Whole)",
  "Black pepper",
  "Bottle gourd",
  "Brinjal",
  "Broken Rice",
  "Bull",
  "Cabbage",
  "Capsicum",
  "Carrot",
  "Castor Seed",
  "Cauliflower",
  "Chicory(Chikori/Kasni)",
  "Chikoos(Sapota)",
  "Chili Red",
  "Chilly Capsicum",
  "Chow Chow",
  "Cluster beans",
  "Cock",
  "Coconut",
  "Coconut Oil",
  "Colacasia",
  "Coriander(Leaves)",
  "Cotton",
  "Cowpea(Lobia/Karamani)",
  "Cowpea(Veg)",
  "Cucumbar(Kheera)",
  "Cummin Seed(Jeera)",
  "Custard Apple(Sharifa)",
  "Dal Mix",
  "Drumstick",
  "Dry Chillies",
  "Elephant Yam(Suran)/Amorphophallus",
  "Field Pea",
  "Fig(Anjura/Anjeer)",
  "Firewood",
  "Fish",
  "Flowers-Others",
  "Foxtail Millet(Navane)",
  "French Beans(Frasbean)",
  "Galgal(Lemon)",
  "Garlic",
  "Ginger(Green)",
  "Goat",
  "Gram Raw(Chholia)",
  "Grapes",
  "Green Avare(W)",
  "Green Chilli",
  "Green Gram Dal(Moong Dal)",
  "Green Gram(Moong)(Whole)",
  "Green Peas",
  "Groundnut",
  "Groundnut pods(raw)",
  "Guar",
  "Guava",
  "Gur(Jaggery)",
  "Hen",
  "Indian Beans(Seam)",
  "Jack Fruit(Ripe)",
  "Jamun(Narale Hannu)",
  "Jasmine",
  "Jowar(Sorghum)",
  "Jute",
  "Kabuli Chana(Chickpeas-White)",
  "Kakada",
  "Karbuja(Musk Melon)",
  "Kartali(Kantola)",
  "Khandsari(Desi Khand)",
  "Kinnow",
  "Knool Khol",
  "Kodo Millet(Varagu)",
  "Kulthi(Horse Gram)",
  "Kutki",
  "Lak(Teora)",
  "Lemon",
  "Lentil(Masur)(Whole)",
  "Lime",
  "Linseed",
  "Litchi",
  "Little gourd(Kundru)",
  "Long Melon(Kakri)",
  "Mahua",
  "Maize",
  "Makhana(Foxnut)",
  "Mango",
  "Mango(Raw-Ripe)",
  "Marigold(Calcutta)",
  "Mashrooms",
  "Masur Dal",
  "Mentha Oil",
  "Methi Seeds",
  "Methi(Leaves)",
  "Millets",
  "Mint(Pudina)",
  "Mousambi(Sweet Lime)",
  "Mustard",
  "Neem Seed",
  "Niger Seed(Ramtil)",
  "Onion",
  "Onion Green",
  "Orange",
  "Other Pulses",
  "Ox",
  "Paddy(Common)",
  "Papaya",
  "Papaya(Raw)",
  "Pea Pod/Pea Cod/हरी मटर",
  "Peach",
  "Pear(Marasebu)",
  "Peas Wet",
  "Peas(Dry)",
  "Pegeon Pea(Arhar Fali)",
  "Pineapple",
  "Plum",
  "Pointed gourd(Parval)",
  "Pomegranate",
  "Potato",
  "Pumpkin",
  "Purslane",
  "Rab/Liquid Jaggery/Molasses",
  "Raddish",
  "Rajgir",
  "Rayee",
  "Red gram split/Arhar dal/Tur dal",
  "Red gram/Arhar/Tur(whole)",
  "Rice",
  "Ridgeguard(Tori)",
  "Rose(Local)",
  "Rubber",
  "Safflower",
  "Sesamum(Sesame,Gingelly,Til)",
  "She Buffalo",
  "Sheep",
  "Snakeguard",
  "Soanf",
  "Soyabean",
  "Spinach",
  "Squash(Chappal Kadoo)",
  "Sunflower/Sunflower Seed",
  "Sweet Corn",
  "Sweet Potato",
  "Sweet Pumpkin",
  "Sweet Saag",
  "Tamarind Fruit",
  "Tapioca",
  "Tender Coconut",
  "Tendu Leaves/Kendu leaves/Bidi Leaves",
  "Thondekai",
  "Tinda",
  "Tobacco",
  "Tomato",
  "Tube Flower",
  "Tube Rose(Loose)",
  "Turmeric",
  "Turnip",
  "Water Melon",
  "Wheat",
  "Wood",
  "Yam(Ratalu)",
  "buttery",
  "dried mango",
  "karanja seeds",
  "mango powder"
];

function getBestMatchingCommodity(query) {
  if (!query) return '';
  const q = query.trim().toLowerCase();
  const matches = COMMON_COMMODITIES.filter(c => c.toLowerCase().includes(q));
  if (matches.length === 0) return '';
  
  matches.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    const aIdx = aLower.indexOf(q);
    const bIdx = bLower.indexOf(q);
    
    if (aIdx === 0 && bIdx !== 0) return -1;
    if (bIdx === 0 && aIdx !== 0) return 1;
    
    return a.length - b.length;
  });
  
  return matches[0];
}

// Normalize state names (API uses variant spellings)
const STATE_ALIASES = {
  'keralam': 'Kerala',
  'pondicherry': 'Puducherry',
  'orissa': 'Odisha',
  'uttaranchal': 'Uttarakhand',
  'uttrakhand': 'Uttarakhand',
  'chattisgarh': 'Chhattisgarh',
  'nct of delhi': 'Delhi'
};

function normalizeState(raw) {
  if (!raw) return 'N/A';
  const trimmed = raw.trim();
  return STATE_ALIASES[trimmed.toLowerCase()] || trimmed;
}

// Outbound state mapping for API 1 (Current Daily Price)
const STATE_MAP_CURRENT = {
  'kerala': 'Keralam',
  'delhi': 'NCT of Delhi',
  'chhattisgarh': 'Chattisgarh',
  'uttarakhand': 'Uttarakhand'
};

// Outbound state mapping for API 2 (Variety-wise)
const STATE_MAP_VARIETY = {
  'kerala': 'Kerala',
  'delhi': 'NCT of Delhi',
  'chhattisgarh': 'Chattisgarh',
  'uttarakhand': 'Uttrakhand',
  'puducherry': 'Pondicherry'
};

function mapStateForCurrent(state) {
  if (!state) return '';
  const key = state.trim().toLowerCase();
  return STATE_MAP_CURRENT[key] || state;
}

function mapStateForVariety(state) {
  if (!state) return '';
  const key = state.trim().toLowerCase();
  return STATE_MAP_VARIETY[key] || state;
}

// Normalize a record from either API into a common shape
function normalizeRecord(rec) {
  return {
    crop: rec.Commodity || rec.commodity || 'Unknown Crop',
    variety: rec.Variety || rec.variety || '',
    state: normalizeState(rec.State || rec.state || ''),
    district: rec.District || rec.district || '',
    market: rec.Market || rec.market || '',
    min: Number(rec.Min_Price || rec.min_price) || 0,
    max: Number(rec.Max_Price || rec.max_price) || 0,
    avg: Number(rec.Modal_Price || rec.modal_price) || 0,
    arrivalDate: rec.Arrival_Date || rec.arrival_date || '',
    grade: rec.Grade || rec.grade || ''
  };
}

// Dedup key for a record
function recordKey(r) {
  return `${r.crop}|${r.variety}|${r.state}|${r.district}|${r.market}|${r.arrivalDate}`.toLowerCase();
}

// Build URL for the "Current Daily" API (resource 1 — lowercase filters)
function buildCurrentUrl(apiKey, { state, commodity, offset = 0, limit = 500 }) {
  const mappedState = mapStateForCurrent(state);
  let url = `https://api.data.gov.in/resource/${RESOURCE_CURRENT}?api-key=${apiKey}&format=json&limit=${limit}&offset=${offset}`;
  if (mappedState) url += `&filters[state.keyword]=${encodeURIComponent(mappedState)}`;
  if (commodity) {
    url += `&filters[commodity]=${encodeURIComponent(commodity)}`;
  }
  return url;
}

// Build URL for the "Variety-wise" API (resource 2 — capitalized filters)
function buildVarietyUrl(apiKey, { state, commodity, district, date, offset = 0, limit = 500 }) {
  const mappedState = mapStateForVariety(state);
  let url = `https://api.data.gov.in/resource/${RESOURCE_VARIETY}?api-key=${apiKey}&format=json&limit=${limit}&offset=${offset}`;
  if (mappedState) url += `&filters[State]=${encodeURIComponent(mappedState)}`;
  if (commodity) {
    url += `&filters[Commodity]=${encodeURIComponent(commodity)}`;
  }
  if (district) url += `&filters[District]=${encodeURIComponent(district)}`;
  if (date) url += `&filters[Arrival_Date]=${encodeURIComponent(date)}`;
  return url;
}

// Safely fetch records from a URL, return { records, total }
async function fetchRecords(url) {
  try {
    const response = await axios.get(url, { timeout: 15000 });
    if (response.data && response.data.records) {
      return { records: response.data.records, total: response.data.total || 0 };
    }
  } catch (err) {
    console.warn('Mandi API fetch failed:', url.substring(0, 80), err.message);
  }
  return { records: [], total: 0 };
}

// Merge and deduplicate records from both APIs
function mergeRecords(recordsA, recordsB) {
  const seen = new Set();
  const merged = [];
  for (const raw of [...recordsA, ...recordsB]) {
    const rec = normalizeRecord(raw);
    const key = recordKey(rec);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(rec);
    }
  }
  return merged;
}

// Fetch all latest data and write to JSON cache
async function refreshMandiCache(apiKey) {
  console.log('[Mandi Cache] Fetching all live data to refresh cache...');

  // 1. Fetch Current Daily Price API (limit=10000 to get all ~9.8k records)
  const currentUrl = `https://api.data.gov.in/resource/${RESOURCE_CURRENT}?api-key=${apiKey}&format=json&limit=10000`;
  const currentData = await fetchRecords(currentUrl);
  console.log(`[Mandi Cache] Fetched ${currentData.records.length} records from Current API (Total on API: ${currentData.total})`);

  // 2. Fetch Variety-wise API for latest available date
  const recentDates = getRecentDates();
  let varietyRecords = [];
  let foundDate = recentDates[0];

  for (const tryDate of recentDates) {
    const checkUrl = `https://api.data.gov.in/resource/${RESOURCE_VARIETY}?api-key=${apiKey}&format=json&filters[Arrival_Date]=${encodeURIComponent(tryDate)}&limit=1`;
    const checkData = await fetchRecords(checkUrl);
    
    if (checkData.total > 0) {
      foundDate = tryDate;
      const total = checkData.total;
      console.log(`[Mandi Cache] Found ${total} records on ${tryDate}. Fetching all records in batches of 10000...`);
      
      const batchSize = 10000;
      for (let offset = 0; offset < total; offset += batchSize) {
        const batchUrl = `https://api.data.gov.in/resource/${RESOURCE_VARIETY}?api-key=${apiKey}&format=json&filters[Arrival_Date]=${encodeURIComponent(tryDate)}&limit=${batchSize}&offset=${offset}`;
        const batchData = await fetchRecords(batchUrl);
        varietyRecords.push(...batchData.records);
        // Small delay to be gentle on the government API
        await new Promise(r => setTimeout(r, 300));
      }
      break;
    }
  }

  console.log(`[Mandi Cache] Fetched ${varietyRecords.length} records from Variety API`);

  // 3. Merge and deduplicate
  const seen = new Set();
  const merged = [];

  for (const raw of [...currentData.records, ...varietyRecords]) {
    const normalized = normalizeRecord(raw);
    const key = recordKey(normalized);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(normalized);
    }
  }

  console.log(`[Mandi Cache] Merged and deduplicated. Total unique records: ${merged.length}`);

  const cacheContent = {
    lastRefreshed: new Date().toISOString(),
    date: foundDate,
    records: merged
  };

  // Write to disk
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cacheContent, null, 2), 'utf8');

  // Update memory reference
  mandiCache = cacheContent;
}

// In-memory cache filter helper
function filterCache(records, state, commodity, district) {
  let results = records;
  if (state) {
    const s = state.trim().toLowerCase();
    results = results.filter(r => r.state.toLowerCase() === s);
  }
  if (commodity) {
    const c = commodity.trim().toLowerCase();
    results = results.filter(r => r.crop.toLowerCase().includes(c));
  }
  if (district) {
    const d = district.trim().toLowerCase();
    results = results.filter(r => r.district.toLowerCase().includes(d) || r.market.toLowerCase().includes(d));
  }
  return results;
}

// GET /api/crops/mandi-prices?state=&commodity=&district=&date=dd/MM/yyyy&offset=0&limit=500&refresh=true
exports.getMandiPrices = async (req, res) => {
  const apiKey = process.env.DATA_GOV_API_KEY;
  const { state, district } = req.query;
  const rawCommodity = req.query.commodity || '';
  const offset = parseInt(req.query.offset) || 0;
  const limit = Math.min(parseInt(req.query.limit) || 500, 1000);
  const requestedDate = req.query.date || null;
  const forceRefresh = req.query.refresh === 'true';

  // 1. Initialize cache if null
  if (!mandiCache) {
    if (fs.existsSync(CACHE_PATH)) {
      try {
        mandiCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
      } catch (e) {
        console.error('Failed to parse mandi cache:', e.message);
      }
    }
    if (!mandiCache) {
      try {
        await refreshMandiCache(apiKey);
      } catch (err) {
        console.error('[Mandi Cache] Initial refresh failed:', err.message);
        mandiCache = { lastRefreshed: new Date(0).toISOString(), date: getRecentDates()[0], records: [] };
      }
    }
  }

  // 2. Handle Force Refresh request
  if (forceRefresh) {
    const now = Date.now();
    const lastRefreshedTime = new Date(mandiCache.lastRefreshed).getTime();
    const oneHour = 3600000; // 1 hour in ms

    if (now - lastRefreshedTime < oneHour) {
      console.warn(`[Mandi Cache] Rate limit hit. Last refreshed at ${mandiCache.lastRefreshed}. Refusing API call.`);
      try {
        const Log = require('../models/Log');
        await new Log({
          userId: req.user.id,
          action: `Attempted Mandi prices cache refresh (Refused: limit is once per hour)`
        }).save();
      } catch (e) {
        console.error('Log save error:', e.message);
      }

      const filtered = filterCache(mandiCache.records, state, rawCommodity, district);
      const sliced = filtered.slice(offset, offset + limit);

      return res.status(200).json({
        prices: sliced,
        total: filtered.length,
        offset,
        limit,
        date: mandiCache.date,
        lastRefreshed: mandiCache.lastRefreshed,
        hasMore: (offset + sliced.length) < filtered.length,
        rateLimited: true,
        message: 'Mandi prices can only be refreshed once per hour. Showing cached data.'
      });
    }

    // Refresh is allowed (> 1 hour)
    try {
      await refreshMandiCache(apiKey);
      
      const Log = require('../models/Log');
      await new Log({
        userId: req.user.id,
        action: `Refreshed Live Mandi Prices Cache`
      }).save();
    } catch (err) {
      console.error('[Mandi Cache] Forced refresh failed:', err.message);
      return res.status(502).json({ message: 'Unable to refresh live mandi prices. Government API failed.', error: err.message });
    }
  }

  // 3. Serve from Cache or API depending on Date
  // If date matches cache date OR no specific date is requested, serve from Cache
  if (!requestedDate || requestedDate === mandiCache.date) {
    const filtered = filterCache(mandiCache.records, state, rawCommodity, district);
    const sliced = filtered.slice(offset, offset + limit);

    return res.status(200).json({
      prices: sliced,
      total: filtered.length,
      offset,
      limit,
      date: mandiCache.date,
      lastRefreshed: mandiCache.lastRefreshed,
      hasMore: (offset + sliced.length) < filtered.length
    });
  }

  // ── Otherwise: Historical browse date. Fetch from API directly using resolved best-matching crop. ──
  const bestMatch = getBestMatchingCommodity(rawCommodity);
  const queryCommodity = bestMatch || (rawCommodity ? titleCase(rawCommodity) : '');

  try {
    const [currentData, varietyData] = await Promise.all([
      fetchRecords(buildCurrentUrl(apiKey, { state, commodity: queryCommodity, offset, limit })),
      fetchRecords(buildVarietyUrl(apiKey, { state, commodity: queryCommodity, district, date: requestedDate, offset, limit }))
    ]);

    const currentFiltered = currentData.records.filter(r => {
      const rd = r.arrival_date || '';
      return rd === requestedDate || rd.replace(/\//g, '/') === requestedDate;
    });

    const merged = mergeRecords(currentFiltered, varietyData.records);
    const total = varietyData.total || merged.length;

    return res.status(200).json({
      prices: merged,
      total,
      offset,
      limit,
      date: requestedDate,
      hasMore: (offset + varietyData.records.length) < varietyData.total
    });

  } catch (error) {
    console.error('Error fetching historical Mandi prices:', error.message);
    res.status(502).json({ message: 'Unable to fetch historical mandi prices.', error: error.message });
  }
};

// GET /api/crops/mandi-states — all Indian states/UTs
exports.getMandiStates = async (req, res) => {
  const states = [
    'Andaman and Nicobar', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
    'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli',
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
    'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala',
    'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra',
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
    'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];
  res.status(200).json({ states });
};

