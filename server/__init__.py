# app/__init__.py
from flask import Flask, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import google.generativeai as genai

def create_app(config_class='config.Config'):
    """
    Application Factory: Creates and configures the Flask application.
    
    Args:
        config_class (str): The configuration class to use.

    Returns:
        Flask: The configured Flask application instance.
    """
    app = Flask(__name__)
    app.config.from_object(config_class)

    # --- Initialize Extensions ---
    CORS(app) # Allow Cross-Origin Resource Sharing

    # --- Initialize Firebase Admin SDK ---
    try:
        # Using Application Default Credentials (ADC)
        # Ensure GOOGLE_APPLICATION_CREDENTIALS is set in your environment
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            'projectId': app.config['FIREBASE_PROJECT_ID'],
        })
        db = firestore.client()
        app.config['DB'] = db  # Store db client in app config for access in routes
        print("Firebase Admin SDK initialized successfully.")
    except Exception as e:
        print(f"FATAL: Error initializing Firebase Admin SDK: {e}")
        app.config['DB'] = None

    # --- Initialize Google Gemini API ---
    try:
        genai.configure(api_key=app.config['GEMINI_API_KEY'])
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        app.config['GEMINI_MODEL'] = gemini_model
        print("Gemini API configured successfully.")
    except Exception as e:
        print(f"FATAL: Error initializing Gemini API: {e}")
        app.config['GEMINI_MODEL'] = None

    # --- Register Blueprints ---
    with app.app_context():
        # Import blueprints here to avoid circular imports
        from app.api.npcs import npcs_bp
        # from app.api.worlds import worlds_bp
        # from app.api.scenes import scenes_bp
        # from app.api.dialogue import dialogue_bp

        app.register_blueprint(npcs_bp)
        # app.register_blueprint(worlds_bp)
        # app.register_blueprint(scenes_bp)
        # app.register_blueprint(dialogue_bp)

    # --- Health Check Route ---
    @app.route('/')
    def index():
        return jsonify({"message": "TTRPG AI Nexus Backend is running!"}), 200

    return app