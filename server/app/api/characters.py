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
    
    # Find all documents in the collection.
    # The pymongo .find() method returns a cursor, which we need to convert to a list
    # to see its contents and count them.
    characters_cursor = db_characters.find({})
    results = [mongo_db_service.mongo_to_dict(char) for char in characters_cursor]
    
    # --- FINAL DEBUG LOGS ---
    # This will tell us if the database query during the API request is returning any data.
    print(f"[API] Found {len(results)} characters in the database during the request.")
    if results:
        print(f"[API] First character name found: {results[0].get('name')}")
    else:
        print("[API] The database query returned an empty list. No characters were found.")
    
    return jsonify(results), 200
