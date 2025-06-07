# app/__init__.py
from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import google.generativeai as genai

# CORRECTED: Import from the new, correct auth_service.py file
from .services.auth_service import token_required

def create_app(config_object):
    app = Flask(__name__)
    app.config.from_object(config_object)
    
    # --- Initialize MongoDB Client ---
    try:
        client = MongoClient(app.config['MONGO_URI'])
        # The client connects when we first perform an operation
        db = client[app.config['MONGO_DB_NAME']]
        app.config['DB'] = db # Store db handle in app config
        print(f"MongoDB client initialized for database '{app.config['MONGO_DB_NAME']}'.")
    except Exception as e:
        print(f"FATAL: Could not connect to MongoDB: {e}")
        app.config['DB'] = None

    # --- Initialize Extensions (CORS, Gemini) ---
    CORS(app)
    try:
        genai.configure(api_key=app.config['GEMINI_API_KEY'])
        app.config['GEMINI_MODEL'] = genai.GenerativeModel('gemini-1.5-flash')
        print("Gemini API configured successfully.")
    except Exception as e:
        print(f"FATAL: Error initializing Gemini API: {e}")
        app.config['GEMINI_MODEL'] = None

    # --- Register Blueprints ---
    with app.app_context():
        from .api import worlds, npcs # Import your blueprint modules
        app.register_blueprint(worlds.worlds_bp)
        app.register_blueprint(npcs.npcs_bp)
        # Register other blueprints here

    # --- Health Check Route ---
    @app.route('/')
    def index():
        return jsonify({"message": "TTRPG AI Nexus Backend is running with MongoDB!"}), 200

    return app# app/__init__.py
from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import google.generativeai as genai

# CORRECTED: Import the decorator from its new, dedicated file.
from .services.auth_service import token_required

def create_app(config_object):
    app = Flask(__name__)
    app.config.from_object(config_object)
    
    # --- Initialize MongoDB Client ---
    try:
        client = MongoClient(app.config['MONGO_URI'])
        db = client[app.config['MONGO_DB_NAME']]
        app.config['DB'] = db
        print(f"MongoDB client initialized for database '{app.config['MONGO_DB_NAME']}'.")
    except Exception as e:
        print(f"FATAL: Could not connect to MongoDB: {e}")
        app.config['DB'] = None

    # --- Initialize Extensions (CORS, Gemini) ---
    CORS(app)
    try:
        genai.configure(api_key=app.config['GEMINI_API_KEY'])
        app.config['GEMINI_MODEL'] = genai.GenerativeModel('gemini-1.5-flash')
        print("Gemini API configured successfully.")
    except Exception as e:
        print(f"FATAL: Error initializing Gemini API: {e}")
        app.config['GEMINI_MODEL'] = None

    # --- Register Blueprints ---
    with app.app_context():
        from .api import worlds, npcs # Import your blueprint modules
        app.register_blueprint(worlds.worlds_bp)
        app.register_blueprint(npcs.npcs_bp)
        # Register other blueprints here

    # --- Health Check Route ---
    @app.route('/')
    def index():
        return jsonify({"message": "TTRPG AI Nexus Backend is running with MongoDB!"}), 200

    return app