import sqlite3
import os
import hashlib

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "government.db")

def hash_pw(password):
    return hashlib.sha256(password.encode()).hexdigest()

def seed_officers():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM government_officers")

    # 10 Officers across 3 Departments
    # Format: name, email, phone, location, uid_number, proof_path, password_hash, role, admin_role, admin_body, specific_role, workspace_code, is_setup, is_setup_complete, onboarding_step, is_onboarded
    officers = [
        ("Admin Sakshi", "admin@nivaran.gov", "9967586511", "Dombivli East", "GOV-001", "proofs/id.pdf", hash_pw("admin123"), "government", "Admin", "Municipal Corporation", "Commissioner", "DOM-E-2026", 1, 1, 9, 1),
        ("Sarpanch Ganpat", "village@nivaran.gov", "9820011223", "Ganpatipule", "GOV-002", "proofs/id.pdf", hash_pw("pass123"), "government", "Admin", "Gram Panchayat", "Sarpanch", "GAN-GP-2026", 1, 1, 9, 1),
        ("JE Roads", "roads@nivaran.gov", "9000000001", "Dombivli East", "GOV-003", "proofs/id.pdf", hash_pw("pass123"), "government", "Desk_Officer", "Municipal Corporation", "Junior Engineer", "DOM-E-2026", 1, 1, 9, 1),
        ("Sanitary Inspector", "waste@nivaran.gov", "9000000002", "Manpada Road", "GOV-004", "proofs/id.pdf", hash_pw("pass123"), "government", "Desk_Officer", "Municipal Corporation", "Inspector", "MAN-W5-2026", 1, 1, 9, 1),
        ("Contractor One", "worker1@nivaran.gov", "9000000003", "Dombivli East", "GOV-005", "proofs/id.pdf", hash_pw("pass123"), "government", "Contractor", "Municipal Corporation", "Contractor", "DOM-E-2026", 1, 1, 9, 1)
    ]
    # Adding 5 more to reach 10
    for i in range(6, 11):
        officers.append((f"Officer_{i}", f"gov{i}@nivaran.gov", f"9000000{i:03d}", "Dombivli East", f"GOV-00{i}", "id.pdf", hash_pw("pass123"), "government", "Desk_Officer", "Municipal Corporation", "JE", "DOM-E", 1, 1, 9, 1))

    for row in officers:
        try:
            cursor.execute('''
                INSERT INTO government_officers (
                    name, email, phone, location, uid_number, proof_path, password_hash, role, 
                    admin_role, admin_body, specific_role, workspace_code, is_setup, 
                    is_setup_complete, onboarding_step, is_onboarded
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', row)
        except Exception as e:
            print(f"Error: {e}")
            
    conn.commit()
    conn.close()
    print("✅ Seeded 10 multi-role officers successfully.")

if __name__ == "__main__":
    seed_officers()