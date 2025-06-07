# app/services/auth_service.py
from flask import request, jsonify
from firebase_admin import auth
from functools import wraps

def verify_firebase_token(id_token):
    """
    Verifies the Firebase ID token.
    
    Args:
        id_token (str): The Firebase ID token from the client.

    Returns:
        str: The user's unique ID (uid) if the token is valid, otherwise None.
    """
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token['uid']
    except Exception as e:
        print(f"Error verifying token: {e}")
        return None

def token_required(f):
    """
    A decorator to protect endpoints, ensuring a valid Firebase token is present.
    It injects the user's UID into the decorated function.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Unauthorized: Missing or invalid Authorization header"}), 401
        
        id_token = auth_header.split('Bearer ')[1]
        uid = verify_firebase_token(id_token)

        if not uid:
            return jsonify({"error": "Unauthorized: Invalid token"}), 401
        
        # Pass the uid to the decorated route function
        return f(uid, *args, **kwargs)
    return decorated_function