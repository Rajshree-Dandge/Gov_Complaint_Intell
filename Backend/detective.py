# this file for fake or real check of images
# import roboflow sdk to commuicate with cloud based AI model
from roboflow import Roboflow
import os

# 1.replace with actual privae key from roboflow

# there is a private security key found in roboflow deploy it act as your password
API_KEY="c5jEmDo5cIPP9Ap3LNJl"
# create a connection
rf = Roboflow(api_key=API_KEY)

# use project name and version number from ss
project=rf.workspace.project("gov_ai_compliant")
version=project.version(1).model

# 3.send the image to roboflow and returns detection result
def run_ai(image_path):
    ai_result=model.predict(image_path,confidence=40).json()
