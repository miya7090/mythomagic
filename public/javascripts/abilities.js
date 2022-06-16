const ABILITY_MAP = {
    "Athena":[ability_athena,0], // 0 = ally friendly, 1 = attacks enemy, 2 = all valid, 3 = no target provided
    "Apollo":[ability_apollo,1], "Achilles":[ability_achilles,1],
    "Medea":[ability_medea,1], "Poseidon":undefined,
    "Thanatos":undefined, "Hestia":[ability_hestia,0],
    "Kronos":undefined, "Perseus":[ability_perseus,1],
    "Hera":[ability_hera,0], "Hermes":[ability_hermes,2],
    "Heracles":[ability_heracles,1]};

const ULT_MAP = {
    "Athena":[ult_athena,1],
    "Apollo":[ult_apollo,3], "Achilles":[ult_achilles,3],
    "Medea":[ult_medea,0], "Poseidon":[ult_poseidon,1],
    "Thanatos":[ult_thanatos,3], "Hestia":[ult_hestia,0],
    "Kronos":undefined, "Perseus":[ult_perseus,3],
    "Hera":[ult_hera,1], "Hermes":[ult_hermes,3],
    "Heracles":[ult_heracles,3]};

function doUniqueSkill(atkType, attacker, target, targetIsOpponent) { // atkType 1=ability, 2=ultimate
    let map = ABILITY_MAP;
    if (atkType == 2) { map = ULT_MAP; } // #TODO rewrite this and similar with ternary

    if (map[attacker.cardName] != undefined){
        if (targetIsOpponent && map[attacker.cardName][1] == 0) {
            console.error("invalid target: target must be an ally");
        } else if (!targetIsOpponent && map[attacker.cardName][1] == 1) {
            console.error("invalid target: target must be an opponent");
        } else {
            let skillFunc = map[attacker.cardName][0]; // do action
            skillFunc(attacker, target);
            return map[attacker.cardName][1]; // return how to highlight the tile
        }
    } else {
        console.error("action not defined yet");
    }
}

function ability_athena(attacker, target) {
    broadcastMsg("ability", true, "Athena", target.cardName);
    target.current_defense += 10;
    target.clearStatuses();
}

function ult_athena(attacker, target) {
    broadcastMsg("ultimate", true, "Athena", target.cardName);
    target.takeDamage(700);
}

function ability_apollo(attacker, target) {
    broadcastMsg("ability", true, "Apollo", target.cardName);
    let dmg = calcDamage(attacker, target);
    target.takeDamage(1.1 * dmg);
}

function ult_apollo(attacker, target) {
    broadcastMsg("ultimate", true, "Apollo", "allies");
    PLAYER_GAMECARD_OBJS.forEach(pc => {
        pc.clearStatuses();
        pc.giveMana(0.2 * pc.getMaxMana());
        pc.heal(0.2 * pc.getMaxHealth());
    });
}

function ability_achilles(attacker, target) {
    broadcastMsg("ability", true, "Achilles", target.cardName);
    attacker.clearStatuses();
    let dmg = calcDamage(attacker, target);
    target.takeDamage(1.2 * dmg);
}

function ult_achilles(attacker, target) {
    broadcastMsg("ultimate", true, "Achilles", undefined);
    attacker.current_health = 1;
    attacker.current_defense += 40;
}

function ability_medea(attacker, target) {
    broadcastMsg("ability", true, "Medea", target.cardName);
    target.current_mana = 0;
    target.inflictStatus("poisoned");
}

function ult_medea(attacker, target) {
    broadcastMsg("ultimate", true, "Medea", target.cardName);
    if (target.cardName != "Medea"){
        attacker.fullHeal();
        target.takeDamage(target.current_health);
        attacker.current_attack += target.current_attack;
        attacker.current_defense += target.current_defense;
        attacker.current_movement += target.current_movement;
    } else {
        console.error("medea cannot apply ult to self");
    }
}

function ult_poseidon(attacker, target) {
    broadcastMsg("ultimate", true, "Poseidon", target.cardName);
    target.takeDamage(300);
}

function ult_thanatos(attacker, target) {
    broadcastMsg("ultimate", true, "Thanatos", "enemies");
    ENEMY_GAMECARD_OBJS.forEach(pc => {
        if (pc.current_health < 100) {
            pc.takeDamage(100);
        }
    });
}

function ability_hestia(attacker, target) {
    broadcastMsg("ability", true, "Hestia", target.cardName);
    target.heal(300);
}

function ult_hestia(attacker, target) {
    broadcastMsg("ultimate", true, "Hestia", target.cardName);
    target.health_bonus += 200;
    target.heal(300);
}

