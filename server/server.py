# main.py
# Before running, install necessary libraries:
# pip install Flask firebase-admin-python google-generativeai python-dotenv Flask-Cors

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import firebase_admin
from firebase_admin import credentials, firestore, auth
from dotenv import load_dotenv

# --- Initialization ---
load_dotenv()

app = Flask(__name__)
# In a real production app, you'd want to restrict this to your frontend's domain
CORS(app) 

# --- Firebase Admin SDK Initialization ---
# The GOOGLE_APPLICATION_CREDENTIALS environment variable should be set to the path
# of your Firebase service account key file.
try:
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred, {
        'projectId': os.getenv('FIREBASE_PROJECT_ID'),
    })
    db = firestore.client()
    print("Firebase Admin SDK initialized successfully.")
except Exception as e:
    print(f"Error initializing Firebase Admin SDK: {e}")
    db = None

# --- Google Gemini API Initialization ---
try:
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
    print("Gemini API configured successfully.")
except Exception as e:
    print(f"Error initializing Gemini API: {e}")
    gemini_model = None

# --- Helper Functions ---
def verify_firebase_token(request):
    """Verifies the Firebase ID token in the Authorization header."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    id_token = auth_header.split('Bearer ')[1]
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token['uid']
    except Exception as e:
        print(f"Error verifying token: {e}")
        return None

# --- API Endpoints ---

@app.route('/')
def index():
    return jsonify({"message": "TTRPG AI Nexus Backend is running!"}), 200

# --- Game World Endpoints ---
@app.route('/api/worlds', methods=['GET'])
def get_worlds():
    uid = verify_firebase_token(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401
    
    worlds_ref = db.collection('gameWorlds').where('userId', '==', uid)
    worlds = [doc.to_dict() | {'id': doc.id} for doc in worlds_ref.stream()]
    return jsonify(worlds), 200

@app.route('/api/worlds', methods=['POST'])
def create_world():
    uid = verify_firebase_token(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    world_data = {
        'userId': uid,
        'title': data.get('title'),
        'game_system': data.get('game_system'),
        'createdAt': firestore.SERVER_TIMESTAMP
    }
    _, doc_ref = db.collection('gameWorlds').add(world_data)
    return jsonify({"id": doc_ref.id}), 201

# --- NPC Endpoints ---
@app.route('/api/worlds/<world_id>/npcs', methods=['GET'])
def get_npcs(world_id):
    uid = verify_firebase_token(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401
    
    # Basic check to ensure the user owns the world
    world_doc = db.collection('gameWorlds').document(world_id).get()
    if not world_doc.exists or world_doc.to_dict().get('userId') != uid:
        return jsonify({"error": "World not found or access denied"}), 404

    npcs_ref = db.collection('npcs').where('game_world_id', '==', world_id)
    npcs = [doc.to_dict() | {'id': doc.id} for doc in npcs_ref.stream()]
    return jsonify(npcs), 200
    
@app.route('/api/npcs', methods=['POST'])
def create_npc():
    uid = verify_firebase_token(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    npc_data = {
        'userId': uid,
        'game_world_id': data.get('game_world_id'),
        'name': data.get('name'),
        'appearance': data.get('appearance'),
        'portrait_url': data.get('portrait_url'),
        'personality_traits': data.get('personality_traits'),
        'motivations': data.get('motivations'),
        'dialogue_style_guide': data.get('dialogue_style_guide'),
        'memory': data.get('memory'),
        'createdAt': firestore.SERVER_TIMESTAMP
    }
    _, doc_ref = db.collection('npcs').add(npc_data)
    return jsonify({"id": doc_ref.id}), 201

@app.route('/api/npcs/<npc_id>', methods=['PUT'])
def update_npc(npc_id):
    uid = verify_firebase_token(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    npc_ref = db.collection('npcs').document(npc_id)
    if not npc_ref.get().exists or npc_ref.get().to_dict().get('userId') != uid:
        return jsonify({"error": "NPC not found or access denied"}), 404
        
    data = request.json
    npc_ref.update(data)
    return jsonify({"success": True}), 200

@app.route('/api/npcs/<npc_id>', methods=['DELETE'])
def delete_npc(npc_id):
    uid = verify_firebase_token(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401
    
    npc_ref = db.collection('npcs').document(npc_id)
    if not npc_ref.get().exists or npc_ref.get().to_dict().get('userId') != uid:
        return jsonify({"error": "NPC not found or access denied"}), 404
    
    npc_ref.delete()
    return jsonify({"success": True}), 200

# --- Scene Endpoints (similar structure) ---
@app.route('/api/worlds/<world_id>/scenes', methods=['GET'])
def get_scenes(world_id):
    uid = verify_firebase_token(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    scenes_ref = db.collection('scenes').where('game_world_id', '==', world_id)
    scenes = [doc.to_dict() | {'id': doc.id} for doc in scenes_ref.stream()]
    return jsonify(scenes), 200

@app.route('/api/scenes', methods=['POST'])
def create_scene():
    uid = verify_firebase_token(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    scene_data = {
        'userId': uid,
        'game_world_id': data.get('game_world_id'),
        'name': data.get('name'),
        'description': data.get('description'),
        'active_npcs_in_scene': data.get('active_npcs_in_scene', []),
        'scene_log': [],
        'current_context_for_ai': '',
        'createdAt': firestore.SERVER_TIMESTAMP
    }
    _, doc_ref = db.collection('scenes').add(scene_data)
    return jsonify({"id": doc_ref.id}), 201
    
@app.route('/api/scenes/<scene_id>', methods=['PUT'])
def update_scene(scene_id):
    uid = verify_firebase_token(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    scene_ref = db.collection('scenes').document(scene_id)
    if not scene_ref.get().exists or scene_ref.get().to_dict().get('userId') != uid:
        return jsonify({"error": "Scene not found or access denied"}), 404

    data = request.json
    # Specific logic for updating scene log (arrayUnion)
    if 'scene_log_entry' in data:
        entry = data.pop('scene_log_entry')
        entry['timestamp'] = firestore.SERVER_TIMESTAMP
        scene_ref.update({'scene_log': firestore.ArrayUnion([entry])})
        
    scene_ref.update(data) # Update other fields
    return jsonify({"success": True}), 200


@app.route('/api/scenes/<scene_id>', methods=['DELETE'])
def delete_scene(scene_id):
    uid = verify_firebase_token(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    scene_ref = db.collection('scenes').document(scene_id)
    if not scene_ref.get().exists or scene_ref.get().to_dict().get('userId') != uid:
        return jsonify({"error": "Scene not found or access denied"}), 404

    scene_ref.delete()
    return jsonify({"success": True}), 200


# --- AI Dialogue Generation Endpoint ---
@app.route('/api/generate-dialogue', methods=['POST'])
def generate_dialogue():
    uid = verify_firebase_token(request)
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    if not gemini_model:
        return jsonify({"error": "AI model not initialized"}), 500

    data = request.json
    npc_id = data.get('npcId')
    scene_id = data.get('sceneId')
    
    # --- Fetch data from Firestore ---
    try:
        npc_doc = db.collection('npcs').document(npc_id).get()
        scene_doc = db.collection('scenes').document(scene_id).get()

        if not npc_doc.exists or not scene_doc.exists:
            return jsonify({"error": "NPC or Scene not found"}), 404
        
        npc = npc_doc.to_dict()
        scene = scene_doc.to_dict()
        
        # Check ownership
        if npc.get('userId') != uid or scene.get('userId') != uid:
             return jsonify({"error": "Access denied"}), 403

    except Exception as e:
        return jsonify({"error": f"Database error: {e}"}), 500

    # --- Construct the Prompt ---
    recent_log = scene.get('scene_log', [])[-5:]
    scene_context_summary = "\n".join([f"{log.get('speaker_name', 'Someone')}: \"{log.get('dialogue_text')}\"" for log in recent_log])

    prompt = f"""
        You are a master Game Master AI. Your task is to generate dialogue for a Non-Player Character (NPC) in a tabletop role-playing game.

        **NPC Profile:**
        - Name: {npc.get('name')}
        - Personality: {npc.get('personality_traits')}
        - Motivations: {npc.get('motivations')}
        - Dialogue Style: {npc.get('dialogue_style_guide')}
        - Memory & Backstory: {npc.get('memory')}

        **Scene Context:**
        - Scene Description: {scene.get('description')}
        - Game Master's Notes for this moment: {scene.get('current_context_for_ai')}
        - Recent Conversation History:
        {scene_context_summary or "This is the beginning of the conversation."}

        **Your Task:**
        Generate the next single line of dialogue for {npc.get('name')}. It should be engaging, in-character, and move the scene forward. Do not add actions or descriptions, only the dialogue text itself.
    """

    # --- Call Gemini API ---
    try:
        response = gemini_model.generate_content(prompt)
        generated_text = response.text.replace('"', '').strip()
        return jsonify({"dialogue": generated_text}), 200
    except Exception as e:
        print(f"Gemini API error: {e}")
        return jsonify({"error": "Failed to generate AI dialogue"}), 500


if __name__ == '__main__':
    # Use Gunicorn for production
    app.run(debug=True, port=5001)

