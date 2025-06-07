// This object will hold our application's data
const appState = {
    allCharacters: [],
};

// New function in app.js
async function fetchAndDisplayCharacters() {
    try {
        // Use your centralized ApiService to fetch data
        const characters = await ApiService.getAllCharacters();
        console.log("Characters fetched successfully:", characters);

        // Use your centralized UIRenderer to build the character list
        UIRenderers.renderCharacterList(characters);

    } catch (error) {
        console.error("Failed to fetch and display characters:", error);
        const pcListDiv = document.getElementById('active-pc-list');
        pcListDiv.innerHTML = '<p style="color: red;">Error loading characters. Is the server running and is the API service correctly configured?</p>';
    }
}

// This function runs when the page is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://127.0.0.1:5001/api/characters');
        appState.allCharacters = await response.json();
        
        UIRenderers.renderCharacterList(
            appState.allCharacters.filter(c => c.type === 'pc')
        );
        setupEventListeners();
        
    } catch (error) {
        console.error("Failed to initialize app:", error);
    }
});


function setupEventListeners() {
    const pcList = document.getElementById('active-pc-list');
    const acInput = document.getElementById('target-ac-input');

    // Add a single event listener to the list for efficiency
    pcList.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            updateDashboardView();
        }
    });

    // Add an event listener to the AC input to recalculate on change
    acInput.addEventListener('input', () => {
        updateDashboardView();
    });
}

function updateDashboardView() {
    const selectedCheckboxes = document.querySelectorAll('#active-pc-list input[type="checkbox"]:checked');
    const selectedPcIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.charId);
    
    const selectedPcs = appState.allCharacters.filter(char => selectedPcIds.includes(char.id));
    const targetAC = parseInt(document.getElementById('target-ac-input').value, 10) || 15;
    
    UIRenderers.updatePcDashboard(selectedPcs, targetAC);
}