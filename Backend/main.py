# For communication with frontend. This is Api Layer. It sends images to detective and brain
# ---1.importing lib-----
from fastapi import FastAPI, File, Form, UploadFile  # Tools for handling web requests and forms
from fastapi.middleware.cors import CORSMiddleware  # Middleware to allow frontend to talk to backend
import sqlite3  # Python's built-in database to store complaint information
import os  # Library to manage folders and file paths on the computer
from detective import run_ai_detection  # Importing the AI detection function (Roboflow)
from brain import prioritize_complaint  # Importing the categorization and priority logic

# ---2.creating app object-----
app = FastAPI()  # Creating the FastAPI app object to handle incoming requests

# ---3.cors middleware to allow frontend to talk to backend without any blocked---
app.add_middleware(  # Adding security settings for cross-origin requests
    CORSMiddleware,  # Using the CORS middleware
    allow_origins=["*"],  # Allow any website (like React localhost) to connect
    allow_credentials=True,  # Allow cookies or authentication if needed
    allow_methods=["*"],  # Allow all types of requests (GET, POST, etc.)
    allow_headers=["*"],  # Allow all types of headers
)

# ---4.db initialization-----
def init_db():  # Function to set up the database
    conn = sqlite3.connect("grievance.db")  # Connects to (or creates) the database file
    cursor = conn.cursor()  # Cursor object used to execute SQL commands
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS complaints(
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   full_name TEXT,
                   phone_number TEXT,
                   language TEXT,
                   text_desc TEXT,
                   location TEXT,
                   ward_zone TEXT,
                   image_path TEXT,
                   status TEXT DEFAULT 'pending',
                   priority TEXT DEFAULT 'low',
                   ai_category TEXT,
                   ai_score REAL DEFAULT 0.0
            )
''')  # SQL command to create the table with all necessary columns
    conn.commit()  # Save the changes made to the database
    conn.close()  # Terminate the connection to the database

init_db()  # Call the function to ensure the database is ready at startup

# ---5.ROUTES---
@app.get("/")  # Defining a basic home route
def home():  # Function for the home route
    return {"message": "Backend is running!!"}  # Simple response to confirm backend status

@app.post("/submit-complaint")  # Defining the route to receive complaint data
async def submit_complaint(  # Main function to handle the complaint submission
    full_name: str = Form(...),  # Getting the user's name from form data
    phone_number: str = Form(...),  # Getting the phone number from form data
    language: str = Form(...),  # Getting the language selection from form data
    description: str = Form(...),  # Getting the complaint text from form data
    location: str = Form(...),  # Getting the location from form data
    ward_zone: str = Form(...),  # Getting the ward or zone info from form data
    file: UploadFile = File(...)  # Getting the uploaded image file
):
    # Pre-defining default values so we can save to DB even if AI fails
    ai_status = "pending_review"  # Default status if AI code crashes
    ai_priority = "low"  # Default priority level
    ai_cat = "General"  # Default category
    ai_conf = 0.0  # Default AI confidence score
    
    try:  # Starting a safe block to handle potential errors
        # --step1. save image locally---
        os.makedirs("uploads", exist_ok=True)  # Create 'uploads' folder if it doesn't exist
        file_loc = f"uploads/{file.filename}"  # Set the path for the saved image
        with open(file_loc, "wb+") as file_obj:  # Open a new file in binary write mode
            file_obj.write(file.file.read())  # Write the uploaded image data into the file

        # --step2. AI Process (Nested Try so if AI fails, DB storage still happens)---
        try:  # Try to run the AI detection
            ai_result = run_ai_detection(file_loc)  # Send image to the detective script
            logic_result = prioritize_complaint(description, ai_result)  # Get priority from brain script
            
            # Update variables based on AI results
            ai_status = "verified" if ai_result.get("detected") else "rejected"  # Set status based on detection
            ai_priority = logic_result.get("priority", "low")  # Get priority from AI logic
            ai_cat = logic_result.get("category", "Uncategorized")  # Get category from AI logic
            ai_conf = ai_result.get("confidence", 0.0)  # Get the confidence score from AI
        except Exception as ai_err:  # If AI script fails for any reason
            print(f"AI Error: {ai_err}")  # Log the error in the console but don't stop the code

        # --step3. SAVE TO DATABASE (Always runs even if AI verification fails)---
        conn = sqlite3.connect("grievance.db")  # Connect to the database
        cursor = conn.cursor()  # Create a database cursor
        cursor.execute('''
            INSERT INTO complaints (
                full_name, phone_number, language, 
                text_desc, location, ward_zone, image_path, 
                status, priority, ai_category, ai_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (
                full_name, phone_number, language,
                description, location, ward_zone, file_loc,
                ai_status, ai_priority, ai_cat, ai_conf
            )
        )  # Insert all user data and AI results into the table
        conn.commit()  # Save the record permanently in the DB
        conn.close()  # Close the connection

        # --step4. Return final response to frontend---
        return {
            "status": ai_status,  # Send back the AI status (verified/rejected/pending)
            "message": "Complaint recorded successfully.",  # Success message
            "image_saved_at": file_loc  # Path where the image was stored
        }

    except Exception as e:  # Handling any major errors (like database locked)
        return {
            "status": "error",  # Return error status
            "message": str(e)  # Return the specific error message to the frontend
        }