# AgroMitra Machine Learning Microservice 🧠🌾

This is the decoupled, high-performance machine learning microservice for **AgroMitra**. Built using **Python (v3.10+)**, **Flask**, and **Scikit-Learn**, it exposes REST API endpoints for agricultural predictions and hybrid vector search queries.

---

## 📂 Directory Structure

```text
ml_service/
├── data/                    # Datasets (Seattle weather, fertilizer data, subsidies, FAQs)
│   ├── crop_recommendation.csv
│   ├── fertilizer_prediction.csv
│   ├── seattle-weather.csv
│   ├── subsidies.csv
│   └── subsidy_faqs.json
├── models/                  # Serialized Scikit-Learn models and label encoders (.joblib)
│   ├── crop_model.joblib
│   ├── fertilizer_model.joblib
│   └── weather_model.joblib
├── app.py                   # Flask API entry point and vector chatbot loaders
├── train_models.py          # Script to download datasets, train classifiers, and export models
├── requirements.txt         # Python package dependencies
└── README.md                # This documentation file
```

---

## 🔮 Machine Learning Models

### 1. Weather Predictor (`RandomForestClassifier`)
Classifies meteorological profiles into five classes: `Sun`, `Rain`, `Fog`, `Snow`, and `Drizzle`.
* **Features:** Precipitation, Max Temperature, Min Temperature, Wind Speed.
* **Outputs:** Predicted weather category and dynamic agricultural advice (e.g., advising against pesticide spraying before a rain forecast).

### 2. Fertilizer Advisor (`RandomForestClassifier`)
Recommends optimal fertilizer types (e.g., Urea, DAP, NPK variants, 10-26-26) to remediate soil nutrient deficiencies.
* **Features:** Temperature, Humidity, Soil Moisture, Soil Type, Crop Type, Nitrogen (N), Phosphorous (P), Potassium (K).
* **Outputs:** Recommended fertilizer blend and custom dosage application guidelines.

### 3. Crop Recommender (`RandomForestClassifier`)
Suggests high-yield crop choices tailored to specific soil chemical compositions and regional rainfall averages.
* **Features:** Nitrogen (N), Phosphorous (P), Potassium (K), Temperature, Humidity, Soil pH, Average Rainfall.
* **Outputs:** The optimal crop choice (e.g., Rice, Maize, Wheat, Mango, Tea, etc.).

### 4. Hybrid Q&A Search Engines (`TF-IDF Vectorizers`)
* **Subsidy FAQ Assistant:** Evaluates natural language user queries regarding government support schemes (e.g., PM-KUSUM, PM-Kisan) and outputs the most relevant matched scheme instructions.
* **Website QA Assistant:** Answers questions about AgroMitra's features, developers, and workflows.
* **Matching Algorithm:** Combines **Cosine Similarity** (via TF-IDF vectorizer), **Levenshtein Sequence Matching Ratio**, and **Keyword Tag Intersections** to compute a hybrid relevance score.

---

## ⚡ Setup & Run Locally

### 1. Install Dependencies
Ensure you have Python 3.10+ installed. From the `ml_service/` directory, install the required packages:
```bash
pip install -r requirements.txt
```

### 2. Download Datasets & Train Models
Compile the classifiers by downloading remote datasets and generating the serialized `.joblib` files inside the `models/` folder:
```bash
python train_models.py
```

### 3. Run Flask App
Start the Flask web service in development mode:
```bash
python app.py
```
By default, the server runs on `http://localhost:5050` (or `http://localhost:7860` if port environment variables are defined).

---

## 🚀 Deploy to Hugging Face Spaces (Without Docker)

You can easily host this Flask microservice for free using **Hugging Face Spaces**. By deploying with the **Gradio SDK** template, Hugging Face automatically manages the Python environment, dependencies, and executes your server script.

### 1. Create a Space on Hugging Face
1. Log in to [Hugging Face](https://huggingface.co/) and click **New Space**.
2. Name your space (e.g., `agromitra-ml`).
3. Select **Gradio** as the SDK.
4. Choose the **Blank** template.
5. Set the space visibility to **Public** (so your Express backend can call it).
6. Click **Create Space**.

### 2. Push/Upload Files
Commit or upload the following files from your local `ml_service` directory to the root of your Hugging Face Space repository:
* `app.py`
* `train_models.py`
* `requirements.txt`
* `data/` *(directory containing subsidies.csv and subsidy_faqs.json)*

*Note: Hugging Face will automatically execute `train_models.py` on startup if it detects that the serialized models do not exist.*

### 3. Retrieve URL and Link your Backend
Once Hugging Face completes the build, your API will be running at:
```text
https://<your-username>-<your-space-name>.hf.space
```
To configure your Node.js Express server to use this API, update your backend's `server/.env` file:
```env
ML_SERVICE_URL=https://<your-username>-<your-space-name>.hf.space
```

---

## 🔌 API Documentation

All endpoints expect requests with a JSON body and header `Content-Type: application/json`.

### `POST /predict/weather`
Predicts the weather condition and yields corresponding agricultural advisories.
* **Request Body:**
  ```json
  {
    "precipitation": 3.2,
    "temp_max": 24.5,
    "temp_min": 14.0,
    "wind": 5.4
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "prediction": "Rain",
    "advice": "Heavy rainfall predicted. Postpone spraying pesticides or fertilizers..."
  }
  ```

### `POST /predict/fertilizer`
Recommends optimal fertilizer blends based on soil chemistry.
* **Request Body:**
  ```json
  {
    "temperature": 27.2,
    "humidity": 62.0,
    "moisture": 38.0,
    "soil_type": "Loamy",
    "crop_type": "Wheat",
    "nitrogen": 45.0,
    "phosphorous": 50.0,
    "potassium": 35.0
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "recommendation": "NPK 14-35-14",
    "guidelines": "Apply recommended compound fertilizer to supply balanced nutrients..."
  }
  ```

### `POST /predict/subsidies`
Scans and filters active state and national subsidies.
* **Request Body:**
  ```json
  {
    "state": "Maharashtra",
    "crop": "Cotton",
    "land_acres": 2.5,
    "income": 75000
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "subsidies": [
      {
        "scheme": "PM-Kisan Samman Nidhi",
        "subsidy_amount": 6000,
        "category": "Income Support",
        "description": "Direct financial assistance of ₹6,000 per year...",
        "match_percentage": 100,
        "is_eligible": true
      }
    ]
  }
  ```

### `POST /query/subsidy`
Queries the hybrid vector engine for government scheme Q&As.
* **Request Body:**
  ```json
  {
    "query": "How do I register for PM-KUSUM solar pump subsidy?"
  }
  ```

### `POST /query/website`
Queries the hybrid vector engine for platform FAQs and navigation help.
* **Request Body:**
  ```json
  {
    "query": "Who built the frontend and UI of AgroMitra?"
  }
  ```
