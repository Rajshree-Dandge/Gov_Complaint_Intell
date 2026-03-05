# priotize complaints and route to correct department
# ----1.Importing Lib-----
# lib to check tone of text
from textblob import TextBlob

# for translation
from deep_translator import GoogleTranslator
from geopy.geocoders import Nominatim # New Import

# ---2.Priotization logic---
# func analyze  analyzes the user text and Ai result to categorize and priortize complaint

geolocator = Nominatim(user_agent="city_grievance_app")
translator=GoogleTranslator()

def prioritize_complaint(description,ai_result,location_text):
    # 1.identify and translate
    # auto detection of languages

    # --- 1. Translation ---
    try:
        desc_Lower=GoogleTranslator(source='auto', target='en').translate(description).lower()
    except:
        desc_Lower=description.lower()
    
    # --- 2. Geocoding (Lat/Long) ---
    lat, lon = None, None
    try:
        # We append a city name (e.g., "Mumbai") to make searches more accurate
        geo_location = geolocator.geocode(f"{location_text}, Mumbai") 
        if geo_location:
            lat, lon = geo_location.latitude, geo_location.longitude
    except Exception as e:
        print(f"Geocoding Error: {e}")

    # --- 3. Categorization ---
    # Base Intensity from AI Visual confidence (0.0 to 2.0)
    base_score = ai_result.get('confidence', 0) * 2

    # 1. KEYWORD WEIGHTS
    # Dangerous: Immediate threat to life (+7 points)
    dangerous_keywords = ["accident", "injury", "deadly", "hospital", "emergency", "shock", "falling"]
    
    # Moderate: Operational failure, affecting traffic/daily life (+4 points)
    moderate_keywords = ["bad", "problem", "dark", "smell", "waste", "stuck", "leakage"]
    
    # Neutral: Minor aesthetic issue or routine maintenance (+1 point)
    neutral_keywords = ["cleaning", "minor", "small", "notice", "request"]

    score_multiplier = 0
    if any(word in desc_Lower for word in dangerous_keywords):
        score_multiplier = 7
        level = "Dangerous"
    elif any(word in desc_Lower for word in moderate_keywords):
        score_multiplier = 4
        level = "Moderate"
    else:
        score_multiplier = 1
        level = "Neutral"

    # Final Severity Score (Max 10)
    final_score = min(base_score + score_multiplier + 1, 10.0)

    return {
        "score": round(final_score, 1),
        "priority": level, # This is our new 3-level label
        "category": ai_result.get('label', 'General')
    }