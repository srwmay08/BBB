const DNDCalculations = {
    DIE_AVERAGES: { 4: 2.5, 6: 3.5, 8: 4.5, 10: 5.5, 12: 6.5, 20: 10.5 },

    getAbilityModifier(score) {
        return Math.floor(((score || 10) - 10) / 2);
    },

    calculateCharacterDPR(pc, targetAC, targetSaves) {
        const actions = [];
        if (!pc.system) return { actions };

        const profBonus = Math.floor(((pc.system.details?.level || 1) - 1) / 4) + 2;
        
        // --- 1. WEAPON ATTACKS ---
        const weapons = (pc.items || []).filter(item => item.type === 'weapon' && item.system?.equipped);
        weapons.forEach(weapon => {
            const weaponSystem = weapon.system;
            if (!weaponSystem?.damage?.base) return;
            const strMod = this.getAbilityModifier(pc.system.abilities.str.value);
            const dexMod = this.getAbilityModifier(pc.system.abilities.dex.value);
            const isFinesse = weaponSystem.properties?.includes('fin');
            const abilityKey = isFinesse && dexMod > strMod ? 'dex' : (weaponSystem.ability || 'str');
            const abilityMod = (abilityKey === 'dex') ? dexMod : strMod;
            const pcProficiencies = pc.system.traits?.weaponProf?.value || [];
            const isProficient = weaponSystem.proficient || pcProficiencies.includes(weaponSystem.type?.baseItem) || pcProficiencies.includes('sim') || pcProficiencies.includes('mar');
            const A = abilityMod + (isProficient ? profBonus : 0);
            const D = (weaponSystem.damage.base.denomination) ? (weaponSystem.damage.base.number || 1) * (this.DIE_AVERAGES[weaponSystem.damage.base.denomination] || 0) : 0;
            const B = abilityMod;
            if (D > 0) {
                const M = targetAC, C = 0.05;
                let H = Math.max(0.05, Math.min(0.95, 1 - ((M - A) / 20)));
                const dpr_normal = (C * D) + (H * (D + B));
                let HA = Math.max(0.0025, Math.min(0.9975, 1 - Math.pow(((M - A) / 20), 2)));
                const CA = 1 - Math.pow((1 - C), 2);
                const dpr_adv = (CA * D) + (HA * (D + B));
                let HD = Math.max(0.0025, Math.min(0.9975, Math.pow(((21 - (M - A)) / 20), 2)));
                const CD = Math.pow(C, 2);
                const dpr_disadv = (CD * D) + (HD * (D + B));
                actions.push({ name: weapon.name, dpr_normal, dpr_adv, dpr_disadv });
            }
        });
        
        // --- 2. SPELL ATTACKS & SAVES ---
        const allSpells = (pc.items || []).filter(item => item.type === 'spell');
        
        allSpells.forEach(spell => {
            const activities = spell.system?.activities;
            if (!activities) return;

            for (const key in activities) {
                const activity = activities[key];
                if (activity?.damage?.parts?.length > 0) {
                    let D = 0;
                    activity.damage.parts.forEach(part => {
                        let formula = Array.isArray(part) ? part[0] : (part.denomination ? `${part.number || 1}d${part.denomination}` : '');
                        if (formula && formula.includes('d')) {
                            const [numDice, diceType] = formula.split('d').map(Number);
                            D += (numDice || 1) * (this.DIE_AVERAGES[diceType] || 0);
                        }
                    });

                    if (D > 0) {
                        const spellAbilityKey = pc.system.attributes.spellcasting || 'int';
                        const spellMod = this.getAbilityModifier(pc.system.abilities[spellAbilityKey]?.value || 10);
                        let dpr_normal = 0, dpr_adv = 0, dpr_disadv = 0;

                        if (activity.type === 'save' || spell.system.save?.ability) {
                            const spellDC = 8 + profBonus + spellMod;
                            const saveAbility = spell.system.save?.ability || activity.save?.ability[0];
                            if (!saveAbility) continue;
                            const targetSaveBonus = targetSaves[saveAbility] || 0;
                            const chanceToFail = Math.max(0.05, Math.min(0.95, (spellDC - targetSaveBonus - 1) / 20));
                            dpr_normal = dpr_adv = dpr_disadv = chanceToFail * D;
                        } else { // Spell Attack
                            const A = spellMod + profBonus;
                            const B = 0, C = 0.05, M = targetAC;
                            let H = Math.max(0.05, Math.min(0.95, 1 - ((M - A) / 20)));
                            dpr_normal = (C * D) + (H * (D + B));
                            let HA = Math.max(0.0025, Math.min(0.9975, 1 - Math.pow(((M - A) / 20), 2)));
                            const CA = 1 - Math.pow((1 - C), 2);
                            dpr_adv = (CA * D) + (HA * (D + B));
                            let HD = Math.max(0.0025, Math.min(0.9975, Math.pow(((21 - (M - A)) / 20), 2)));
                            const CD = Math.pow(C, 2);
                            dpr_disadv = (CD * D) + (HD * (D + B));
                        }
                        actions.push({ name: spell.name, dpr_normal, dpr_adv, dpr_disadv });
                        break; 
                    }
                }
            }
        });
        
        return { actions };
    }
};