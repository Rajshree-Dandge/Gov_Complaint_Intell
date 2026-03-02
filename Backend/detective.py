# --- 1. IMPORTING THE NECESSARY LIBRARY ---
# Importing the Roboflow SDK to communicate with the cloud-based AI model
from roboflow import Roboflow 

# --- 2. CONFIGURATION & CLOUD CONNECTION ---
# Replace with your actual Private API Key from the Roboflow 'Deploy' tab
API_KEY = "c5jEmDo5cIPP9Ap3LNJl" 

# Creating a connection object 'rf' to log into your Roboflow account
rf = Roboflow(api_key=API_KEY)

# Selecting your specific project from your workspace
# Based on your setup: "govt_ai_compliant"
project = rf.workspace().project("govt_ai_compliant")

# Loading the 'model' object from Version 1 of your project
model = project.version(1).model

# --- 3. THE AI SCANNING FUNCTION ---
# This function takes a local image path (e.g., 'uploads/image.jpg') and scans it
def run_ai_detection(image_path):
    # 'try' block ensures the app doesn't crash if internet fails
    try:
        # Sending image to Roboflow for 'Inference' (AI verification)
        # confidence=40 means ignore any results the AI isn't at least 40% sure about
        prediction = model.predict(image_path, confidence=40).json()
        
        # Extracting the list of found objects from the 'predictions' section of the response
        detections = prediction.get('predictions', [])
        print(prediction)
        # If the list size is greater than 0, a grievance (pothole) was found
        if len(detections) > 0:
            # Taking the result with the highest confidence (the first item)
            top_detect = detections[0]
            
            # Returning a package of data back to main.py
            return {
                "detected": True,                # AI confirms grievance is present
                "label": top_detect['class'],    # The name of the object (e.g., 'pothole')
                "confidence": top_detect['confidence'] # How sure the AI is (0.0 to 1.0)
            }
        
        # If the list is empty, the AI found no potholes
        else:
            return {
                "detected": False, 
                "label": "none", 
                "confidence": 0.0
            }
            
    # Handling potential errors (like API limits or network issues)
    except Exception as e:
        print(f"AI Detection Error: {e}")
        return {
            "detected": False, 
            "label": "error", 
            "confidence": 0.0
        }