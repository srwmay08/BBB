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
            const M = targetAC;
            const C = 0.05;

            let H = Math.max(0.05, Math.min(0.95, 1 - ((M - A) / 20)));
            const dpr_normal = (C * D) + (H * (D + B));
            let HA = Math.max(0.0025, Math.min(0.9975, 1 - Math.pow(((M - A) / 20), 2)));
            const CA = 1 - Math.pow((1 - C), 2);
            const dpr_adv = (CA * D) + (HA * (D + B));
            let HD = Math.max(0.0025, Math.min(0.9975, Math.pow(((21 - (M - A)) / 20), 2)));
            const CD = Math.pow(C, 2);
            const dpr_disadv = (CD * D) + (HD * (D + B));
            
            if (D > 0) {
                 actions.push({ name: weapon.name, dpr_normal, dpr_adv, dpr_disadv });
            }
        });
        
        // --- 2. SPELL ATTACKS & SAVES (REVISED LOGIC) ---
        const allSpells = (pc.items || []).filter(item => item.type === 'spell');
        console.log(`[INFO] For ${pc.name}, found ${allSpells.length} total spells. Checking for damage...`);

        allSpells.forEach(spell => {
            if (!spell.system?.damage?.parts || spell.system.damage.parts.length === 0) {
                return; // Skip spells with no damage parts array
            }
            
            let D = 0; // Average Dice Damage
            spell.system.damage.parts.forEach(part => {
                let formula = '';
                if (Array.isArray(part) && typeof part[0] === 'string') { // e.g., ["1d6", "fire"]
                    formula = part[0];
                } else if (typeof part === 'object' && part.denomination) { // e.g., { number: 1, denomination: 8 }
                    formula = `${part.number || 1}d${part.denomination}`;
                }
                
                if (formula.includes('d')) {
                    const [numDice, diceType] = formula.split('d').map(Number);
                    if(this.DIE_AVERAGES[diceType]) {
                        D += (numDice || 1) * this.DIE_AVERAGES[diceType];
                    }
                }
            });

            if (D > 0) {
                 console.log(`[SUCCESS] Found damaging spell for ${pc.name}: ${spell.name} with avg damage ${D}`);
                 const spellAbilityKey = pc.system.attributes.spellcasting || 'int';
                 const spellMod = this.getAbilityModifier(pc.system.abilities[spellAbilityKey]?.value || 10);
                 let dpr_normal = 0, dpr_adv = 0, dpr_disadv = 0;

                if (spell.system.save?.ability) {
                    const spellDC = 8 + profBonus + spellMod;
                    const targetSaveBonus = targetSaves[spell.system.save.ability] || 0;
                    const chanceToFail = Math.max(0.05, Math.min(0.95, (spellDC - targetSaveBonus - 1) / 20));
                    dpr_normal = dpr_adv = dpr_disadv = chanceToFail * D;
                } else {
                    const A = spellMod + profBonus;
                    const B = 0;
                    const C = 0.05;
                    const M = targetAC;

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
            }
        });
        
        return { actions };
    }
};