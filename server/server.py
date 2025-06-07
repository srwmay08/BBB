# server.py
import os
from app import create_app
from config import Config
from app.services import data_importer

# Create the Flask app instance
app = create_app(Config)

# --- Run the Data Importer on Startup ---
with app.app_context():
    db = app.config.get('DB')
    if db is not None:
        data_importer.import_characters_from_json(db)
    else:
        print("WARNING: Database connection not available. Skipping data import.")

# --- Diagnostic Check for index.html ---
# This code will run before the server starts to help debug the template path.
expected_template_path = os.path.join(os.path.dirname(__file__), 'app', 'templates', 'index.html')
print("="*60)
print(f"DIAGNOSTIC: Checking for template at this path:")
print(f"-> {expected_template_path}")
if os.path.exists(expected_template_path):
    print("SUCCESS: index.html found at the expected location.")
else:
    print("ERROR: index.html NOT FOUND at the expected location.")
    print("Please ensure your folder structure is exactly /server/app/templates/index.html")
print("="*60)
# --- End of Diagnostic Check ---

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(debug=True, port=port)