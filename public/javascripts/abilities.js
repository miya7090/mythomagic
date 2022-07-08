const ABILITY_MAP = {
    "Athena":[ability_athena,0], // 0 = ally friendly, 1 = attacks enemy, 2 = all valid, 3 = no target provided
    "Apollo":[ability_apollo,1], "Achilles":[ability_achilles,1],
    "Medea":[ability_medea,1], "Poseidon":undefined,
    "Thanatos":[ability_thanatos,1], "Hestia":[ability_hestia,0],
    "Kronos":[ability_kronos,1], "Perseus":[ability_perseus,1],
    "Hera":[ability_hera,0], "Hermes":[ability_hermes,2],
    "Heracles":[ability_heracles,1], "Hades":[ability_hades,2],
    "Hecate":[ability_hecate,1], "Icarus":[ability_icarus,3],
    "Orpheus":[ability_orpheus,3], "Echo":[ability_echo,3],
    "Themis":[ability_themis,2], "Artemis":[ability_artemis,1],
    "Atalanta":[ability_atalanta,1], "Gaea":[ability_gaea,0],
    "Jason":[ability_jason,3], "Hephaestus":[ability_hephaestus,2],
    "Eros":[ability_eros,1], "Aphrodite":[ability_aphrodite,0],
    "Nyx":[ability_nyx,1]};

const ULT_MAP = {
    "Athena":[ult_athena,1],
    "Apollo":[ult_apollo,3], "Achilles":[ult_achilles,3],
    "Medea":[ult_medea,0], "Poseidon":[ult_poseidon,1],
    "Thanatos":[ult_thanatos,3], "Hestia":[ult_hestia,0],
    "Kronos":[ult_kronos,3], "Perseus":[ult_perseus,3],
    "Hera":[ult_hera,1], "Hermes":[ult_hermes,0],
    "Heracles":[ult_heracles,3], "Hades":[ult_hades,3],
    "Hecate":[ult_hecate,3], "Icarus":[ult_icarus,3],
    "Orpheus":[ult_orpheus,3], "Echo":[ult_echo,1],
    "Themis":[ult_themis,3], "Artemis":[ult_artemis,1],
    "Atalanta":[ult_atalanta,2], "Gaea":[ult_gaea,3],
    "Jason":[ult_jason,3], "Hephaestus":[ult_hephaestus,1],
    "Eros":[ult_eros,3], "Aphrodite":[ult_aphrodite,0],
    "Nyx":[ult_nyx,1]};

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

function ult_nyx(attacker, target) {
    broadcastMsg("ultimate", true, "Nyx", target.cardName);
    target.giveBlessing("Nyx");
}

function ability_nyx(attacker, target) {
    broadcastMsg("ability", true, "Nyx", target.cardName);
    target.addToCMPT(-20);
}

function ult_eros(attacker, target) {
    broadcastMsg("ultimate", true, "Eros", undefined);
    ENEMY_GAMECARD_OBJS.forEach(pc => {
        if (pc.statuses["charmed"] == 1) {
            pc.current_mana = 0;
            pc.takeDamage(200);
        }
    });
}

function ability_eros(attacker, target) {
    broadcastMsg("ability", true, "Eros", target.cardName);
    target.inflictStatus("charmed");
}

function ult_aphrodite(attacker, target) {
    broadcastMsg("ultimate", true, "Aphrodite", target.cardName);
    target.clearStatuses();
    target.giveMana(400);
}

function ability_aphrodite(attacker, target) {
    broadcastMsg("ability", true, "Aphrodite", target.cardName);
    target.giveMana(200);
}

function ult_hephaestus(attacker, target) {
    broadcastMsg("ultimate", true, "Hephaestus", undefined);
    let dmg = calcDamage(attacker, target);
    target.takeDamage(1.5 * dmg);
}

function ability_hephaestus(attacker, target) {
    broadcastMsg("ability", true, "Hephaestus", target.cardName);
    if (target.p1) {
        target.inflictStatus("obscured");
    } else {
        target.inflictStatus("stunned");
    }
}

