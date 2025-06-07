# app/api/scenes.py
from flask import Blueprint, request, jsonify, current_app
from ..services import mongo_db_service
from ..services.auth_service import token_required

scenes_bp = Blueprint('scenes_api', __name__)

@scenes_bp.route('/api/worlds/<world_id>/scenes', methods=['GET'])
@token_required
def get_scenes_route(uid, world_id):
    """Gets all scenes for a specific game world."""
    # Note: For simplicity, we are not checking if the user owns the world here,
    # but in production, you'd verify ownership first.
    db_scenes = current_app.config['DB']['scenes']
    scenes = mongo_db_service.get_scenes_by_world(db_scenes, world_id)
    return jsonify(scenes), 200

@scenes_bp.route('/api/scenes', methods=['POST'])
@token_required
def create_scene_route(uid):
    """Creates a new scene."""
    db_scenes = current_app.config['DB']['scenes']
    data = request.get_json()
    if not all(k in data for k in ['name', 'game_world_id']):
        return jsonify({"error": "Missing required fields: name, game_world_id"}), 400
        
    new_scene = mongo_db_service.create_scene(db_scenes, uid, data)
    return jsonify(new_scene), 201

@scenes_bp.route('/api/scenes/<scene_id>', methods=['PUT'])
@token_required
def update_scene_route(uid, scene_id):
    """Updates a scene, such as adding dialogue to its log."""
    # Note: In production, verify user 'uid' owns this scene before updating.
    db_scenes = current_app.config['DB']['scenes']
    data = request.get_json()
    result = mongo_db_service.update_scene(db_scenes, scene_id, data)
    
    if "error" in result:
        return jsonify(result), result.get("status", 500)
        
    return jsonify(result), 200