# desk_routes.py
from fastapi import APIRouter, Depends, HTTPException
import sqlite3
import os
from datetime import datetime, timedelta # 1. ADDED MISSING IMPORTS
from detective import decrypt_data 

router = APIRouter(prefix="/api/v1/desk", tags=["Desk Officer"])

DATABASE_PATH = "grievance.db"

@router.get("/dashboard-stats")
async def get_desk_stats(ward: str, domain: str):
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # 2. REVOLUTIONARY FIX: Use LIKE with wildcards
        # This allows "Roads" to match "Roads & Infrastructure"
        domain = domain.strip()
        search_term = f"%{domain}%"

        # Query 1: Total Load
        cursor.execute('''
            SELECT COUNT(*) FROM complaints 
            WHERE ward_zone=? AND ai_category LIKE ? AND status IN ('verified', 'assigned', 'resolved')
        ''', (ward, search_term))
        total_tasks = cursor.fetchone()[0]

        if total_tasks == 0:
            return {"total_today": 0, "urgent_count": "00", "sla_compliance": "100%"}

        # Query 2: Resolved on time
        cursor.execute('''
            SELECT COUNT(*) FROM complaints 
            WHERE ward_zone=? AND ai_category LIKE ? 
            AND status = 'resolved' 
            AND resolved_at <= deadline_at
        ''', (ward, search_term))
        on_time_resolved = cursor.fetchone()[0]

        # Query 3: Urgent count
        cursor.execute('''
            SELECT COUNT(*) FROM complaints 
            WHERE ward_zone=? AND ai_category LIKE ? AND ai_score >= 8.0 AND status != 'resolved'
        ''', (ward, search_term))
        urgent = cursor.fetchone()[0]

        compliance_rate = (on_time_resolved / total_tasks) * 100

        conn.close()
        return {
            "total_today": total_tasks,
            "urgent_count": f"{urgent:02d}",
            "sla_compliance": f"{int(compliance_rate)}%"
        }
    except Exception as e:
        print(f"SLA Calculation Error: {e}")
        return {"status": "error", "message": str(e)}
        
@router.get("/inbox")
async def get_desk_inbox(ward: str, domain: str):
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        domain = domain.strip()
        search_term = f"%{domain}%"
        
        # Updated to LIKE
        cursor.execute('''
            SELECT id, location, ai_score, status, contractor_id, full_name 
            FROM complaints 
            WHERE ward_zone=? AND ai_category LIKE ? AND status != 'rejected'
            ORDER BY ai_score DESC
        ''', (ward, search_term))
        
        rows = cursor.fetchall()
        complaints = []
        for row in rows:
            d = dict(row)
            d["full_name"] = decrypt_data(d["full_name"])
            complaints.append(d)
            
        conn.close()
        return complaints
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/severity-trend")
async def get_severity_trend(ward: str, domain: str):
    try:
        with sqlite3.connect("grievance.db") as conn:
            cursor = conn.cursor()
            domain = domain.strip()
            search_term = f"%{domain}%"
            trend_data = []
            
            for i in range(6, -1, -1):
                # Calculate the date for the last 7 days
                target_date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
                day_name = (datetime.now() - timedelta(days=i)).strftime('%a')
                
                # REVOLUTIONARY FIX: 
                # 1. Use AVG(ai_score) to show real severity trend.
                # 2. Use strftime to normalize the SQLite date comparison.
                cursor.execute('''
                    SELECT AVG(ai_score) FROM complaints 
                    WHERE ward_zone=? AND ai_category LIKE ? 
                    AND strftime('%Y-%m-%d', created_at) = ?
                ''', (ward, search_term, target_date))
                
                avg_val = cursor.fetchone()[0]
                # If no data for that day, return 0.0
                score = round(float(avg_val), 1) if avg_val else 0.0
                
                trend_data.append({"day": day_name, "val": score})
            
            return trend_data
    except Exception as e:
        print(f"Trend Calculation Error: {e}")
        return []