function ability_perseus(attacker, target) {
    broadcastMsg("ability", true, "Perseus", target.cardName);
    var effectiveAttack = attacker.current_attack;
    var effectiveDefense = target.base_defense;
    if (target.statuses["distracted" == 1]) { effectiveDefense -= (0.1 * target.current_defense); }
    if (target.statuses["charmed" == 1]) { effectiveDefense = 1; }
    if (effectiveAttack < 0) { effectiveAttack = 0; }
    if (effectiveDefense < 1) { effectiveDefense = 1; }
    let dmg = effectiveAttack / effectiveDefense;
    
    let memHB = target.health_bonus;
    target.health_bonus = 0;
    target.takeDamage(dmg);
    if (target.dead != "defeated") {
        target.health_bonus = memHB;
    }
}

function ult_perseus(attacker, target) {
    broadcastMsg("ultimate", true, "Perseus", undefined);
    attacker.current_attack += Math.round(0.2 * attacker.current_attack);
    attacker.current_defense += Math.round(0.2 * attacker.current_defense);
    attacker.current_movement += 1;
}

function ability_hera(attacker, target) {
    broadcastMsg("ability", true, "Hera", target.cardName);
    target.current_defense += 10;
    target.heal(100);
    target.giveMana(100);
}

function ult_hera(attacker, target) {
    broadcastMsg("ultimate", true, "Hera", target.cardName);
    target.setMaxHealthTo(100);
}

function ability_heracles(attacker, target) {
    broadcastMsg("ability", true, "Heracles", target.cardName);
    let dmg = calcDamage(attacker, target);
    target.takeDamage(1.5 * dmg);
}

function ult_heracles(attacker, target) {
    broadcastMsg("ultimate", true, "Heracles", target.cardName);
    target.current_defense *= 2;
}

function ult_hermes(attacker, target) {
    const randomPC = PLAYER_GAMECARD_OBJS[Math.floor(Math.random() * PLAYER_GAMECARD_OBJS.length)];
    broadcastMsg("ultimate", true, "Hermes", randomPC.cardName);
    let mult = 3;
    if (coinFlip()) {
        mult = 0.5;
    }
    randomPC.current_attack = Math.round(mult * randomPC.current_attack);
    randomPC.current_normal_attack_range = Math.round(mult * randomPC.current_normal_attack_range);
    if (randomPC.current_normal_attack_range < 1) {randomPC.current_normal_attack_range = 1; }
    randomPC.current_defense = Math.round(mult * randomPC.current_defense);
    if (randomPC.current_defense < 1) {randomPC.current_defense = 1; }
    randomPC.current_mana_per_turn = Math.round(mult * randomPC.current_mana_per_turn);
    randomPC.current_mana_per_atk = Math.round(mult * randomPC.current_mana_per_atk);
    randomPC.current_movement = Math.round(mult * randomPC.current_movement);
    if (randomPC.current_movement < 1) {randomPC.current_movement = 1; }
    randomPC.setMaxHealthTo(mult * randomPC.getMaxHealth());
    randomPC.setMaxManaTo(mult * randomPC.getMaxMana());
}

function ability_hermes(attacker, target) { // #TODO add more outputting of what happens in abilities, add aesthetic notifications
    broadcastMsg("ultimate", true, "Hermes", target.cardName);
    if (attacker.current_attack < target.current_attack && coinFlip()) {
        let ACA = attacker.current_attack;
        attacker.current_attack = target.current_attack;
        target.current_attack = ACA;
    }
    if (attacker.current_normal_attack_range < target.current_normal_attack_range && coinFlip()) {
        let ACNAR = attacker.current_normal_attack_range;
        attacker.current_normal_attack_range = target.current_normal_attack_range;
        target.current_normal_attack_range = ACNAR;
    }
    if (attacker.current_defense < target.current_defense && coinFlip()) {
        let ACD = attacker.current_defense;
        attacker.current_defense = target.current_defense;
        target.current_defense = ACD;
    }
    if (attacker.current_mana_per_turn < target.current_mana_per_turn && coinFlip()) {
        let ACMPT = attacker.current_mana_per_turn;
        attacker.current_mana_per_turn = target.current_mana_per_turn;
        target.current_mana_per_turn = ACMPT;
    }
    if (attacker.current_mana_per_atk < target.current_mana_per_atk && coinFlip()) {
        let ACMPA = attacker.current_mana_per_atk;
        attacker.current_mana_per_atk = target.current_mana_per_atk;
        target.current_mana_per_atk = ACMPA;
    }
    if (attacker.current_movement < target.current_movement && coinFlip()) {
        let ACM = attacker.current_movement;
        attacker.current_movement = target.current_movement;
        target.current_movement = ACM;
    }
    if (attacker.getMaxHealth() < target.getMaxHealth() && coinFlip()) {
        let AMH = attacker.getMaxHealth();
        attacker.setMaxHealthTo(target.getMaxHealth());
        target.setMaxHealthTo(AMH);
    }
    if (attacker.getMaxMana() < target.getMaxMana && coinFlip()) {
        let AMM = attacker.getMaxMana();
        attacker.setMaxManaTo(target.getMaxMana());
        target.setMaxManaTo(AMM);
    }
}