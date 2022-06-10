// @miya7090

function nextTurn() {
  if (GAME_MODE == "startup") {
    console.log("now player 1's turn");
    GAME_MODE = "p1-active";
  } else if (GAME_MODE == "p1-active" || GAME_MODE == "p1-moveToken") {
    console.log("now player 2's turn");
    GAME_MODE = "p2-active";
  } else if (GAME_MODE == "p2-active" || GAME_MODE == "p2-moveToken") {
    console.log("now player 1's turn");
    GAME_MODE = "p1-active";
  } else {
    console.error("error continuing to next turn from", GAME_MODE);
  }

  updateTurnText();
}

function changeGameModeTo(newMode) {
  GAME_MODE = newMode;
  updateTurnText();
}

function getTurn() {
  if (GAME_MODE == "startup") {
    return "startup";
  } else if (GAME_MODE == "p1-active" || GAME_MODE == "p1-moveToken") {
    return "p1";
  } else if (GAME_MODE == "p2-active" || GAME_MODE == "p2-moveToken") {
    return "p2";
  } else {
    console.error("can't determine which player's turn it is", GAME_MODE);
  }
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
    const ttrQ = pcardOfThisToken.q;
    tokenToRemove.remove();
    // move tokens to the right, left one space
    Object.keys(PLAYER_GAMECARD_OBJS).forEach(key => {
      const pcardOfOtherToken = PLAYER_GAMECARD_OBJS[key];
      const ttmQ = pcardOfOtherToken.q;
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