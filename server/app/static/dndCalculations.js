const DNDCalculations = {
    // A mapping of dice types to their average roll value, as per your document.
    DIE_AVERAGES: { 4: 2.5, 6: 3.5, 8: 4.5, 10: 5.5, 12: 6.5 },

    /**
     * Calculates the primary DPR for a character against a given target AC.
     * @param {object} pc - The character object from the database.
     * @param {number} targetAC - The AC of the target.
     * @returns {object} An object containing the calculated DPR and a breakdown.
     */
    calculateCharacterDPR(pc, targetAC) {
        // Find the first equipped weapon to use for the calculation.
        // NOTE: This is a simplification. A real implementation would handle multi-weapon, multi-attack, etc.
        const weapon = (pc.items || []).find(item => item.type === 'weapon' && item.system?.equipped);
        if (!weapon) {
            return { totalDpr: 0, breakdown: "No equipped weapon found." };
        }

        const profBonus = Math.floor(((pc.system?.details?.level || 1) - 1) / 4) + 2;
        
        // Determine attack ability (STR or DEX for finesse)
        const abilityKey = (weapon.system?.properties?.fin && pc.system.abilities.dex.mod > pc.system.abilities.str.mod) ? 'dex' : (weapon.system.ability || 'str');
        const abilityMod = pc.system.abilities[abilityKey]?.mod || 0;

        // A (Attack Bonus)
        const attackBonus = abilityMod + profBonus;

        // C (Critical Hit Chance) - Assuming a normal 5% chance (nat 20)
        const critChance = 0.05;

        // H (Hit Chance)
        // Formula: 1 - ((M - A) / 20)
        let hitChance = (21 - (targetAC - attackBonus)) / 20;
        hitChance = Math.max(0.05, Math.min(0.95, hitChance)); // Clamp between 5% and 95%

        // D (Base Damage from Dice) & B (Bonus Static Damage)
        let totalDiceAverage = 0;
        let bonusDamage = abilityMod; // Start with the ability modifier
        
        const damageParts = weapon.system.damage?.parts || [];
        damageParts.forEach(part => {
            const formula = part[0]; // e.g., "1d8" or "2d6"
            const damageType = part[1]; // e.g., "slashing"
            
            if (formula.includes('d')) {
                const [numDice, diceType] = formula.split('d').map(Number);
                if (this.DIE_AVERAGES[diceType]) {
                    totalDiceAverage += numDice * this.DIE_AVERAGES[diceType];
                }
            } else if (!isNaN(parseInt(formula))) {
                // If a part is just a number, treat it as a static bonus
                bonusDamage += parseInt(formula);
            }
        });

        // The final DPR calculation from your document: DPR = C*D + H*(D+B)
        const dpr = (critChance * totalDiceAverage) + (hitChance * (totalDiceAverage + bonusDamage));

        return {
            totalDpr: dpr,
            breakdown: `${weapon.name}: +${attackBonus} to hit, Hit%: ${(hitChance * 100).toFixed(0)}%, Avg Dmg: ${(totalDiceAverage + bonusDamage).toFixed(1)}`
        };
    }
};