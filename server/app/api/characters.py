# app/api/characters.py
from flask import Blueprint, jsonify, current_app
from ..services import mongo_db_service

characters_bp = Blueprint('characters_api', __name__)

@characters_bp.route('/api/characters', methods=['GET'])
def get_characters_route():
    """
    Retrieves all characters from the 'characters' collection.
    """
    db_characters = current_app.config['DB']['characters']
    
    # Find all documents in the collection. The {} means no filter.
    characters = db_characters.find({})
    
    # Convert documents to a list of dictionaries, handling the MongoDB ObjectId
    results = [mongo_db_service.mongo_to_dict(char) for char in characters]
    
    return jsonify(results), 200