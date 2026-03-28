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

# --- UPDATE CORS IN server.py ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows any origin during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIG ---
CITIZEN_DB = "citizens.db"
GOVERNMENT_DB = "government.db"
SMTP_EMAIL = "rajeedandge444@gmail.com" 
SMTP_PASSWORD = "jpiy ukpb lgtu kcxt" 

# Stores OTPs and verification status: { email: { "code": "...", "verified": False, "role": "..." } }
auth_context = {}

# --- DB INIT ---
def init_dbs():
    conn_c = sqlite3.connect(CITIZEN_DB)
    conn_c.execute('''CREATE TABLE IF NOT EXISTS citizens (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, phone TEXT, uid_number TEXT, password_hash TEXT, role TEXT DEFAULT 'citizen')''')
    conn_c.close()
    conn_g = sqlite3.connect(GOVERNMENT_DB)
    conn_g.execute('''CREATE TABLE IF NOT EXISTS government_officers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, phone TEXT, ward TEXT, uid_number TEXT, proof_path TEXT, password_hash TEXT, role TEXT DEFAULT 'government')''')
    conn_g.close()

init_dbs()

# --- HELPERS ---
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def send_email(target, subject, body):
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = SMTP_EMAIL
    msg['To'] = target
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Mail Error: {e}")
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
@app.exception_handler(Exception)
async def debug_exception_handler(request, exc):
    print(f"DEBUG ERROR: {exc}")
    return await request.app.default_exception_handler(request, exc)

@app.post("/api/send-otp")
async def send_otp(data: OTPRequest):
    email = data.email.strip()
    name = data.name.strip()
    role = data.role.strip()

    # LOGIN FLOW: Verify user exists in DB first
    if not data.is_signup:
        db = GOVERNMENT_DB if role == "government" else CITIZEN_DB
        table = "government_officers" if role == "government" else "citizens"
        conn = sqlite3.connect(db)
        user = conn.execute(f"SELECT name FROM {table} WHERE email = ? AND name = ?", (email, name)).fetchone()
        conn.close()
        
        if not user:
            raise HTTPException(status_code=404, detail=f"No registered {role} found with this Name/Email.")

    # Generate OTP
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
    record = auth_context.get(data.email)

    print(f"DEBUG: Record for {data.email} is {record}")
    
    if not record or datetime.now() > record["expiry"]:
        raise HTTPException(status_code=400, detail="OTP expired or not requested.")
    
    if record["code"] != data.code:
        raise HTTPException(status_code=400, detail="Invalid code.")
    
    record["verified"] = True
    return {"status": "success", "role": record["role"], "message": "Email verified"}

@app.post("/register/citizen")
async def register_citizen(data: CitizenFinal):
    # Security Check: Was email verified?
    if not auth_context.get(data.email, {}).get("verified"):
        raise HTTPException(status_code=403, detail="Email not verified via OTP.")

    conn = sqlite3.connect(CITIZEN_DB)
    try:
        conn.execute(
            "INSERT INTO citizens (name, email, phone, uid_number, password_hash) VALUES (?, ?, ?, ?, ?)",
            (data.name, data.email, data.phone, data.uid_number, hash_password(data.password))
        )
        conn.commit()
        send_email(data.email, "Welcome to Nivaran", f"Hello {data.name}, your citizen account is ready!")
        del auth_context[data.email]
        return {"status": "success", "redirect_to": "/citizen"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="User already exists.")
    finally:
        conn.close()

@app.post("/register/government")
async def register_gov(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    ward: str = Form(...),
    uid: str = Form(...),
    password: str = Form(...),
    proof: UploadFile = File(...)
):
    if not auth_context.get(email, {}).get("verified"):
        raise HTTPException(status_code=403, detail="Email not verified.")

    os.makedirs("gov_proofs", exist_ok=True)
    proof_path = f"gov_proofs/{email}_{proof.filename}"
    with open(proof_path, "wb") as f:
        f.write(await proof.read())

    conn = sqlite3.connect(GOVERNMENT_DB)
    try:
        conn.execute(
            "INSERT INTO government_officers (name, email, phone, ward, uid_number, proof_path, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (name, email, phone, ward, uid, proof_path, hash_password(password))
        )
        conn.commit()
        send_email(email, "Welcome to Nivaran", f"Hello {name}, your officer account is approved!")
        del auth_context[email]
        return {"status": "success", "redirect_to": "/dashboard"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Officer already exists.")
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)