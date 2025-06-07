const DNDCalculations = {
    DIE_AVERAGES: { 4: 2.5, 6: 3.5, 8: 4.5, 10: 5.5, 12: 6.5, 20: 10.5 },

    getAbilityModifier(score) {
        return Math.floor(((score || 10) - 10) / 2);
    },

    calculateCharacterDPR(pc, targetAC, targetSaves) {
        const actions = [];
        if (!pc || !pc.system || !pc.items) return { actions };

        const profBonus = Math.floor(((pc.system.details?.level || 1) - 1) / 4) + 2;

        const processAction = (item, isSpell = false) => {
            let calcs = {};
            let actionName = item.name;

            if (isSpell) {
                // Find the first valid damaging activity in the spell
                const activityKey = Object.keys(item.system.activities).find(key => item.system.activities[key]?.damage?.parts?.length > 0);
                if (!activityKey) return null;
                const activity = item.system.activities[activityKey];

                const spellAbilityKey = pc.system.attributes.spellcasting || 'int';
                const spellMod = this.getAbilityModifier(pc.system.abilities[spellAbilityKey]?.value || 10);
                calcs.A = spellMod + profBonus;
                calcs.B = 0; // Spells don't add ability mod to damage by default
                
                calcs.D = 0;
                activity.damage.parts.forEach(part => {
                    let formula = Array.isArray(part) ? part[0] : (part.denomination ? `${part.number || 1}d${part.denomination}` : '');
                    if (formula && formula.includes('d')) {
                        const [numDice, diceType] = formula.split('d').map(Number);
                        calcs.D += (numDice || 1) * (this.DIE_AVERAGES[diceType] || 0);
                    }
                });

                 if (activity.type === 'save' || item.system.save?.ability) {
                    calcs.isSave = true;
                    const saveAbility = item.system.save?.ability || activity.save?.ability[0];
                    calcs.saveAbility = saveAbility;
                    calcs.spellDC = 8 + profBonus + spellMod;
                 }

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
                calcs.isSave = false;
            }

            if (calcs.D === 0) return null;

            calcs.M = targetAC;
            calcs.C = 0.05;

            if (calcs.isSave) {
                 const targetSaveBonus = targetSaves[calcs.saveAbility] || 0;
                 const chanceToFail = Math.max(0.05, Math.min(0.95, (calcs.spellDC - targetSaveBonus - 1) / 20));
                 calcs.dpr_normal = calcs.dpr_adv = calcs.dpr_disadv = chanceToFail * calcs.D;
                 calcs.H = calcs.HA = calcs.HD = chanceToFail;
                 calcs.CA = calcs.CD = calcs.C;
            } else {
                calcs.H = Math.max(0.05, Math.min(0.95, 1 - ((calcs.M - calcs.A) / 20)));
                calcs.dpr_normal = (calcs.C * calcs.D) + (calcs.H * (calcs.D + calcs.B));
                calcs.HA = Math.max(0.0025, Math.min(0.9975, 1 - Math.pow(((calcs.M - calcs.A) / 20), 2)));
                calcs.CA = 1 - Math.pow((1 - calcs.C), 2);
                calcs.dpr_adv = (calcs.CA * calcs.D) + (calcs.HA * (calcs.D + calcs.B));
                calcs.HD = Math.max(0.0025, Math.min(0.9975, Math.pow(((21 - (calcs.M - calcs.A)) / 20), 2)));
                calcs.CD = Math.pow(calcs.C, 2);
                calcs.dpr_disadv = (calcs.CD * calcs.D) + (calcs.HD * (calcs.D + calcs.B));
            }
            
            return { name: actionName, calcs };
        };

        const weapons = pc.items.filter(item => item.type === 'weapon' && item.system?.equipped);
        weapons.forEach(weapon => {
            const result = processAction(weapon, false);
            if (result) actions.push(result);
        });

        const allSpells = pc.items.filter(item => item.type === 'spell');
        allSpells.forEach(spell => {
            const result = processAction(spell, true);
            if (result) actions.push(result);
        });
        
        return { actions };
    }
};