function ult_jason(attacker, target) {
    broadcastMsg("ultimate", true, "Jason", undefined);
    PLAYER_GAMECARD_OBJS.forEach(pc => {
        pc.current_defense += 1;
    });
    ENEMY_GAMECARD_OBJS.forEach(pc => {
        pc.current_defense -= 3;
    });
}

function ability_jason(attacker, target) {
    let lowestDef = undefined;
    let pcWithLowestDef = undefined;
    PLAYER_GAMECARD_OBJS.forEach(pc => {
        if (lowestDef == undefined || pc.getCurrentDefense() < lowestDef) {
            lowestDef = pc.getCurrentDefense();
            pcWithLowestDef = pc;
        }
    });

    broadcastMsg("ability", true, "Jason", pcWithLowestDef.cardName);
    pcWithLowestDef.current_defense += 2;
}

function ult_gaea(attacker, target) {
    broadcastMsg("ultimate", true, "Gaea", undefined);
    PLAYER_GAMECARD_OBJS.forEach(pc => {
        pc.heal(100);
    });
}

function ability_gaea(attacker, target) {
    broadcastMsg("ability", true, "Gaea", target.cardName);
    target.heal(200);
    target.giveMana(100);
}

function ult_atalanta(attacker, target) {
    broadcastMsg("ultimate", true, "Atalanta", target.cardName);
    target.inflictStatus("stunned");
    target.takeDamage(300);
}

function ability_atalanta(attacker, target) {
    broadcastMsg("ability", true, "Atalanta", target.cardName);
    let dmg = calcDamage(attacker, target);
    if (target.current_health == target.getMaxHealth()){
        dmg += 150;
    }
    target.takeDamage(dmg);
}

function ult_themis(attacker, target) {
    broadcastMsg("ultimate", true, "Themis", undefined);
    ENEMY_GAMECARD_OBJS.forEach(pc => {
        pc.revertToBaseStats();
    });
}

function ability_themis(attacker, target) {
    broadcastMsg("ability", true, "Themis", target.cardName);
    target.revertToBaseStats();
}

function ult_artemis(attacker, target) {
    broadcastMsg("ultimate", true, "Artemis", target.cardName);
    target.inflictStatus("stunned");
}

function ability_artemis(attacker, target) { // passive_artemis
    broadcastMsg("ability", true, "Artemis", target.cardName);
    if (target.current_health / target.getMaxHealth() > 0.75){
        target.takeDamage(300);
    } else {
        target.takeDamage(100);
    }
}

function ult_echo(attacker, target) {
    broadcastMsg("ultimate", true, "Echo", target.cardName);
    let lastQ = attacker.getQ();
    let lastR = attacker.getR();
    PLAYER_GAMECARD_OBJS.splice(PLAYER_GAMECARD_OBJS.indexOf(attacker), 1);
    let newEcho = importPC(exportPC(target), true);
    newEcho.p1 = true;
    newEcho.changeLocationTo(lastQ, lastR);
    PLAYER_GAMECARD_OBJS.push(newEcho); // attackComplete will have a rerender
}

function ability_echo(attacker, target) {
    broadcastMsg("ability", true, "Echo", undefined);
    attacker.inflictStatus("obscured");
}

function ult_orpheus(attacker, target) {
    broadcastMsg("ultimate", true, "Orpheus", undefined);
    ENEMY_GAMECARD_OBJS.forEach(pc => {
        pc.inflictStatus("distracted");
    });
}

function ability_orpheus(attacker, target) {
    let lowestHealth = undefined;
    let pcWithLowestHealth = undefined;
    PLAYER_GAMECARD_OBJS.forEach(pc => {
        if (lowestHealth == undefined || (pc.current_health < lowestHealth && pc.dead != "defeated")) {
            lowestHealth = pc.current_health;
            pcWithLowestHealth = pc;
        }
    });

    broadcastMsg("ability", true, "Orpheus", pcWithLowestHealth.cardName);
    pcWithLowestHealth.heal(200);
}

function ult_icarus(attacker, target) {
    broadcastMsg("ultimate", true, "Icarus", undefined);
    attacker.current_movement += 3;
    attacker.takeDamage(attacker.current_health / 2);
}

