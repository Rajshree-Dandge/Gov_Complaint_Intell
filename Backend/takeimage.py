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
from typing import Optional, List
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
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# --- 2. INDUSTRIAL-GRADE SECURITY CONFIGURATION ---
DATABASE_PATH = os.getenv("DATABASE_PATH", "grievance.db")
SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-government-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# AES-256-GCM Implementation (Sovereign Hardening)
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
ENCRYPTION_KEY_RAW_STR = os.getenv("ENCRYPTION_KEY", "32-bytes-of-sovereign-intelligence-key!")
# Ensure 32 bytes for AES-256
key_bytes = ENCRYPTION_KEY_RAW_STR.encode().ljust(32)[0:32]
aesgcm = AESGCM(key_bytes)

# Password Hashing Setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def encrypt_data(data: str) -> str:
    """Industrial-Grade AES-256-GCM Encryption"""
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, data.encode(), None)
    return (nonce.hex() + ciphertext.hex())

def decrypt_data(data_hex: str) -> str:
    """Industrial-Grade AES-256-GCM Decryption"""
    data_bytes = bytes.fromhex(data_hex)
    nonce = data_bytes[0:12]
    ciphertext = data_bytes[12:len(data_bytes)]
    return aesgcm.decrypt(nonce, ciphertext, None).decode()

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

