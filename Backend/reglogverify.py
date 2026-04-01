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
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIG ---
CITIZEN_DB = "citizens.db"
GOVERNMENT_DB = "government.db"
SMTP_EMAIL = "rajeedandge444@gmail.com" 
SMTP_PASSWORD = "zkpm slsj txnh bclm"

# In-memory store for OTPs and Sessions
auth_context = {}
sessions = {} # {token: {"name": str, "role": str}}

# --- DB INIT ---
def init_dbs():
    # 1. Initialize Citizen Database
    try:
        conn_c = sqlite3.connect(CITIZEN_DB)
        cursor_c = conn_c.cursor()
        cursor_c.execute('''CREATE TABLE IF NOT EXISTS citizens (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            name TEXT, 
            email TEXT UNIQUE, 
            phone TEXT, 
            uid_number TEXT, 
            password_hash TEXT, 
            role TEXT DEFAULT 'citizen')''')
        conn_c.commit()
        conn_c.close()
        print("✅ Citizen Database Initialized")
    except Exception as e:
        print(f"❌ Error initializing Citizen DB: {e}")
    
    try:
        conn_g = sqlite3.connect(GOVERNMENT_DB)
        cursor_g = conn_g.cursor()

        
        # Permanent Table
        cursor_g.execute('''CREATE TABLE IF NOT EXISTS government_officers (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            name TEXT, 
            email TEXT UNIQUE, 
            phone TEXT, 
            location TEXT, 
            uid_number TEXT, 
            proof_path TEXT,
            password_hash TEXT, 
            role TEXT, 
            admin_body TEXT, 
            specific_role TEXT, 
            workspace_code TEXT,
            is_setup_complete INTEGER DEFAULT 0)''')
        
        
        # Onboarding Progress Table
        cursor_g.execute('''CREATE TABLE IF NOT EXISTS onboarding_progress (
            email TEXT PRIMARY KEY,
            step INTEGER DEFAULT 1,
            name TEXT,
            phone TEXT,
            location TEXT,
            uid_number TEXT,
            password_hash TEXT,
            role TEXT,
            admin_role TEXT,
            admin_body TEXT,
            specific_role TEXT,
            workspace_code TEXT,
            is_setup INTEGER DEFAULT 0,
            is_setup_complete INTEGER DEFAULT 0,
            onboarding_step INTEGER DEFAULT 1,
            is_onboarded INTEGER DEFAULT 0)''')

        # Add this inside your init_dbs() function under the Government section
        cursor_g.execute('''CREATE TABLE IF NOT EXISTS workspaces (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location TEXT,
            workspace_code TEXT UNIQUE,
            admin_body TEXT,
            is_active INTEGER DEFAULT 1
        )''')

        # Optional: Seed a test workspace
        cursor_g.execute("INSERT OR IGNORE INTO workspaces (location, workspace_code, admin_body) VALUES ('Mumbai', 'MUM789', 'Municipal Corporation')")

        conn_g.commit()
        conn_g.close()
        print("✅ Government Database Initialized")
    except Exception as e:
        print(f"❌ Error initializing Government DB: {e}")

# Call it directly
init_dbs()

# --- HELPERS ---
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_session(email: str, name: str, role: str):
    token = hashlib.sha256(f"{email}{datetime.now()}".encode()).hexdigest()
    sessions[token] = {"name": name, "role": role}
    return token

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
class OnboardingUpdate(BaseModel):
    email: str
    step: int

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

@app.get("/api/onboarding/status")
async def get_onboarding_status(email: str):
    conn = sqlite3.connect(GOVERNMENT_DB)
    conn.row_factory = sqlite3.Row 
    cursor = conn.cursor()
    try:
        # FIRST: Check if they are already fully registered
        officer = cursor.execute(
            "SELECT is_setup_complete FROM government_officers WHERE email = ?", 
            (email,)
        ).fetchone()
        
        if officer and officer["is_setup_complete"] == 1:
            return {"step": 11, "is_complete": True, "redirect": "/dashboard"}

        # SECOND: Check temporary progress
        row = cursor.execute("SELECT * FROM onboarding_progress WHERE email = ?", (email,)).fetchone()
        if row:
            res = dict(row)
            # Logic: If step is > 1, we can skip the OTP screen on refresh
            res["skip_otp"] = res.get("step", 1) > 1
            res["is_complete"] = False
            return res
            
        # THIRD: Default for brand new users
        return {"step": 1, "skip_otp": False, "is_complete": False}
        
    except Exception as e:
        print(f"❌ Error in status check: {e}")
        return {"step": 1, "error": str(e)}
    finally:
        conn.close()

