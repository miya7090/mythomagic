// @miya7090

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
    let code = GAME_MODE.substring(0,3);
    if (code != "p1" && code != "p2") {
      console.error("can't determine which player's turn it is", GAME_MODE, code);
    }
    return code;
  }
}

function resetToActiveMode(){
  changeGameModeTo("p1-active");
  highlightSelfAndRadius("rangeHighlight", false, GAME_MODE_MEMORYTARGET.current_movement,
  GAME_MODE_MEMORYTARGET.getQ(), GAME_MODE_MEMORYTARGET.getR(), GAME_MODE_MEMORYTARGET.getS());
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
  highlightSelfAndRadius("rangeHighlight", true, GAME_MODE_MEMORYTARGET.current_movement,
    GAME_MODE_MEMORYTARGET.getQ(), GAME_MODE_MEMORYTARGET.getR(), GAME_MODE_MEMORYTARGET.getS());
}

function giveAllTurnMana() {
  Object.keys(PLAYER_GAMECARD_OBJS).forEach(key => {
    const pcardTarget = PLAYER_GAMECARD_OBJS[key];
    pcardTarget.giveTurnMana();
  });
}

function autoattack(pcard){
  attack(0, pcard, pcard.getQ(), pcard.getR(), pcard.getS(), pcard.current_normal_attack_range);
  GAME_MODE_MEMORYTARGET.giveAttackMana();
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
  let [cQ,cR,cS] = [q,r,s];
  if (q == undefined) { // if not an aimed attack
    cQ = GAME_MODE_MEMORYTARGET.getQ();
    cR = GAME_MODE_MEMORYTARGET.getR();
    cS = GAME_MODE_MEMORYTARGET.getS();
  }
  GAME_MODE_MEMORYTARGET.current_mana -= MAX_MANA;
  attack(2, pcard, cQ, cR, cS, GAME_MODE_MEMORYTARGET.ult_aim_aoe); //#TODO change from flat dmg
}

function attack(atkType, attacker, centerQ, centerR, centerS, aoe) {
  if (aoe == undefined && atkType != 0){ // needs no target
    console.log("doing action without aoe",atkType, attacker, centerQ, centerR, centerS, aoe);
    let animCode = doUniqueSkill(atkType, attacker, undefined, undefined);
  } else { // needs target
    console.log("doing action with aoe",atkType, attacker, centerQ, centerR, centerS, aoe);
    let coordTagsInRangeAll = getCoordinatesWithinRadius(centerQ, centerR, centerS, aoe, false);
    const coordTagsInRange = filterOnlyCoordinatesOnBoard(coordTagsInRangeAll);
    coordTagsInRange.forEach(hitTag => {
      let hitTile = HEXTILE_CUBIC_INDEX[hitTag];
      let tokenOnTile = hitTile.querySelector('.token');
      if (tokenOnTile != undefined) {
        // found a valid target
        let targetIsOpponent = tokenOnTile.classList.contains("player2");
        if (atkType == 0){
          if (targetIsOpponent == true) {
            let dmg = calcDamage(attacker, tokenOnTile.pcardLink); // autoattack
            tokenOnTile.pcardLink.takeDamage(dmg);
            anim_tileHitByAttack(hitTile); // #TODO add sound
          }
        } else { // #TODO avoid attacking defeated cards?
          let animCode = doUniqueSkill(atkType, attacker, tokenOnTile.pcardLink, targetIsOpponent);
          if (animCode == 0) { // do animation
            anim_tileHitByHeal(hitTile);
          } else if (animCode == 1) {
            anim_tileHitByAttack(hitTile);
          } else {
            console.error("need to implement anim for neutral skill");
          }
        }
      } else { // no hit
        anim_tileInAttackRange(hitTile);
      }
    });
  }
}

function calcDamage(attacker, target){
  var effectiveAttack = attacker.current_attack;
  if (attacker.statuses["obscured"] == 1) { effectiveAttack -= (0.1 * attacker.current_attack); }
  if (attacker.statuses["terrified"] == 1) { effectiveAttack -= (0.5 * attacker.current_attack); }
  if (attacker.statuses["stunned"] == 1) { effectiveAttack = 0; }

  var effectiveDefense = target.current_defense;
  if (target.statuses["distracted" == 1]) { effectiveDefense -= (0.1 * target.current_defense); }
  if (target.statuses["charmed" == 1]) { effectiveDefense = 1; }

  if (effectiveAttack < 0) { effectiveAttack = 0; }
  if (effectiveDefense < 1) { effectiveDefense = 1; }

  let dmg = effectiveAttack / effectiveDefense; // rounded by the recipient
  console.log(dmg, "damage :", effectiveAttack, "/", effectiveDefense, ": to", target.cardName);

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
  } else if (GAME_MODE == "pick-phase") {
    let lastPcard = PLAYER_GAMECARD_OBJS[PLAYER_GAMECARD_OBJS.length - 1];
    removeTokenAndShiftOthers(lastPcard);
    document.getElementById("p1card-" + lastPcard.cardName).remove(); // remove last gamecard's div
    PLAYER_GAMECARD_OBJS.splice(PLAYER_GAMECARD_OBJS.length - 1, 1); // remove last gamecard's obj
  } else if (GAME_MODE == "p1-abilityAim") {
    relinquishAimingMouseHighlight();
    aimingTargetReachHighlight(false, GAME_MODE_MEMORYTARGET.ability_aim_range);
    toSelectAttackMode();
  } else if (GAME_MODE == "p1-ultimateAim") {
    relinquishAimingMouseHighlight();
    aimingTargetReachHighlight(false, GAME_MODE_MEMORYTARGET.ult_aim_range);
    toSelectAttackMode();
  } else {
    console.error("nothing to cancel with C");
  }
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