function ability_icarus(attacker, target) {
    broadcastMsg("ability", true, "Icarus", undefined);
    attacker.current_movement += 1;
    attacker.changeMaxHealthBy(-50);
}

function ult_hecate(attacker, target) {
    broadcastMsg("ultimate", true, "Hecate", undefined);
    PLAYER_GAMECARD_OBJS.forEach(pc => {
        pc.inflictStatus("obscured");
    });
}

function ability_hecate(attacker, target) {
    broadcastMsg("ability", true, "Hecate", target.cardName);
    target.takeDamage(200);
}

function ult_hades(attacker, target) {
    broadcastMsg("ultimate", true, "Hades", undefined);
    PLAYER_GAMECARD_OBJS.forEach(pc => {
        if (pc.dead == "defeated"){
            pc.current_attack += 300;
            autoattack(pc);
        }
    });
    ENEMY_GAMECARD_OBJS.forEach(pc => {
        if (pc.dead == "defeated"){
            pc.current_attack += 300;
            autoattack(pc);
        }
    });
}

function ability_hades(attacker, target) {
    broadcastMsg("ability", true, "Hades", target.cardName);
    if (target.dead == "defeated"){
        autoattack(target); // the target autoattacks
    }
}

function ability_athena(attacker, target) {
    broadcastMsg("ability", true, "Athena", target.cardName);
    target.current_defense += 15;
    target.clearStatuses();
}

function ability_thanatos(attacker, target) {
    broadcastMsg("ability", true, "Thanatos", target.cardName);
    let absorbAtk = target.current_attack;
    let absorbMP = target.current_mana;

    let dmg = calcDamage(attacker, target);
    target.takeDamage(dmg);
    if (target.dead == "defeated") {
        attacker.current_attack += Math.round(0.5 * absorbAtk);
        attacker.giveMana(absorbMP);
    }
}

function ult_athena(attacker, target) {
    broadcastMsg("ultimate", true, "Athena", target.cardName);
    target.takeDamage(600);
}

function ability_apollo(attacker, target) {
    broadcastMsg("ability", true, "Apollo", target.cardName);
    let dmg = calcDamage(attacker, target);
    target.takeDamage(1.1 * dmg);
}

function ability_kronos(attacker, target) {
    broadcastMsg("ability", true, "Kronos", target.cardName);
    let dmg = calcDamage(attacker, target);
    target.takeDamage(dmg);
    target.inflictStatus("stunned");
}

function ult_kronos(attacker, target) {
    //Deals 200 true damage to all Stunned enemies, and grants additional turn
    broadcastMsg("ultimate", true, "Kronos", "enemies");
    ENEMY_GAMECARD_OBJS.forEach(pc => {
        if (pc.statuses["stunned"] == 1) {
            pc.takeDamage(200);
        }
    });
    TURNS_ALLOCATED += 1;
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
    attacker.current_defense += 50;
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
    var dmg = attacker.base_attack / target.base_defense; // use base stats
    let memHB = target.health_bonus; // ignore health bonus
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
    target.current_defense += 5;
    target.heal(200);
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
    broadcastMsg("ultimate", true, "Hermes", target.cardName);
    let mult = 3;
    if (coinFlip()) {
        mult = 0.5;
    }
    target.current_attack = Math.round(mult * target.current_attack);
    target.current_normal_attack_range = Math.round(mult * target.current_normal_attack_range);
    if (target.current_normal_attack_range < 1) {target.current_normal_attack_range = 1; }
    target.current_defense = Math.round(mult * target.current_defense);
    if (target.current_defense < 1) {target.current_defense = 1; }
    target.current_mana_per_turn = Math.round(mult * target.current_mana_per_turn);
    target.current_mana_per_atk = Math.round(mult * target.current_mana_per_atk);
    target.current_movement = Math.round(mult * target.current_movement);
    if (target.current_movement < 1) {target.current_movement = 1; }
    target.setMaxHealthTo(mult * target.getMaxHealth());
    target.setMaxManaTo(mult * target.getMaxMana());
}

function ability_hermes(attacker, target) { // #TODO add more outputting of what happens in abilities, add aesthetic notifications
    broadcastMsg("ability", true, "Hermes", target.cardName);
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