const appState = {
    allCharacters: [],
};

function openTab(evt, tabName) {
    const tablinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    evt.currentTarget.className += " active";
    const contentEl = document.getElementById('left-column-content');
    contentEl.innerHTML = `<p>Content for ${tabName} would be displayed here.</p>`;
    console.log(`Switched to tab: ${tabName}`);
}

async function fetchAndDisplayCharacters() {
    try {
        appState.allCharacters = await ApiService.getAllCharacters();
        const playerCharacters = appState.allCharacters.filter(c => c.type === 'character');
        UIRenderers.renderCharacterList(playerCharacters);
    } catch (error) {
        console.error("Failed to fetch characters:", error);
        document.getElementById('active-pc-list').innerHTML = '<p style="color: red;">Error loading characters.</p>';
    }
}

function setupEventListeners() {
    const updateView = () => updateDashboardView();
    document.getElementById('active-pc-list').addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            updateView();
        }
    });
    document.getElementById('dpr-controls').addEventListener('input', updateView);
}

function updateDashboardView() {
    const selectedCheckboxes = document.querySelectorAll('#active-pc-list input[type="checkbox"]:checked');
    const selectedPcIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.charId);
    
    const selectedPcs = appState.allCharacters.filter(char => selectedPcIds.includes(char.id));
    const targetAC = parseInt(document.getElementById('target-ac-input').value, 10) || 15;
    
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
    updateDashboardView();
});