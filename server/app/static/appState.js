const appState = {
    allCharacters: [],
    scenes: [],
    activeSceneId: null,
};

function openTab(evt, tabName) {
    const tablinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    evt.currentTarget.className += " active";
    
    // Toggle visibility based on tab
    const dashboardView = document.getElementById('pc-dashboard-view');
    const dialogueView = document.getElementById('dialogue-interface');

    if (tabName === 'tab-scene') {
        dashboardView.style.display = 'none';
        dialogueView.style.display = 'block';
    } else {
        dashboardView.style.display = 'block';
        dialogueView.style.display = 'none';
    }

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

async function fetchAndDisplayScenes() {
    try {
        // Assuming a default world for now
        appState.scenes = await ApiService.getScenesForWorld('default-world');
        UIRenderers.renderSceneList(appState.scenes);
    } catch (error) {
        console.error("Failed to fetch scenes:", error);
    }
}

function setActiveScene(sceneId) {
    appState.activeSceneId = sceneId;
    const scene = appState.scenes.find(s => s.id === sceneId);
    if (scene) {
        const dialogueContainer = document.getElementById('dialogue-container');
        dialogueContainer.innerHTML = '';
        scene.dialogue_log.forEach(entry => UIRenderers.renderDialogue(entry));
        
        // Update NPC selector for the dialogue
        const sceneNpcs = appState.allCharacters.filter(c => scene.npc_ids.includes(c.id));
        UIRenderers.updateNpcSelector(sceneNpcs);
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

    // Scene management listeners
    document.getElementById('add-scene-btn').addEventListener('click', async () => {
        const newSceneNameInput = document.getElementById('new-scene-name');
        const newSceneName = newSceneNameInput.value.trim();
        if (newSceneName) {
            await ApiService.createScene(newSceneName, 'default-world');
            newSceneNameInput.value = '';
            fetchAndDisplayScenes();
        }
    });

    document.getElementById('scene-list').addEventListener('click', (event) => {
        if (event.target.classList.contains('scene-item')) {
            const sceneId = event.target.dataset.sceneId;
            setActiveScene(sceneId);
        }
    });

    // Dialogue generation listener
    document.getElementById('generate-dialogue-btn').addEventListener('click', async () => {
        const npcId = document.getElementById('dialogue-npc-select').value;
        const topic = document.getElementById('dialogue-topic-input').value;
        if (appState.activeSceneId && npcId) {
            const result = await ApiService.generateDialogue(appState.activeSceneId, npcId, topic);
            UIRenderers.renderDialogue(result);
        }
    });
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
    fetchAndDisplayScenes();
    setupEventListeners();
    updateDashboardView();
});