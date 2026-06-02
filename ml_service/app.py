import os
import json
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# Paths
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

# Load models and encoders
print("Loading ML models and encoders...")
try:
    weather_model = joblib.load(os.path.join(MODELS_DIR, "weather_model.joblib"))
    weather_encoder = joblib.load(os.path.join(MODELS_DIR, "weather_encoder.joblib"))
    
    fertilizer_model = joblib.load(os.path.join(MODELS_DIR, "fertilizer_model.joblib"))
    soil_encoder = joblib.load(os.path.join(MODELS_DIR, "soil_encoder.joblib"))
    crop_encoder = joblib.load(os.path.join(MODELS_DIR, "crop_encoder.joblib"))
    fertilizer_encoder = joblib.load(os.path.join(MODELS_DIR, "fertilizer_encoder.joblib"))
    
    crop_model = joblib.load(os.path.join(MODELS_DIR, "crop_model.joblib"))
    crop_rec_encoder = joblib.load(os.path.join(MODELS_DIR, "crop_rec_encoder.joblib"))
    print("All models loaded successfully!")
except Exception as e:
    print(f"Warning: Could not load trained models. Please run train_models.py first. Error: {e}")

# Load datasets
subsidies_df = pd.read_csv(os.path.join(DATA_DIR, "subsidies.csv"))

# Subsidy FAQ data state
subsidy_corpus = []
subsidy_mappings = []
subsidy_vectors = None
subsidy_vectorizer = None

# Website FAQ data state
website_corpus = []
website_mappings = []
website_vectors = None
website_vectorizer = None

def compute_hybrid_score(query_text, faq_item, tfidf_score):
    import difflib
    query_lower = query_text.lower().strip()
    question_lower = faq_item['question'].lower().strip()
    
    # 1. Cosine TF-IDF score (bound to [0,1])
    cos_score = max(0.0, min(1.0, float(tfidf_score)))
    
    # 2. SequenceMatcher similarity on question
    seq_ratio = difflib.SequenceMatcher(None, query_lower, question_lower).ratio()
    
    # 3. Keyword substring match overlap
    kw_match_count = 0
    keywords = faq_item.get('keywords', [])
    for kw in keywords:
        kw_clean = kw.lower().strip()
        if kw_clean and kw_clean in query_lower:
            kw_match_count += 1
            
    kw_score = kw_match_count / max(1, len(keywords)) if keywords else 0.0
    
    # Combined score
    hybrid_score = 0.5 * cos_score + 0.3 * seq_ratio + 0.2 * kw_score
    
    # Match tag boost
    for kw in keywords:
        kw_clean = kw.lower().strip()
        if kw_clean and kw_clean in query_lower and len(kw_clean) > 3:
            hybrid_score += 0.15
            
    return min(1.0, hybrid_score)

