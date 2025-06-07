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
            checkbox.value = character.id;
            checkbox.id = `pc-checkbox-${character.id}`;
            checkbox.addEventListener('change', (event) => {
                appState.toggleSelectedPc(event.target.value);
                this.updatePcDashboard(); // Re-render the dashboard on change
            });

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
    updatePcDashboard() {
        const dashboardContent = document.getElementById('pc-dashboard-content');
        const selectedPcs = appState.allCharacters.filter(char => appState.selectedPcIds.has(char.id));

        if (selectedPcs.length === 0) {
            dashboardContent.innerHTML = `<p class="pc-dashboard-no-selection">Select Player Characters from the left panel to calculate and compare their Damage Per Round (DPR).</p>`;
            return;
        }

        let html = '<h4>Damage Per Round (DPR) Comparison</h4>';
        html += '<p><i>Assumes all attacks hit against a target AC of 15. Does not account for advantage, disadvantage, or special class features.</i></p>';
        html += '<div class="table-wrapper"><table class="derived-stats-table">';
        html += '<thead><tr><th>Character</th><th>DPR</th><th>Attack Details</th></tr></thead><tbody>';

        selectedPcs.forEach(pc => {
            const dprCalcs = this.calculateCharacterDPR(pc);
            html += `
                <tr>
                    <td><strong>${pc.name}</strong></td>
                    <td><strong>${dprCalcs.totalDpr.toFixed(2)}</strong></td>
                    <td>${dprCalcs.breakdown}</td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        dashboardContent.innerHTML = html;
    },
    
    /**
     * Calculates the DPR for a single character based on their items.
     * @param {Object} pc - The character object.
     * @returns {Object} An object containing totalDPR and a breakdown string.
     */
    calculateCharacterDPR(pc) {
        let totalDpr = 0;
        let breakdown = [];
        const targetAC = 15; // A common baseline for calculation
        const profBonus = DNDCalculations.getProficiencyBonus(pc.system?.details?.level || 1);

        const attacks = (pc.items || []).filter(item => item.type === 'weapon' && item.system?.actionType === 'mwak' || item.system?.actionType === 'rwak');

        attacks.forEach(weapon => {
            const abilityKey = weapon.system.ability || 'str';
            const abilityMod = DNDCalculations.getAbilityModifier(pc.system.abilities[abilityKey]?.value || 10);
            const attackBonus = abilityMod + profBonus;
            const hitChance = Math.max(0.05, Math.min(0.95, (21 - (targetAC - attackBonus)) / 20));

            const damageFormula = weapon.system.damage.parts[0]?.[0]; // e.g., "1d8 + @mod"
            if(!damageFormula) return;
            
            const [dicePart, ] = damageFormula.split('+');
            const [numDice, diceType] = dicePart.trim().split('d').map(Number);
            
            const avgDiceDamage = numDice * ((diceType + 1) / 2);
            const avgDamage = avgDiceDamage + abilityMod;
            const avgCritDamage = avgDiceDamage; // Just the extra dice

            const dpr = (hitChance * avgDamage) + (0.05 * avgCritDamage); // 0.05 is crit chance
            totalDpr += dpr;
            breakdown.push(`${weapon.name} (${dpr.toFixed(2)} DPR)`);
        });

        if (breakdown.length === 0) {
            breakdown.push("No scannable weapons found.");
        }

        return { totalDpr, breakdown: breakdown.join(', ') };
    }
};

// Placeholder for tab functionality
function openTab() {}