# app/services/dialogue_service.py
import json
from pymongo.database import Database
from . import mongo_db_service

def generate_prompt(db: Database, prompt_info: dict):
    """
    Constructs a detailed prompt for the Gemini API based on world, scene, and NPC data.
    """
    scene_collection = db['scenes']
    worlds_collection = db['worlds']
    characters_collection = db['characters']

    scene = mongo_db_service.get_scene_by_id(scene_collection, prompt_info["scene_id"])
    if not scene:
        raise ValueError("Scene not found")

    world = mongo_db_service.get_world_by_id(worlds_collection, scene["game_world_id"])
    if not world:
        raise ValueError("World not found")

    # Using the 'characters' collection for all character/NPC data
    npc = mongo_db_service.get_npc_by_id(characters_collection, prompt_info["npc_id"])
    if not npc:
        raise ValueError("NPC not found")

    # Extracting details from the fvtt format
    npc_name = npc.get('name', 'An unnamed character')
    npc_bio = npc.get('system', {}).get('details', {}).get('biography', {}).get('value', 'No biography available.')
    if not npc_bio: # Fallback for different structures
        npc_bio = json.dumps(npc.get('system', {}).get('details', {}))


    prompt = f"""
    You are a fantasy role-playing game NPC. Your name is {npc_name}.
    Your personality is: {npc_bio}.
    You are in the world of {world.get('title')}.
    The current scene is: {scene.get('name')} - {scene.get('description')}.
    The dialogue style should be: {prompt_info.get('style', 'normal')}.
    """

    if scene.get('dialogue_log'):
        prompt += "\n\n--- Recent Dialogue History ---\n"
        for log in scene.get('dialogue_log')[-5:]:
            log_npc_data = mongo_db_service.get_npc_by_id(characters_collection, log['npc_id'])
            log_npc_name = log_npc_data.get('name', 'Unknown') if log_npc_data else 'Unknown'
            prompt += f"{log_npc_name}: {log['dialogue']}\n"

    if prompt_info.get('topic'):
        prompt += f"\nA player is asking you about: {prompt_info.get('topic')}.\n"

    prompt += "\nWhat is your response? Provide only the dialogue text."

    return prompt

def generate_dialogue_with_gemini(model, db: Database, prompt_info: dict):
    """
    Generates dialogue using the configured Gemini model.
    """
    try:
        full_prompt = generate_prompt(db, prompt_info)
        print(f"--- Sending Prompt to Gemini ---\n{full_prompt}\n---------------------------------")
        
        # Ensure the model is not None before proceeding
        if model is None:
            raise ValueError("Gemini model is not initialized.")

        response = model.generate_content(full_prompt)
        
        # Safely access the text from the response
        dialogue_text = getattr(response, 'text', 'I... I don\'t know what to say.')

        return dialogue_text
    except Exception as e:
        print(f"Error during Gemini API call or prompt generation: {e}")
        # It's better to return a generic error or re-raise than to crash.
        raise