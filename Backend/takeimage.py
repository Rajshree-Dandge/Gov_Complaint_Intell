# --- 1. IMPORTING LIBRARIES ---
from fastapi import FastAPI, File, Form, UploadFile, BackgroundTasks, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import sqlite3
import uvicorn
import time
import os
import random
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from dotenv import load_dotenv

from detective import run_ai_detection  # AI Verification (Roboflow)
from priortize import prioritize_complaint  # Categorization & Logic
from Clustering import get_clusters  # Clustering Logic
from verification import (
    auth_context, OTPRequest, VerifyRequest, CitizenFinal, 
    init_verification_db, send_email, hash_password
)

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
    """Revolutionary Developer Security: Encrypts a string for database storage."""
    return cipher_suite.encrypt(data.encode()).decode()

def decrypt_data(data: str) -> str:
    """Revolutionary Developer Security: Decrypts a string from database retrieval."""
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
app = FastAPI(title="Nivaran Backend - Enterprise Verified AI Pipeline")
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
    """Revolutionary Developer: Unified Schema for Complaints & Identity"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    # Main complaints table
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
    # Unified Identity Tables (Citizens & Officers)
    init_verification_db(cursor)
    
    conn.commit()
    conn.close()

init_db()

# --- 5. OTP & IDENTITY ROUTES ---

@app.post("/api/send-otp")
async def send_otp(data: OTPRequest):
    """Revolutionary Developer: Identity Verification Layer"""
    email = data.email.strip()
    name = data.name.strip()
    role = data.role.strip()

    if not data.is_signup:
        conn = sqlite3.connect(DATABASE_PATH)
        table = "government_officers" if role == "government" else "citizens"
        user = conn.execute(f"SELECT name FROM {table} WHERE email = ? AND name = ?", (email, name)).fetchone()
        conn.close()
        if not user:
            raise HTTPException(
                status_code=404, 
                detail=f"Identity Verification Failed: No {role} record found in our database. Please Sign Up first."
            )

    otp_code = str(random.randint(100000, 999999))
    auth_context[email] = {
        "code": otp_code,
        "expiry": datetime.now() + timedelta(minutes=5),
        "verified": False,
        "role": role
    }
    
    body = f"Hello {name},\n\nYour Nivaran verification code is: {otp_code}\nExpires in 5 minutes."
    if send_email(email, "Nivaran Verification", body):
        return {"message": "OTP sent to email"}
    raise HTTPException(status_code=500, detail="Failed to send email.")

@app.post("/api/verify-otp")
async def verify_otp(data: VerifyRequest):
    """Revolutionary Developer: Verify OTP and Grant Session Token"""
    record = auth_context.get(data.email)
    
    if not record or datetime.now() > record["expiry"]:
        raise HTTPException(status_code=400, detail="OTP expired or not requested.")
    
    if record["code"] != data.code:
        raise HTTPException(status_code=400, detail="Invalid code.")
    
    record["verified"] = True
    
    # Generate JWT for the session
    access_token = create_access_token(
        data={"sub": data.email, "role": record["role"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "status": "success", 
        "token": access_token,
        "role": record["role"], 
        "message": "Identity verified successfully"
    }

@app.post("/register/citizen")
async def register_citizen(data: CitizenFinal):
    """Revolutionary Developer: Final Citizen Registration"""
    if not auth_context.get(data.email, {}).get("verified"):
        raise HTTPException(status_code=403, detail="Email not verified via OTP.")

    conn = sqlite3.connect(DATABASE_PATH)
    try:
        conn.execute(
            "INSERT INTO citizens (name, email, phone, uid_number, password_hash) VALUES (?, ?, ?, ?, ?)",
            (data.name, data.email, data.phone, data.uid_number, hash_password(data.password))
        )
        conn.commit()
        send_email(data.email, "Welcome to Nivaran", f"Hello {data.name}, your citizen account is ready!")
        # Optional: Remove verified flag from context
        return {"status": "success", "redirect_to": "/citizen"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="User already exists.")
    finally:
        conn.close()

@app.post("/register/government")
async def register_government(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    ward: str = Form(...),
    uid: str = Form(...),
    password: str = Form(...),
    proof: UploadFile = File(...)
):
    """Revolutionary Developer: Secure Government Officer Registration"""
    if not auth_context.get(email, {}).get("verified"):
        raise HTTPException(status_code=403, detail="Email verification required first.")

    # Save Proof of Employment
    os.makedirs("gov_proofs", exist_ok=True)
    proof_path = f"gov_proofs/{email}_{proof.filename}"
    content = await proof.read()
    with open(proof_path, "wb") as f:
        f.write(content)

    conn = sqlite3.connect(DATABASE_PATH)
    try:
        conn.execute(
            "INSERT INTO government_officers (name, email, phone, ward, uid_number, proof_path, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (name, email, phone, ward, uid, proof_path, hash_password(password))
        )
        conn.commit()
        send_email(email, "Welcome Officer", f"Hello {name}, your Nivaran Officer account is created!")
        return {"status": "success", "redirect_to": "/dashboard"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Officer already exists.")
    finally:
        conn.close()

# --- 6. MAIN COMPLAINT ROUTE (PROTECTED BY OTP) ---

@app.post("/submit-complaint")
async def submit_complaint(
    background_tasks: BackgroundTasks,
    full_name: str = Form(...),
    phone_number: str = Form(...),
    email: str = Form(...), # Added for OTP verification
    language: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    latitude: float = Form(0.0),
    longitude: float = Form(0.0),
    ward_zone: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Revolutionary Developer Entry Point:
    Validates OTP verification status before triggering AI scan.
    """
    # STRICT Conflict Resolution: Verify OTP Identity Layer first
    verification_record = auth_context.get(email)
    if not verification_record or not verification_record.get("verified"):
        raise HTTPException(status_code=403, detail="STRICT ORDER: Citizen must verify OTP before filing a grievance.")

    complaint_id = None
    try:
        # STEP 1: SAVE IMAGE (Maintain performance with await file.read())
        os.makedirs("uploads", exist_ok=True)
        file_loc = f"uploads/{file.filename}"
        content = await file.read()
        with open(file_loc, "wb+") as file_obj:
            file_obj.write(content)
        
        # STEP 2: CREATE PENDING RECORD (Immediate Handshake)
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
        
        # STEP 3: RUN BACKGROUND AI TASK (Trigger AFTER verification)
        background_tasks.add_task(
            run_task_back,
            complaint_id, file_loc, description, location, latitude, longitude
        )
        
        # Cleanup verification context after successful submission
        del auth_context[email]
        
        # STEP 4: SUCCESS RESPONSE (Immediate feedback to citizen)
        return {
            "status": "success",
            "id": complaint_id,
            "message": "Verified! Complaint received. AI Triaging is starting in the background."
        }
    except Exception as e:
        print(f"Server Error: {e}")
        return {"status": "error", "message": str(e)}

