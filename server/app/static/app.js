// This object will hold our application's data
const appState = {
    allCharacters: [],
};

/**
 * Handles switching between tabs in the UI.
 * @param {Event} evt - The click event.
 * @param {string} tabName - The name of the tab to open.
 */
function openTab(evt, tabName) {
  // Get all elements with class="tab-link" and remove the class "active"
  const tablinks = document.getElementsByClassName("tab-link");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Add an "active" class to the button that opened the tab
  evt.currentTarget.className += " active";

  // Placeholder for showing tab content.
  const contentEl = document.getElementById('left-column-content');
  contentEl.innerHTML = `<p>Content for ${tabName} would be displayed here.</p>`;
  console.log(`Switched to tab: ${tabName}`);
}

/**
 * Fetches character data from the API and renders the character list.
 */
async function fetchAndDisplayCharacters() {
    try {
        // Use your centralized ApiService to fetch data
        appState.allCharacters = await ApiService.getAllCharacters();
        console.log("Characters fetched successfully:", appState.allCharacters);

        // Correctly filter for player characters. The provided JSON uses 'character'.
        const playerCharacters = appState.allCharacters.filter(c => c.type === 'character');

        if (playerCharacters.length > 0) {
            UIRenderers.renderCharacterList(playerCharacters);
        } else {
            const pcListDiv = document.getElementById('active-pc-list');
            pcListDiv.innerHTML = '<p style="color: orange;">No player characters found.</p>';
        }

    } catch (error) {
        console.error("Failed to fetch and display characters:", error);
        const pcListDiv = document.getElementById('active-pc-list');
        pcListDiv.innerHTML = '<p style="color: red;">Error loading characters. Is the server running?</p>';
    }
}

/**
 * Sets up event listeners for UI elements.
 */
function setupEventListeners() {
    const pcList = document.getElementById('active-pc-list');
    const acInput = document.getElementById('target-ac-input');

    if (pcList) {
        // Add a single event listener to the list for efficiency
        pcList.addEventListener('change', (event) => {
            if (event.target.type === 'checkbox') {
                updateDashboardView();
            }
        });
    }

    if (acInput) {
        // Add an event listener to the AC input to recalculate on change
        acInput.addEventListener('input', () => {
            updateDashboardView();
        });
    }
}

/**
 * Updates the main dashboard view with selected characters and target AC.
 */
function updateDashboardView() {
    const selectedCheckboxes = document.querySelectorAll('#active-pc-list input[type="checkbox"]:checked');
    const selectedPcIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.charId);

    const selectedPcs = appState.allCharacters.filter(char => selectedPcIds.includes(char.id));
    const targetAC = parseInt(document.getElementById('target-ac-input').value, 10) || 15;

    UIRenderers.updatePcDashboard(selectedPcs, targetAC);
}

// This function runs when the page is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayCharacters();
    setupEventListeners();
});