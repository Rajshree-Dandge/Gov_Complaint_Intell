import sqlite3
import os
import hashlib

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "citizen.db")

def hash_pw(password):
    return hashlib.sha256(password.encode()).hexdigest()

def seed_citizens():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM citizens") # Clean start

    names = ["Aarav", "Ishani", "Vihaan", "Ananya", "Rohan", "Priya", "Aditya", "Saanvi", "Kabir", "Meera"]
    surnames = ["Patil", "Deshmukh", "Chavan", "Kulkarni", "Jadhav", "More", "Pawar", "Shinde", "Gaekwad", "Koli"]
    
    citizens = []
    for i in range(1, 51):
        full_name = f"{names[i % 10]} {surnames[i % 10]}"
        email = f"citizen{i}@nivaran.in"
        phone = f"9821630{i:03d}"
        uid = f"AADH-{i:04d}-{i+1000:04d}"
        citizens.append((full_name, email, phone, uid, hash_pw("pass123")))

    for row in citizens:
        try:
            cursor.execute('''
                INSERT INTO citizens (name, email, phone, uid_number, password_hash)
                VALUES (?, ?, ?, ?, ?)
            ''', row)
        except Exception as e:
            print(f"Error: {e}")
            
    conn.commit()
    conn.close()
    print("✅ Seeded 50 citizens successfully.")

if __name__ == "__main__":
    seed_citizens()