# server.py
# This is the main entry point for the application. It should be in your root 
# project folder (e.g., C:\Users\Sean\projects\BBB\server\).

import os
from app import create_app
from config import Config

# Create the Flask app instance using the application factory.
# The factory is defined in app/__init__.py and uses the configuration
# from the Config class.
app = create_app(Config)

if __name__ == '__main__':
    # For production, use a production-ready WSGI server like Gunicorn.
    # Example: gunicorn --bind 0.0.0.0:5001 "server:app"
    # The 'server:app' refers to the 'app' object within this 'server.py' file.
    
    # Use the PORT environment variable if available, otherwise default to 5001.
    port = int(os.environ.get("PORT", 5001))
    
    # Running with debug=True is for development. It provides helpful error
    # messages and auto-reloads the server when you make code changes.
    app.run(debug=True, port=port)