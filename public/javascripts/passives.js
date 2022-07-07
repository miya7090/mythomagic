// contains functions for some (but not all) passives

// passive_heracles in models.js
// passive_hades in models.js
// passive_hera in models.js
// passive_jason in models.js
// passive_icarus in models.js
// passive_themis in models.js
// passive_artemis in abilities.js

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

function passive_echo(attacker, target, dmg){
    if (target.cardName == "Echo"){
        if (dmg > 0){
            broadcastMsg("passive", true, "Echo", attacker.cardName);
            attacker.takeDamage(dmg);
        }
    }
}

function passive_gaea(target) {
    if (target.cardName == "Gaea") {
        if (target.p1) {
            broadcastMsg("passive", true, "Gaea", undefined);
            PLAYER_GAMECARD_OBJS.forEach(pc => {
                pc.heal(100);
            });
        } else {
            broadcastMsg("passive", false, "Gaea", undefined);
            ENEMY_GAMECARD_OBJS.forEach(pc => {
                pc.heal(100);
            });
        }
    }
}

function passive_atalanta(attacker, target){
    if (attacker.cardName == "Atalanta" && (target.current_movement < attacker.current_movement)){
        broadcastMsg("passive", true, "Atalanta", attacker.cardName);
        return 100;
    }
    return 0;
}

function passive_orpheus(p1, targetName){
    let mc = getAllyCard("Orpheus");
    if (p1 && mc != undefined){
        if (mc.current_health == mc.getMaxHealth() && mc.current_mana == mc.getMaxMana()){
            broadcastMsg("passive", true, "Orpheus", targetName);
            return true;
        }
    }
    let ec = getEnemyCard("Orpheus");
    if (!p1 && ec != undefined){
        if (ec.current_health == ec.getMaxHealth() && ec.current_mana == ec.getMaxMana()){
            broadcastMsg("passive", false, "Orpheus", targetName);
            return true;
        }
    }
    return false;
}

function passive_hecate(p1){ // #TODO add notification
    if (p1 && hasAllyCard("Hecate")){
        return 30;
    }
    if (!p1 && hasEnemyCard("Hecate")){
        return 30;
    }
    return 0;
}

function passive_athena(){ // run by both players at the beginning of the game
    if (hasAllyCard("Athena")) {
        broadcastMsg("passive", true, "Athena", "allies");
        PLAYER_GAMECARD_OBJS.forEach(pc => {
            pc.giveMana(200);
        });
    }
}

function passive_apollo(){ // run by player1 at the end of the turn
    if (hasAllyCard("Apollo")) {
        broadcastMsg("passive", true, "Apollo", "targets");
        PLAYER_GAMECARD_OBJS.forEach(pc => {
            pc.heal(20);
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

function passive_hestia(notif, suppressNotif) { // run by player1 at the beginning of the turn
    if (hasAllyCard("Hestia")) {
        let mc = getAllyCard("Hestia");
        let numberBlessed = 0;
        PLAYER_GAMECARD_OBJS.forEach(pc => {
            if (getTileDistance(mc.getQ(),mc.getR(),mc.getS(),pc.getQ(),pc.getR(),pc.getS()) == 1) {
                pc.giveBlessing("Hestia");
                numberBlessed += 1;
            } else {
                pc.removeBlessing("Hestia");
            }
        });
        if (!suppressNotif && notif && numberBlessed > 0) { broadcastMsg("passive", true, "Hestia"); }
    }
    if (hasEnemyCard("Hestia")) {
        let yc = getEnemyCard("Hestia");
        let numberBlessed = 0;
        ENEMY_GAMECARD_OBJS.forEach(pc => {
            if (getTileDistance(yc.getQ(),yc.getR(),yc.getS(),pc.getQ(),pc.getR(),pc.getS()) == 1) {
                pc.giveBlessing("Hestia");
                numberBlessed += 1;
            } else {
                pc.removeBlessing("Hestia");
            }
        });
        if (!suppressNotif && notif && numberBlessed > 0) { broadcastMsg("passive", false, "Hestia"); }
    }
}

function passive_hermes(suppressNotif) { // run by player1 at the beginning of the turn // #TODO combine blessing format with hestia's
    if (hasAllyCard("Hermes")) {
        let mc = getAllyCard("Hermes");
        let numberBlessed = 0;
        PLAYER_GAMECARD_OBJS.forEach(pc => {
            if (getTileDistance(mc.getQ(),mc.getR(),mc.getS(),pc.getQ(),pc.getR(),pc.getS()) == 1) {
                pc.giveBlessing("Hermes");
                numberBlessed += 1;
            } else {
                pc.removeBlessing("Hermes");
            }
        });
        if (!suppressNotif && numberBlessed > 0) { broadcastMsg("passive", true, "Hermes"); }
    }
    if (hasEnemyCard("Hermes")) {
        let yc = getEnemyCard("Hermes");
        let numberBlessed = 0;
        ENEMY_GAMECARD_OBJS.forEach(pc => {
            if (getTileDistance(yc.getQ(),yc.getR(),yc.getS(),pc.getQ(),pc.getR(),pc.getS()) == 1) {
                pc.giveBlessing("Hermes");
                numberBlessed += 1;
            } else {
                pc.removeBlessing("Hermes");
            }
        });
        if (!suppressNotif && numberBlessed > 0) { broadcastMsg("passive", false, "Hermes"); } // #TODO debug dupe
    }
}

function clearBestowedBlessingsFrom(cardName, p1){
    let objList = PLAYER_GAMECARD_OBJS;
    if (!p1) { objList = ENEMY_GAMECARD_OBJS; }

    if (cardName == "Hestia" || cardName == "Hermes"){
        objList.forEach(pc => {
            pc.removeBlessing(cardName);
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
        mc.inflictStatus("obscured");
        mc.current_movement += 1;
    }
}

function passive_perseus_onEnemy(){ // enemy card was defeated
    let mc = getAllyCard("Perseus");
    if (hasAllyCard("Perseus")) {
        broadcastMsg("passive", true, "Perseus", undefined);
        mc.inflictStatus("obscured");
        mc.current_movement += 2;
    }
}
