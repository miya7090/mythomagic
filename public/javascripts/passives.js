// contains functions for some (but not all) passives

function getAllyCard(cardName) { return PLAYER_GAMECARD_OBJS.find(e => e.cardName == cardName); }
function getEnemyCard(cardName) { return ENEMY_GAMECARD_OBJS.find(e => e.cardName == cardName); }
function hasAllyCard(cardName) { return getAllyCard(cardName) != undefined; }
function getEnemyCard(cardName) { return getEnemyCard(cardName) != undefined; }

function passive_athena(){ // run by both players at the beginning of the game
    if (hasAllyCard("Athena")) {
        PLAYER_GAMECARD_OBJS.forEach(pc => {
            pc.giveMana(200);
        });
    }
}

function passive_apollo(){ // run by player1 at the end of the turn
    if (hasAllyCard("Apollo")) {
        PLAYER_GAMECARD_OBJS.forEach(pc => {
            pc.heal(30);
        });
        ENEMY_GAMECARD_OBJS.forEach(pc => {
            pc.takeDamage(30);
        });
    }
    if (hasEnemyCard("Apollo")) {
        ENEMY_GAMECARD_OBJS.forEach(pc => {
            pc.heal(30);
        });
        PLAYER_GAMECARD_OBJS.forEach(pc => {
            pc.takeDamage(30);
        });
    }
}

function passive_achilles_onAlly(){ // run when ally card is defeated
    let mc = getAllyCard("Achilles");
    if (mc != undefined) {
        mc.clearStatuses();
        mc.current_attack += 1000;
    }
}

function passive_achilles_onEnemy(){ // run when enemy card is defeated
    let mc = getEnemyCard("Achilles");
    if (mc != undefined) {
        mc.clearStatuses();
        mc.current_attack += 1000;
    }
}

function passive_thanatos_onAlly(target){ // run when ally loses >50% of HP at once
    if (hasEnemyCard("Thanatos")) {
        target.inflictStatus("terrified");
    }
}

function passive_thanatos_onEnemy(target){ // run when enemy loses >50% of HP at once
    if (hasAllyCard("Thanatos")) {
        target.inflictStatus("terrified");
    }
}

function passive_hestia() { // run by player1 at the beginning of the turn
    if (hasAllyCard("Hestia")) {
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
        let mc = getEnemyCard("Hestia");
        ENEMY_GAMECARD_OBJS.forEach(pc => {
            if (getTileDistance(mc.getQ(),mc.getR(),mc.getS(),pc.getQ(),pc.getR(),pc.getS()) == 1) {
                pc.giveBlessing("Hestia");
            } else {
                pc.removeBlessing("Hestia");
            }
        });
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
        let mc = getAllyCard("Kronos");
        mc.current_attack += 150;
        mc.current_defense += 2;
    }
    if (hasEnemyCard("Kronos")) {
        let mc = getEnemyCard("Kronos");
        mc.current_attack += 150;
        mc.current_defense += 2;
    }
}

function passive_perseus(){
    let mc = getAllyCard("Perseus");
    if (hasAllyCard("Perseus")) {
        mc.inflictStatus["obscured"];
        mc.current_movement += 2;
    }
}

// passive_heracles in models.js