def load_faq_data():
    global subsidy_corpus, subsidy_mappings, subsidy_vectors, subsidy_vectorizer
    global website_corpus, website_mappings, website_vectors, website_vectorizer
    import requests

    # 1. Load Subsidy FAQs (Always from subsidy_faqs.json)
    try:
        local_path = os.path.join(DATA_DIR, "subsidy_faqs.json")
        if os.path.exists(local_path):
            with open(local_path, "r") as f:
                local_faqs = json.load(f)
            new_sub_corpus = []
            new_sub_mappings = []
            for faq in local_faqs:
                text_repr = f"{faq['question']} {' '.join(faq['keywords'])} {faq['answer']}"
                new_sub_corpus.append(text_repr)
                new_sub_mappings.append({'question': faq['question'], 'answer': faq['answer'], 'keywords': faq.get('keywords', [])})
            
            if new_sub_corpus:
                v = TfidfVectorizer(stop_words='english')
                subsidy_vectors = v.fit_transform(new_sub_corpus)
                subsidy_vectorizer = v
                subsidy_corpus = new_sub_corpus
                subsidy_mappings = new_sub_mappings
                print(f"Loaded and indexed {len(new_sub_corpus)} subsidy FAQs from local JSON.")
        else:
            print("Warning: subsidy_faqs.json not found.")
    except Exception as e:
        print(f"Error loading subsidy FAQs: {e}")

    # 2. Load Website FAQs (From Express API, fallback to default seed list)
    loaded_api = False
    try:
        print("Attempting to load website FAQ training data from Express backend...")
        res = requests.get('http://localhost:5000/api/faqs/training-data', timeout=3)
        if res.status_code == 200:
            data = res.json()
            faqs_list = data.get('faqs', [])
            queries_list = data.get('approvedQueries', [])
            
            new_web_corpus = []
            new_web_mappings = []
            
            for f in faqs_list:
                k = f.get('keywords', [])
                text_repr = f"{f['question']} {' '.join(k)} {f['answer']}"
                new_web_corpus.append(text_repr)
                new_web_mappings.append({'question': f['question'], 'answer': f['answer'], 'keywords': k})
                
            for q in queries_list:
                text_repr = f"{q['question']} {q['answer']}"
                new_web_corpus.append(text_repr)
                new_web_mappings.append({'question': q['question'], 'answer': q['answer'], 'keywords': []})
                
            if new_web_corpus:
                v = TfidfVectorizer(stop_words='english')
                website_vectors = v.fit_transform(new_web_corpus)
                website_vectorizer = v
                website_corpus = new_web_corpus
                website_mappings = new_web_mappings
                loaded_api = True
                print(f"Successfully loaded and vectorized {len(new_web_corpus)} website FAQ/Query entries from Express API.")
    except Exception as e:
        print(f"Could not connect to Express API for website FAQs: {e}. Falling back to default list.")

    if not loaded_api:
        default_website_faqs = [
            {
                "question": "Who built this platform and who are the project leads?",
                "answer": "The project leads for AgroMitra are Vrishank Raina and Raushan Shrivastawa. Vrishank Raina is responsible for the backend architecture and machine learning models, while Raushan Shrivastawa leads the frontend interface design and user experience development.",
                "keywords": ["leads", "built", "who", "vrishank", "raina", "vrishank raina", "raushan", "shrivastawa", "raushan shrivastawa", "creator", "backend", "frontend", "developers"]
            },
            {
                "question": "What is Vrishank Raina's role in the AgroMitra project?",
                "answer": "Vrishank Raina is the Backend and Machine Learning Architect for AgroMitra. He designed the server-side framework using Express and Node.js, established the MongoDB database models, implemented the API routing and security, and engineered the Python Flask ML microservice which powers weather forecasts, fertilizer advice, crop suggestions, and the FAQ search models.",
                "keywords": ["vrishank", "vrishank raina", "backend", "ml", "machine learning", "flask", "express", "node", "database", "mongodb", "routing", "developer", "architect"]
            },
            {
                "question": "What is Raushan Shrivastawa's role in the AgroMitra project?",
                "answer": "Raushan Shrivastawa is the Frontend Lead and UI/UX Designer for AgroMitra. He built the entire client application using React, created the interactive farmer and admin dashboards, integrated charts, responsive grid layouts, custom UI components, and designed the premium look-and-feel of the application, including the custom theme context for light and dark modes.",
                "keywords": ["raushan", "raushan shrivastawa", "frontend", "react", "ui", "ux", "design", "theme", "dashboard", "layout", "visuals", "interface"]
            },
            {
                "question": "What agricultural services does AgroMitra provide?",
                "answer": "AgroMitra offers a suite of intelligent services including live weather forecast with smart advisories, crop recommendation based on NPK parameters, fertilizer suggestion, live Mandi pricing from data.gov.in, and a crop marketplace.",
                "keywords": ["services", "features", "mandi", "weather", "fertilizer"]
            },
            {
                "question": "How does the soil testing service work?",
                "answer": "Farmers can schedule a soil sample pickup from their dashboard. Our agents will collect the sample, analyze it, and the admin will upload the NPK results directly to your profile. You can then import these results directly into the Fertilizer Advisor.",
                "keywords": ["soil", "test", "testing", "pickup", "sample"]
            }
        ]
        new_web_corpus = []
        new_web_mappings = []
        for faq in default_website_faqs:
            text_repr = f"{faq['question']} {' '.join(faq['keywords'])} {faq['answer']}"
            new_web_corpus.append(text_repr)
            new_web_mappings.append({'question': faq['question'], 'answer': faq['answer'], 'keywords': faq.get('keywords', [])})
            
        v = TfidfVectorizer(stop_words='english')
        website_vectors = v.fit_transform(new_web_corpus)
        website_vectorizer = v
        website_corpus = new_web_corpus
        website_mappings = new_web_mappings
        print(f"Loaded {len(new_web_corpus)} fallback website FAQ entries.")

# Initialize indexes
load_faq_data()

# --- Endpoints ---