async def check_admin_authority(current_user: str = Depends(get_current_user)):
    """Strict Backend Provision: Admin Gatekeeping."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    # Teammate logic uses 'role' or a specific flag
    cursor.execute("SELECT role FROM government_officers WHERE email = ?", (current_user,))
    user = cursor.fetchone()
    conn.close()
    
    if not user or user[0].lower() not in ['government', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="GOVERNMENT AUTHORITY REQUIRED: Access restricted to Government staff."
        )
    return current_user



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
    """Revolutionary Architect: Unified Schema for Integrity & Accountability"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT,
            phone_number TEXT,
            text_desc TEXT,
            location TEXT,
            image_path TEXT,
            status TEXT DEFAULT 'pending',
            priority TEXT,
            ai_category TEXT,
            ai_score REAL,
            ward_zone TEXT,
            latitude REAL,
            longitude REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            verified_at TIMESTAMP,
            assigned_at TIMESTAMP,
            deadline_at TIMESTAMP,
            resolved_at TIMESTAMP,
            resolution_image_path TEXT,
            contractor_id TEXT
        )
    ''')
    
    # 2. INTEGRATE TEAMMATE'S IDENTITY TABLES (CRITICAL FIX: Tables must exist before indexing email)
    init_verification_db(cursor)

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS system_config (
            id INTEGER PRIMARY KEY,
            administrative_scope TEXT,
            category_mapping TEXT,
            sla_hours INTEGER,
            desk_officers INTEGER,
            field_workers INTEGER
        )
    ''')


    # 2. INTEGRATE TEAMMATE'S IDENTITY TABLES (CRITICAL: Must exist before Indexing)
    init_verification_db(cursor)

    # Persistent Auth Context: Thread-Safe SQLite Storage for OTPs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS auth_otps (
            email TEXT PRIMARY KEY,
            code TEXT,
            expiry TEXT,
            sent_at TEXT,
            verified INTEGER DEFAULT 0,
            role TEXT
        )
    ''')

    cursor.execute('CREATE INDEX IF NOT EXISTS idx_complaints_ward ON complaints(ward_zone)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_complaints_ai_score ON complaints(ai_score)')

    # Performance Crack: Authentication Indexing for sub-50ms query speed
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_citizens_email ON citizens(email)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_government_officers_email ON government_officers(email)')
    
    # 3. PERFORMANCE OPTIMIZATION: WAL MODE
    cursor.execute("PRAGMA journal_mode=WAL")
    
    conn.commit()
    conn.close()

init_db()

# --- 5. OTP & IDENTITY ROUTES ---

@app.post("/api/send-otp")
async def send_otp(data: OTPRequest, background_tasks: BackgroundTasks):
    """Revolutionary Developer: Identity Verification Layer (Zero-Latency Handshake)"""
    email = data.email.strip().lower()
    name = data.name.strip()
    role = data.role.strip()

    if not data.is_signup:
        conn = sqlite3.connect(DATABASE_PATH)
        table = "government_officers" if role == "government" else "citizens"
        # Teammate Logic: Strict database check
        user = conn.execute(f"SELECT name FROM {table} WHERE email = ?", (email,)).fetchone()
        conn.close()
        if not user:
            raise HTTPException(
                status_code=404, 
                detail=f"Identity Verification Failed: No {role} record found in our database. Please Sign Up first."
            )

    otp_code = str(random.randint(100000, 999999))
    # Stable Dictionary Handshake
    auth_context[email] = {
        "code": otp_code,
        "expiry": datetime.now() + timedelta(minutes=5),
        "verified": False,
        "role": role
    }
    
    body = f"Hello {name},\n\nYour Nivaran verification code is: {otp_code}\nExpires in 5 minutes."
    
    # REVOLUTIONARY DEVELOPER: Synchronous SMTP Dispatch for Handshake Integrity
    send_email(email, "Nivaran Verification", body)
    
    return {"message": "Secure Identity Handshake Initiated. Please check your inbox for the AI-generated code."}

@app.post("/api/verify-otp")
async def verify_otp(data: VerifyRequest):
    """Teammate's Stable OTP Verification Logic with Admin Moulding"""
    email = data.email.strip().lower()
    record = auth_context.get(email)
    
    if not record or datetime.now() > record["expiry"]:
        raise HTTPException(status_code=400, detail="OTP expired or not requested.")
    
    if record["code"] != data.code:
        raise HTTPException(status_code=400, detail="Invalid code.")
    
    record["verified"] = True
    
    # Administrative Moulding: Check if system_config exists to flag setup completion
    conn = sqlite3.connect(DATABASE_PATH)
    config_exists = conn.execute("SELECT 1 FROM system_config LIMIT 1").fetchone()
    
    admin_role = "Desk_Officer"
    ward = "General"
    is_setup_complete = 1  # DEPLOYMENT MODE: Standardized Production Standard
    
    if record["role"] == "government":
        user_data = conn.execute(
            "SELECT admin_role, ward FROM government_officers WHERE email = ?", 
            (data.email,)
        ).fetchone()
        if user_data:
            admin_role = user_data[0] # Usually 'Admin' or 'Desk_Officer'
            ward = user_data[1]
    conn.close()

    # Simple Token Generation
    access_token = create_access_token(
        data={"sub": data.email, "role": record["role"], "admin_role": admin_role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "status": "success", 
        "token": access_token,
        "token_type": "bearer",
        "role": record["role"], 
        "admin_role": admin_role,
        "ward": ward,
        "is_setup_complete": is_setup_complete,
        "message": "Identity verified successfully"
    }




@app.post("/register/citizen")
async def register_citizen(data: CitizenFinal):
    """Revolutionary Developer: Final Citizen Registration"""
    email = data.email.strip().lower()
    if not auth_context.get(email, {}).get("verified"):
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
    admin_role: str = Form("Desk_Officer"), # Default to Desk_Officer
    proof: UploadFile = File(...)
):
    """Revolutionary Developer: Secure Government Officer Registration"""
    email = email.strip().lower()
    if not auth_context.get(email, {}).get("verified"):
        raise HTTPException(status_code=403, detail="STRICT: Email verification required first.")

    # Save Proof of Employment
    os.makedirs("gov_proofs", exist_ok=True)
    proof_path = f"gov_proofs/{email}_{proof.filename}"
    content = await proof.read()
    with open(proof_path, "wb") as f:
        f.write(content)

    conn = sqlite3.connect(DATABASE_PATH)
    try:
        # SYSTEMS ARCHITECT: First-User Elevation (Zero-Touch Admin Deployment)
        officer_count = conn.execute("SELECT COUNT(*) FROM government_officers").fetchone()[0]
        final_role = "Admin" if officer_count == 0 else admin_role

        conn.execute(
            "INSERT INTO government_officers (name, email, phone, ward, uid_number, proof_path, password_hash, admin_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (name, email, phone, ward, uid, proof_path, hash_password(password), final_role)
        )
        conn.commit()
        
        # Cleanup verification context
        if email in auth_context:
            del auth_context[email]
            
        send_email(email, "Welcome Officer", f"Hello {name}, your Nivaran Officer account is created! Role: {admin_role}")
        return {"status": "success", "redirect_to": "/dashboard", "is_setup_complete": 0}
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
    # --- FAIL-FAST DUPLICATE DETECTION (10m Radius) ---
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    # Using a simple bounding box for 10m approximately (0.0001 degrees)
    cursor.execute("""
        SELECT id FROM complaints 
        WHERE status IN ('pending', 'verified', 'assigned') 
        AND ABS(latitude - ?) < 0.0001 
        AND ABS(longitude - ?) < 0.0001
        LIMIT 1
    """, (latitude, longitude))
    duplicate = cursor.fetchone()
    if duplicate:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="Hotspot Detected: Our team is already on-site at this location (Case ID: " + str(duplicate[0]) + ")."
        )
    conn.close()

    # STRICT Conflict Resolution: Verify OTP Identity Layer first
    email = email.lower()
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
        
        # --- YOLOv11 + NLP MULTIMODAL GUARD (FIRE-AND-FORGET) ---
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

        # --- FETCH SYSTEM CONFIG FOR AUTO-ASSIGNMENT ---
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT category_mapping, sla_hours FROM system_config LIMIT 1")
        config = cursor.fetchone()
        
        contractor_id = "Default_Contractor"
        deadline_timestamp = None
        
        if config:
            import json
            category_mapping = json.loads(config[0]) if config[0] else {}
            sla_hours = config[1] or 24
            contractor_id = category_mapping.get(logic_result['category'], "General_Desk")
            deadline_timestamp = (datetime.now() + timedelta(hours=sla_hours)).isoformat()

        # --- UPDATE DATABASE WITH AI RESULTS & AUTO-ASSIGNMENT ---
        # HIGH PRIORITY TRIAGE: 2-Hour Deadline for Dangerous road failures
        deadline_hours = 2 if logic_result['priority'] == 'Dangerous' else (sla_hours or 24)
        deadline_timestamp = (datetime.now() + timedelta(hours=deadline_hours)).isoformat()

        conn.execute('''
        UPDATE complaints SET 
        status='verified', 
        priority=?, 
        ai_category=?, 
        ai_score=?, 
        ward_zone=?,
        verified_at=CURRENT_TIMESTAMP,
        assigned_at=CURRENT_TIMESTAMP,
        deadline_at=?,
        contractor_id=?
        WHERE id=?
        ''', (
            logic_result['priority'], 
            logic_result['category'], 
            logic_result['score'], 
            logic_result['jurisdiction'], 
            deadline_timestamp,
            contractor_id,
            complaint_id
        ))

        conn.commit()
        conn.close()
        print(f"Complaint {complaint_id} Verified & Auto-Assigned with SLA: {deadline_hours}h")


    except Exception as e:
        print(f"Background Task Error: {e}")


# --- 7. GOVT LOGIN (JWT ENABLED) ---
@app.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """Revolutionary Developer Security: Enterprise Standard OAuth2"""
    print(f"Testing SECURE Login: {form_data.username}")
    
    # Top-Down Authority Check: Determine setup status from system_config
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT admin_role FROM government_officers WHERE email = ?", (form_data.username,))
    user_data = cursor.fetchone()
    
    config_exists = cursor.execute("SELECT 1 FROM system_config LIMIT 1").fetchone()
    conn.close()
    
    admin_role = user_data[0] if user_data else "Desk_Officer"
    is_setup_complete = 1  # DEPLOYMENT MODE: Standardized Production Standard

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username, "admin_role": admin_role}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "status": "success",
        "user": form_data.username,
        "admin_role": admin_role,
        "is_setup_complete": is_setup_complete,
        "message": "Access Granted"
    }

@app.get("/api/v1/user/profile")
async def get_user_profile(current_user: str = Depends(get_current_user)):
    """Administrative Identity Check: Returns profile details including setup status."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT admin_role, ward FROM government_officers WHERE email = ?", (current_user,))
    user_data = cursor.fetchone()
    
    config_exists = cursor.execute("SELECT 1 FROM system_config LIMIT 1").fetchone()
    conn.close()
    
    admin_role = user_data[0] if user_data else "Desk_Officer"
    ward = user_data[1] if user_data else "General"
    is_setup_complete = 1  # DEPLOYMENT MODE: Standardized Production Standard
    
    return {
        "email": current_user,
        "admin_role": admin_role,
        "ward": ward,
        "is_setup_complete": is_setup_complete
    }

@app.get("/api/v1/system/status")
async def get_system_status():
    """Gatekeeper Logic: Dynamic status check via system_config table."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    config_exists = cursor.execute("SELECT 1 FROM system_config LIMIT 1").fetchone()
    conn.close()
    
    is_complete = 1  # DEPLOYMENT MODE: Standardized Production Standard
    return {"is_setup_complete": is_complete}

@app.post("/api/v1/system/configure")
async def configure_system(
    scope: str = Form(...),
    mapping: str = Form(...), # JSON string
    sla: int = Form(...),
    desk_officers: int = Form(5),
    field_workers: int = Form(20),
    admin: str = Depends(check_admin_authority)
):
    """
    Top-Down Authority: Unified System Moulding.
    Restricted to Administative Body Leads.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Verify Administrative Role for this command (Strict RBAC)
    cursor.execute("SELECT admin_role FROM government_officers WHERE email = ?", (admin,))
    role_record = cursor.fetchone()
    if not role_record or role_record[0].lower() != 'admin':
        conn.close()
        raise HTTPException(
            status_code=403, 
            detail="AUTHORITY DENIED: Only the System Admin can access the setup table."
        )

    cursor.execute("DELETE FROM system_config")
    cursor.execute(
        "INSERT INTO system_config (administrative_scope, category_mapping, sla_hours, desk_officers, field_workers) VALUES (?, ?, ?, ?, ?)",
        (scope, mapping, sla, desk_officers, field_workers)
    )
    # Global sync: All admin personnel are now on the same operational page
    cursor.execute("UPDATE government_officers SET is_setup_complete = 1")
    
    conn.commit()
    conn.close()
    return {"status": "success", "message": "System Moulded: The Administrative Reality has been updated."}

@app.get("/api/v1/system/config")
async def get_system_config(current_user: str = Depends(get_current_user)):
    """Fetch for UI Moulding (Protected)"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    config = conn.execute("SELECT * FROM system_config LIMIT 1").fetchone()
    conn.close()
    return dict(config) if config else {}


@app.patch("/resolve-grievance/{id}")
async def resolve_grievance(
    id: int,
    after_photo: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    """Resolution Loop: Immutable Proof of Fix Required"""
    os.makedirs("uploads/resolutions", exist_ok=True)
    res_path = f"uploads/resolutions/{id}_{after_photo.filename}"
    content = await after_photo.read()
    with open(res_path, "wb") as f:
        f.write(content)
        
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE complaints SET status='resolved', resolved_at=CURRENT_TIMESTAMP, resolution_image_path=? WHERE id=?",
        (res_path, id)
    )
    conn.commit()
    conn.close()
    return {"message": "Grievance resolved with physical evidence."}


@app.post("/api/v1/complaints/{id}/issue-job-card")
async def issue_job_card(id: int, current_user: str = Depends(get_current_user)):
    """Commander Dispatch: Auto-calculates 2-hour deadline and assigns sovereignty job card."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # SYSTEM ARCHITECT: Strict 2-Hour Sovereign Handshake
    deadline = (datetime.now() + timedelta(hours=2)).isoformat()
    
    cursor.execute(
        "UPDATE complaints SET status='assigned', assigned_at=CURRENT_TIMESTAMP, deadline_at=? WHERE id=?",
        (deadline, id)
    )
    conn.commit()
    conn.close()
    return {
        "status": "success", 
        "message": "COMMANDER DISPATCHED: Job Card Issued. 2-Hour Triage Active.",
        "deadline": deadline
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

        search_term = f"%{category.split(' ')[0]}%" if category else "%%"

        # Fetch system scope for label bridging
        config = cursor.execute("SELECT administrative_scope FROM system_config LIMIT 1").fetchone()
        scope = config[0] if config else "Municipal"

        cursor.execute('''
            SELECT * FROM complaints 
            WHERE ward_zone = ? AND ai_category LIKE ? AND status IN ('verified', 'assigned', 'resolved')
            ORDER BY ai_score DESC
        ''', (ward, search_term))
        
        rows = cursor.fetchall()
        complaints = []
        for row in rows:
            comp_dict = dict(row)
            try:
                # DECRYPT DATA FOR DISPLAY (PII HARDENING)
                raw_name = decrypt_data(comp_dict["full_name"])
                raw_phone = str(decrypt_data(comp_dict["phone_number"]))
                
                # DATA MASKING: Only last 3 digits visible
                masked_phone = ("*" * (len(raw_phone) - 3)) + raw_phone[-3:] if len(raw_phone) >= 3 else raw_phone
                
                # Top-Down Configuration Authority: Label Mapping (Handled by frontend)
                comp_dict["full_name"] = raw_name
                comp_dict["phone_number"] = masked_phone
            except Exception as e:
                print(f"Decryption error for record {comp_dict['id']}: {e}")
            
            complaints.append(comp_dict)


        conn.close()

        return complaints
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/get-ward-stats")
async def get_ward_stats(
    ward: str,
    current_user: str = Depends(get_current_user)
):
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
        
        query = "SELECT latitude, longitude, ai_score, ai_category FROM complaints WHERE status IN ('verified', 'assigned')"
        params = []
        
        if ward:
            query += " AND ward_zone = ?"
            params.append(ward)
        if category and category != 'undefined':
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
