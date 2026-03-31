import sqlite3
import os
import random
from datetime import datetime, timedelta
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from dotenv import load_dotenv

# Path logic: find the .env file in the parent folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

DB_PATH = os.path.join(BASE_DIR, "grievance.db")

# ENCRYPTION SYNC: Must match the logic in takeimage.py
ENCRYPTION_KEY_RAW = os.getenv("ENCRYPTION_KEY", "32-bytes-of-sovereign-intelligence-key!")
key_bytes = ENCRYPTION_KEY_RAW.encode().ljust(32)[0:32]
aesgcm = AESGCM(key_bytes)

def encrypt_data(data: str) -> str:
    """Industrial-Grade AES-256-GCM Encryption for Seeding"""
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, data.encode(), None)
    return (nonce.hex() + ciphertext.hex())

def seed_grievances():
    if not os.path.exists(DB_PATH):
        print(f"❌ Error: Database not found at {DB_PATH}. Run backend main first.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM complaints")

    complaints = []
    
    # --- AREA 1: DOMBIVLI EAST (15 Dangerous Potholes) ---
    # Purpose: High severity Red Pulsing Hotspot
    for i in range(15):
        complaints.append((
            encrypt_data(f"Citizen D{i}"), 
            encrypt_data(f"9967586{i:03d}"), 
            "Emergency: Deep pothole on Manpada Road caused accident!", 
            "Manpada Road, Dombivli", 
            "uploads/test_pothole.jpg", 
            "verified", "Dangerous", "Roads", 
            random.uniform(8.5, 9.9), 
            "Dombivli East", 
            19.2184 + random.uniform(-0.0005, 0.0005), 
            73.0867 + random.uniform(-0.0005, 0.0005)
        ))

    # --- AREA 2: MANPADA (35 Moderate Sanitation Issues) ---
    # Purpose: Large Yellow Bubble on Heatmap
    for i in range(35):
        complaints.append((
            encrypt_data(f"Resident M{i}"), 
            encrypt_data(f"9821630{i:03d}"), 
            "Kachra jamla ahe, khup ghan vas yeto ahe.", 
            "Manpada Sector 4", 
            "uploads/test_garbage.jpg", 
            "verified", "Moderate", "Sanitation", 
            random.uniform(3.5, 5.5), 
            "Dombivli East", 
            19.2250 + random.uniform(-0.002, 0.002), 
            73.0950 + random.uniform(-0.002, 0.002)
        ))

    cursor.executemany('''
        INSERT INTO complaints (
            full_name, phone_number, text_desc, location, image_path, 
            status, priority, ai_category, ai_score, ward_zone, latitude, longitude
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    ''', complaints)

    conn.commit()
    conn.close()
    print(f"✅ [INTELLIGENCE] 50 Cases seeded successfully into {DB_PATH}")

if __name__ == "__main__":
    seed_grievances()