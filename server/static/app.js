// app/static/app.js

// This function runs automatically when the webpage is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded. Fetching characters...");
    fetchAndDisplayCharacters();
});

/**
 * Fetches character data from the backend API and calls the render function.
 */
async function fetchAndDisplayCharacters() {
    try {
        // Our backend runs on port 5001, and we created the /api/characters endpoint.
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

    // Create an unordered list to hold the characters.
    const ul = document.createElement('ul');

    // Filter for characters that are likely PCs (this is a guess, you can refine it)
    const playerCharacters = characters.filter(char => char.type === 'pc');

    playerCharacters.forEach(character => {
        const li = document.createElement('li');
        
        // Add a checkbox to select/deselect the character for DPR comparison.
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `pc-checkbox-${character.id}`;
        checkbox.value = character.id;
        checkbox.className = 'pc-select-checkbox';
        
        // Add a label for the checkbox which will contain the character's name.
        const label = document.createElement('label');
        label.htmlFor = `pc-checkbox-${character.id}`;
        label.textContent = character.name;
        
        li.appendChild(checkbox);
        li.appendChild(label);
        ul.appendChild(li);
    });

    // Clear the "Loading..." message and append the new list.
    pcListDiv.innerHTML = '';
    pcListDiv.appendChild(ul);
}

// --- Placeholder for Tab functionality from your HTML ---
function openTab(event, tabName) {
  // This is a placeholder. In a real app, you would have logic
  // to show/hide the different tabs in the left column.
  console.log(`Tab clicked: ${tabName}`);
}