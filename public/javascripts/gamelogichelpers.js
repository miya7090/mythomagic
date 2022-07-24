// @miya7090

function processLobbyCode(lobbyCode){
  REGION_NAME = lobbyCode;
  if (lobbyCode == "olympia"){
    PICK_PHASE_RANDOM = true;
    TIMED_TURNS = false;
  } else if (lobbyCode == "corinth"){
    PICK_PHASE_RANDOM = false;
    PICK_PHASE_TIMER = 60000;
    TIMED_TURNS = false;
  } else if (lobbyCode == "athens"){
    PICK_PHASE_RANDOM = false;
    PICK_PHASE_TIMER = 45000;
    TIMED_TURNS = true;
    TURN_TIMER = 30000;
  } else if (lobbyCode == "sparta"){
    PICK_PHASE_RANDOM = false;
    PICK_PHASE_TIMER = 15000;
    TIMED_TURNS = true;
    TURN_TIMER = 15000;
  } else {
    console.error("lobby code not recognized");
  }
}

function getBotCardJsonObjs(){ // similar to pickPCardsRandomly
  let fighterTags = pickRandomEntries(PLAYER_OWNED_FIGHTERS, 1);
  let healerTags = pickRandomEntries(PLAYER_OWNED_DEFENDERS, 1);

  let PLAYER_OWNED_PICKABLE = PLAYER_OWNED.filter(key => (key !== fighterTags[0] && key !== healerTags[0]));
  let anyTags = pickRandomEntries(PLAYER_OWNED_PICKABLE, 3);
  let pickedTags = randArray(fighterTags.concat(healerTags).concat(anyTags));

  let botList = [];
  for (let i = 0; i < 5; i++) {
    let tempCardName = pickedTags[i];
    let tempCardQ = -(HEX_RADIUS-1)+i;
    let tempCardR = HEX_RADIUS;
    let tempPC = new PlayerCard(tempCardName, tempCardQ, tempCardR, -tempCardQ-tempCardR, true);
    botList.push(tempPC);
  }
  return botList;
}

function pickPCardsRandomly(){
  let fighterTags = pickRandomEntries(PLAYER_OWNED_FIGHTERS, 1);
  let healerTags = pickRandomEntries(PLAYER_OWNED_DEFENDERS, 1);

  let PLAYER_OWNED_PICKABLE = PLAYER_OWNED.filter(key => (key !== fighterTags[0] && key !== healerTags[0]));
  let anyTags = pickRandomEntries(PLAYER_OWNED_PICKABLE, 3);

  let pickedTags = randArray(fighterTags.concat(healerTags).concat(anyTags));

  for (let i = 0; i < 5; i++) { selectAvailCard(pickedTags[i], -(HEX_RADIUS-1)+i, HEX_RADIUS); }
  
  rerenderAllGamecardsAndTokens();
}

function selectAvailCard(cardName, cardQ, cardR) {
  let availCardDiv = document.getElementById("availCard-" + cardName);
  availCardDiv.setAttribute("acChosen", true);
  var newPC = new PlayerCard(cardName, cardQ, cardR, -cardQ-cardR, true);
  PLAYER_GAMECARD_OBJS.push(newPC);
  return newPC;
}

function changeGameModeTo(newMode) {
  GAME_MODE = newMode;
  updateTurnText();
}

function getTurn() {
  if (GAME_MODE == "startup") {
    return "startup";
  } else if (GAME_MODE == "pick-phase") {
    return "pick";
  } else {
    let code = GAME_MODE.substring(0,2);
    if (code != "p1" && code != "p2" && code != "bo") { // bot
      console.error("can't determine which player's turn it is", GAME_MODE, code);
    }
    return code;
  }
}

function resetToActiveMode(){
  changeGameModeTo("p1-active");
  highlightSelfAndRadius("rangeHighlight", false, GAME_MODE_MEMORYTARGET.getCurrentMovement(),
  GAME_MODE_MEMORYTARGET.getQ(), GAME_MODE_MEMORYTARGET.getR(), GAME_MODE_MEMORYTARGET.getS());
  highlightMemoryTarget(false);
  GAME_MODE_MEMORYTARGET = undefined;
}

function toSelectAttackMode(){
  changeGameModeTo("p1-attackSelect");
  document.getElementById("passButton").disabled = false;
  document.getElementById("autoButton").disabled = false;
  if (GAME_MODE_MEMORYTARGET.current_mana >= ABILITY_MANA_REQ) {
    document.getElementById("abilityButton").disabled = false;
  }
  if (GAME_MODE_MEMORYTARGET.current_mana >= MAX_MANA) {
    document.getElementById("ultButton").disabled = false;
  }
}

