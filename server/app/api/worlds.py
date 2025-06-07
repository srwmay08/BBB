# app/api/worlds.py
from flask import Blueprint, request, jsonify, current_app
from ..services import mongo_db_service
# Using a mock decorator for now to keep things simple
from ..services.mock_db_service import mock_token_required as token_required

worlds_bp = Blueprint('worlds_api', __name__)

@worlds_bp.route('/api/worlds', methods=['GET'])
@token_required
def get_worlds_route(uid):
    """Gets all worlds for the authenticated user."""
    db_worlds = current_app.config['DB']['worlds'] # Access the 'worlds' collection
    worlds = mongo_db_service.get_all_worlds(db_worlds, uid)
    return jsonify(worlds), 200

@worlds_bp.route('/api/worlds', methods=['POST'])
@token_required
def create_world_route(uid):
    """Creates a new world for the authenticated user."""
    db_worlds = current_app.config['DB']['worlds']
    data = request.get_json()
    if not data or not data.get('title'):
        return jsonify({"error": "Title is required"}), 400
    
    new_world = mongo_db_service.create_world(db_worlds, uid, data)
    return jsonify(new_world), 201