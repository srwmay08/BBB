const DNDCalculations = {
    DIE_AVERAGES: { 4: 2.5, 6: 3.5, 8: 4.5, 10: 5.5, 12: 6.5 },

    calculateCharacterDPR(pc, targetAC, targetSaves) {
        const actions = [];
        if (!pc.system) return { actions };

        const profBonus = Math.floor(((pc.system.details?.level || 1) - 1) / 4) + 2;
        let hasLogged = false; // Flag to ensure we only log once per character calculation

        // --- 1. WEAPON ATTACKS ---
        const weapons = (pc.items || []).filter(item => item.type === 'weapon' && item.system?.equipped);
        weapons.forEach(weapon => {
            const weaponSystem = weapon.system;
            if (!weaponSystem?.damage) return;

            const log = (...args) => {
                if (!hasLogged) {
                    console.log(...args);
                }
            };
            
            log(`\n--- START DPR CALCULATION FOR ${pc.name}: ${weapon.name} ---`);

            const abilityKey = (weaponSystem.properties?.fin && pc.system.abilities.dex.mod > pc.system.abilities.str.mod) ? 'dex' : (weaponSystem.ability || 'str');
            const abilityMod = pc.system.abilities[abilityKey]?.mod || 0;
            log(`[1] Ability Modifier (${abilityKey.toUpperCase()}):`, abilityMod);

            const pcProficiencies = pc.system.traits?.weaponProf?.value || [];
            const weaponBase = weaponSystem.type?.baseItem;
            const isProficient = pcProficiencies.includes(weaponBase) || pcProficiencies.includes(weaponSystem.type?.value?.slice(0, 3));
            log(`[2] Is Proficient?`, isProficient);

            const A = abilityMod + (isProficient ? profBonus : 0);
            log(`[3] Attack Bonus (A): ${abilityMod} + ${isProficient ? profBonus : 0} =`, A);

            let totalDiceAverage = 0;
            const damageBase = weaponSystem.damage.base;
            if (damageBase && damageBase.denomination) {
                totalDiceAverage += (damageBase.number || 1) * (this.DIE_AVERAGES[damageBase.denomination] || 0);
            }
            const D = totalDiceAverage;
            log(`[4] Average Dice Damage (D):`, D);
            
            const B = abilityMod;
            log(`[5] Bonus Damage (B):`, B);

            const M = targetAC;
            log(`[6] Target AC (M):`, M);

            const C_base = 0.05; // Base crit chance on a 20
            
            // --- Normal Attack ---
            log("\n-- Normal Attack Calculation --");
            let H = 1 - ((M - A) / 20);
            H = Math.max(0.05, Math.min(0.95, H)); // Clamp for nat 1/20
            log(`H = 1 - ((${M} - ${A}) / 20) =`, H);
            const dpr_normal = (C_base * D) + (H * (D + B));
            log(`DPR = (${C_base} * ${D.toFixed(2)}) + (${H.toFixed(2)} * (${D.toFixed(2)} + ${B})) =`, dpr_normal.toFixed(2));

            // --- Advantage Attack ---
            log("\n-- Advantage Attack Calculation --");
            let HA = 1 - Math.pow(((M - A) / 20), 2);
            HA = Math.max(0.0025, Math.min(0.9975, HA));
             log(`HA = 1 - ((${M} - ${A}) / 20)^2 =`, HA);
            const CA = 1 - Math.pow((1 - C_base), 2);
            log(`CA = 1 - (1 - ${C_base})^2 =`, CA);
            const dpr_adv = (CA * D) + (HA * (D + B));
            log(`DPRA = (${CA.toFixed(4)} * ${D.toFixed(2)}) + (${HA.toFixed(4)} * (${D.toFixed(2)} + ${B})) =`, dpr_adv.toFixed(2));

            // --- Disadvantage Attack ---
            log("\n-- Disadvantage Attack Calculation --");
            let HD = Math.pow(((21 - (M - A)) / 20), 2);
            HD = Math.max(0.0025, Math.min(0.9975, HD));
            log(`HD = ((21 - (${M} - ${A})) / 20)^2 =`, HD);
            const CD = Math.pow(C_base, 2);
            log(`CD = ${C_base}^2 =`, CD);
            const dpr_disadv = (CD * D) + (HD * (D + B));
            log(`DPRD = (${CD.toFixed(4)} * ${D.toFixed(2)}) + (${HD.toFixed(4)} * (${D.toFixed(2)} + ${B})) =`, dpr_disadv.toFixed(2));
            log(`--- END DPR CALCULATION FOR ${weapon.name} ---`);
            
            actions.push({
                name: weapon.name,
                dpr_normal,
                dpr_adv,
                dpr_disadv
            });
            hasLogged = true; // Set flag so we only log the first weapon in detail
        });

        return { actions };
    }
};