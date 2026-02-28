# priotize complaints and route to correct department
# ----1.Importing Lib-----
# lib to check tone of text
from textblob import TextBlob

# for translation
from deep_translator import GoogleTranslator

# ---2.Priotization logic---
# func analyze  analyzes the user text and Ai result to categorize and priortize complaint



def prioritize_complaint(description,ai_result):
    # 1.identify and translate
    # auto detection of languages
    # convert to english for maintaing consistency
    try:
        desc_Lower=GoogleTranslator(source='auto', target='en').translate(description).lower()
    except:
        desc_Lower=description.lower()
    
    category="General"

    if any(word in desc_Lower for word in ["pothole", "khadda", "road", "rasta"]):
        category = "Roads & Infrastructure"
    elif any(word in desc_Lower for word in ["garbage", "waste", "trash", "kachra", "gutter"]):
        category = "Sanitation & Waste"
    elif any(word in desc_Lower for word in ["light", "electricity", "wire", "current", "pole"]):
        category = "Electricity/Power"
    elif any(word in desc_Lower for word in ["leak", "water", "pipe", "pipeline", "pani"]):
        category = "Water Supply" # Targeted fix for your pipeline idea

    # If text is vague, use YOLO label
    if category == "General" and ai_result.get('label') == 'pothole':
        category = "Roads & Infrastructure"

    # STEP2--Urgency Check--
    
    urgency_score = 0
    danger_words = ["danger", "urgent", "accident", "emergency", "fell", "deadly"]
    for word in danger_words:
        if word in desc_Lower:
            urgency_score += 3

    # FINAL PRIORITIZATION (Fixed the 'confidence' variable bug)
    # Logic: AI Confidence + Text Urgency
    conf = ai_result.get('confidence', 0)
    final_score = (conf * 5) + urgency_score

    priority = "Low"
    if final_score > 7: priority = "High"
    elif final_score > 4: priority = "Medium"
    
    return {
        "category": category,
        "priority": priority,
        "score": round(final_score, 1),
        "eng_desc": desc_Lower
    }