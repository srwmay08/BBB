const DNDCalculations = {
    DIE_AVERAGES: { 4: 2.5, 6: 3.5, 8: 4.5, 10: 5.5, 12: 6.5 },

    /**
     * Calculates DPR for all of a character's actions.
     * @param {object} pc - The character object.
     * @param {number} targetAC - The target's Armor Class.
     * @param {object} targetSaves - An object with target's save bonuses (e.g., {str: 2, dex: 1, ...}).
     * @returns {object} An object with a list of actions and their DPR.
     */
    calculateCharacterDPR(pc, targetAC, targetSaves) {
        const actions = [];
        const profBonus = Math.floor(((pc.system?.details?.level || 1) - 1) / 4) + 2;
        const pcProficiencies = pc.system?.traits?.weaponProf?.value || [];

        // --- 1. WEAPON ATTACKS ---
        const weapons = (pc.items || []).filter(item => item.type === 'weapon' && item.system?.equipped);
        weapons.forEach(weapon => {
            const weaponSystem = weapon.system;
            const abilityKey = (weaponSystem?.properties?.fin && pc.system.abilities.dex.mod > pc.system.abilities.str.mod) ? 'dex' : (weaponSystem.ability || 'str');
            const abilityMod = pc.system.abilities[abilityKey]?.mod || 0;
            
            // Check for proficiency with the specific weapon base type (e.g., 'rapier', 'shortsword')
            const isProficient = pcProficiencies.includes(weaponSystem?.type?.baseItem) || pcProficiencies.includes(weaponSystem?.type?.value);

            const attackBonus = abilityMod + (isProficient ? profBonus : 0);
            
            let hitChance = (21 - (targetAC - attackBonus)) / 20;
            hitChance = Math.max(0.05, Math.min(0.95, hitChance));
            const critChance = 0.05;

            let totalDiceAverage = 0;
            // Correctly add only the ability modifier to bonus damage
            let bonusDamage = abilityMod; 
            const damageParts = weaponSystem.damage?.parts || [];
            damageParts.forEach(part => {
                 const formula = part[0] || '';
                if (formula.includes('d')) {
                    const [numDice, diceType] = formula.split('d').map(Number);
                    if (this.DIE_AVERAGES[diceType]) {
                        totalDiceAverage += numDice * this.DIE_AVERAGES[diceType];
                    }
                } else if (!isNaN(parseInt(formula))) {
                    bonusDamage += parseInt(formula);
                }
            });
            
            const averageDamage = totalDiceAverage + bonusDamage;
            const dpr = (hitChance * averageDamage) + (critChance * totalDiceAverage);
            
            actions.push({
                name: weapon.name,
                dpr: dpr,
                breakdown: `+${attackBonus} to hit (vs AC ${targetAC}), Hit%: ${(hitChance * 100).toFixed(0)}%, Avg Dmg: ${averageDamage.toFixed(1)}`
            });
        });
        
        // --- 2. SPELL ATTACKS & SAVES ---
        const spells = (pc.items || []).filter(item => item.type === 'spell' && item.system.damage?.parts?.length > 0 && item.system.damage.parts[0][0]);
        spells.forEach(spell => {
            const spellAbility = pc.system.attributes.spellcasting || 'int';
            const spellMod = pc.system.abilities[spellAbility]?.mod || 0;
            const spellDC = 8 + profBonus + spellMod;
            const saveInfo = spell.system.save;

            let spellDiceAverage = 0;
            (spell.system.damage?.parts || []).forEach(part => {
                 const formula = part[0] || '';
                 if (formula.includes('d')) {
                    const [numDice, diceType] = formula.split('d').map(Number);
                    if (this.DIE_AVERAGES[diceType]) {
                        spellDiceAverage += numDice * this.DIE_AVERAGES[diceType];
                    }
                } else if (!isNaN(parseInt(formula))) {
                    spellDiceAverage += parseInt(formula);
                }
            });

            if (spellDiceAverage > 0) {
                let successChance = 0;
                let breakdown = '';
                
                // Saving Throw Spells
                if (saveInfo && saveInfo.ability) {
                    const targetSaveBonus = targetSaves[saveInfo.ability] || 0;
                    const chanceToFail = (spellDC - targetSaveBonus - 1) / 20;
                    successChance = Math.max(0.05, Math.min(0.95, chanceToFail));
                    breakdown = `DC ${spellDC} ${saveInfo.ability.toUpperCase()} (vs Bonus +${targetSaveBonus}), Fail%: ${(successChance * 100).toFixed(0)}%`;
                }
                // Spell Attack Spells
                else {
                    const attackBonus = spellMod + profBonus;
                    successChance = (21 - (targetAC - attackBonus)) / 20;
                    successChance = Math.max(0.05, Math.min(0.95, successChance));
                    breakdown = `+${attackBonus} to hit (vs AC ${targetAC}), Hit%: ${(successChance * 100).toFixed(0)}%`;
                }
                
                //This simplification assumes no damage on a successful save.
                const spellDpr = successChance * spellDiceAverage;
                actions.push({
                    name: spell.name,
                    dpr: spellDpr,
                    breakdown: `${breakdown}, Avg Dmg: ${spellDiceAverage.toFixed(1)}`
                });
            }
        });

        return { actions };
    }
};