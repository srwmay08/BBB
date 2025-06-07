# server.py
import os
from app import create_app
from config import Config
from app.services import data_importer

# Create the Flask app instance
app = create_app(Config)

# --- Run the Data Importer on Startup ---
# This block runs when the server starts to load your character data.
with app.app_context():
    # We get the database handle from the app's config.
    db = app.config.get('DB')
    
    # CORRECTED: We must check for the database object's existence 
    # by comparing it to None, as required by the pymongo library.
    if db is not None:
        data_importer.import_characters_from_json(db)
    else:
        print("WARNING: Database connection not available. Skipping data import.")

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(debug=True, port=port)