# FIX 2: Add endpoint to update current step (PATCH)
@app.patch("/api/onboarding/update-step")
async def update_onboarding_step(
    email: str = Form(...),
    step: int = Form(...),
    field: str = Form(None),
    value: str = Form(None)
):
    print(f"DEBUG: Syncing {field} for {email} at step {step}")

    conn = sqlite3.connect("government.db")
    cursor = conn.cursor()
    try:
        # 1. Check if user already has a progress record
        cursor.execute("SELECT step FROM onboarding_progress WHERE email = ?", (email,))
        existing_user = cursor.fetchone()

        if not existing_user:
            # If new, force start at Step 1 regardless of what frontend says
            cursor.execute(
                "INSERT INTO onboarding_progress (email, step) VALUES (?, 1)", 
                (email,)
            )
            actual_step = 1
        else:
            # For existing users, update to the new step provided by frontend
            actual_step = step
            cursor.execute(
                "UPDATE onboarding_progress SET step = ? WHERE email = ?", 
                (actual_step, email)
            )
        
        # 2. Update specific field if provided
        if field and value:
            allowed_columns = [
                "name", "email", "phone", "location", "uid_number", 
                "password_hash", "role", "admin_role", "admin_body", 
                "specific_role", "workspace_code", "is_setup", 
                "is_setup_complete", "onboarding_step", "is_onboarded"
            ]
            
            if field in allowed_columns:
                # Use parameterized query for the value, f-string for column (safe due to allowed_columns)
                cursor.execute(f"UPDATE onboarding_progress SET {field} = ? WHERE email = ?", (value, email))
            else:
                raise HTTPException(status_code=400, detail=f"Invalid field: {field}")

        conn.commit()
        return {"status": "success", "current_step": actual_step}

    except Exception as e:
        print(f"SQL Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# @app.post("/api/onboarding/update-step") # Handle both if frontend uses different methods
# async def update_onboarding_step(data: OnboardingUpdate):
#     conn = sqlite3.connect(GOVERNMENT_DB)
#     try:
#         conn.execute("""
#             INSERT INTO onboarding_progress (email, step) VALUES (?, ?)
#             ON CONFLICT(email) DO UPDATE SET step = excluded.step
#         """, (data.email, data.step))
#         conn.commit()
#         return {"status": "success"}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
#     finally:
#         conn.close()

@app.post("/api/gov/finalize-onboarding")
async def finalize_gov_onboarding(
    email: str = Form(...),
    name: str = Form(...),
    phone: str = Form(...),
    location: str = Form(...),
    uid_number: str = Form(...),
    password: str = Form(...),
    admin_body: str = Form(...),
    specific_role: str = Form(...),
    workspace_code: str = Form(...),
    proof: UploadFile = File(None) # Optional if they didn't upload in final step
):
    conn = sqlite3.connect(GOVERNMENT_DB)
    cursor = conn.cursor()
    
    try:
        # 1. Handle File Upload (Identity Proof)
        proof_path = None
        if proof:
            os.makedirs("gov_proofs", exist_ok=True)
            file_ext = os.path.splitext(proof.filename)[1]
            proof_path = f"gov_proofs/{email}_final_proof{file_ext}"
            with open(proof_path, "wb") as f:
                f.write(await proof.read())

        # 2. Check if already exists in permanent table
        cursor.execute("SELECT id FROM government_officers WHERE email = ?", (email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="This official is already registered.")

        # 3. Insert into permanent Government Officers table
        # Note: We use specific_role as the primary 'role' for the dashboard logic
        cursor.execute('''
            INSERT INTO government_officers (
                name, email, phone, location, uid_number, 
                proof_path, password_hash, role, admin_body, 
                specific_role, workspace_code, is_setup, is_setup_complete,is_onboarding, is_onboarded
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 1)
        ''', (
            name, email, phone, location, uid_number, 
            proof_path, hash_password(password), specific_role, 
            admin_body, specific_role, workspace_code
        ))

        # 4. Clean up the onboarding progress table
        cursor.execute("DELETE FROM onboarding_progress WHERE email = ?", (email,))

        conn.commit()
        
        # 5. Send Success Email
        send_email(
            email, 
            "Nivaran - Sovereign Account Initialized", 
            f"Hello {name}, your administrative account as {specific_role} has been successfully activated."
        )

        return {
            "status": "success",
            "message": "Account Anchored",
            "user": {
                "name": name,
                "email": email,
                "role": specific_role
            }
        }

    except sqlite3.IntegrityError as e:
        print(f"Integrity Error: {e}")
        raise HTTPException(status_code=400, detail="Database integrity error (possible duplicate UID or Email).")
    except Exception as e:
        conn.rollback()
        print(f"Finalization Failure: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- 3. WORKSPACE CHECK ---
@app.get("/api/onboarding/check-code")
async def check_workspace_code(code: str, location: str):
    conn = sqlite3.connect(GOVERNMENT_DB)
    cursor = conn.cursor()
    try:
        # Check if this specific code exists for this specific location
        cursor.execute(
            "SELECT admin_body FROM workspaces WHERE workspace_code = ? AND location = ? AND is_active = 1", 
            (code, location)
        )
        result = cursor.fetchone()

        if result:
            return {"valid": True, "admin_body": result[0]}
        
        # Fallback for your development testing
        if code == "123456":
            return {"valid": True, "admin_body": "Test Department"}

        raise HTTPException(
            status_code=400, 
            detail=f"Invalid Security Key. Code {code} is not authorized for {location}."
        )
    finally:
        conn.close()
        
# --- 4. FINAL SYSTEM CONFIGURE ---
@app.post("/api/v1/system/configure")
async def finalize_config(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    uid: str = Form(...),
    password: str = Form(...),
    # admin_body: str = Form(...),
    # role: str = Form(...),
    # location: str = Form(...)
    scope: str = Form(...),
    desk: str = Form(...),
    worker: str = Form(...),
    sla: str = Form(...),
):
    conn = sqlite3.connect("government.db")
    cursor = conn.cursor()
    
    try:
        # 1. Fetch any remaining data from the temporary onboarding table
        # 1. Insert into permanent Officers table
        cursor.execute('''
            INSERT INTO government_officers (
                name, email, phone, uid_number, password, 
                admin_body, role, location, is_setup_complete
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        ''', (full_name, email, phone, uid, password, admin_body, role, location))
        
        cursor.execute("SELECT specific_role, location FROM onboarding_progress WHERE email = ?", (email,))
        temp_data = cursor.fetchone()
        role = temp_data[0] if temp_data else "Officer"
        location = temp_data[1] if temp_data else "Unknown"

        # 2. INSERT into the permanent table
        # We store the 'specific_role' (e.g., Sarpanch) as the actual role
        cursor.execute('''
            INSERT INTO government_officers (
                name, email, phone, uid_number, password, 
                admin_body, role, location, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        ''', (full_name, email, phone, uid, password, scope, role, location))

        # 3. DELETE or MARK as complete in the onboarding table
        cursor.execute("DELETE FROM onboarding_progress WHERE email = ?", (email,))

        conn.commit()
        
        # Return the data that the Frontend needs to update the AuthContext
        return {
            "status": "success",
            "user": {
                "name": full_name,
                "role": role, # This sends 'Sarpanch' or 'Chief Officer' to the Dashboard
                "email": email
            }
        }
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Account already exists or UID duplicated.")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/send-otp")
async def send_otp(data: OTPRequest):
    email = data.email.strip().lower()
    name = data.name.strip()
    role = data.role.strip()

    if not data.is_signup:
        db = GOVERNMENT_DB if role == "government" else CITIZEN_DB
        table = "government_officers" if role == "government" else "citizens"
        conn = sqlite3.connect(db)
        conn.row_factory = sqlite3.Row
        user = conn.execute(f"SELECT * FROM {table} WHERE email = ?", (email,)).fetchone()
        conn.close()
        if not user:
            raise HTTPException(status_code=404, detail="Account not found. Please sign up.")

    otp_code = str(random.randint(100000, 999999))
    
    auth_context[email] = {
        "code": otp_code,
        "expiry": datetime.now() + timedelta(minutes=10),
        "verified": False,
        "role": role,
        "name": name,
        "is_signup": data.is_signup
    }

    print(f"--- PROTOCOL HANDSHAKE: {email} | CODE: {otp_code} ---")
    
    body = f"Hello {name}, your Nivaran code is: {otp_code}"
    # Try to send the email, but don't crash if it fails
    success = send_email(email, "Nivaran Verification", body)
    
    if not success:
        print(f"⚠️ MAIL FAIL: Check console for OTP. Using bypass mode.")
        # We return 200 anyway so the frontend proceeds, but we notify in console
        return {
            "message": "OTP generated (Email failed, check server console)", 
            "debug_mode": True 
        }

    return {"message": "OTP sent successfully"}

@app.post("/api/verify-otp")
async def verify_otp(data: VerifyRequest):
    email = data.email.strip().lower()
    print(f"🔍 Verification Attempt for: {email} with code: {data.code}")
    record = auth_context.get(email)

    if not record or record["code"] != data.code:
        print("❌ OTP Mismatch or Expired")
        raise HTTPException(status_code=400, detail="Invalid OTP")

    auth_context[email]["verified"] = True

    # SIGN-IN FLOW: Check database if user exists
    if not record.get("is_signup"):
        db = GOVERNMENT_DB if record["role"] == "government" else CITIZEN_DB
        table = "government_officers" if record["role"] == "government" else "citizens"
        
        conn = sqlite3.connect(db)
        conn.row_factory = sqlite3.Row
        user = conn.execute(f"SELECT * FROM {table} WHERE email = ?", (email,)).fetchone()
        conn.close()

        if not user:
            print(f"❌ User {email} not found in {table}")
            raise HTTPException(status_code=404, detail="User not found. Please sign up.")
        
        user_dict = dict(user)  # Convert Row to a real dictionary
        role_to_return = user_dict.get("specific_role") or user_dict.get("role") or record["role"]
        # Determine Redirect based on Role
        redirect = "/dashboard" if record["role"] == "government" else "/citizen"
        
        # Handle the missing 'specific_role' for citizens
        display_role = user_dict.get("specific_role") or user_dict.get("role") or record["role"]

        return {
            "status": "success",
            "user": {
                "name": user_dict["name"],
                "email": user_dict["email"],
                "role": user_dict.get("specific_role") or user_dict.get("role", "citizen")
            },
            "redirect_to": redirect
        }

    return {"status": "success", "message": "Verified. Proceed to registration."}

@app.post("/api/gov/request-otp")
async def request_otp(email: str = Form(...), name: str = Form(...)):
    # Check if they are ALREADY fully registered
    conn = sqlite3.connect(GOVERNMENT_DB)
    user = conn.execute("SELECT * FROM government_officers WHERE email = ? AND is_setup_complete = 1", (email,)).fetchone()
    conn.close()
    
    if user:
        raise HTTPException(status_code=400, detail="Officer already registered. Please Sign In.")

    otp = str(random.randint(100000, 999999))
    auth_context[email] = {"otp": otp, "name": name, "timestamp": datetime.now()}
    
    # Send email logic here...
    print(f"OTP for {email}: {otp}") 
    return {"status": "success", "message": "OTP Dispatched"}

@app.post("/register/citizen")
async def register_citizen(data: CitizenFinal):
    if not auth_context.get(data.email, {}).get("verified"):
        raise HTTPException(status_code=403, detail="Please verify your email first.")
    
    conn = sqlite3.connect(CITIZEN_DB)
    try:
        conn.execute("INSERT INTO citizens (name, email, phone, uid_number, password_hash) VALUES (?, ?, ?, ?, ?)",
            (data.name, data.email, data.phone, data.uid_number, hash_password(data.password)))
        conn.commit()
        
        token = generate_session(data.email, data.name, "citizen")
        if data.email in auth_context: del auth_context[data.email]
        
        return {"status": "success", "token": token, "redirect_to": "/citizen"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="User already exists.")
    finally: conn.close()

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
    user_context = auth_context.get(email)
    if not user_context or not user_context.get("verified"):
        raise HTTPException(status_code=403, detail="Email not verified.")

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
        
        token = generate_session(email, name, "government")
        send_email(email, "Nivaran - Registration Success", f"Hello {name}, account created as {designation}.")
        
        if email in auth_context: del auth_context[email]
        return {"status": "success", "token": token, "redirect_to": "/govLanding"}
    
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Officer already exists.")
    finally:
        conn = sqlite3.connect(GOVERNMENT_DB)
        conn.execute("DELETE FROM onboarding_progress WHERE email = ?", (email,))
        conn.commit()
        conn.close()

@app.get("/api/me")
async def get_me(token: str):
    if token not in sessions:
        raise HTTPException(status_code=401, detail="Invalid session")
    return sessions[token]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)