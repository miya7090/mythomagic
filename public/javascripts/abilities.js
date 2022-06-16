const ABILITY_MAP = {
    "Athena":[ability_athena,0], // 0 = ally friendly, 1 = attacks enemy, 2 = all valid, 3= no target provided
    "Apollo":undefined, "Achilles":[ability_achilles,1],
    "Medea":[ability_medea,1], "Poseidon":undefined,
    "Thanatos":undefined, "Hestia":undefined,
    "Kronos":undefined, "Perseus":undefined,
    "Hera":undefined, "Hermes":undefined,
    "Heracles":undefined};

const ULT_MAP = {
    "Athena":[ult_athena,1],
    "Apollo":[ult_apollo,3], "Achilles":[ult_achilles,3],
    "Medea":[ult_medea,0], "Poseidon":undefined,
    "Thanatos":undefined, "Hestia":undefined,
    "Kronos":undefined, "Perseus":undefined,
    "Hera":undefined, "Hermes":undefined,
    "Heracles":undefined};

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
    }
    re
}

function ability_athena(attacker, target) {
    target.current_defense += 10;
    target.clearStatuses();
}

function ult_athena(attacker, target) {
    target.takeDamage(700);
}

function ult_apollo(attacker, target) {
    PLAYER_GAMECARD_OBJS.forEach(pc => {
        pc.clearStatuses();
        pc.giveMana(0.2 * pc.getMaxMana());
        pc.heal(0.2 * pc.getMaxHealth());
    });
}

function ability_achilles(attacker, target) {
    attacker.clearStatuses();
    let dmg = calcDamage(attacker, target);
    target.takeDamage(1.2 * dmg);
}

function ult_achilles(attacker, target) {
    attacker.current_health = 1;
    attacker.current_defense += 40;
}

function ability_medea(attacker, target) {
    target.current_mana = 0;
}

function ult_medea(attacker, target) {
    attacker.heal()
    target.takeDamage(target.current_health);
    attacker.current_attack += target.current_attack;
    attacker.current_defense += target.current_defense;
    attacker.current_movement += target.current_movement;
}