function transitionToMoveTokenMode(tokenOnTile){
  changeGameModeTo("p1-moveToken");
  GAME_MODE_MEMORYTARGET = getGamecardByTokenId(tokenOnTile.id);
  highlightMemoryTarget(true);
  highlightSelfAndRadius("rangeHighlight", true, GAME_MODE_MEMORYTARGET.getCurrentMovement(),
    GAME_MODE_MEMORYTARGET.getQ(), GAME_MODE_MEMORYTARGET.getR(), GAME_MODE_MEMORYTARGET.getS());
}

function giveAllTurnMana(isBot) {
  if (isBot != undefined){
    Object.keys(ENEMY_GAMECARD_OBJS).forEach(key => {
      const pcardTarget = ENEMY_GAMECARD_OBJS[key];
      pcardTarget.giveTurnMana();
    });
  } else {
    Object.keys(PLAYER_GAMECARD_OBJS).forEach(key => {
      const pcardTarget = PLAYER_GAMECARD_OBJS[key];
      pcardTarget.giveTurnMana();
    });
  }  
}

function poisonThePoisoned(){
  PLAYER_GAMECARD_OBJS.forEach(pc => {
    if (pc.statuses["poisoned"] > 0){
      let poisonDmg = Math.round(800 / pc.getCurrentDefense());
      console.log(pc.cardName,"takes", poisonDmg, "poison damage");
      pc.takeDamage(poisonDmg);
    }
  });
  ENEMY_GAMECARD_OBJS.forEach(pc => {
    if (pc.statuses["poisoned"] > 0){
      let poisonDmg = Math.round(800 / pc.getCurrentDefense());
      console.log(pc.cardName,"takes", poisonDmg, "poison damage");
      pc.takeDamage(poisonDmg);
    }
  });
}


function forAll_decreaseStatusCooldowns(){
  PLAYER_GAMECARD_OBJS.forEach(pc => {
    pc.decreaseStatusCooldowns();
  });
  ENEMY_GAMECARD_OBJS.forEach(pc => {
    pc.decreaseStatusCooldowns();
  });
}

function countCardsMatching(gamecardObjs, cList){
  var listCount = 0;
  gamecardObjs.forEach(pc => {
    if (cList.includes(pc.cardName)){
      listCount += 1;
    }
  });
  return listCount;
}

function countCardPairsIn(gamecardObjs, cList){
  var listCount = 0;
  var gamecardNames = getPCNames(gamecardObjs);
  cList.forEach(pairing => {
    if (gamecardNames.includes(pairing[0]) && gamecardNames.includes(pairing[1])) {
      listCount += 1;
    }
  });
  return listCount;
}

function autoattack(pcard){
  attack(0, pcard, pcard.getQ(), pcard.getR(), pcard.getS(), pcard.getCurrentNormAtkRange());
  pcard.giveAttackMana();
}

function abilityAttack(pcard, q, r, s){
  let [cQ,cR,cS] = [q,r,s];
  if (q == undefined) { // if not an aimed attack
    cQ = GAME_MODE_MEMORYTARGET.getQ();
    cR = GAME_MODE_MEMORYTARGET.getR();
    cS = GAME_MODE_MEMORYTARGET.getS();
  }
  GAME_MODE_MEMORYTARGET.current_mana -= ABILITY_MANA_REQ;
  attack(1, pcard, cQ, cR, cS, GAME_MODE_MEMORYTARGET.ability_aim_aoe);
}

function ultimateAttack(pcard, q, r, s){
  if (pcard.blessings["Nyx"] == true) { // nyx ultimate disables ultimate
    broadcastMsg("ultimate", false, "Nyx", pcard.cardName);
    return;
  }

  if (pcard.blessings["Dionysus"] == true) { // passive_dionysus
    broadcastMsg("passive", false, "Dionysus", pcard.cardName);
    pcard.takeDamage(100);
    return;
  }

  let [cQ,cR,cS] = [q,r,s];
  if (q == undefined) { // if not an aimed attack
    cQ = GAME_MODE_MEMORYTARGET.getQ();
    cR = GAME_MODE_MEMORYTARGET.getR();
    cS = GAME_MODE_MEMORYTARGET.getS();
  }
  GAME_MODE_MEMORYTARGET.current_mana -= MAX_MANA;
  attack(2, pcard, cQ, cR, cS, GAME_MODE_MEMORYTARGET.ult_aim_aoe);
}

function bot_autoattack(pcard){
  attack(3, pcard, pcard.getQ(), pcard.getR(), pcard.getS(), pcard.getCurrentNormAtkRange());
  pcard.giveAttackMana();
}

