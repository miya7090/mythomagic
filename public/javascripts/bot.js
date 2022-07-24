// @miya7090

function playBotTurn(){
  changeGameModeTo("bot-thinking");
  updateTurnText();

  setTimeout(function () {
    console.log("BOT TURN!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    const [PLAYER_GAMECARD_OBJS_ORIG_COPY, ENEMY_GAMECARD_OBJS_ORIG_COPY] = botDeepCopyPCArrsToState(PLAYER_GAMECARD_OBJS, ENEMY_GAMECARD_OBJS);
    forAll_decreaseStatusCooldowns();
    // #TODO implement passives here

    const [playerOrig, botOrig] = botDeepCopyPCArrsToState(PLAYER_GAMECARD_OBJS, ENEMY_GAMECARD_OBJS);
    var bestCourseOfAction = gradeStateMetric(2, playerOrig, botOrig);

    if (bestCourseOfAction[1] == undefined) {
      console.error("bot logic: bot cannot make any move");
      giveAllTurnMana(true);
      poisonThePoisoned();
      onBotTurnEnd();
      console.log("bot done-------------------");
      return;
    }

    var recipeString = bestCourseOfAction[1].split(".").slice(0, -1);

    if (recipeString.length != 2) {
      console.error("bot logic error 100");
    }
    
    PLAYER_GAMECARD_OBJS = PLAYER_GAMECARD_OBJS_ORIG_COPY;
    ENEMY_GAMECARD_OBJS = ENEMY_GAMECARD_OBJS_ORIG_COPY;
    rerenderAllGamecardsAndTokens(false, false);

    changeGameModeTo("p2-turn1");
    setTimeout(function () {
      followRecipe(recipeString[0]);
      rerenderAllGamecardsAndTokens(false, false);
      changeGameModeTo("p2-turn2");

      setTimeout(function () {      
        followRecipe(recipeString[1]);
        giveAllTurnMana(true);
        poisonThePoisoned();
        onBotTurnEnd();
        console.log("bot done-------------------");
      }, 2*BOT_LAG);
    }, BOT_LAG);
  }, 100);  
}

function followRecipe(recipe){
  let bestCard = recipe.split("_")[0];
  let bestMove = recipe.split("_")[1].split(",").map(obj => parseInt(obj));
  let bestAction = recipe.split("_")[2].split(":")[0];
  let [bestActionQ, bestActionR, bestActionS] = [undefined, undefined, undefined];
  if (recipe.split("_")[2].split(":").length > 1){
    [bestActionQ, bestActionR, bestActionS] = recipe.split("_")[2].split(":").slice(1).map(obj => parseInt(obj));
  }

  let targetCard = getGamecardByTokenId("p2-"+bestCard);
  console.log("bot command", bestCard, bestMove, bestAction, bestActionQ, bestActionR, bestActionS);
  moveBotToken(targetCard, true, bestMove[0], bestMove[1]);
  if (bestAction == "aa"){
    bot_autoattack(targetCard);
  } else if (bestAction == "b"){
    bot_abilityAttack(targetCard,bestActionQ, bestActionR, bestActionS);
  } else if (bestAction == "u"){
    bot_ultimateAttack(targetCard,bestActionQ, bestActionR, bestActionS);
  } else {
    console.error("bot logic error 200");
  }
}

function gradeStateMetric(horizon, origPlayerArr, origBotArr){
  if (horizon == 0) { return [0, ""]; } // ran out of turns
  var bestCourseOfAction = [undefined, undefined]; // [score, actionCode]

  // on bot turn
  // for all possible cards, for all possible moves, for all possible actions + aims of actions
  
  let undefeatedBots = [];
  ENEMY_GAMECARD_OBJS.forEach(pc => {
    if (pc.dead != "defeated") { undefeatedBots.push(pc); }
  });

  var limitForSearches = 0;

  randArray(undefeatedBots).forEach(hypoCardCopyToMove => {
    var hypoCardToMove = undefined;
    //console.log("evaluating moving card", hypoCardToMove);
    let coordTagsInRangeAll = getCoordinatesWithinRadius(hypoCardCopyToMove.getQ(), hypoCardCopyToMove.getR(), hypoCardCopyToMove.getS(), hypoCardCopyToMove.getCurrentMovement(), true);
    let coordTagsInRange = randArray(filterOnlyCoordinatesOnBoard(coordTagsInRangeAll));
    coordTagsInRange.forEach(hitTag => {
      if (BOT_DIFFICULTY == "easy" && limitForSearches > 10){
        [PLAYER_GAMECARD_OBJS, ENEMY_GAMECARD_OBJS] = botDeepCopyPCArrsToState(origPlayerArr, origBotArr);
        return bestCourseOfAction;
      }
      if (limitForSearches > 200 || (limitForSearches > 30 && horizon == 2)){
        //console.log("bot search limit reached. ending search early...");
        [PLAYER_GAMECARD_OBJS, ENEMY_GAMECARD_OBJS] = botDeepCopyPCArrsToState(origPlayerArr, origBotArr);
        return bestCourseOfAction;
      }

      [PLAYER_GAMECARD_OBJS, ENEMY_GAMECARD_OBJS] = botDeepCopyPCArrsToState(origPlayerArr, origBotArr);

      let hitTile = HEXTILE_CUBIC_INDEX[hitTag];
      let tokenOnTile = hitTile.querySelector('.token');      
      if (tokenOnTile == undefined && !hitTile.classList.contains("offgrid")) { // can move here~
        var cQ = hitTile.cube_q;
        var cR = hitTile.cube_r;

        hypoCardToMove = getGamecardByTokenId("p2-"+hypoCardCopyToMove.cardName);
        moveBotToken(hypoCardToMove, true, cQ, cR);
        const postMoveState = botDeepCopyPCArrsToState(PLAYER_GAMECARD_OBJS, ENEMY_GAMECARD_OBJS); // *
        
        hypoCardToMove = getGamecardByTokenId("p2-"+hypoCardCopyToMove.cardName);
        bot_autoattack(hypoCardToMove);
        limitForSearches += 1;
        bestCourseOfAction = evaluateAction(bestCourseOfAction, hypoCardToMove.cardName, hypoCardToMove.tag, "aa", horizon, postMoveState);
        
        if (hypoCardToMove.current_mana >= 200) {
          if (hypoCardToMove.ability_is_aimed) {
            let possAimCoords = getCoordinatesWithinRadius(hypoCardToMove.getQ(), hypoCardToMove.getR(), hypoCardToMove.getS(), hypoCardToMove.ability_aim_range, true);
            let aimCoordsInRange = filterOnlyCoordinatesOnBoard(possAimCoords);
            aimCoordsInRange.forEach(aimHitTag => {
              if (limitForSearches > 200 || (limitForSearches > 30 && horizon == 2)){
                //console.log("bot search limit reached. ending search early...");
                [PLAYER_GAMECARD_OBJS, ENEMY_GAMECARD_OBJS] = botDeepCopyPCArrsToState(origPlayerArr, origBotArr);
                return bestCourseOfAction;
              }

              let aimHitTile = HEXTILE_CUBIC_INDEX[aimHitTag];
              var aim_cQ = aimHitTile.cube_q;
              var aim_cR = aimHitTile.cube_r;
              var aim_cS = aimHitTile.cube_s;

              hypoCardToMove = getGamecardByTokenId("p2-"+hypoCardCopyToMove.cardName);
              bot_abilityAttack(hypoCardToMove, aim_cQ, aim_cR, aim_cS);
              limitForSearches += 1;
              bestCourseOfAction = evaluateAction(bestCourseOfAction, hypoCardToMove.cardName, hypoCardToMove.tag, "b:"+aim_cQ+":"+aim_cR+":"+aim_cS, horizon, postMoveState);
            });
          } else {
            hypoCardToMove = getGamecardByTokenId("p2-"+hypoCardCopyToMove.cardName);
            bot_abilityAttack(hypoCardToMove);
            limitForSearches += 1;
            bestCourseOfAction = evaluateAction(bestCourseOfAction, hypoCardToMove.cardName, hypoCardToMove.tag, "b", horizon, postMoveState);
          }
        }

        if (hypoCardToMove.current_mana >= 1000) {
          if (hypoCardToMove.ult_is_aimed) {
            let possAimCoords = getCoordinatesWithinRadius(hypoCardToMove.getQ(), hypoCardToMove.getR(), hypoCardToMove.getS(), hypoCardToMove.ult_aim_range, true);
            let aimCoordsInRange = filterOnlyCoordinatesOnBoard(possAimCoords);
            aimCoordsInRange.forEach(aimHitTag => {
              if (limitForSearches > 200 || (limitForSearches > 30 && horizon == 2)){
                //console.log("bot search limit reached. ending search early...");
                [PLAYER_GAMECARD_OBJS, ENEMY_GAMECARD_OBJS] = botDeepCopyPCArrsToState(origPlayerArr, origBotArr);
                return bestCourseOfAction;
              }
              
              let aimHitTile = HEXTILE_CUBIC_INDEX[aimHitTag];
              var aim_cQ = aimHitTile.cube_q;
              var aim_cR = aimHitTile.cube_r;
              var aim_cS = aimHitTile.cube_s;

              hypoCardToMove = getGamecardByTokenId("p2-"+hypoCardCopyToMove.cardName);
              bot_ultimateAttack(hypoCardToMove, aim_cQ, aim_cR, aim_cS);
              limitForSearches += 1;
              bestCourseOfAction = evaluateAction(bestCourseOfAction, hypoCardToMove.cardName, hypoCardToMove.tag, "u:"+aim_cQ+":"+aim_cR+":"+aim_cS, horizon, postMoveState);
            });
          } else {
            hypoCardToMove = getGamecardByTokenId("p2-"+hypoCardCopyToMove.cardName);
            bot_ultimateAttack(hypoCardToMove);
            limitForSearches += 1;
            bestCourseOfAction = evaluateAction(bestCourseOfAction, hypoCardToMove.cardName, hypoCardToMove.tag, "b", horizon, postMoveState);
          }
        }
      }
    });
  });

  [PLAYER_GAMECARD_OBJS, ENEMY_GAMECARD_OBJS] = botDeepCopyPCArrsToState(origPlayerArr, origBotArr);
  return bestCourseOfAction;
}

function evaluateAction(bestCourseOfAction, cardName, newLocation, actionCode, horizon, stateToReturnTo){
  const groundTruth = botDeepCopyPCArrsToState(PLAYER_GAMECARD_OBJS, ENEMY_GAMECARD_OBJS);
  let memoryScore = gradeTeamMetric(groundTruth);

  let thisCourse = gradeStateMetric(horizon-1, groundTruth[0], groundTruth[1]);
  thisCourse[0] += memoryScore;

  if (bestCourseOfAction[0] == undefined) {
    bestCourseOfAction = [thisCourse[0], cardName+"_"+newLocation+"_"+actionCode+"."+thisCourse[1]];
  }
  if (thisCourse[0] > bestCourseOfAction[0]) {
    //console.log(horizon, "bot better suggestion...",cardName,newLocation,actionCode,"=",thisCourse[0]);   
    bestCourseOfAction = [thisCourse[0], cardName+"_"+newLocation+"_"+actionCode+"."+thisCourse[1]];
  }

  [PLAYER_GAMECARD_OBJS, ENEMY_GAMECARD_OBJS] = botDeepCopyPCArrsToState(stateToReturnTo[0], stateToReturnTo[1]);
  return bestCourseOfAction;
}

function gradeTeamMetric(){
  var finalScore = 0; // a higher finalScore is more advantageous for the bot
  PLAYER_GAMECARD_OBJS.forEach(pc => { // #TODO improve metric
    finalScore -= pc.current_health;

    if (BOT_DIFFICULTY != "easy") {
      finalScore -= (pc.getCurrentAttack() / 20.0);
      finalScore -= (pc.getCurrentDefense() * 4.0);
      if (pc.dead == "defeated") { finalScore += 200; }
    }
  });

  ENEMY_GAMECARD_OBJS.forEach(pc => {
    finalScore += pc.current_health;

    if (BOT_DIFFICULTY != "easy") {
      finalScore += (pc.getCurrentAttack() / 20.0);
      finalScore += (pc.getCurrentDefense() * 4.0);
      if (pc.dead == "defeated") { finalScore -= 200; }
    }
  });
  return finalScore;
}

function onBotTurnEnd(){
  let gameOver = checkGameOver();
  if (gameOver == "ongoing"){
    TURNS_ALLOCATED = 2;
    beginTurn(undefined, undefined); // includes a rerender
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