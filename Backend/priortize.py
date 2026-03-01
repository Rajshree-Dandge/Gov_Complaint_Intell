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
    category = "General"
    if "pothole" in desc_Lower or ai_result.get('label') == 'pothole' or "road" in desc_Lower:
        category = "Roads & Infrastructure"
    elif any(word in desc_Lower for word in ["garbage", "waste", "gutter", "trash"]):
        category = "Sanitization & Waste"
    elif any(word in desc_Lower for word in ["light", "electricity", "wire"]):
        category = "Electricity/Power"

    # STEP2--Urgency Check--
    # TextBlob  gives polarity [-1 to 1]
    # negative polarity means user has given dangerous suitation
    polarity=TextBlob(description)

    urgency_score = 0
    danger_words = ["danger", "urgent", "accident", "emergency", "immediate", "hazard"]
    for word in danger_words:
        if word in desc_Lower:
            urgency_score += 3

    final_score = (ai_result.get('confidence', 0) * 5) + urgency_score
    priority = "High" if final_score > 7 else "Medium" if final_score > 4 else "Low"
    
    return{
        "category":category,
        "priority":priority,
        "score":round(final_score,1),
        "latitude": lat,
        "longitude": lon
    }
    