const UIRenderers = {
    /**
     * Renders the selectable list of Player Characters on the left.
     */
    renderCharacterList(characters) {
        const pcListDiv = document.getElementById('active-pc-list');
        pcListDiv.innerHTML = '';
        const ul = document.createElement('ul');

        characters.forEach(character => {
            const li = document.createElement('li');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `pc-checkbox-${character.id}`;
            checkbox.dataset.charId = character.id; // Store ID for easy access
            
            const label = document.createElement('label');
            label.htmlFor = `pc-checkbox-${character.id}`;
            label.textContent = character.name;

            li.appendChild(checkbox);
            li.appendChild(label);
ul.appendChild(li);
        });
        pcListDiv.appendChild(ul);
    },

    /**
     * Renders the main PC Dashboard view with DPR and stats comparisons.
     */
    updatePcDashboard(selectedPcs, targetAC) {
        const resultsContainer = document.getElementById('dpr-comparison-results');

        if (selectedPcs.length === 0) {
            resultsContainer.innerHTML = `<p class="pc-dashboard-no-selection">Select Player Characters from the left panel to calculate and compare their Damage Per Round (DPR).</p>`;
            return;
        }

        let html = '<h4>Damage Per Round (DPR) Comparison</h4>';
        html += '<div class="table-wrapper"><table class="derived-stats-table">';
        html += '<thead><tr><th>Character</th><th>DPR</th><th>Attack Details</th></tr></thead><tbody>';

        selectedPcs.forEach(pc => {
            const dprCalcs = DNDCalculations.calculateCharacterDPR(pc, targetAC);
            html += `
                <tr>
                    <td><strong>${pc.name}</strong></td>
                    <td><strong>${dprCalcs.totalDpr.toFixed(2)}</strong></td>
                    <td>${dprCalcs.breakdown}</td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        resultsContainer.innerHTML = html;
    }
};