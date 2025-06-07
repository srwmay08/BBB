# app/services/data_importer.py
import os
import json
import glob
from pymongo.database import Database

def import_characters_from_json(db: Database):
    """
    Scans the app/data/ directory for JSON files, parses them, and upserts them
    into the 'characters' collection in MongoDB. It now differentiates between
    PCs and NPCs based on the 'type' field in the JSON.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, '..', 'data', '*.json')
    
    characters_collection = db['characters']
    
    print("--- Starting Character Data Import ---")
    
    print(f"DEBUG: Searching for JSON files using pattern: {data_path}")
    file_list = glob.glob(data_path)
    print(f"DEBUG: Found {len(file_list)} files: {[os.path.basename(p) for p in file_list]}")
    if not file_list:
        print("WARNING: No JSON character files were found. The 'characters' collection will be empty.")

    for json_file_path in glob.glob(data_path):
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                character_data = json.load(f)
                
                char_name = character_data.get('name')
                
                if not char_name:
                    print(f"  - WARNING: Skipping file {os.path.basename(json_file_path)} - missing 'name' field.")
                    continue

                # Differentiate between PC ('character') and NPC ('npc')
                char_type = character_data.get('type', 'npc')  # Default to 'npc'
                character_data['character_type'] = char_type
                
                print(f"  - Processing file for: {char_name} (Type: {char_type})")
                
                # Use update_one with upsert=True.
                result = characters_collection.update_one(
                    {'name': char_name},
                    {'$set': character_data},
                    upsert=True
                )
                
                print(f"    - DB Result: Matched={result.matched_count}, Modified={result.modified_count}, Upserted ID={result.upserted_id}")
                
                if result.upserted_id:
                    print(f"    -> SUCCESS: Imported as new character.")
                elif result.modified_count > 0:
                    print(f"    -> SUCCESS: Updated existing character.")
                else:
                    print(f"    - INFO: Character data already up-to-date in the database.")

        except Exception as e:
            print(f"  - ERROR: Could not process file {os.path.basename(json_file_path)}. Reason: {e}")
            
    print("--- Character Data Import Complete ---")