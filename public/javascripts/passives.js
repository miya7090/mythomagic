// contains functions for some (but not all) passives

// passive_heracles in models.js
// passive_hera part 1 in models.js, part 2 in listeners.js

function getAllyCard(cardName) {
    let AC = PLAYER_GAMECARD_OBJS.find(e => e.cardName == cardName);
    if (AC != undefined && AC.dead != "defeated") { return AC; }
    else { return undefined; }
}
function getEnemyCard(cardName) {
    let EC = ENEMY_GAMECARD_OBJS.find(e => e.cardName == cardName);
    if (EC != undefined && EC.dead != "defeated") { return EC; }
    else { return undefined; }
}
function hasAllyCard(cardName) { return getAllyCard(cardName) != undefined; }
function hasEnemyCard(cardName) { return getEnemyCard(cardName) != undefined; }

function passive_athena(){ // run by both players at the beginning of the game
    if (hasAllyCard("Athena")) {
        broadcastMsg("passive", true, "Athena", "allies");
        PLAYER_GAMECARD_OBJS.forEach(pc => {
            pc.giveMana(200);
        });
    }
}

function passive_hera_part2() { // run by both players at the beginning of the game
    if (hasAllyCard("Hera")) {
        broadcastMsg("passive", true, "Hera", "allies");
        PLAYER_GAMECARD_OBJS.forEach(pc => {
            pc.heal(100 * countCardsMatching(PLAYER_GAMECARD_OBJS, OLYMPIAN_LIST));
        });
    }
}

function passive_apollo(){ // run by player1 at the end of the turn
    if (hasAllyCard("Apollo")) {
        broadcastMsg("passive", true, "Apollo", "targets");
        PLAYER_GAMECARD_OBJS.forEach(pc => {
            pc.heal(10);
        });
        ENEMY_GAMECARD_OBJS.forEach(pc => {
            pc.takeDamage(10);
        });
    }
}

function passive_achilles_onAlly(){ // run when ally card is defeated
    let mc = getAllyCard("Achilles");
    if (mc != undefined) {
        broadcastMsg("passive", true, "Achilles", undefined);
        mc.clearStatuses();
        mc.current_attack += 1000;
    }
}

function passive_achilles_onEnemy(){ // run when enemy card is defeated
    let mc = getEnemyCard("Achilles");
    if (mc != undefined) {
        broadcastMsg("passive", false, "Achilles", undefined);
        mc.clearStatuses();
        mc.current_attack += 1000;
    }
}


function passive_medea_onAlly(target){ // run when ally has inflicted status
    if (hasAllyCard("Medea") && target.statusesAreClear() == false) {
        broadcastMsg("passive", true, "Medea", target.cardName);
        target.clearStatuses();
    }
}

function passive_medea_onEnemy(target){ // run when enemy has inflicted status
    if (hasEnemyCard("Medea") && target.statusesAreClear() == false) {
        broadcastMsg("passive", false, "Medea", target.cardName);
        target.clearStatuses();
    }
}

function passive_thanatos_onAlly(target){ // run when ally loses >50% of HP at once
    if (hasEnemyCard("Thanatos")) {
        broadcastMsg("passive", false, "Thanatos", target.cardName);
        target.inflictStatus("terrified");
    }
}

function passive_thanatos_onEnemy(target){ // run when enemy loses >50% of HP at once
    if (hasAllyCard("Thanatos")) {
        broadcastMsg("passive", true, "Thanatos", target.cardName);
        target.inflictStatus("terrified");
    }
}

function passive_hestia(notif) { // run by player1 at the beginning of the turn
    if (hasAllyCard("Hestia")) {
        if (notif) { broadcastMsg("passive", true, "Hestia"); }
        let mc = getAllyCard("Hestia");
        PLAYER_GAMECARD_OBJS.forEach(pc => {
            if (getTileDistance(mc.getQ(),mc.getR(),mc.getS(),pc.getQ(),pc.getR(),pc.getS()) == 1) {
                pc.giveBlessing("Hestia");
            } else {
                pc.removeBlessing("Hestia");
            }
        });
    }
    if (hasEnemyCard("Hestia")) {
        if (notif) { broadcastMsg("passive", false, "Hestia"); }
        let yc = getEnemyCard("Hestia");
        ENEMY_GAMECARD_OBJS.forEach(pc => {
            if (getTileDistance(yc.getQ(),yc.getR(),yc.getS(),pc.getQ(),pc.getR(),pc.getS()) == 1) {
                pc.giveBlessing("Hestia");
            } else {
                pc.removeBlessing("Hestia");
            }
        });
    }
}

function passive_hermes() { // run by player1 at the beginning of the turn // #TODO combine blessing format with hestia's
    if (hasAllyCard("Hermes")) {
        broadcastMsg("passive", true, "Hermes");
        let mc = getAllyCard("Hermes");
        PLAYER_GAMECARD_OBJS.forEach(pc => {
            if (getTileDistance(mc.getQ(),mc.getR(),mc.getS(),pc.getQ(),pc.getR(),pc.getS()) == 1) {
                pc.giveBlessing("Hermes");
            } else {
                pc.removeBlessing("Hermes");
            }
        });
    }
    if (hasEnemyCard("Hermes")) {
        broadcastMsg("passive", false, "Hermes");
        let yc = getEnemyCard("Hermes");
        ENEMY_GAMECARD_OBJS.forEach(pc => {
            if (getTileDistance(yc.getQ(),yc.getR(),yc.getS(),pc.getQ(),pc.getR(),pc.getS()) == 1) {
                pc.giveBlessing("Hermes");
            } else {
                pc.removeBlessing("Hermes");
            }
        });
    }
}

function blessing_hermes(give, pc) {
    if (give) {
        pc.current_movement += 2;
    } else {
        pc.current_movement -= 2;
    }
}

function blessing_hestia(give, pc) {
    if (give) {
        pc.current_defense += 10;
        pc.changeMaxHealthBy(200);
    } else {
        pc.current_defense -= 10;
        pc.changeMaxHealthBy(-200);
    }
}

function passive_kronos(){ // run by player1 at the end of the turn
    if (hasAllyCard("Kronos")) {
        broadcastMsg("passive", true, "Kronos", undefined);
        let mc = getAllyCard("Kronos");
        mc.current_attack += 50;
        mc.current_defense += 1;
    }
}

function passive_perseus_onAlly(){ // ally card was defeated
    let mc = getEnemyCard("Perseus");
    if (getEnemyCard("Perseus")) {
        broadcastMsg("passive", false, "Perseus", undefined);
        mc.inflictStatus["obscured"];
        mc.current_movement += 2;
    }
}

function passive_perseus_onEnemy(){ // enemy card was defeated
    let mc = getAllyCard("Perseus");
    if (hasAllyCard("Perseus")) {
        broadcastMsg("passive", true, "Perseus", undefined);
        mc.inflictStatus["obscured"];
        mc.current_movement += 2;
    }
}
