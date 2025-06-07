# app/services/data_importer.py
import os
import json
import glob
from pymongo.database import Database

def import_characters_from_json(db: Database):
    """
    Scans the app/data/ directory for JSON files, parses them, and upserts them
    into the 'characters' collection in MongoDB. Upserting prevents creating
    duplicate characters on every server restart.
    """
    # Use __file__ to get the path relative to this file, making it robust
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, '..', 'data', '*.json')
    
    # The 'characters' collection will be created if it doesn't exist
    characters_collection = db['characters']
    
    print("--- Starting Character Data Import ---")
    
    # glob.glob finds all pathnames matching a specified pattern
    for json_file_path in glob.glob(data_path):
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                character_data = json.load(f)
                
                # We need a unique field to check for existing characters.
                # Foundry VTT exports typically have a 'name' field at the top level.
                char_name = character_data.get('name')
                
                if not char_name:
                    print(f"WARNING: Skipping file {os.path.basename(json_file_path)} - missing 'name' field.")
                    continue

                # Use update_one with upsert=True.
                # This finds a document with the same name and updates it.
                # If no document is found, it inserts this data as a new one.
                result = characters_collection.update_one(
                    {'name': char_name},
                    {'$set': character_data},
                    upsert=True
                )
                
                if result.upserted_id:
                    print(f"  -> Imported new character: {char_name}")
                elif result.modified_count > 0:
                    print(f"  -> Updated existing character: {char_name}")

        except Exception as e:
            print(f"ERROR: Could not process file {os.path.basename(json_file_path)}. Reason: {e}")
            
    print("--- Character Data Import Complete ---")