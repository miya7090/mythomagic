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
    PICK_PHASE_TIMER = 20000;
    TIMED_TURNS = true;
    TURN_TIMER = 20000;
  } else {
    console.error("lobby code not recognized");
  }
}

function pickPCardsRandomly(){
  let fighterTags = pickRandomEntries(PLAYER_OWNED_FIGHTERS, 1);
  let healerTags = pickRandomEntries(PLAYER_OWNED_HEALERS, 1);

  let PLAYER_OWNED_PICKABLE = PLAYER_OWNED.filter(key => (key !== fighterTags[0] && key !== healerTags[0]));
  let anyTags = pickRandomEntries(PLAYER_OWNED_PICKABLE, 3);

  let pickedTags = randArray(fighterTags.concat(healerTags).concat(anyTags));

  for (let i = 0; i < 5; i++) { selectAvailCard(pickedTags[i], -(HEX_RADIUS-1)+i, HEX_RADIUS,-1-i); }
  
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
    if (code != "p1" && code != "p2") {
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
  GAME_MODE_MEMORYTARGET = tokenOnTile.pcardLink;
  highlightMemoryTarget(true);
  highlightSelfAndRadius("rangeHighlight", true, GAME_MODE_MEMORYTARGET.getCurrentMovement(),
    GAME_MODE_MEMORYTARGET.getQ(), GAME_MODE_MEMORYTARGET.getR(), GAME_MODE_MEMORYTARGET.getS());
}

function giveAllTurnMana() {
  Object.keys(PLAYER_GAMECARD_OBJS).forEach(key => {
    const pcardTarget = PLAYER_GAMECARD_OBJS[key];
    pcardTarget.giveTurnMana();
  });
}

function poisonThePoisoned(){
  PLAYER_GAMECARD_OBJS.forEach(pc => {
    if (pc.statuses["poisoned"] > 0){
      let poisonDmg = Math.round(500 / pc.getCurrentDefense());
      console.log(pc.cardName,"takes", poisonDmg, "poison damage");
      pc.takeDamage(poisonDmg);
    }
  });
  ENEMY_GAMECARD_OBJS.forEach(pc => {
    if (pc.statuses["poisoned"] > 0){
      let poisonDmg = Math.round(500 / pc.getCurrentDefense());
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
  attack(1, pcard, cQ, cR, cS, GAME_MODE_MEMORYTARGET.ability_aim_aoe); //#TODO change from flat dmg
}

function ultimateAttack(pcard, q, r, s){
  if (pcard.blessings["Nyx"] == true) { // nyx ultimate disables ultimate
    broadcastMsg("ultimate", false, "Nyx", pcard.cardName);
    return;
  }

  let [cQ,cR,cS] = [q,r,s];
  if (q == undefined) { // if not an aimed attack
    cQ = GAME_MODE_MEMORYTARGET.getQ();
    cR = GAME_MODE_MEMORYTARGET.getR();
    cS = GAME_MODE_MEMORYTARGET.getS();
  }
  GAME_MODE_MEMORYTARGET.current_mana -= MAX_MANA;
  attack(2, pcard, cQ, cR, cS, GAME_MODE_MEMORYTARGET.ult_aim_aoe); //#TODO change from flat dmg
}

function canWorkWithDead(cardName){
  if (cardName == "Hades"){
    return true;
  }
  return false;
}

function attack(atkType, attacker, centerQ, centerR, centerS, aoe) {
  if (aoe == undefined && atkType != 0){ // needs no target
    console.log("doing action without aoe",atkType, attacker, centerQ, centerR, centerS, aoe);
    let animCode = doUniqueSkill(atkType, attacker, undefined, undefined);
  } else { // needs target
    console.log("doing action with aoe",atkType, attacker, centerQ, centerR, centerS, aoe);
    let coordTagsInRangeAll = getCoordinatesWithinRadius(centerQ, centerR, centerS, aoe, true);
    const coordTagsInRange = filterOnlyCoordinatesOnBoard(coordTagsInRangeAll);
    console.log(coordTagsInRange,"xxx",coordTagsInRangeAll);
    coordTagsInRange.forEach(hitTag => {
      let hitTile = HEXTILE_CUBIC_INDEX[hitTag];
      let tokenOnTile = hitTile.querySelector('.token');
      if (tokenOnTile != undefined) {
        // found a valid target
        console.log("intersected target", tokenOnTile.pcardLink.cardName);
        let targetIsOpponent = tokenOnTile.classList.contains("player2");
        if (atkType == 0){
          if (targetIsOpponent == true && tokenOnTile.pcardLink.dead != "defeated") { // cannot autoattack an already-defeated card
            let dmg = calcDamage(attacker, tokenOnTile.pcardLink); // autoattack
            dmg += passive_atalanta(attacker, tokenOnTile.pcardLink);
            dmg += passive_hephaestus(attacker, tokenOnTile.pcardLink);
            broadcastMsg("autoattack", true, attacker.cardName, tokenOnTile.pcardLink.cardName);
            tokenOnTile.pcardLink.takeDamage(dmg);
            passive_echo(attacker, tokenOnTile.pcardLink, dmg);
            passive_eros(attacker, tokenOnTile.pcardLink);
            anim_tileHitByAttack(hitTile); // #TODO add sound
          }
        } else { // #TODO avoid attacking defeated cards if not a certain card e.g. hades
          if (tokenOnTile.pcardLink.dead != "defeated" || canWorkWithDead(attacker.cardName)){
            let animCode = doUniqueSkill(atkType, attacker, tokenOnTile.pcardLink, targetIsOpponent);
            if (animCode == 0) { // do animation
              anim_tileHitByHeal(hitTile);
            } else if (animCode == 1) {
              anim_tileHitByAttack(hitTile);
            } else {
              console.error("need to implement anim for neutral skill"); // #TODO
            }
          } else {
            console.log("hero already defeated");
          }
        }
      } else { // no hit
        anim_tileInAttackRange(hitTile);
      }
    });
  }
}

function calcDamage(attacker, target){
  let dmg = attacker.getCurrentAttack() / target.getCurrentDefense(); // rounded by the recipient
  console.log(dmg, "damage :", attacker.getCurrentAttack(), "/", target.getCurrentDefense(), ": to", target.cardName);
  return dmg;
}

// retrieve base stats of a card, return array
function getBaseStats(cardType) {
  if (BASE_STAT_DICT[cardType] == undefined){
      console.error(cardType+" not found in base stat dictionary");
  }
  return BASE_STAT_DICT[cardType];
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
    rerenderAllGamecardsAndTokens(); // #TODO above code redundant
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