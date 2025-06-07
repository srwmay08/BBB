const UIRenderers = {
    renderCharacterList(characters, type = 'pc') {
        const listId = type === 'pc' ? 'active-pc-list' : 'active-npc-list';
        const listDiv = document.getElementById(listId);
        if (!listDiv) return;
        listDiv.innerHTML = '';
        const ul = document.createElement('ul');
        characters.forEach(character => {
            const li = document.createElement('li');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `${type}-checkbox-${character.id}`;
            checkbox.dataset.charId = character.id;
            checkbox.dataset.charType = type;
            const label = document.createElement('label');
            label.htmlFor = `${type}-checkbox-${character.id}`;
            label.textContent = character.name;
            li.appendChild(checkbox);
            li.appendChild(label);
            ul.appendChild(li);
        });
        listDiv.appendChild(ul);
    },

    /**
     * Creates a span with a detailed tooltip for a DPR value.
     */
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
    }
};