# app/services/mongo_db_service.py
# This service handles all interactions with the MongoDB database.

from pymongo.collection import Collection
from bson.objectid import ObjectId
import time

# --- Helper to convert MongoDB documents ---
def mongo_to_dict(obj):
    """Converts a MongoDB document to a JSON-serializable dictionary."""
    if obj and '_id' in obj:
        obj['id'] = str(obj.pop('_id'))
    return obj

# --- World Functions ---
def create_world(db: Collection, uid: str, data: dict):
    world_doc = {
        "userId": uid,
        "title": data.get("title"),
        "game_system": data.get("game_system"),
        "createdAt": time.time()
    }
    result = db.insert_one(world_doc)
    return {"id": str(result.inserted_id)}

def get_all_worlds(db: Collection, uid: str):
    worlds = db.find({"userId": uid})
    return [mongo_to_dict(world) for world in worlds]

# --- NPC Functions ---
def create_npc(db: Collection, uid: str, data: dict):
    npc_doc = {
        'userId': uid,
        'game_world_id': data.get('game_world_id'),
        'name': data.get('name'),
        'appearance': data.get('appearance'),
        'portrait_url': data.get('portrait_url'),
        'personality_traits': data.get('personality_traits'),
        'motivations': data.get('motivations'),
        'dialogue_style_guide': data.get('dialogue_style_guide'),
        'memory': data.get('memory'),
        'createdAt': time.time()
    }
    result = db.insert_one(npc_doc)
    return {"id": str(result.inserted_id)}

def get_npcs_by_world(db: Collection, world_id: str):
    npcs = db.find({"game_world_id": world_id})
    return [mongo_to_dict(npc) for npc in npcs]

def get_npc_by_id(db: Collection, npc_id: str):
    try:
        # ObjectId is specific to MongoDB and must be imported
        return db.find_one({"_id": ObjectId(npc_id)})
    except Exception:
        return None