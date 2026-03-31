from pydantic import BaseModel
import sqlite3
import os
import hashlib
import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Form, UploadFile, File

# --- CONFIG ---
DATABASE_PATH = os.getenv("DATABASE_PATH", "grievance.db")
SMTP_EMAIL = "rajeedandge444@gmail.com" 
SMTP_PASSWORD = "jpiy ukpb lgtu kcxt" 

# Stores OTPs and verification status: { email: { "code": "...", "verified": False, "role": "..." } }
auth_context = {}

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

# --- CORE LOGIC ---
def init_verification_db(cursor):
    """Called from main init_db to set up verification tables."""
    cursor.execute('''CREATE TABLE IF NOT EXISTS citizens (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT, 
        email TEXT UNIQUE, 
        phone TEXT, 
        uid_number TEXT, 
        password_hash TEXT, 
        role TEXT DEFAULT 'citizen'
    )''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS government_officers (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT, 
        email TEXT UNIQUE, 
        phone TEXT, 
        ward TEXT, 
        uid_number TEXT, 
        proof_path TEXT, 
        password_hash TEXT, 
        role TEXT DEFAULT 'government',
        admin_role TEXT DEFAULT 'Desk_Officer', -- Body_Admin or Desk_Officer
        is_setup_complete INTEGER DEFAULT 0 -- 0 = Not complete, 1 = Complete
    )''')
    
    # --- MIGRATION: ADD is_setup_complete if it doesn't exist ---
    try:
        cursor.execute("ALTER TABLE government_officers ADD COLUMN is_setup_complete INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass # Column already exists

