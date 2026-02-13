# priotize complaints and route to correct department
# ----1.Importing Lib-----
# lib to check tone of text
from textblob import TextBlob

# for translation
from deep_translator import GoogleTranslator

# ---2.Priotization logic---
# func analyze  analyzes the user text and Ai result to categorize and priortize complaint

translator=GoogleTranslator()

def prioritize_complaint(description,ai_result):
    # 1.identify and translate
    # auto detection of languages
    # convert to english for maintaing consistency
    try:
        desc_Lower=GoogleTranslator(source='auto', target='en').translate(description).lower()
    except:
        desc_Lower=description.lower()
    
    category="General"

    if "pothhole" in desc_Lower or ai_result['label']=='pothole' or "road" in desc_Lower:
        category="Roads & Infrastructure"
    elif "garbage" in desc_Lower or "waste" in desc_Lower or "gutter" in desc_Lower or "trash" in desc_Lower:
        category="Sanitization & Waste"
    elif "light" in desc_Lower or "electricity" in desc_Lower or "wire" in desc_Lower or "street light" in desc_Lower:
        category="Electricity/Power"

    # STEP2--Urgency Check--
    # TextBlob  gives polarity [-1 to 1]
    # negative polarity means user has given dangerous suitation
    polarity=TextBlob(description)
    urgency_score=0
    danger_words=["danger","urgent","accident","emergency","immediate","hazard"]

    for word in danger_words:
        if word in desc_Lower:
            urgency_score+=3

    # STEP3--FINAL PRIOTIZATION
    final_score=(ai_result[confidence]*5)+urgency_score

    priority="Low"
    if final_score>7:
        priority="High"
    elif final_score>4:
        priority="Medium"
    
    return{
        "category":category,
        "priority":priority,
        "score":round(final_score,1)
    }
    