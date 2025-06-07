# app/api/scenes.py
from flask import Blueprint, request, jsonify, current_app
from ..services import mongo_db_service
from ..services.auth_service import token_required

scenes_bp = Blueprint('scenes_api', __name__)

@scenes_bp.route('/api/worlds/<world_id>/scenes', methods=['GET'])
@token_required
def get_scenes_route(uid, world_id):
    """Gets all scenes for a specific game world."""
    db_scenes = current_app.config['DB']['scenes']
    # Basic ownership check
    world = mongo_db_service.get_world_by_id(current_app.config['DB']['worlds'], world_id)
    if not world or world.get('userId') != uid:
        return jsonify({"error": "World not found or access denied"}), 404
        
    scenes = mongo_db_service.get_scenes_by_world(db_scenes, world_id)
    return jsonify(scenes), 200

@scenes_bp.route('/api/scenes', methods=['POST'])
@token_required
def create_scene_route(uid):
    """Creates a new scene."""
    db = current_app.config['DB']
    data = request.get_json()
    if not all(k in data for k in ['name', 'game_world_id']):
        return jsonify({"error": "Missing required fields: name, game_world_id"}), 400

    # Verify ownership of the world
    world = mongo_db_service.get_world_by_id(db['worlds'], data['game_world_id'])
    if not world or world.get('userId') != uid:
        return jsonify({"error": "World not found or access denied"}), 404
        
    new_scene = mongo_db_service.create_scene(db['scenes'], uid, data)
    return jsonify(new_scene), 201

@scenes_bp.route('/api/scenes/<scene_id>', methods=['PUT'])
@token_required
def update_scene_route(uid, scene_id):
    """Updates a scene, such as adding dialogue to its log."""
    db_scenes = current_app.config['DB']['scenes']
    
    # Verify ownership of the scene
    scene = mongo_db_service.get_scene_by_id(db_scenes, scene_id)
    if not scene or scene.get('userId') != uid:
        return jsonify({"error": "Scene not found or access denied"}), 404

    data = request.get_json()
    result = mongo_db_service.update_scene(db_scenes, scene_id, data)
    
    if "error" in result:
        return jsonify(result), result.get("status", 500)
        
    return jsonify(result), 200

@scenes_bp.route('/api/scenes/<scene_id>', methods=['DELETE'])
@token_required
def delete_scene_route(uid, scene_id):
    """Deletes a scene."""
    db_scenes = current_app.config['DB']['scenes']

    # Verify ownership
    scene = mongo_db_service.get_scene_by_id(db_scenes, scene_id)
    if not scene or scene.get('userId') != uid:
        return jsonify({"error": "Scene not found or access denied"}), 404

    result = db_scenes.delete_one({"_id": mongo_db_service.ObjectId(scene_id)})
    if result.deleted_count == 1:
        return jsonify({"success": True, "message": "Scene deleted"}), 200
    else:
        return jsonify({"error": "Scene not found"}), 404