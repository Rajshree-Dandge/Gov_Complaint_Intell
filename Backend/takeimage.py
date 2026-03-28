# --- 1. IMPORTING LIBRARIES ---
from fastapi import FastAPI, File, Form, UploadFile, BackgroundTasks, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import sqlite3
import uvicorn
import time
import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from dotenv import load_dotenv
from detective import run_ai_detection  # AI Verification (Roboflow)
from priortize import prioritize_complaint  # Categorization & Logic
from Clustering import get_clusters  # Clustering Logic

# Load environment variables
load_dotenv()

# --- 2. SECURITY CONFIGURATION ---

DATABASE_PATH = os.getenv("DATABASE_PATH", "grievance.db")
SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-government-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Encryption Setup (Fernet for PII)
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    raise ValueError("Missing ENCRYPTION_KEY in environment variables")
cipher_suite = Fernet(ENCRYPTION_KEY.encode())

# Password Hashing Setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def encrypt_data(data: str) -> str:
    """Encrypts a string for database storage."""
    return cipher_suite.encrypt(data.encode()).decode()

def decrypt_data(data: str) -> str:
    """Decrypts a string from database retrieval."""
    return cipher_suite.decrypt(data.encode()).decode()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return username
    except JWTError:
        raise credentials_exception

# --- 3. APP SETUP ---
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

# --- 4. DATABASE INITIALIZATION ---
def init_db():
    conn = sqlite3.connect(DATABASE_PATH)
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
        # ENCRYPT PII BEFORE SAVING (Enterprise Hardening)
        encrypted_name = encrypt_data(full_name)
        encrypted_phone = encrypt_data(phone_number)

        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO complaints (
                full_name, phone_number, language, 
                text_desc, location, latitude, longitude, ward_zone, image_path, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (
                encrypted_name, encrypted_phone, language,
                description, location, latitude, longitude, ward_zone, file_loc, 'pending'
            )
        )
        complaint_id = cursor.lastrowid 
        conn.commit()
        conn.close()

        # STEP 3: run the back task
        background_tasks.add_task(
            run_task_back, 
            complaint_id, file_loc, description, location, latitude, longitude
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
async def run_task_back(complaint_id:int,file_loc:str,description:str,location:str,latitude:float,longitude:float):
    try:
        ai_result=run_ai_detection(file_loc)
        if not ai_result.get("detected"):
            # connection
            conn=sqlite3.connect(DATABASE_PATH)
            # assisstant
            cursor=conn.cursor()
            # execute
            cursor.execute("UPDATE complaints SET status='rejected' WHERE id=?", (complaint_id,))
            # commit
            conn.commit()
            # close
            conn.close()
            return
        logic_result=prioritize_complaint(description,ai_result,latitude,longitude,location)

        # --- 4. UPDATE DATABASE WITH AI RESULTS ---
        conn = sqlite3.connect(DATABASE_PATH)
        conn.execute('''
        UPDATE complaints SET 
        status='verified', 
        priority=?, 
        ai_category=?, 
        ai_score=?, 
        ward_zone=?  -- This column now stores the resolved Jurisdiction
        WHERE id=?
        ''', (logic_result['priority'], logic_result['category'], logic_result['score'], logic_result['jurisdiction'], complaint_id))

        conn.commit()
        conn.close()
        print(f"Complaint {complaint_id} Verified: {logic_result}")

    except Exception as e:
        print(f"Background Task Error: {e}")

# --- 6. GOVT LOGIN (JWT ENABLED) ---
@app.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    # Enterprise hardening: Use standard OAuth2 login
    print(f"Testing SECURE Login: {form_data.username}")
    
    # In a real app, verify against hashed password in DB
    # For this task, we return a JWT for any login (mocking success)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "status": "success",
        "user": form_data.username,
        "message": "Access Granted"
    }

# Route for Government Officials to view complaints (Filtered by Category and Ward)
@app.get("/get-complaints")
async def get_complaints(
    ward: str, 
    category: str,
    current_user: str = Depends(get_current_user) # Protected by JWT
):
    try:
        conn = sqlite3.connect(DATABASE_PATH)
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
        
        rows = cursor.fetchall()
        complaints = []
        for row in rows:
            comp_dict = dict(row)
            try:
                # DECRYPT DATA FOR DISPLAY (PII HARDENING)
                full_name = decrypt_data(comp_dict["full_name"])
                phone = str(decrypt_data(comp_dict["phone_number"]))
                
                # DATA MASKING: Only last 3 digits visible
                masked_phone = ("*" * (len(phone) - 3)) + phone[-3:]
                
                comp_dict["full_name"] = full_name
                comp_dict["phone_number"] = masked_phone
            except Exception as e:
                print(f"Decryption error for record {comp_dict['id']}: {e}")
            
            complaints.append(comp_dict)
            
        conn.close()
        return complaints
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- ROUTE TO GET CATEGORY COUNTS FOR A SPECIFIC WARD ---
@app.get("/get-ward-stats")
async def get_ward_stats(ward: str):
    try:
        conn = sqlite3.connect(DATABASE_PATH)
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
async def get_heatmap(
    ward: str, 
    category: str,
    current_user: str = Depends(get_current_user) # Protected by JWT
):
    try:
        conn = sqlite3.connect(DATABASE_PATH)
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

@app.get("/")
def home():
    return {"message": "Backend is running!!"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)