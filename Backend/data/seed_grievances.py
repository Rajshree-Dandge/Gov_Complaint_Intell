import sqlite3
import os
import random
from datetime import datetime, timedelta
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from dotenv import load_dotenv

# Path logic: find the .env file in the parent folder
# Path logic
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))
DB_PATH = os.path.join(BASE_DIR, "grievance.db")

# ENCRYPTION SYNC: Industrial AES-256-GCM
ENCRYPTION_KEY_RAW = os.getenv("ENCRYPTION_KEY", "32-bytes-of-sovereign-intelligence-key!")
key_bytes = ENCRYPTION_KEY_RAW.encode().ljust(32)[0:32]
aesgcm = AESGCM(key_bytes)

def encrypt_data(data: str) -> str:
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, data.encode(), None)
    return (nonce.hex() + ciphertext.hex())

def seed_grievances():
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at {DB_PATH}. Run backend main first.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM complaints")

    complaints = []
    
    # --- LOGIC: SPREAD DATA OVER 7 DAYS ---
    for day_offset in range(7):
        # Create a date for each of the last 7 days
        timestamp = (datetime.now() - timedelta(days=day_offset))
        date_str = timestamp.isoformat()
        
        # --- SCENARIO 1: DANGEROUS POTHOLES (The Red Zone) ---
        # 3 high-priority cases per day for the last 7 days (Total 21)
        for i in range(3):
            status = random.choice(['verified', 'assigned', 'resolved'])
            deadline = (timestamp + timedelta(hours=2)).isoformat()
            
            complaints.append((
                encrypt_data(f"Urgent Citizen {day_offset}_{i}"), 
                encrypt_data("9967586511"), 
                "CRITICAL: Massive road failure causing accidents.", 
                "Manpada Road, Dombivli East", 
                "uploads/test_pothole.jpg", 
                status, "Dangerous", "Roads & Infrastructure", 
                random.uniform(8.5, 9.8), "Dombivli East", 
                19.2184 + random.uniform(-0.0005, 0.0005), 
                73.0867 + random.uniform(-0.0005, 0.0005),
                date_str, # created_at
                deadline  # deadline_at (2 Hours for Dangerous)
            ))

        # --- SCENARIO 2: MODERATE ISSUES (The Yellow Volume) ---
        # 5 moderate cases per day (Total 35)
        for i in range(5):
            complaints.append((
                encrypt_data(f"Resident {day_offset}_{i}"), 
                encrypt_data("9821630502"), 
                "General kachra problem, bad smell.", 
                "Sector 4, Manpada", 
                "uploads/test_garbage.jpg", 
                "verified", "Moderate", "Sanitation & Waste", 
                random.uniform(4.0, 5.5), "Dombivli East", 
                19.2250 + random.uniform(-0.002, 0.002), 
                73.0950 + random.uniform(-0.002, 0.002),
                date_str,
                (timestamp + timedelta(hours=48)).isoformat() # 48H for Moderate
            ))

    # --- SQL INJECTION ---
    cursor.executemany('''
        INSERT INTO complaints (
            full_name, phone_number, text_desc, location, image_path, 
            status, priority, ai_category, ai_score, ward_zone, latitude, longitude, 
            created_at, deadline_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ''', complaints)

    conn.commit()
    conn.close()
    print(f"✅ [SUCCESS] 56 Operational Grievances with 7-Day History seeded into {DB_PATH}")
if __name__ == "__main__":
    seed_grievances()