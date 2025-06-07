# config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """
    Configuration class for the Flask application.
    """
    # --- MongoDB Configuration ---
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'TTRPG_AI_Nexus') # You can name your DB anything

    # --- Google Gemini API Configuration ---
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

    # --- Flask Configuration ---
    SECRET_KEY = os.getenv('SECRET_KEY', 'a-secret-key-for-development')