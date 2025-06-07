const appState = {
    allCharacters: [],
    activeSceneId: null,
};

function openTab(evt, tabName) {
    const tablinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    evt.currentTarget.className += " active";

    const dprView = document.getElementById('pc-dashboard-view');
    const sceneView = document.getElementById('dialogue-interface');
    
    // Hide all views first
    dprView.style.display = 'none';
    sceneView.style.display = 'none';

    // Show the selected view
    if (tabName === 'tab-dpr') {
        dprView.style.display = 'block';
    } else if (tabName === 'tab-scene') {
        sceneView.style.display = 'block';
    } else {
        // Default to DPR view if something else is clicked or on error
        dprView.style.display = 'block';
    }
    console.log(`Switched to tab: ${tabName}`);
}

async function fetchAndDisplayCharacters() {
    try {
        appState.allCharacters = await ApiService.getAllCharacters();
        const playerCharacters = appState.allCharacters.filter(c => c.character_type === 'character' || c.type === 'character');
        const nonPlayerCharacters = appState.allCharacters.filter(c => c.character_type === 'npc' || (c.type !== 'character' && c.type !== undefined));
        
        UIRenderers.renderCharacterList(playerCharacters, 'pc');
        UIRenderers.renderCharacterList(nonPlayerCharacters, 'npc');

    } catch (error) {
        console.error("Failed to fetch characters:", error);
        document.getElementById('active-pc-list').innerHTML = '<p style="color: red;">Error loading PCs.</p>';
        document.getElementById('active-npc-list').innerHTML = '<p style="color: red;">Error loading NPCs.</p>';
    }
}

function setupEventListeners() {
    const updateDprView = () => {
        // Only update DPR if the DPR tab is active and no scene is selected
        if (appState.activeSceneId === null) {
            updateDashboardView();
        }
    };
    document.getElementById('active-pc-list').addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            updateDprView();
        }
    });
    document.getElementById('dpr-controls').addEventListener('input', updateDprView);
}

function updateDashboardView() {
    const selectedCheckboxes = document.querySelectorAll('#active-pc-list input[type="checkbox"]:checked');
    const selectedPcIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.charId);
    
    const selectedPcs = appState.allCharacters.filter(char => selectedPcIds.includes(char.id));
    
    // Safely get the target AC value
    const targetACInput = document.getElementById('target-ac-input');
    const targetAC = targetACInput ? parseInt(targetACInput.value, 10) : 15;
    
    const targetSaves = {
        str: parseInt(document.getElementById('target-str-save').value, 10) || 0,
        dex: parseInt(document.getElementById('target-dex-save').value, 10) || 0,
        con: parseInt(document.getElementById('target-con-save').value, 10) || 0,
        int: parseInt(document.getElementById('target-int-save').value, 10) || 0,
        wis: parseInt(document.getElementById('target-wis-save').value, 10) || 0,
        cha: parseInt(document.getElementById('target-cha-save').value, 10) || 0,
    };

    UIRenderers.updatePcDashboard(selectedPcs, targetAC, targetSaves);
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayCharacters();
    setupEventListeners();
    // Set the initial view to the DPR dashboard
    document.getElementById('pc-dashboard-view').style.display = 'block';
    document.getElementById('dialogue-interface').style.display = 'none';
    updateDashboardView();
});