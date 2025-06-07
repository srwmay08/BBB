const DNDCalculations = {
    DIE_AVERAGES: { 4: 2.5, 6: 3.5, 8: 4.5, 10: 5.5, 12: 6.5, 20: 10.5 },

    getAbilityModifier(score) {
        return Math.floor(((score || 10) - 10) / 2);
    },

    calculateCharacterDPR(pc, targetAC, targetSaves) {
        const actions = [];
        if (!pc.system) return { actions };

        const profBonus = Math.floor(((pc.system.details?.level || 1) - 1) / 4) + 2;

        const processAction = (item, isSpell = false) => {
            let calcs = {};
            
            if (isSpell) {
                const spellAbilityKey = pc.system.attributes.spellcasting || 'int';
                const spellMod = this.getAbilityModifier(pc.system.abilities[spellAbilityKey]?.value || 10);
                calcs.A = spellMod + profBonus;
                calcs.B = 0; // Spells don't add ability mod to damage by default
                
                calcs.D = 0;
                item.system.damage.parts.forEach(part => {
                    let formula = Array.isArray(part) ? part[0] : (part.denomination ? `${part.number || 1}d${part.denomination}` : '');
                    if (formula && formula.includes('d')) {
                        const [numDice, diceType] = formula.split('d').map(Number);
                        calcs.D += (numDice || 1) * (this.DIE_AVERAGES[diceType] || 0);
                    }
                });

            } else { // Is a weapon
                const weaponSystem = item.system;
                const strMod = this.getAbilityModifier(pc.system.abilities.str.value);
                const dexMod = this.getAbilityModifier(pc.system.abilities.dex.value);
                const isFinesse = weaponSystem.properties?.includes('fin');
                const abilityKey = isFinesse && dexMod > strMod ? 'dex' : (weaponSystem.ability || 'str');
                const abilityMod = (abilityKey === 'dex') ? dexMod : strMod;
                const pcProficiencies = pc.system.traits?.weaponProf?.value || [];
                const isProficient = weaponSystem.proficient || pcProficiencies.includes(weaponSystem.type?.baseItem) || pcProficiencies.includes('sim') || pcProficiencies.includes('mar');
                
                calcs.A = abilityMod + (isProficient ? profBonus : 0);
                calcs.D = (weaponSystem.damage.base.denomination) ? (weaponSystem.damage.base.number || 1) * (this.DIE_AVERAGES[weaponSystem.damage.base.denomination] || 0) : 0;
                calcs.B = abilityMod;
            }

            if (calcs.D === 0) return null;

            calcs.M = targetAC;
            calcs.C = 0.05;

            // Normal
            calcs.H = Math.max(0.05, Math.min(0.95, 1 - ((calcs.M - calcs.A) / 20)));
            calcs.dpr_normal = (calcs.C * calcs.D) + (calcs.H * (calcs.D + calcs.B));

            // Advantage
            calcs.HA = Math.max(0.0025, Math.min(0.9975, 1 - Math.pow(((calcs.M - calcs.A) / 20), 2)));
            calcs.CA = 1 - Math.pow((1 - calcs.C), 2);
            calcs.dpr_adv = (calcs.CA * calcs.D) + (calcs.HA * (calcs.D + calcs.B));

            // Disadvantage
            calcs.HD = Math.max(0.0025, Math.min(0.9975, Math.pow(((21 - (calcs.M - calcs.A)) / 20), 2)));
            calcs.CD = Math.pow(calcs.C, 2);
            calcs.dpr_disadv = (calcs.CD * calcs.D) + (calcs.HD * (calcs.D + calcs.B));
            
            return { name: item.name, calcs };
        };

        const weapons = (pc.items || []).filter(item => item.type === 'weapon' && item.system?.equipped);
        weapons.forEach(weapon => {
            const result = processAction(weapon, false);
            if (result) actions.push(result);
        });

        const allSpells = (pc.items || []).filter(item => item.type === 'spell' && item.system?.damage?.parts?.length > 0);
        allSpells.forEach(spell => {
             // This logic needs to check inside activities for damage, as we discovered
            const activities = spell.system?.activities;
            if (!activities) return;

            for (const key in activities) {
                const activity = activities[key];
                if (activity?.damage?.parts?.length > 0) {
                     // create a temporary item-like structure for the spell activity
                    const spellAction = {
                        name: spell.name,
                        system: {
                            damage: activity.damage,
                            save: spell.system.save
                        }
                    };
                    const result = processAction(spellAction, true);
                    if (result) actions.push(result);
                    break; // Assume one damaging activity per spell for simplicity
                }
            }
        });
        
        return { actions };
    }
};