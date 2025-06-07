// app/static/app.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded. Fetching characters...");
    fetchAndDisplayCharacters();
});

/**
 * Fetches character data from the backend API and calls the render function.
 */
async function fetchAndDisplayCharacters() {
    try {
        const response = await fetch('http://127.0.0.1:5001/api/characters');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const characters = await response.json();
        console.log("Characters fetched successfully:", characters);
        renderCharacterList(characters);
    } catch (error) {
        console.error("Failed to fetch characters:", error);
        const pcListDiv = document.getElementById('active-pc-list');
        pcListDiv.innerHTML = '<p style="color: red;">Error loading characters. Is the server running?</p>';
    }
}

/**
 * Renders the list of characters on the left-hand side menu.
 * @param {Array} characters - An array of character objects from the API.
 */
function renderCharacterList(characters) {
    const pcListDiv = document.getElementById('active-pc-list');
    if (!characters || characters.length === 0) {
        pcListDiv.innerHTML = '<p>No characters found in the database.</p>';
        return;
    }

    const ul = document.createElement('ul');

    // CORRECTED: Instead of filtering, we will now render ALL characters
    // that were imported from your data folder. This is more reliable.
    characters.forEach(character => {
        // We only render if the character has a name.
        if (!character.name) {
            return; // Skip this entry if it doesn't have a name
        }
        
        const li = document.createElement('li');
        
        // Check if the character is a PC or NPC to display it correctly.
        // Foundry's default is 'character' for PCs and 'npc' for NPCs.
        const charType = character.type === 'npc' ? 'NPC' : 'PC';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `pc-checkbox-${character.id}`;
        checkbox.value = character.id;
        checkbox.className = 'pc-select-checkbox';
        
        const label = document.createElement('label');
        label.htmlFor = `pc-checkbox-${character.id}`;
        // Display the name and type (PC/NPC)
        label.textContent = `${character.name} (${charType})`;
        
        li.appendChild(checkbox);
        li.appendChild(label);
        ul.appendChild(li);
    });

    // Clear the "Loading..." message and append the new list.
    pcListDiv.innerHTML = '';
    pcListDiv.appendChild(ul);
}

// --- Placeholder for Tab functionality ---
function openTab(event, tabName) {
  console.log(`Tab clicked: ${tabName}`);
}