function bot_abilityAttack(pcard, q, r, s){
  let [cQ,cR,cS] = [q,r,s];
  if (q == undefined) { // if not an aimed attack
    cQ = pcard.getQ();
    cR = pcard.getR();
    cS = pcard.getS();    
  }
  pcard.current_mana -= ABILITY_MANA_REQ;
  attack(4, pcard, cQ, cR, cS, pcard.ability_aim_aoe);
}

function bot_ultimateAttack(pcard, q, r, s){
  let [cQ,cR,cS] = [q,r,s];
  if (q == undefined) { // if not an aimed attack
    cQ = pcard.getQ();
    cR = pcard.getR();
    cS = pcard.getS();
  }
  pcard.current_mana -= MAX_MANA;
  attack(5, pcard, cQ, cR, cS, pcard.ult_aim_aoe);
}

function canWorkWithDead(cardName){
  if (cardName == "Hades"){
    return true;
  }
  return false;
}

function attack(atkType, attacker, centerQ, centerR, centerS, aoe) {
  let IS_BOT = false;
  if (atkType >= 3) { IS_BOT = true; }

  if (aoe == undefined && !(atkType == 0 || atkType == 3)){ // an ability/ultimate that needs no target
    if (getTurn() != "bo"){ console.log("doing no-aoe action,",IS_BOT,atkType, attacker, centerQ, centerR, centerS, aoe); }
    let animCode = doUniqueSkill(IS_BOT, atkType, attacker, undefined, undefined);
  } else { // needs target
    if (getTurn() != "bo"){ console.log("doing aoe action,",atkType, attacker, centerQ, centerR, centerS, aoe); }
    let coordTagsInRangeAll = getCoordinatesWithinRadius(centerQ, centerR, centerS, aoe, true);
    const coordTagsInRange = filterOnlyCoordinatesOnBoard(coordTagsInRangeAll);
    coordTagsInRange.forEach(hitTag => {
      let hitTile = HEXTILE_CUBIC_INDEX[hitTag];
      let tokenOnTile = hitTile.querySelector('.token');
      if (tokenOnTile != undefined) {
        // found a valid target
        if (getTurn() != "bo"){ console.log("intersected target", tokenOnTile.id); }
        let targetIsOpponent = tokenOnTile.classList.contains("player2");
        if (atkType == 0){ // p1 autoattack
          let TEMPGETGAMECARD = getGamecardByTokenId(tokenOnTile.id);
          if (targetIsOpponent == true && TEMPGETGAMECARD.dead != "defeated") { // cannot autoattack an already-defeated card
            let dmg = calcDamage(attacker, TEMPGETGAMECARD); // autoattack
            dmg += passive_atalanta(attacker, TEMPGETGAMECARD);
            dmg += passive_hephaestus(attacker, TEMPGETGAMECARD);
            broadcastMsg("autoattack", true, attacker.cardName, TEMPGETGAMECARD.cardName);
            TEMPGETGAMECARD.takeDamage(dmg);
            passive_echo(attacker, TEMPGETGAMECARD, dmg);
            passive_eros(attacker, TEMPGETGAMECARD);
            passive_gaea(TEMPGETGAMECARD);
            anim_tileHitByAttack(hitTile);
          }
        } else if (atkType == 3){ // bot autoattack
          let TEMPGETGAMECARD = getGamecardByTokenId(tokenOnTile.id);
          if (targetIsOpponent == false && TEMPGETGAMECARD.dead != "defeated") { // cannot autoattack an already-defeated card
            let dmg = calcDamage(attacker, TEMPGETGAMECARD); // autoattack // #TODO re-add passives
            broadcastMsg("autoattack", false, attacker.cardName, TEMPGETGAMECARD.cardName);
            TEMPGETGAMECARD.takeDamage(dmg);
          }
        } else {
          let TEMPGETGAMECARD = getGamecardByTokenId(tokenOnTile.id);
          if (TEMPGETGAMECARD.dead != "defeated" || canWorkWithDead(attacker.cardName)){
            doUniqueSkill(IS_BOT, atkType, attacker, TEMPGETGAMECARD, targetIsOpponent);
          } else {
            if (getTurn() != "bo"){ console.log("hero already defeated"); }
          }
        }
      } else { // no hit
        if (!IS_BOT) { anim_tileInAttackRange(hitTile); }
      }
    });
  }
}

function calcDamage(attacker, target){
  let dmg = attacker.getCurrentAttack() / target.getCurrentDefense(); // rounded by the recipient
  if (getTurn() != "bo"){
    console.log(dmg, "damage :", attacker.getCurrentAttack(), "/", target.getCurrentDefense(), ": to", target.cardName);
  }  
  return dmg;
}

