# --- 1. IMPORTING LIBRARIES ---
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import os
from detective import run_ai_detection  # AI Verification (Roboflow)
from priortize import prioritize_complaint  # Categorization & Logic

# --- 2. APP SETUP ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. DATABASE INITIALIZATION ---
def init_db():
    conn = sqlite3.connect("grievance.db")
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS complaints(
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   full_name TEXT,
                   phone_number TEXT,
                   language TEXT,
                   text_desc TEXT,
                   location TEXT,
                   latitude REAL,
                   longitude REAL,
                   ward_zone TEXT,
                   image_path TEXT,
                   status TEXT DEFAULT 'pending',
                   priority TEXT DEFAULT 'low',
                   ai_category TEXT,
                   ai_score REAL DEFAULT 0.0
            )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- 4. MAIN ROUTE ---
@app.post("/submit-complaint")
async def submit_complaint(
    full_name: str = Form(...),
    phone_number: str = Form(...),
    language: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    ward_zone: str = Form(...),
    file: UploadFile = File(...)
):
    # Initialize variables at the top to prevent "UnboundLocalError"
    complaint_id = None
    final_lat, final_lon = latitude, longitude

    try:
        # STEP 1: SAVE IMAGE
        os.makedirs("uploads", exist_ok=True)
        file_loc = f"uploads/{file.filename}"
        content = await file.read() 
        with open(file_loc, "wb+") as file_obj:
            file_obj.write(content)

        # STEP 2: CREATE PENDING RECORD (Immediate Handshake)
        conn = sqlite3.connect("grievance.db")
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO complaints (
                full_name, phone_number, language, 
                text_desc, location, latitude, longitude, ward_zone, image_path, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (
                full_name, phone_number, language,
                description, location, latitude, longitude, ward_zone, file_loc, 'pending'
            )
        )
        complaint_id = cursor.lastrowid 
        conn.commit()

        # STEP 3: AI VERIFICATION (The Gatekeeper)
        ai_result = run_ai_detection(file_loc)

        if not ai_result.get("detected"):
            # --- INCORRECT IMAGE LOGIC ---
            cursor.execute("UPDATE complaints SET status='rejected' WHERE id=?", (complaint_id,))
            conn.commit()
            conn.close()
            # Return specific "rejected" status so frontend can show alert
            return {
                "status": "rejected", 
                "message": "AI Verification Failed: Incorrect or invalid image detected. Please upload a clear photo of the issue."
            }

        # STEP 4: PROCEED FURTHER (Image is Correct)
        # Only reached if ai_result["detected"] is True
        logic_result = prioritize_complaint(description, ai_result, location)
        
        # Determine final coordinates (GPS vs Geocoding)
        if not final_lat or final_lat == 0:
            final_lat = logic_result.get("latitude", latitude)
            final_lon = logic_result.get("longitude", longitude)

        # STEP 5: FINAL UPDATE (Enrich the data)
        cursor.execute('''
            UPDATE complaints SET 
                status='verified', 
                priority=?, 
                ai_category=?, 
                ai_score=?, 
                text_desc=?, 
                latitude=?, 
                longitude=?
            WHERE id=?''',
            (
                logic_result.get("priority", "low"), 
                logic_result.get("category", "General"), 
                ai_result.get("confidence", 0.0), 
                logic_result.get("eng_desc", description), 
                final_lat, 
                final_lon, 
                complaint_id
            )
        )
        conn.commit()
        conn.close()

        # STEP 6: SUCCESS RESPONSE
        return {
            "status": "success",
            "id": complaint_id,
            "category": logic_result.get("category"),
            "priority": logic_result.get("priority"),
            "message": f"Verified! Assigned to {logic_result.get('category')} - Desk 1"
        }

    except Exception as e:
        print(f"Server Error: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)