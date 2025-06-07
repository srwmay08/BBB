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
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, '..', 'data', '*.json')
    
    characters_collection = db['characters']
    
    print("--- Starting Character Data Import ---")
    
    # --- Start of new debug code ---
    print(f"DEBUG: Searching for JSON files using pattern: {data_path}")
    file_list = glob.glob(data_path)
    print(f"DEBUG: Found {len(file_list)} files: {[os.path.basename(p) for p in file_list]}")
    if not file_list:
        print("WARNING: No JSON character files were found. The 'characters' collection will be empty.")
    # --- End of new debug code ---

    # glob.glob finds all pathnames matching a specified pattern
    for json_file_path in file_list: # Use the pre-fetched file_list
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                character_data = json.load(f)
                
                char_name = character_data.get('name')
                
                if not char_name:
                    print(f"WARNING: Skipping file {os.path.basename(json_file_path)} - missing 'name' field.")
                    continue

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