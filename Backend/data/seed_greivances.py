import sqlite3
import os
import random
from cryptography.fernet import Fernet
from dotenv import load_dotenv

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
load_dotenv(os.path.join(BASE_DIR, ".env"))
DB_PATH = os.path.join(BASE_DIR, "grievance.db")

# ENCRYPTION SYNC (Crucial: Use your app's actual key from .env)
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "32-bytes-of-sovereign-intelligence-key!")
cipher_suite = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)

def enc(data): return cipher_suite.encrypt(str(data).encode()).decode()

def seed_grievances():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM complaints")

    complaints = []
    
    # --- CLUSTER 1: 15 DANGEROUS POTHOLES (DOMBIVLI EAST) ---
    # Center: 19.2184, 73.0867
    for i in range(15):
        complaints.append((
            enc(f"Citizen D{i}"), enc(f"9967586{i:03d}"), 
            "Emergency: Huge pothole on Manpada Road caused accident!", "Manpada Road", 
            "uploads/pothole.jpg", "verified", "Dangerous", "Roads", 9.8 - (i*0.1), 
            "Dombivli East", 19.2184 + random.uniform(-0.0005, 0.0005), 73.0867 + random.uniform(-0.0005, 0.0005)
        ))

    # --- CLUSTER 2: 35 MODERATE GARBAGE (MANPADA ROAD) ---
    # Center: 19.2250, 73.0950
    for i in range(35):
        complaints.append((
            enc(f"Resident M{i}"), enc(f"9821630{i:03d}"), 
            "Kachra jamla ahe, khup ghan vas yeto ahe.", "Manpada Sector", 
            "uploads/garbage.jpg", "verified", "Moderate", "Sanitation", random.uniform(3.5, 5.0), 
            "Manpada Road", 19.2250 + random.uniform(-0.002, 0.002), 73.0950 + random.uniform(-0.002, 0.002)
        ))

    for row in complaints:
        try:
            cursor.execute('''
                INSERT INTO complaints (
                    full_name, phone_number, text_desc, location, image_path, status, priority, ai_category, ai_score, ward_zone, latitude, longitude
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', row)
        except Exception as e:
            print(f"Error: {e}")

    conn.commit()
    conn.close()
    print(f"✅ Seeded 50 complaints in clustered geofences into {DB_PATH}.")

if __name__ == "__main__":
    seed_grievances()