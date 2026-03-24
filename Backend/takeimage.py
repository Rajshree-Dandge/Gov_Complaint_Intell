# --- 1. IMPORTING LIBRARIES ---
from fastapi import FastAPI, File, Form, UploadFile,BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import sqlite3
import uvicorn
import time
import os
from detective import run_ai_detection  # AI Verification (Roboflow)
from priortize import prioritize_complaint  # Categorization & Logic
from Clustering import get_clusters  # Clustering Logic

# --- 2. APP SETUP ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)





# Serve the uploads folder so React can show the images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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
    background_tasks:BackgroundTasks,
    full_name: str = Form(...),
    phone_number: str = Form(...),
    language: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    latitude: float = Form(0.0),
    longitude: float = Form(0.0),
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
        conn.close()

        # STEP 3: run the back task
        background_tasks.add_task(
            run_task_back, 
            complaint_id, file_loc, description, location
        )
       

        # STEP 6: SUCCESS RESPONSE
        return {
            "status": "success",
            "id": complaint_id,
            "message": "Complaint received. AI verification is running in background. You will receive a notification shortly."
        }

    except Exception as e:
        print(f"Server Error: {e}")
        return {"status": "error", "message": str(e)
        }
    



# adding background task to achieve performance
async def run_task_back(complaint_id:int,file_loc:str,description:str,location:str):
    try:
        ai_result=run_ai_detection(file_loc)
        if not ai_result.get("detected"):
            # connection
            conn=sqlite3.connect("grievance.db")
            # assisstant
            cursor=conn.cursor()
            # execute
            cursor.execute("UPDATE complaints SET status='rejected' WHERE id=?", (complaint_id,))
            # commit
            conn.commit()
            # close
            conn.close()
            return
        logic_result=prioritize_complaint(description,ai_result,location)

        # --- 4. UPDATE DATABASE WITH AI RESULTS ---
        conn = sqlite3.connect("grievance.db")
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE complaints 
            SET status='verified', 
                priority=?, 
                ai_category=?, 
                ai_score=?, 
                latitude=?, 
                longitude=?
            WHERE id=?
        ''',
        (
            logic_result['priority'],
            logic_result['category'],
            logic_result['score'],
            logic_result['lat'],
            logic_result['lon'],
            complaint_id
        ))
        conn.commit()
        conn.close()

        print(f"Complaint {complaint_id} Verified: {logic_result}")

    except Exception as e:
        print(f"Background Task Error: {e}")

# --- 5. GOVT LOGIN (TESTING) ---
@app.post("/login")
async def login(
    username: str = Form(...), 
    password: str = Form(...),
    ward: str = Form(...) # Now we take the ward during login for testing
):
    print(f"Testing Login: {username} accessing {ward}")
    
    # Logic: Always return success for testing, but pass back the ward name
    return {
        "status": "success",
        "user": username,
        "working_zone": ward, # This tells React which ward to load
        "message": "Access Granted to " + ward
    }

from typing import Optional

# Route for Government Officials to view complaints (Filtered by Category and Ward)
@app.get("/get-complaints")
async def get_complaints(ward: str, category: str):
    try:
        conn = sqlite3.connect("grievance.db")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # We use '%' to match parts of the word. 
        # This makes "Sanitation & Waste" match "Sanitation"
        search_term = f"%{category.split(' ')[0]}%" 

        cursor.execute('''
            SELECT * FROM complaints 
            WHERE ward_zone = ? AND ai_category LIKE ? AND status = 'verified'
            ORDER BY ai_score DESC
        ''', (ward, search_term))
        
        complaints = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return complaints
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- ROUTE TO GET CATEGORY COUNTS FOR A SPECIFIC WARD ---
@app.get("/get-ward-stats")
async def get_ward_stats(ward: str):
    try:
        conn = sqlite3.connect("grievance.db")
        cursor = conn.cursor()

        # Logic: Count how many verified complaints exist in each category for this ward
        cursor.execute('''
            SELECT ai_category, COUNT(*) 
            FROM complaints 
            WHERE ward_zone = ? AND status = 'verified'
            GROUP BY ai_category
        ''', (ward,))
        
        results = cursor.fetchall()
        # Convert to a simple dictionary: {"Roads": 5, "Garbage": 12...}
        stats = {row[0]: row[1] for row in results}
        
        conn.close()
        return {
            "ward": ward,
            "stats": stats
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
@app.get("/get-heatmap")
async def get_heatmap(ward: str, category: str):
    try:
        conn = sqlite3.connect("grievance.db")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # 1. Fetch complaints for this specific area and dept
        # We split the category for fuzzy matching (like in get-complaints)
        search_term = f"%{category.split(' ')[0]}%"

        cursor.execute('''
            SELECT latitude, longitude, ai_score, ai_category 
            FROM complaints 
            WHERE ward_zone = ? AND ai_category LIKE ? AND status = 'verified'
        ''', (ward, search_term))
        
        complaints = [dict(row) for row in cursor.fetchall()]
        conn.close()

        # 2. Run DBSCAN logic to group them into bubbles
        clusters = get_clusters(complaints)
        return clusters
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)