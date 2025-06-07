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

    updatePcDashboard(selectedPcs, targetAC, advantageStatus, targetSaves) {
        const resultsContainer = document.getElementById('dpr-comparison-results');

        if (selectedPcs.length === 0) {
            resultsContainer.innerHTML = `<p class="pc-dashboard-no-selection">Select Player Characters to compare their Damage Per Round (DPR).</p>`;
            return;
        }

        let html = '<h4>Damage Per Round (DPR) Comparison</h4>';
        
        selectedPcs.forEach(pc => {
            html += `<h5>${pc.name}</h5>`;
            const dprCalcs = DNDCalculations.calculateCharacterDPR(pc, targetAC, targetSaves);
            
            if (dprCalcs.actions && dprCalcs.actions.length > 0) {
                html += '<div class="table-wrapper"><table class="derived-stats-table">';
                html += '<thead><tr><th>Action</th><th>DPR (Normal)</th><th>DPR (Adv)</th><th>DPR (Disadv)</th></tr></thead><tbody>';
                dprCalcs.actions.sort((a, b) => b.dpr_adv - a.dpr_adv).forEach(action => {
                    html += `
                        <tr>
                            <td><strong>${action.name}</strong></td>
                            <td>${action.dpr_normal.toFixed(2)}</td>
                            <td>${action.dpr_adv.toFixed(2)}</td>
                            <td>${action.dpr_disadv.toFixed(2)}</td>
                        </tr>
                    `;
                });
                html += '</tbody></table></div>';
            } else {
                html += '<p>No damaging actions found for this character.</p>';
            }
        });

        resultsContainer.innerHTML = html;
    }
};