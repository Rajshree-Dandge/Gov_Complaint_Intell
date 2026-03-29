import sqlite3
import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()
DATABASE_PATH = os.getenv("DATABASE_PATH", "grievance.db")
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
cipher_suite = Fernet(ENCRYPTION_KEY.encode())

def encrypt_data(data: str) -> str:
    return cipher_suite.encrypt(data.encode()).decode()

def seed_kokan_village():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS complaints")
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
    cursor.execute("DELETE FROM complaints") # Fresh start
    
    # KOKAN GEODATA (Ganpatipule Area)
    # Center: 17.1475, 73.2685
    kokan_cases = [
        # --- DANGEROUS (The Red Hotspot near the Temple Road) ---
        ("Sakshi Chavan", "9967586511", "मंदीर रोडवर मोठा खड्डा आहे, रात्री दुचाकी घसरून अपघात झाला. तातडीने दुरुस्ती हवी!", "Ganpatipule Mandir Road", 17.1478, 73.2680, "Ganpatipule GP", "Roads", 9.8, "verified"),
        ("Rahul Patil", "9820011223", "Emergency: Mandir javal rasta kharab jhalay, accident risk khup ahe.", "Mandir Chowk", 17.1479, 73.2681, "Ganpatipule GP", "Roads", 9.5, "verified"),

        # --- MODERATE (Garbage Cluster near the Beach Entrance) ---
        *[(f"Villager {i}", f"9800000{i}", "किनाऱ्यावर कचरा कुंडी भरली आहे, खूप घाण वास येत आहे.", "Beach Front", 
           17.1490 + (i*0.0001), 73.2690 + (i*0.0001), "Ganpatipule GP", "Sanitation", 5.2, "verified") for i in range(5)],

        # --- NEUTRAL (Routine Maintenance) ---
        ("Dinesh Mane", "9700011122", "Street light pole no 4 band ahe. Vinanti ahe ki check karave.", "Gram Panchayat Lane", 17.1460, 73.2660, "Ganpatipule GP", "Electricity", 2.4, "verified")
    ]

    for name, phone, desc, loc, lat, lon, ward, cat, score, status in kokan_cases:
        enc_name = encrypt_data(name)
        enc_phone = encrypt_data(phone)
        cursor.execute('''
            INSERT INTO complaints (full_name, phone_number, text_desc, location, latitude, longitude, ward_zone, ai_category, ai_score, status, image_path)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
        ''', (enc_name, enc_phone, desc, loc, lat, lon, ward, cat, score, status, "uploads/test.jpg"))

    conn.commit()
    conn.close()
    print("✅ Kokan Village (Ganpatipule) Data Seeded Successfully!")

if __name__ == "__main__":
    seed_kokan_village()

