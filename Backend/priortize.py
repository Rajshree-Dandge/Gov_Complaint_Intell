# --- 1. IMPORTING LIBRARIES ---
# Library for Sentiment Analysis (Urgency Check)
from textblob import TextBlob
 # Reliable library for Multi-language support
from deep_translator import GoogleTranslator
# Library for Reverse Geocoding (GPS to Address) 
from geopy.geocoders import Nominatim
import os
from dotenv import load_dotenv
# Load environment variables (Secret Management)
load_dotenv()
# --- 2. INITIALIZING AI UTILITIES ---
#  'user_agent ' identifies our app to OpenStreetMap servers
geolocator = Nominatim(user_agent= "city_grievance_app")
# --- 3. THE CORE INTELLIGENCE FUNCTION ---
def prioritize_complaint(description, ai_result, lat, lon, location_text):
    """
    Analyzes input data across three vectors:
    1. Visual (YOLOv11)
    2. Semantic (NLP Translation  & Keywords)
    3. Geospatial (Reverse Geocoding)
    """
    # --- STEP A: CROSS-LINGUAL NORMALIZATION ---
    # We convert everything to English first to ensure consistent keyword matching
    try:
        #  'source=auto ' allows citizens to write in Marathi, Hindi, or Marathish
        eng_desc = GoogleTranslator(source= 'auto', target= 'en').translate(description)
        desc_lower = eng_desc.lower()
    except Exception as e:
        print(f"Translation Error: {e}")
        desc_lower = description.lower()
    
    # --- STEP B: ADMINISTRATIVE JURISDICTION RESOLUTION ---
    # This solves the  "Semi-Urban/Rural " problem (Mumbai vs Dombivali vs Village)
    detected_jurisdiction =  "Unknown Sector"
    try:
        # Only attempt if GPS coordinates are valid (not 0.0)
        if lat != 0 and lon != 0:
            location_obj = geolocator.reverse(f"{lat}, {lon}", language= 'en')
            address = location_obj.raw['address']

            # Logic: We follow an Administrative Hierarchy to find the responsible body
            # Suburb (Metro) -&gt; City (Semi-Urban) -&gt; Town/Village (Rural)
            detected_jurisdiction = (
                address.get('suburb') or
                address.get('neighbourhood') or
                address.get('city') or
                address.get('town') or
                address.get('village') or
                address.get('county') or
                location_text # Final fallback to user 's manual text
            )
    except Exception as e:
        print(f"Geocoding Error: {e} ")
        detected_jurisdiction = location_text # Fallback to manual text if API fails
    # --- STEP C: MULTIMODAL CATEGORIZATION ---
    # We combine Vision Labels (YOLO) with Textual Context (Keywords)

    ai_label = ai_result.get('label', 'none').lower()
    # Standardizing for Frontend Card Keys
    if any(k in ai_label or k in desc_lower for k in [ "pothole",  "road",  "crack",  "bridge"]):
        final_category =  "Roads & Infrastructure"
    elif any(k in ai_label or k in desc_lower for k in [ "water",  "leak",  "pipe",  "flood","sewage",  "leakage"]):
        final_category =  "Water Supply"
    elif any(k in ai_label or k in desc_lower for k in [ "electric",  "power",  "light",  "wire","current"]):
        final_category =  "Electricity/Power"
    elif any(k in ai_label or k in desc_lower for k in [ "garbage",  "trash",  "waste",  "kachra","smell"]):
        final_category =  "Sanitation  & Waste"
    else:
        final_category =  "General Inquiry"
    # --- STEP D: SEVERITY TRIAGE (The Formula) ---
    # We use a 1-10 Scale
    # 1. Base Score from AI Certainty (Max 2.0 points)
    image_score = ai_result.get('confidence', 0) * 2
    # 2. Urgency Weights based on NLP
    dangerous_keywords = [ "accident",  "injury",  "deadly",  "hospital",  "emergency",  "shock", "falling"]
    moderate_keywords = [ "bad",  "problem",  "dark",  "smell",  "waste",  "stuck",  "leakage"]
    urgency_bonus = 0
    if any(word in desc_lower for word in dangerous_keywords):
        urgency_bonus = 7
        prio_level =  "Dangerous"
    elif any(word in desc_lower for word in moderate_keywords):
        urgency_bonus = 4
        prio_level =  "Moderate"
    else:
        urgency_bonus = 1
        prio_level =  "Neutral"
    # Calculation: Base(Visual) + Bonus(Context) + 1(Minimum for verified items)
    final_score = min(image_score + urgency_bonus + 1, 10.0)
    # --- STEP E: THE INTELLIGENCE PACKAGE ---
    return {
        "score": round(final_score, 1),
        "priority": prio_level,
        "category": final_category,
        "jurisdiction": str(detected_jurisdiction),
        "eng_desc": desc_lower, # We return translated text for the Gov Dashboard
        "lat": lat,
        "lon": lon
}