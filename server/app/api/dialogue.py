# app/api/dialogue.py
from flask import Blueprint, request, jsonify, current_app
from ..services.auth_service import token_required
from ..services import dialogue_service, mongo_db_service

dialogue_bp = Blueprint('dialogue_api', __name__)

@dialogue_bp.route('/api/scenes/<scene_id>/generate-dialogue', methods=['POST'])
@token_required
def generate_dialogue_route(uid, scene_id):
    """
    Generates dialogue for a given NPC in a scene based on the context.
    """
    data = request.get_json()
    if not data or 'npc_id' not in data:
        return jsonify({"error": "Missing npc_id in request body"}), 400

    npc_id = data.get('npc_id')
    prompt_info = {
        "scene_id": scene_id,
        "npc_id": npc_id,
        "user_id": uid,
        "topic": data.get("topic"),
        "style": data.get("style", "normal")
    }

    gemini_model = current_app.config.get('GEMINI_MODEL')
    if not gemini_model:
        return jsonify({"error": "Gemini model not configured"}), 500

    db = current_app.config.get('DB')

    try:
        dialogue_text = dialogue_service.generate_dialogue_with_gemini(
            gemini_model,
            db,
            prompt_info
        )

        # Log the generated dialogue to the scene
        dialogue_log_entry = {"npc_id": npc_id, "dialogue": dialogue_text, "timestamp": mongo_db_service.time.time()}
        mongo_db_service.update_scene(
            db['scenes'],
            scene_id,
            {"dialogue_log": [dialogue_log_entry]}
        )

        return jsonify({"dialogue": dialogue_text, "npc_id": npc_id}), 200

    except Exception as e:
        print(f"[API ERROR] Failed to generate dialogue: {e}")
        return jsonify({"error": f"An error occurred: {e}"}), 500