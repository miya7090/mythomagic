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

function autoattack(pcard){
  console.log(pcard.cardName+" attacks all in radius " + pcard.current_normal_attack_range);
  attack(pcard.getQ(), pcard.getR(), pcard.getS(), pcard.current_normal_attack_range, 200); //#TODO change from flat dmg
}

function abilityAttack(q, r, s){
  let [cQ,cR,cS] = [q,r,s];
  if (q == undefined) { // if not an aimed attack
    cQ = GAME_MODE_MEMORYTARGET.getQ();
    cR = GAME_MODE_MEMORYTARGET.getR();
    cS = GAME_MODE_MEMORYTARGET.getS();
  }
  attack(cQ, cR, cS, GAME_MODE_MEMORYTARGET.ability_aim_aoe, 300); //#TODO change from flat dmg
}

function ultimateAttack(q, r, s){
  let [cQ,cR,cS] = [q,r,s];
  if (q == undefined) { // if not an aimed attack
    cQ = GAME_MODE_MEMORYTARGET.getQ();
    cR = GAME_MODE_MEMORYTARGET.getR();
    cS = GAME_MODE_MEMORYTARGET.getS();
  }
  attack(cQ, cR, cS, GAME_MODE_MEMORYTARGET.ult_aim_aoe, 400); //#TODO change from flat dmg
}

function attack(centerQ, centerR, centerS, aoe, incomingDamage) {
  let coordTagsInRangeAll = getCoordinatesWithinRadius(centerQ, centerR, centerS, aoe, false);
  const coordTagsInRange = filterOnlyCoordinatesOnBoard(coordTagsInRangeAll);
  coordTagsInRange.forEach(hitTag => {
    let hitTile = HEXTILE_CUBIC_INDEX[hitTag];
    let tokenOnTile = hitTile.querySelector('.token');
    if (tokenOnTile != undefined && tokenOnTile.classList.contains("player2")) {
      console.log("hit!!", tokenOnTile.pcardLink.cardName);
      let damageCalc = incomingDamage; // #TODO mitigate
      tokenOnTile.pcardLink.takeDamage(damageCalc);
      anim_tileHitByAttack(hitTile); // #TODO add sound
    } else {
      anim_tileInAttackRange(hitTile);
    }
  });
}

// retrieve base stats of a card, return array
function getBaseStats(cardType) {
  if (BASE_STAT_DICT[cardType] == undefined){
      console.error(cardType+" not found in base stat dictionary");
  }
  return BASE_STAT_DICT[cardType];
}

// #TODO change this up
function savingThrow(savingThrowThreshold) {
    // augmented by movement speed and defense
    const mvmtOffset = (this.current_movement + this.movement_bonus) / MVMT_SPD_SCALE_TO_SAVE_THROW;
    const defOffset = (this.current_defense + this.defense_bonus) / DEFENCE_SCALE_TO_SAVE_THROW;
    var figBoost = 0;
    if (this.is_figurine){
        figBoost = FIGURINE_SAVING_THROW_FLAT_BOOST;
    }
    return (Math.floor(Math.random()*20) + mvmtOffset + defOffset + figBoost) > savingThrowThreshold;
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
    tokenToRemove.remove();
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
    tokenDiv.remove();
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