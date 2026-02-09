# For communication with frontend . This is Api Layer .It sends images to detective and brain

# ---1.importing lib-----
from fastapi import FastAPI,File,Form, UploadFile
# fastapi tools for handling web request, files and text forms
from fastapi.middleware.cors import CORSMiddleware
# allow react frontend to talk to this py backend
import sqlite3
# py built in db to store complaints
import os
# lib to manage folders and file path on computer
from brain import prioritize_complaint

# ---2.creating app object-----
app=FastAPI()
# creating app object to handle the incoming request

# ---3.cors middleware  to allow frontend to talk to backend  without any blocked---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # allow any website (react localhost) to connect
    allow_credentials=True,
    # allow cookies or auth if needed further
    allow_methods=["*"],
    # allow all type of request
    allow_headers=["*"],
    # allow all headers
)

# ---4.db initialization-----
def init_db():
    conn=sqlite3.connect("grievance.db")
    # connects to(or creates) a file  named grievance.db
    cursor=conn.cursor()
    # cursor used to write commands in db

    # create a table if it does not exist yet
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS complaints(
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   text_desc TEXT,
                   image_path TEXT,
                   status TEXT DEFAULT 'pending',
                   priority TEXT DEFAULT 'low'
                   )
''')
    conn.commit()
    conn.close()
    # save changes to db and terminate connection




init_db()
logic_result=prioritize_complaint(description,ai_result)

# ---5.ROUTES---
@app.get("/")
def home():
    return {"message":"Backend is running!!"}
# basic route to check if backend is running

# handling image and text together
@app.post("/submit-complaint")
async def submit_complaint(
    # tell app that these are desc and image came from frontend
    description: str = Form(...),
    file: UploadFile=File(...)
):
    
    try:

        # --step1. save image locally---
        file_loc=f"uploads/{file.filename}"
        # create uploads if not there
        os.makedirs("uploads",exist_ok=True)
    
        # open a new file in right binary mode
        with open(file_loc,"wb+") as file_obj:
        # write the uplaoded image data into that file
            file_obj.write(file.file.read())

        # --step2. save data info in db---
        conn=sqlite3.connect("grievance.db")
        cursor=conn.cursor()

        cursor.execute('''
        INSERT INTO complaints (text_desc,image_path,status,priority,category) VALUES (?,?,?,?,?)''',(description,file_loc,final_status,logic_result["priority"],logic_result["category"]))
        conn.commit()
        conn.close()
        return {
            "status":"success",
            "message": "Complaint submitted successfully",
            "rec_text":description,
            "image_Saved_at":file_loc
        }
    except Exception as e:
        return {
            "status":"error",
            "message": str(e)
        }



