const DNDCalculations = {
    DIE_AVERAGES: { 4: 2.5, 6: 3.5, 8: 4.5, 10: 5.5, 12: 6.5, 20: 10.5 },

    /**
     * Calculates DPR for all of a character's actions.
     */
    calculateCharacterDPR(pc, targetAC, targetSaves) {
        const actions = [];
        if (!pc.system) return { actions };

        const profBonus = Math.floor(((pc.system.details?.level || 1) - 1) / 4) + 2;
        let hasLogged = false;

        const logOnce = (...args) => {
            if (!hasLogged) console.log(...args);
        };

        // --- 1. WEAPON ATTACKS ---
        const weapons = (pc.items || []).filter(item => item.type === 'weapon' && item.system?.equipped);
        weapons.forEach(weapon => {
            logOnce(`\n--- START DPR CALCULATION FOR ${pc.name}: ${weapon.name} ---`);
            
            const weaponSystem = weapon.system;
            if (!weaponSystem?.damage) return;
            
            const abilityKey = (weaponSystem.properties?.fin && pc.system.abilities.dex.mod > pc.system.abilities.str.mod) ? 'dex' : (weaponSystem.ability || 'str');
            const abilityMod = pc.system.abilities[abilityKey]?.mod || 0;
            logOnce(`[1] Ability Modifier (${abilityKey.toUpperCase()}):`, abilityMod);
            
            const pcProficiencies = pc.system.traits?.weaponProf?.value || [];
            const isProficient = pcProficiencies.includes(weaponSystem.type?.baseItem) || pcProficiencies.includes(weaponSystem.type?.value?.slice(0, 3));
            logOnce(`[2] Is Proficient?`, isProficient);

            const A = abilityMod + (isProficient ? profBonus : 0);
            logOnce(`[3] Attack Bonus (A) = ${abilityMod} (mod) + ${isProficient ? profBonus : 0} (prof) =`, A);

            let totalDiceAverage = 0;
            const damageBase = weaponSystem.damage.base;
            if (damageBase && damageBase.denomination) {
                totalDiceAverage += (damageBase.number || 1) * (this.DIE_AVERAGES[damageBase.denomination] || 0);
            }
            const D = totalDiceAverage;
             logOnce(`[4] Average Dice Damage (D):`, D.toFixed(2));
            
            const B = abilityMod;
            logOnce(`[5] Bonus Static Damage (B):`, B);

            const M = targetAC;
            logOnce(`[6] Target AC (M):`, M);

            const C = 0.05;

            // --- Normal ---
            let H = 1 - ((M - A) / 20);
            H = Math.max(0.05, Math.min(0.95, H));
            const dpr_normal = (C * D) + (H * (D + B));

            // --- Advantage ---
            let HA = 1 - Math.pow(((M - A) / 20), 2);
            HA = Math.max(0.0025, Math.min(0.9975, HA));
            const CA = 1 - Math.pow((1 - C), 2);
            const dpr_adv = (CA * D) + (HA * (D + B));
            
            // --- Disadvantage ---
            let HD = Math.pow(((21 - (M - A)) / 20), 2);
            HD = Math.max(0.0025, Math.min(0.9975, HD));
            const CD = Math.pow(C, 2);
            const dpr_disadv = (CD * D) + (HD * (D + B));
            
            actions.push({ name: weapon.name, dpr_normal, dpr_adv, dpr_disadv });
            hasLogged = true; // Only log first weapon
        });
        
        // --- 2. SPELL ATTACKS & SAVES ---
        const spells = (pc.items || []).filter(item => item.type === 'spell' && item.system.damage?.parts?.length > 0 && item.system.damage.parts[0][0]);
        spells.forEach(spell => {
            const spellAbility = pc.system.attributes.spellcasting || 'int';
            const spellMod = pc.system.abilities[spellAbility]?.mod || 0;
            
            let D = 0; // Average dice damage for the spell
            (spell.system.damage?.parts || []).forEach(part => {
                 const formula = part[0] || '';
                 if (formula.includes('d')) {
                    const [numDice, diceType] = formula.split('d').map(Number);
                    if (this.DIE_AVERAGES[diceType]) {
                        D += numDice * this.DIE_AVERAGES[diceType];
                    }
                }
            });

            // Handle special case: Sorcerous Burst
            if (spell.name === "Sorcerous Burst") {
                const explosionChance = 1 / 8;
                D += (explosionChance * this.DIE_AVERAGES[8]) * spellMod; // Add avg extra damage
            }

            if (D > 0) {
                let dpr_normal = 0, dpr_adv = 0, dpr_disadv = 0;
                // Saving Throw Spells
                if (spell.system.save?.ability) {
                    const spellDC = 8 + profBonus + spellMod;
                    const targetSaveBonus = targetSaves[spell.system.save.ability] || 0;
                    const chanceToFail = (spellDC - targetSaveBonus - 1) / 20;
                    dpr_normal = Math.max(0.05, Math.min(0.95, chanceToFail)) * D;
                    //Adv/Disadv on saves is less common to calculate generically, so we use normal for all three
                    dpr_adv = dpr_normal;
                    dpr_disadv = dpr_normal;

                } 
                // Spell Attack Spells
                else {
                    const A = spellMod + profBonus;
                    const M = targetAC;
                    const B = 0; // Spells rarely add ability mod to damage unless specified
                    const C = 0.05;

                    let H = 1 - ((M - A) / 20);
                    H = Math.max(0.05, Math.min(0.95, H));
                    dpr_normal = (C * D) + (H * (D + B));

                    let HA = 1 - Math.pow(((M - A) / 20), 2);
                    HA = Math.max(0.0025, Math.min(0.9975, HA));
                    const CA = 1 - Math.pow((1 - C), 2);
                    dpr_adv = (CA * D) + (HA * (D + B));
                    
                    let HD = Math.pow(((21 - (M - A)) / 20), 2);
                    HD = Math.max(0.0025, Math.min(0.9975, HD));
                    const CD = Math.pow(C, 2);
                    dpr_disadv = (CD * D) + (HD * (D + B));
                }
                 actions.push({ name: spell.name, dpr_normal, dpr_adv, dpr_disadv });
            }
        });
        
        return { actions };
    }
};