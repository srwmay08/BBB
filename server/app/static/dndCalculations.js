const DNDCalculations = {
    DIE_AVERAGES: { 4: 2.5, 6: 3.5, 8: 4.5, 10: 5.5, 12: 6.5, 20: 10.5 },

    getAbilityModifier(score) {
        return Math.floor(((score || 10) - 10) / 2);
    },

    calculateCharacterDPR(pc, targetAC, targetSaves) {
        const actions = [];
        if (!pc.system) return { actions };

        const profBonus = Math.floor(((pc.system.details?.level || 1) - 1) / 4) + 2;
        let hasLogged = false; // Flag to ensure we only log the first weapon of the first character

        const logOnce = (...args) => {
            if (!hasLogged) console.log(...args);
        };
        
        console.log(`\n===== CALCULATING FOR: ${pc.name} =====`);

        // --- 1. WEAPON ATTACKS ---
        const weapons = (pc.items || []).filter(item => item.type === 'weapon' && item.system?.equipped);
        weapons.forEach(weapon => {
            logOnce(`\n--- START DPR CALCULATION FOR ${pc.name}: ${weapon.name} ---`);
            
            const weaponSystem = weapon.system;
            if (!weaponSystem?.damage) return;
            
            const strMod = this.getAbilityModifier(pc.system.abilities.str.value);
            const dexMod = this.getAbilityModifier(pc.system.abilities.dex.value);
            
            const isFinesse = weaponSystem.properties?.includes('fin');
            const abilityKey = isFinesse && dexMod > strMod ? 'dex' : (weaponSystem.ability || 'str');
            const abilityMod = (abilityKey === 'dex') ? dexMod : strMod;
            logOnce(`[1] Using Ability: ${abilityKey.toUpperCase()} (DEX: ${dexMod}, STR: ${strMod}). Modifier:`, abilityMod);

            const pcProficiencies = pc.system.traits?.weaponProf?.value || [];
            const isProficient = weaponSystem.proficient === 1 || pcProficiencies.includes(weaponSystem.type?.baseItem) || pcProficiencies.includes('sim') || pcProficiencies.includes('mar');
            logOnce(`[2] Is Proficient?`, isProficient, pcProficiencies);

            const A = abilityMod + (isProficient ? profBonus : 0);
            logOnce(`[3] Attack Bonus (A) = ${abilityMod} (mod) + ${isProficient ? profBonus : 0} (prof) =`, A);

            const damageBase = weaponSystem.damage.base;
            const D = (damageBase && damageBase.denomination) ? (damageBase.number || 1) * (this.DIE_AVERAGES[damageBase.denomination] || 0) : 0;
            logOnce(`[4] Average Dice Damage (D):`, D.toFixed(2));
            
            const B = abilityMod;
            logOnce(`[5] Bonus Static Damage (B):`, B);

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
            
            actions.push({ name: weapon.name, dpr_normal, dpr_adv, dpr_disadv });
            hasLogged = true;
        });
        
        // --- 2. SPELL ATTACKS & SAVES ---
        const spells = (pc.items || []).filter(item => item.type === 'spell' && item.system?.damage?.parts?.length > 0 && item.system.damage.parts[0]);
        console.log(`[INFO] Found ${spells.length} damaging spells for ${pc.name}.`);

        spells.forEach(spell => {
            const spellAbilityKey = pc.system.attributes.spellcasting || 'int';
            const spellMod = this.getAbilityModifier(pc.system.abilities[spellAbilityKey]?.value || 10);
            
            let D = 0;
            (spell.system.damage?.parts || []).forEach(part => {
                let formula = '';
                if (Array.isArray(part) && typeof part[0] === 'string') {
                    formula = part[0];
                } else if (typeof part === 'object' && part !== null && part.denomination) {
                    formula = `${part.number || 1}d${part.denomination}`;
                }

                if (formula.includes('d')) {
                    const [numDice, diceType] = formula.split('d').map(Number);
                    D += (numDice || 1) * (this.DIE_AVERAGES[diceType] || 0);
                }
            });

            if (D > 0) {
                let dpr_normal = 0, dpr_adv = 0, dpr_disadv = 0;
                
                if (spell.system.save?.ability) { // Saving Throw Spell
                    const spellDC = 8 + profBonus + spellMod;
                    const targetSaveBonus = targetSaves[spell.system.save.ability] || 0;
                    const chanceToFail = Math.max(0.05, Math.min(0.95, (spellDC - targetSaveBonus - 1) / 20));
                    dpr_normal = dpr_adv = dpr_disadv = chanceToFail * D;
                } else { // Spell Attack Spell
                    const A = spellMod + profBonus;
                    const B = 0;
                    const C = 0.05;

                    let H = Math.max(0.05, Math.min(0.95, 1 - ((targetAC - A) / 20)));
                    dpr_normal = (C * D) + (H * (D + B));

                    let HA = Math.max(0.0025, Math.min(0.9975, 1 - Math.pow(((targetAC - A) / 20), 2)));
                    const CA = 1 - Math.pow((1 - C), 2);
                    dpr_adv = (CA * D) + (HA * (D + B));
                    
                    let HD = Math.max(0.0025, Math.min(0.9975, Math.pow(((21 - (targetAC - A)) / 20), 2)));
                    const CD = Math.pow(C, 2);
                    dpr_disadv = (CD * D) + (HD * (D + B));
                }
                actions.push({ name: spell.name, dpr_normal, dpr_adv, dpr_disadv });
            }
        });
        
        return { actions };
    }
};