@app.route('/predict/weather', methods=['POST'])
def predict_weather():
    try:
        data = request.get_json()
        precipitation = float(data.get('precipitation', 0))
        temp_max = float(data.get('temp_max', 20))
        temp_min = float(data.get('temp_min', 10))
        wind = float(data.get('wind', 3))
        
        # Format: [[precipitation, temp_max, temp_min, wind]]
        features = [[precipitation, temp_max, temp_min, wind]]
        pred_idx = weather_model.predict(features)[0]
        prediction = weather_encoder.inverse_transform([pred_idx])[0]
        
        # Agricultural advice based on weather
        advice = ""
        if prediction == "rain":
            advice = "Heavy rainfall predicted. Postpone spraying pesticides or fertilizers to avoid chemical runoff. Ensure proper soil drainage in crop fields."
        elif prediction == "sun":
            advice = "Sunny conditions. Ideal for harvesting, sowing, and drying grains. Keep soil moisture monitored and irrigate if necessary."
        elif prediction == "fog":
            advice = "Foggy conditions. High humidity can encourage pest and fungal growth. Inspect crop leaves closely. Exercise caution in transit."
        elif prediction == "snow":
            advice = "Freezing temperatures and snow expected. Protect frost-sensitive crops and cover young saplings. Ensure livestock shelter heating."
        else: # drizzle
            advice = "Light drizzle expected. Favorable for mild soil moisture retention, but monitor wind speed before applying light powders."
            
        return jsonify({
            'prediction': prediction.capitalize(),
            'advice': advice
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/predict/fertilizer', methods=['POST'])
def predict_fertilizer():
    try:
        data = request.get_json()
        temp = float(data.get('temperature', 25))
        humidity = float(data.get('humidity', 60))
        moisture = float(data.get('moisture', 40))
        soil_type = data.get('soil_type', 'Sandy')
        crop_type = data.get('crop_type', 'Wheat')
        n = float(data.get('nitrogen', 40))
        p = float(data.get('phosphorous', 40))
        k = float(data.get('potassium', 40))
        
        # Transform labels
        # Helper: handle unseen categories gracefully by falling back to the first class
        try:
            soil_encoded = soil_encoder.transform([soil_type])[0]
        except Exception:
            soil_encoded = soil_encoder.transform([soil_encoder.classes_[0]])[0]
            
        try:
            crop_encoded = crop_encoder.transform([crop_type])[0]
        except Exception:
            crop_encoded = crop_encoder.transform([crop_encoder.classes_[0]])[0]
            
        features = [[temp, humidity, moisture, soil_encoded, crop_encoded, n, p, k]]
        pred_idx = fertilizer_model.predict(features)[0]
        prediction = fertilizer_encoder.inverse_transform([pred_idx])[0]
        
        # Guidelines
        guidelines = f"Apply recommended {prediction} based on soil profile. Optimal dosage varies depending on target soil organic content."
        if "Urea" in prediction:
            guidelines = "Urea is high in Nitrogen. Recommended to broadcast in split dosages, ideally during vegetative growth phase."
        elif "DAP" in prediction:
            guidelines = "DAP (Diammonium Phosphate) provides Phosphorous. Apply near seeds during sowing for deep root development."
        elif "NPK" in prediction or "10-26-26" in prediction:
            guidelines = "NPK provides complex balanced nutrients. Mix with soil before sowing to enrich nitrogen, phosphorous, and potassium uptake."
            
        return jsonify({
            'recommendation': prediction,
            'guidelines': guidelines
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/predict/subsidies', methods=['POST'])
def predict_subsidies():
    try:
        data = request.get_json() or {}
        
        user_state = data.get('state', '')
        if user_state is None:
            user_state = ''
        user_state = str(user_state).strip().lower()
        
        user_crop = data.get('crop', '')
        if user_crop is None:
            user_crop = ''
        user_crop = str(user_crop).strip().lower()
        
        user_land_val = data.get('land_acres', 0)
        user_land = float(user_land_val) if user_land_val and str(user_land_val).strip() else 0.0
        
        user_income_val = data.get('income', 0)
        user_income = float(user_income_val) if user_income_val and str(user_income_val).strip() else 0.0
        
        eligible_subsidies = []
        
        for _, row in subsidies_df.iterrows():
            row_state = str(row['State']).strip().lower()
            row_crop = str(row['Crop']).strip().lower()
            row_land = float(row['Max_Land_Acres'])
            row_income = float(row['Max_Income'])
            
            # Check state match
            state_match = (user_state == '') or (user_state == 'all') or (row_state == 'all') or (user_state == row_state)
            
            # Check crop match
            crop_match = (user_crop == '') or (user_crop == 'all') or (row_crop == 'all') or (user_crop == row_crop)
            
            # Check land match
            land_match = user_land <= row_land
            
            # Check income match
            income_match = user_income <= row_income
            
            # Calculate match percentage
            score = 0
            if state_match: score += 25
            if crop_match: score += 25
            if land_match: score += 25
            if income_match: score += 25
            
            # If all parameters pass, user is fully eligible
            is_eligible = state_match and crop_match and land_match and income_match
            
            eligible_subsidies.append({
                'scheme': row['Scheme'],
                'subsidy_amount': int(row['Subsidy_Amount']),
                'category': row['Category'],
                'description': row['Description'],
                'match_percentage': score,
                'is_eligible': is_eligible
            })
            
        # Sort so fully eligible are first, then sorted by match percentage
        eligible_subsidies = sorted(eligible_subsidies, key=lambda x: (x['is_eligible'], x['match_percentage']), reverse=True)
            
        return jsonify({
            'subsidies': eligible_subsidies
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/query/subsidy', methods=['POST'])
def query_subsidy():
    try:
        data = request.get_json() or {}
        query_text = data.get('query', '').strip()
        if not query_text:
            return jsonify({
                'answer': "I didn't catch that. Could you please type a query about agricultural subsidies (e.g. 'How do I register for PM-Kisan')?"
            })
            
        if subsidy_vectorizer is None or subsidy_vectors is None or not subsidy_mappings:
            return jsonify({
                'answer': "Subsidy FAQ engine is loading, please try again shortly."
            })
            
        # Transform query and compute similarities
        query_vec = subsidy_vectorizer.transform([query_text])
        similarities = cosine_similarity(query_vec, subsidy_vectors).flatten()
        
        # Compute hybrid score
        hybrid_scores = [compute_hybrid_score(query_text, mapped, similarities[idx]) for idx, mapped in enumerate(subsidy_mappings)]
        best_match_idx = np.argmax(hybrid_scores)
        best_score = hybrid_scores[best_match_idx]
        
        # Threshold check
        if best_score > 0.22:
            matched_faq = subsidy_mappings[best_match_idx]
            return jsonify({
                'question': matched_faq['question'],
                'answer': matched_faq['answer'],
                'score': float(best_score)
            })
        else:
            return jsonify({
                'answer': "I couldn't find a direct match for your question. Here are some options you can ask me about: \n- *PM-Kisan* Samman Nidhi registration or documents\n- *PM Fasal Bima Yojana* (crop insurance)\n- *Solar Pump (PM-KUSUM)* installation subsidies\n- *SMAM* Tractor & farm machinery subsidies\n- *Micro Irrigation* (drip/sprinklers) systems\n- *Kisan Credit Card (KCC)* loan subsidy\n- State support schemes like *Rythu Bandhu* or *Rythu Bharosa*."
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/query/website', methods=['POST'])
def query_website():
    try:
        data = request.get_json() or {}
        query_text = data.get('query', '').strip()
        if not query_text:
            return jsonify({
                'answer': "I didn't catch that. Could you please type a question about AgroMitra's services (e.g. 'How does soil testing work?' or 'Who built this platform?')?"
            })
            
        if website_vectorizer is None or website_vectors is None or not website_mappings:
            return jsonify({
                'answer': "Website FAQ engine is loading, please try again shortly."
            })
            
        # Transform query and compute similarities
        query_vec = website_vectorizer.transform([query_text])
        similarities = cosine_similarity(query_vec, website_vectors).flatten()
        
        # Compute hybrid score
        hybrid_scores = [compute_hybrid_score(query_text, mapped, similarities[idx]) for idx, mapped in enumerate(website_mappings)]
        best_match_idx = np.argmax(hybrid_scores)
        best_score = hybrid_scores[best_match_idx]
        
        # Threshold check
        if best_score > 0.22:
            matched_faq = website_mappings[best_match_idx]
            return jsonify({
                'question': matched_faq['question'],
                'answer': matched_faq['answer'],
                'score': float(best_score)
            })
        else:
            return jsonify({
                'answer': "I couldn't find a direct match for your question. Here are some things you can ask me about: \n- Who built AgroMitra?\n- What services does AgroMitra offer?\n- How does soil testing work?\n- How to use the Fertilizer Advisor?\n- How to check Mandi prices?\n- How to use the Deals Shop?\n\nOr you can contact our support team for more help!"
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/retrain', methods=['POST'])
def retrain_faq():
    """Retrain/Reload both the Website FAQ index and the Subsidy FAQ index."""
    try:
        load_faq_data()
        return jsonify({
            'status': 'success',
            'message': f'Models retrained successfully! Website FAQ model vectorized with {len(website_corpus)} items. Subsidy assistant vectorized with {len(subsidy_mappings)} items.'
        })
    except Exception as e:
        print(f"Retrain error: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrain models: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=True)
