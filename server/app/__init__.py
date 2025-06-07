# app/__init__.py
# This file contains the application factory, create_app().
# Flask will automatically recognize this file as the entry point for the 'app' package.

from flask import Flask, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import google.generativeai as genai

def create_app(config_object):
    """
    Application Factory: Creates and configures the Flask application.
    This pattern makes the application modular and easier to test and scale.
    """
    app = Flask(__name__)
    
    # Load configuration from the object passed (e.g., config.Config)
    app.config.from_object(config_object)

    # --- Initialize Extensions ---
    CORS(app) # Enables Cross-Origin Resource Sharing for the frontend

    # --- Initialize Firebase Admin SDK ---
    # The app connects to your Firestore database here.
    try:
        if not firebase_admin._apps: # Prevent re-initialization
            # Uses Application Default Credentials. Ensure the
            # GOOGLE_APPLICATION_CREDENTIALS environment variable is set.
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred, {
                'projectId': app.config['FIREBASE_PROJECT_ID'],
            })
        
        db = firestore.client()
        # Store the database client in the app's config for easy access in blueprints.
        app.config['DB'] = db
        print("Firebase Admin SDK initialized successfully.")
    except Exception as e:
        print(f"FATAL: Error initializing Firebase Admin SDK: {e}")
        app.config['DB'] = None

    # --- Initialize Google Gemini API ---
    # The app configures the connection to the Gemini AI model.
    try:
        genai.configure(api_key=app.config['GEMINI_API_KEY'])
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        # Store the model in the app's config.
        app.config['GEMINI_MODEL'] = gemini_model
        print("Gemini API configured successfully.")
    except Exception as e:
        print(f"FATAL: Error initializing Gemini API: {e}")
        app.config['GEMINI_MODEL'] = None

    # --- Register Blueprints ---
    # Blueprints are registered here to organize routes into separate files.
    with app.app_context():
        from .api import npcs, worlds, scenes, dialogue

        app.register_blueprint(npcs.npcs_bp)
        app.register_blueprint(worlds.worlds_bp)
        app.register_blueprint(scenes.scenes_bp)
        app.register_blueprint(dialogue.dialogue_bp)

    # --- General Health Check Route ---
    @app.route('/')
    def index():
        return jsonify({"message": "TTRPG AI Nexus Backend is running!"}), 200

    return app