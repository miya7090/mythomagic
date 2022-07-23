// @miya7090

function playBotTurn(moreTurns){
  forAll_decreaseStatusCooldowns();
  // #TODO implement passives here
 
  let cardToMove = pickRandomEntries(ENEMY_GAMECARD_OBJS, 1)[0];

  let coordTagsInRangeAll = getCoordinatesWithinRadius(cardToMove.getQ(), cardToMove.getR(), cardToMove.getS(), cardToMove.getCurrentMovement(), true);
  let coordTagsInRange = randArray(filterOnlyCoordinatesOnBoard(coordTagsInRangeAll));

  let foundGoodTileToLandOn = false;
  coordTagsInRange.forEach(hitTag => {
    if (!foundGoodTileToLandOn){
      let hitTile = HEXTILE_CUBIC_INDEX[hitTag];
      let tokenOnTile = hitTile.querySelector('.token');
      
      if (tokenOnTile == undefined && !hitTile.classList.contains("offgrid")) { // can move here~
        foundGoodTileToLandOn = true;
        var cQ = hitTile.cube_q;
        var cR = hitTile.cube_r;
        moveBotToken(cardToMove, true, cQ, cR);
      }
    }
  });

  if (cardToMove.current_mana >= 1000) {
    bot_ultimateAttack(cardToMove);
  } else if (cardToMove.current_mana >= 200) {
    bot_abilityAttack(cardToMove);
  } else {
    bot_autoattack(cardToMove);
  }

  giveAllTurnMana(true);
  poisonThePoisoned();

  let gameOver = checkGameOver();
  if (gameOver == "ongoing"){
    if (moreTurns > 0){ // another bot turn
      changeGameModeTo("p2-turn2");
      setTimeout(function () { playBotTurn(moreTurns - 1); }, 5000);
    } else { // player's turn
      if (TURNS_ALLOCATED > 0){
        beginTurn(undefined, undefined); // includes a rerender
        MY_SOCKET.emit("tellRival_ongoingProgress", exportAllP1Cs(), exportAllP2Cs());
      } else {
        TURNS_ALLOCATED = 2;
        beginTurn(undefined, undefined); // includes a rerender
      }
    }
  } else if (gameOver == "tie") {
    MY_SOCKET.emit("gameEnded_withTie", REGION_NAME, SELF_NAME, PLAYER_HERO_INITIAL_NAMES, OTHER_NAME, ENEMY_HERO_INITIAL_NAMES);
  } else if (gameOver == "p1win") {
    MY_SOCKET.emit("gameEnded_withMyWin", REGION_NAME, SELF_NAME, PLAYER_HERO_INITIAL_NAMES, OTHER_NAME, ENEMY_HERO_INITIAL_NAMES);
  } else if (gameOver == "p2win") {
    MY_SOCKET.emit("gameEnded_withEnemyWin", REGION_NAME, SELF_NAME, PLAYER_HERO_INITIAL_NAMES, OTHER_NAME, ENEMY_HERO_INITIAL_NAMES);
  } else {
    console.error("gameOver issue", gameOver);
  }
}