# server.py
from server import create_app

# Create the Flask app instance using the application factory
app = create_app()

if __name__ == '__main__':
    # Running with debug=True is suitable for development.
    # For production, use a production-ready WSGI server like Gunicorn.
    # Example: gunicorn --bind 0.0.0.0:5001 "run:app"
    app.run(debug=True, port=5001)