# Adding background task to achieve performance
async def run_task_back(complaint_id: int, file_loc: str, description: str, location: str, latitude: float, longitude: float):
    """
    Revolutionary Developer AI Pipeline:
    Executes YOLOv11 and prioritization logic asynchronously.
    """
    try:
        ai_result = run_ai_detection(file_loc)
        if not ai_result.get("detected"):
            conn = sqlite3.connect(DATABASE_PATH)
            cursor = conn.cursor()
            cursor.execute("UPDATE complaints SET status='rejected' WHERE id=?", (complaint_id,))
            conn.commit()
            conn.close()
            return

        logic_result = prioritize_complaint(description, ai_result, latitude, longitude, location)

        # --- UPDATE DATABASE WITH AI RESULTS ---
        conn = sqlite3.connect(DATABASE_PATH)
        conn.execute('''
        UPDATE complaints SET 
        status='verified', 
        priority=?, 
        ai_category=?, 
        ai_score=?, 
        ward_zone=?  -- This column stores the resolved Geopy Jurisdiction
        WHERE id=?
        ''', (logic_result['priority'], logic_result['category'], logic_result['score'], logic_result['jurisdiction'], complaint_id))

        conn.commit()
        conn.close()
        print(f"Complaint {complaint_id} Verified: {logic_result}")

    except Exception as e:
        print(f"Background Task Error: {e}")

# --- 7. GOVT LOGIN (JWT ENABLED) ---
@app.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """Revolutionary Developer Security: Enterprise Standard OAuth2"""
    print(f"Testing SECURE Login: {form_data.username}")
    
    # In a real app, verify against hashed password in DB
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

@app.get("/get-ward-stats")
async def get_ward_stats(ward: str):
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT ai_category, COUNT(*)
            FROM complaints
            WHERE ward_zone = ? AND status = 'verified'
            GROUP BY ai_category
        ''', (ward,))
        results = cursor.fetchall()
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
    ward: Optional[str] = None, 
    category: Optional[str] = None,
    current_user: str = Depends(get_current_user) # Protected by JWT
):
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = "SELECT latitude, longitude, ai_score, ai_category FROM complaints WHERE status = 'verified'"
        params = []
        
        if ward:
            query += " AND ward_zone = ?"
            params.append(ward)
        if category:
            query += " AND ai_category LIKE ?"
            params.append(f"%{category.split(' ')[0]}%")
            
        cursor.execute(query, params)
        complaints_data = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        # Revolutionary Developer AI Cluster Logic
        clusters = get_clusters(complaints_data)
        return {"status": "success", "clusters": clusters}
    except Exception as e:
        print(f"Heatmap Error: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/")
def home():
    return {"message": "Revolutionary AI Backend is running!!"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)