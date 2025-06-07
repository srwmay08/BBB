# app/api/npcs.py
from flask import Blueprint, request, jsonify, current_app
from app.services.auth_service import token_required
# We will create the firebase_service module next
# from app.services import firebase_service 

# Create a Blueprint for NPC routes
# The first argument, 'npcs', is the name of the Blueprint.
# The second argument, __name__, helps Flask locate the Blueprint's resources.
npcs_bp = Blueprint('npcs', __name__)

@npcs_bp.route('/api/worlds/<world_id>/npcs', methods=['GET'])
@token_required
def get_npcs(uid, world_id):
    """
    Retrieves all NPCs belonging to a specific game world for the authenticated user.
    The 'uid' is injected by the @token_required decorator.
    """
    db = current_app.config['DB'] # Access the db instance from the app context

    # (Example of calling a future firebase_service function)
    # is_owner = firebase_service.check_world_ownership(db, uid, world_id)
    # if not is_owner:
    #     return jsonify({"error": "World not found or access denied"}), 404
    # npcs = firebase_service.get_npcs_by_world(db, world_id)
    
    # For now, implementing the logic directly:
    world_doc = db.collection('gameWorlds').document(world_id).get()
    if not world_doc.exists or world_doc.to_dict().get('userId') != uid:
        return jsonify({"error": "World not found or access denied"}), 404

    npcs_ref = db.collection('npcs').where('game_world_id', '==', world_id)
    npcs = [doc.to_dict() | {'id': doc.id} for doc in npcs_ref.stream()]
    return jsonify(npcs), 200

@npcs_bp.route('/api/npcs', methods=['POST'])
@token_required
def create_npc(uid):
    """
    Creates a new NPC for the authenticated user.
    """
    db = current_app.config['DB']
    data = request.json
    
    # Basic validation
    if not all(k in data for k in ['name', 'game_world_id']):
        return jsonify({"error": "Missing required fields: name, game_world_id"}), 400

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
    
    # (Example of calling a future firebase_service function)
    # new_npc_id = firebase_service.create_npc(db, npc_data)
    
    # For now, implementing the logic directly:
    _, doc_ref = db.collection('npcs').add(npc_data)
    return jsonify({"id": doc_ref.id}), 201

# ... You would continue to define update_npc and delete_npc routes here ...
# For example:
@npcs_bp.route('/api/npcs/<npc_id>', methods=['PUT'])
@token_required
def update_npc(uid, npc_id):
    # Logic to update an NPC
    # 1. Get db from current_app.config
    # 2. Verify NPC exists and belongs to the user (uid)
    # 3. Get request data
    # 4. Update the document in Firestore
    pass

@npcs_bp.route('/api/npcs/<npc_id>', methods=['DELETE'])
@token_required
def delete_npc(uid, npc_id):
    # Logic to delete an NPC
    # 1. Get db from current_app.config
    # 2. Verify NPC exists and belongs to the user (uid)
    # 3. Delete the document in Firestore
    pass