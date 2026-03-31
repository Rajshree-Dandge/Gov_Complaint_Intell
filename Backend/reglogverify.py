
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import os
import hashlib
import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from typing import Optional

app = FastAPI(title="Nivaran Backend - Verified Workflow")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIG ---
CITIZEN_DB = "citizens.db"
GOVERNMENT_DB = "government.db"
SMTP_EMAIL = "rajeedandge444@gmail.com" 
SMTP_PASSWORD = "zflc iugz xhwd tgwh"

# In-memory store for OTPs (Use Redis for production)
auth_context = {}

# --- DB INIT ---
# --- DB INIT ---
def init_dbs():
    conn_c = sqlite3.connect(CITIZEN_DB)
    conn_c.execute('''CREATE TABLE IF NOT EXISTS citizens (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT, 
        email TEXT UNIQUE, 
        phone TEXT, 
        uid_number TEXT, 
        password_hash TEXT, 
        role TEXT DEFAULT 'citizen')''')
    conn_c.close()
    
    conn_g = sqlite3.connect(GOVERNMENT_DB)
    # FIX: Changed 'file' to 'TEXT' for proof_path
    conn_g.execute('''CREATE TABLE IF NOT EXISTS government_officers (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT, 
        email TEXT UNIQUE, 
        phone TEXT, 
        location TEXT, 
        designation TEXT,
        uid_number TEXT, 
        proof_path TEXT, 
        password_hash TEXT, 
        role TEXT DEFAULT 'government')''')
    conn_g.close()

# --- REGISTER GOV ---
@app.post("/register/government")
@app.post("/register/government")
async def register_gov(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    location: str = Form(...),
    designation: str = Form(...),
    uid: str = Form(...),
    password: str = Form(...),
    proof: UploadFile = File(...)
):
    # Security Check
    user_context = auth_context.get(email)
    if not user_context or not user_context.get("verified"):
        raise HTTPException(status_code=403, detail="Session expired or email not verified.")

    # Save Document Proof
    os.makedirs("gov_proofs", exist_ok=True)
    file_extension = os.path.splitext(proof.filename)[1]
    proof_path = f"gov_proofs/{email}_proof{file_extension}"
    
    with open(proof_path, "wb") as f:
        f.write(await proof.read())

    conn = sqlite3.connect(GOVERNMENT_DB)
    try:
        conn.execute(
            """INSERT INTO government_officers 
            (name, email, phone, location, designation, uid_number, proof_path, password_hash) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (name, email, phone, location, designation, uid, proof_path, hash_password(password))
        )
        conn.commit()
        
        # Confirmation Email
        send_email(email, "Nivaran - Registration Success", 
                   f"Hello {name},\n\nYour account as {designation} has been created.")
        
        if email in auth_context: del auth_context[email]
        return {"status": "success", "redirect_to": "/govLanding"}
    
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Officer with this email already exists.")
    finally:
        conn.close()


init_dbs()

# --- HELPERS ---
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def send_email(target, subject, body):
    from email.mime.multipart import MIMEMultipart
    msg = MIMEMultipart()
    msg['Subject'] = subject
    msg['From'] = SMTP_EMAIL
    msg['To'] = target
    msg.attach(MIMEText(body, 'plain'))
    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=30)
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Nivaran Mail Engine Error: {e}")
        return False

# --- MODELS ---
class OTPRequest(BaseModel):
    email: str
    name: str
    role: str
    is_signup: bool = False

class VerifyRequest(BaseModel):
    email: str
    code: str

class CitizenFinal(BaseModel):
    name: str
    email: str
    phone: str
    uid_number: str
    password: str

# --- ROUTES ---

@app.post("/api/send-otp")
async def send_otp(data: OTPRequest):
    email = data.email.strip()
    name = data.name.strip()
    role = data.role.strip()

    # If it's a login check (not signup), verify user exists
    if not data.is_signup:
        db = GOVERNMENT_DB if role == "government" else CITIZEN_DB
        table = "government_officers" if role == "government" else "citizens"
        conn = sqlite3.connect(db)
        user = conn.execute(f"SELECT name FROM {table} WHERE email = ? AND name = ?", (email, name)).fetchone()
        conn.close()
        if not user:
            raise HTTPException(status_code=404, detail=f"No registered {role} found.")

    otp_code = str(random.randint(100000, 999999))
    print(f"DEBUG: The OTP for {data.email} is: {otp_code}") # ADD THIS LINE
    auth_context[email] = {
        "code": otp_code,
        "expiry": datetime.now() + timedelta(minutes=5),
        "verified": False,
        "role": role
    }
    
    body = f"Hello {name},\n\nYour Nivaran verification code is: {otp_code}"
    if send_email(email, "Nivaran Verification", body):
        return {"message": "OTP sent"}
    raise HTTPException(status_code=500, detail="Email service failed.")

@app.post("/api/verify-otp")
async def verify_otp(data: VerifyRequest):
    record = auth_context.get(data.email)
    if not record or datetime.now() > record["expiry"] or record["code"] != data.code:
        raise HTTPException(status_code=400, detail="Invalid or Expired OTP.")
    
    record["verified"] = True
    return {"status": "success", "role": record["role"]}

@app.post("/register/citizen")
async def register_citizen(data: CitizenFinal):
    if not auth_context.get(data.email, {}).get("verified"):
        raise HTTPException(status_code=403, detail="Please verify your email first.")
    
    conn = sqlite3.connect(CITIZEN_DB)
    try:
        conn.execute("INSERT INTO citizens (name, email, phone, uid_number, password_hash) VALUES (?, ?, ?, ?, ?)",
            (data.name, data.email, data.phone, data.uid_number, hash_password(data.password)))
        conn.commit()
        if data.email in auth_context: del auth_context[data.email]
        return {"status": "success", "redirect_to": "/citizenLanding"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="User already exists.")
    finally: conn.close()

# --- UPDATED: GOVERNMENT REGISTRATION ---
@app.post("/register/government")
async def register_gov(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    location: str = Form(...),      # Received from navigator.geolocation
    designation: str = Form(...),   # Selected from rolesList
    uid: str = Form(...),           # Maps to uid_number in DB
    password: str = Form(...),
    proof: UploadFile = File(...)
):
    # Security Check: Ensure OTP was verified in Step 1
    user_context = auth_context.get(email)
    if not user_context or not user_context.get("verified"):
        raise HTTPException(status_code=403, detail="Session expired or email not verified.")

    # Save Document Proof
    os.makedirs("gov_proofs", exist_ok=True)
    file_extension = os.path.splitext(proof.filename)[1]
    proof_path = f"gov_proofs/{email}_proof{file_extension}"
    
    with open(proof_path, "wb") as f:
        f.write(await proof.read())

    conn = sqlite3.connect(GOVERNMENT_DB)
    try:
        # Insert all fields including new location and designation
        conn.execute(
            """INSERT INTO government_officers 
            (name, email, phone, location, designation, uid_number, proof_path, password_hash) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (name, email, phone, location, designation, uid, proof_path, hash_password(password))
        )
        conn.commit()
        
        # Send Confirmation Email
        send_email(email, "Nivaran - Registration Success", 
                   f"Hello {name},\n\nYour account as {designation} has been created successfully.")
        
        # Clear verification session
        if email in auth_context: del auth_context[email]
        
        return {"status": "success", "redirect_to": "/govLanding"}
    
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Officer with this email already exists.")
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)