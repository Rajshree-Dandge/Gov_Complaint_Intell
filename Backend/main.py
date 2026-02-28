from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import os
from detective import run_ai_detection
from brain import prioritize_complaint

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/submit-complaint")
async def submit_complaint(
    full_name: str = Form(...),
    phone_number: str = Form(...),
    language: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    ward_zone: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        # STAGE 1: INITIAL STORAGE (Handshake)
        os.makedirs("uploads", exist_ok=True)
        file_loc = f"uploads/{file.filename}"
        
        # FIX: Added await for file reading
        content = await file.read() 
        with open(file_loc, "wb+") as file_obj:
            file_obj.write(content)

        # Create the record in DB immediately to get ID
        conn = sqlite3.connect("grievance.db")
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO complaints (full_name, phone_number, language, text_desc, location, ward_zone, image_path)
            VALUES (?, ?, ?, ?, ?, ?, ?)''',
            (full_name, phone_number, language, description, location, ward_zone, file_loc)
        )
        complaint_id = cursor.lastrowid # THIS IS YOUR PENDING ID
        conn.commit()

        # STAGE 2 & 3: THE AI SCANNER
        ai_result = run_ai_detection(file_loc)
        
        if not ai_result["detected"]:
            # If fake, update status and stop
            cursor.execute("UPDATE complaints SET status='rejected' WHERE id=?", (complaint_id,))
            conn.commit()
            conn.close()
            return {"status": "rejected", "message": "AI Verification Failed: Fake Image Detected."}

        # Stage 3: The Brain (Categorization)
        logic_result = prioritize_complaint(description, ai_result)

        # STAGE 4: RETURN ENRICHED FILE
        cursor.execute('''
            UPDATE complaints 
            SET status='verified', priority=?, ai_category=?, ai_score=?, text_desc=?
            WHERE id=?''',
            (logic_result["priority"], logic_result["category"], ai_result["confidence"], logic_result["eng_desc"], complaint_id)
        )
        conn.commit()
        conn.close()

        return {
            "status": "success",
            "id": complaint_id,
            "category": logic_result["category"],
            "priority": logic_result["priority"],
            "message": f"Verified! Assigned to {logic_result['category']} - Desk 1"
        }

    except Exception as e:
        print(f"Server Error: {e}")
        return {"status": "error", "message": str(e)}