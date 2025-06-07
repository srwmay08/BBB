# app/services/auth_service.py
# This file provides a temporary, mock authentication solution for development.

from functools import wraps

def token_required(f):
    """
    A mock decorator to simulate user authentication.
    
    In a real application, this function would verify a JWT or session token.
    For now, it simply hardcodes a user ID ("dev-user-001") to allow for 
    backend development without needing a live authentication system.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # We hardcode a user ID to simulate a user being logged in.
        mock_uid = "dev-user-001"
        
        # Pass the mock uid to the decorated route function.
        return f(mock_uid, *args, **kwargs)
    return decorated_function