function clearSelection(){
  if (GAME_MODE == "p1-moveToken") {
    resetToActiveMode();
    playSound("undo", 1.0);
  } else if (GAME_MODE == "p1-abilityAim") {
    relinquishAimingMouseHighlight();
    aimingTargetReachHighlight(false, GAME_MODE_MEMORYTARGET.ability_aim_range);
    toSelectAttackMode();
    playSound("undo", 1.0);
  } else if (GAME_MODE == "p1-ultimateAim") {
    relinquishAimingMouseHighlight();
    aimingTargetReachHighlight(false, GAME_MODE_MEMORYTARGET.ult_aim_range);
    toSelectAttackMode();
    playSound("undo", 1.0);
  } else {
    console.error("nothing to cancel with C");
  }
}

function checkGameOver(){
  var okP1 = false;
  var okP2 = false;
  PLAYER_GAMECARD_OBJS.forEach(pc => {
    if (pc.dead != "defeated") { okP1 = true; }
  });
  ENEMY_GAMECARD_OBJS.forEach(pc => {
    if (pc.dead != "defeated") { okP2 = true; }
  });
  if (okP1 == false && okP2 == false){
    return "tie";
  }
  if (okP1 == false){
    return "p2win";
  }
  if (okP2 == false){
    return "p1win";
  }
  return "ongoing";
}

// given coordinate list, keep only coordinates which are on board
function filterOnlyCoordinatesOnBoard(qrsList){
    var results = [];
    qrsList.forEach((qrsCoord) => {
      if (HEXTILE_CUBIC_INDEX[qrsCoord] !== undefined){
        results.push(qrsCoord);
      }
    });
    return results;
  }

  function removeTokenAndShiftOthers(pcardOfThisToken) { // only valid before game starts
    const tokenToRemove = document.getElementById("p1token-" + pcardOfThisToken.cardName);
    const ttrQ = pcardOfThisToken.getQ();
    tokenToRemove.parentNode.setAttribute("hasP1Token", false);
    tokenToRemove.parentNode.setAttribute("hasP2Token", false);
    tokenToRemove.remove();
    const tooltipDiv = document.getElementById("p1tooltip-" + pcardOfThisToken.cardName);
    tooltipDiv.remove();
    // move tokens to the right, left one space
    Object.keys(PLAYER_GAMECARD_OBJS).forEach(key => {
      const pcardOfOtherToken = PLAYER_GAMECARD_OBJS[key];
      const ttmQ = pcardOfOtherToken.getQ();
      if (ttmQ > ttrQ) {
        moveToken(pcardOfOtherToken, false, -1, 0);
      }
    });
    rerenderAllGamecardsAndTokens();
  };

  function moveToken(tokenPcard, absolute, diffQ, diffR) {
    const tokenDiv = document.getElementById("p1token-" + tokenPcard.cardName);
    tokenDiv.parentNode.setAttribute("hasP1Token", false);
    tokenDiv.parentNode.setAttribute("hasP2Token", false);
    tokenDiv.remove();
    const tooltipDiv = document.getElementById("p1tooltip-" + tokenPcard.cardName);
    tooltipDiv.remove();
    if (absolute == true) {
      tokenPcard.changeLocationTo(diffQ, diffR);
    } else {
      tokenPcard.moveLocationBy(diffQ, diffR);
    }
    // check if this coordinate is invalid
    if (HEXTILE_CUBIC_INDEX[tokenPcard.tag] == undefined){
      console.error(tokenPcard.cardName+" cannot be moved to "+tokenPcard.tag+" since this is out of bounds");
    }
    createTokenDiv(tokenPcard);
  };

  function moveBotToken(tokenPcard, absolute, diffQ, diffR) {
    const tokenDiv = document.getElementById("p2token-" + tokenPcard.cardName);
    tokenDiv.parentNode.setAttribute("hasP1Token", false);
    tokenDiv.parentNode.setAttribute("hasP2Token", false);
    tokenDiv.remove();
    const tooltipDiv = document.getElementById("p2tooltip-" + tokenPcard.cardName);
    tooltipDiv.remove();
    if (absolute == true) {
      tokenPcard.changeLocationTo(diffQ, diffR);
    } else {
      tokenPcard.moveLocationBy(diffQ, diffR);
    }
    // check if this coordinate is invalid
    if (HEXTILE_CUBIC_INDEX[tokenPcard.tag] == undefined){
      console.error(tokenPcard.cardName+" cannot be moved to "+tokenPcard.tag+" since this is out of bounds");
    }
    createEnemyTokenDiv(tokenPcard);
  };