const UIRenderers = {
    renderCharacterList(characters) {
        const pcListDiv = document.getElementById('active-pc-list');
        pcListDiv.innerHTML = '';
        const ul = document.createElement('ul');
        characters.forEach(character => {
            const li = document.createElement('li');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `pc-checkbox-${character.id}`;
            checkbox.dataset.charId = character.id;
            const label = document.createElement('label');
            label.htmlFor = `pc-checkbox-${character.id}`;
            label.textContent = character.name;
            li.appendChild(checkbox);
            li.appendChild(label);
            ul.appendChild(li);
        });
        pcListDiv.appendChild(ul);
    },

    createDprTooltip(dpr, C, D, H, B, type) {
        const tooltipText = `Formula: (${type} * D) + (H * (D + B))\n` +
                          `(${C.toFixed(4)} * ${D.toFixed(2)}) + (${H.toFixed(2)} * (${D.toFixed(2)} + ${B}))`;
        return `<div class="tooltip">${dpr.toFixed(2)}<span class="tooltiptext">${tooltipText}</span></div>`;
    },

    updatePcDashboard(selectedPcs, targetAC, targetSaves) {
        const resultsContainer = document.getElementById('dpr-comparison-results');
        resultsContainer.innerHTML = '';

        if (selectedPcs.length === 0) {
            resultsContainer.innerHTML = `<p class="pc-dashboard-no-selection">Select Characters to compare DPR.</p>`;
            return;
        }

        let html = '<h4>Damage Per Round (DPR) Comparison</h4>';
        selectedPcs.forEach(pc => {
            html += `<h5>${pc.name}</h5>`;
            const dprCalcs = DNDCalculations.calculateCharacterDPR(pc, targetAC, targetSaves);

            if (dprCalcs.actions && dprCalcs.actions.length > 0) {
                html += '<div class="table-wrapper"><table class="derived-stats-table">';
                html += '<thead><tr><th>Action</th><th>Normal</th><th>Advantage</th><th>Disadvantage</th><th>Details</th></tr></thead><tbody>';
                dprCalcs.actions.forEach(action => {
                    const { name, calcs } = action;
                    const details = `A: ${calcs.A}, D: ${calcs.D.toFixed(2)}, B: ${calcs.B}`;
                    html += `
                        <tr>
                            <td><strong>${name}</strong></td>
                            <td>${this.createDprTooltip(calcs.dpr_normal, calcs.C, calcs.D, calcs.H, calcs.B, 'C')}</td>
                            <td>${this.createDprTooltip(calcs.dpr_adv, calcs.CA, calcs.D, calcs.HA, calcs.B, 'CA')}</td>
                            <td>${this.createDprTooltip(calcs.dpr_disadv, calcs.CD, calcs.D, calcs.HD, calcs.B, 'CD')}</td>
                            <td>${details}</td>
                        </tr>
                    `;
                });
                html += '</tbody></table></div>';
            } else {
                html += '<p>No damaging actions found.</p>';
            }
        });
        resultsContainer.innerHTML = html;
    },

    renderSceneList(scenes) {
        const sceneListDiv = document.getElementById('scene-list');
        sceneListDiv.innerHTML = '';
        scenes.forEach(scene => {
            const sceneEl = document.createElement('div');
            sceneEl.classList.add('scene-item');
            sceneEl.textContent = scene.name;
            sceneEl.dataset.sceneId = scene.id;
            sceneListDiv.appendChild(sceneEl);
        });
    },

    renderDialogue(dialogueEntry) {
        const container = document.getElementById('dialogue-container');
        const dialogueBox = document.createElement('div');
        dialogueBox.classList.add('dialogue-box');

        const npc = appState.allCharacters.find(c => c.id === dialogueEntry.npc_id);
        const npcName = npc ? npc.name : 'Unknown';

        dialogueBox.innerHTML = `<p class="npc-name">${npcName}:</p><p>${dialogueEntry.dialogue}</p>`;
        container.appendChild(dialogueBox);
        container.scrollTop = container.scrollHeight; // Auto-scroll to bottom
    },

    updateNpcSelector(npcs) {
        const selector = document.getElementById('dialogue-npc-select');
        selector.innerHTML = '';
        npcs.forEach(npc => {
            const option = document.createElement('option');
            option.value = npc.id;
            option.textContent = npc.name;
            selector.appendChild(option);
        });
    }
};