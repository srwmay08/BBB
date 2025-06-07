# config.py
import os
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

class Config:
    """
    Configuration class for the Flask application.
    Loads settings from environment variables.
    """
    # --- Firebase Configuration ---
    # The GOOGLE_APPLICATION_CREDENTIALS environment variable should be set to the 
    # path of your Firebase service account key file for Application Default Credentials.
    FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID')

    # --- Google Gemini API Configuration ---
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

    # --- Flask Configuration ---
    # In a real production app, you would set this to a secret value
    SECRET_KEY = os.getenv('SECRET_KEY', 'a-secret-key-for-development')