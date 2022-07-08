// @miya7090



function initializeSoundObjects(){
  SOUND_OBJECTS = {};
  for (var soundKey of Object.keys(SOUND_MAP)) {
    SOUND_OBJECTS[soundKey] = [];
    SOUND_MAP[soundKey].forEach((soundValue) => {
      let soundPath = GITHUB_PUBLIC_PATH+'sounds/'+soundValue+'.mp3';
      let soundObj = new Audio(soundPath);
      SOUND_OBJECTS[soundKey].push(soundObj);
    });  
  }
}

function playSound(soundKey, volume){
  if (Object.keys(SOUND_OBJECTS).includes(soundKey)) {
    let choices = SOUND_OBJECTS[soundKey];
    let chosenSound = choices[Math.floor(Math.random() * choices.length)];
    chosenSound.volume = volume;
    chosenSound.currentTime = 0;
    chosenSound.play();
  } else {
    console.error("audio not found for", soundKey);
  }
}

HIGHLIGHT_TILE_MEMORY_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--highlightedTileMemory');
HIGHLIGHT_TILE_ATTACK_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--highlightedTileAttack');

// what to do when key pressed
function keyProcessing(event) {
  // Z/X
  if ((event.keyCode === 90 || event.keyCode === 88) && GAME_MODE != "p1-moveToken") { // mouse hover radius stuff
     // first clear hover highlights
    if (CURRENT_MOUSE_Q !== undefined) {
      hoverMouseHighlight(false);
    }
    if (event.keyCode === 90 && MOUSE_HOVER_RADIUS > 0) { // z, reduce radius
      playSound("radiusChange", 0.8);
      MOUSE_HOVER_RADIUS -= 1;
      previewRadius.textContent="Preview radius: "+MOUSE_HOVER_RADIUS;
    } else if (event.keyCode === 88 && MOUSE_HOVER_RADIUS < 12) { // x, increase radius
      playSound("radiusChange", 0.8);
      MOUSE_HOVER_RADIUS += 1;
      previewRadius.textContent="Preview radius: "+MOUSE_HOVER_RADIUS;
    }
    // then redo hover highlights
    if (CURRENT_MOUSE_Q !== undefined) {
      hoverMouseHighlight(true);
    }
  }

  // C
  if (event.keyCode === 67) { // c, clear selection
    clearSelection();
  }

  // ESC
  if (event.keyCode === 27) { // esc, forfeit game
    if (confirm("do you wish to surrender the game to " + OTHER_NAME + "?")) {
      MY_SOCKET.emit("gameEnded_withEnemyWin", REGION_NAME, SELF_NAME, getPCNames(PLAYER_GAMECARD_OBJS), OTHER_NAME, getPCNames(ENEMY_GAMECARD_OBJS), true);
    }
  }
  return;
}

function updateTokenClock(){
  let clock = document.getElementById("playerTurn"); // #TODO make this & similar jquery
  let secLeft = (PICK_PHASE_TIMER - (Date.now() - PICK_PHASE_STARTED_AT))/1000;
  clock.textContent = "pick your cards ("+Math.round(secLeft)+" seconds left)";
  if (secLeft <= 0) {
    //clockBeep(1.0);
    clock.textContent = "";
    tokenClockDone();
  } else {
    if (secLeft < 5){ playSound("pickPhaseTick", 0.7); } else { playSound("pickPhaseTick", 0.5); }
    setTimeout(updateTokenClock, 1000);
  }
}

function tokenClockDone(){
  changeGameModeTo("startup");
  passive_athena();
  MY_SOCKET.emit("doneWithTokenPick", exportAllP1Cs(false));
}

function updateTurnClock(){
  if (TURN_STARTED_AT == undefined) { return; }
  let clock = document.getElementById("playerTurn");
  let secLeft = (TURN_TIMER - (Date.now() - TURN_STARTED_AT))/1000;
  
  const clockSplit = clock.textContent.split('(');
  if (clockSplit.length > 1){
    clock.textContent = clockSplit[0] + "("+Math.round(secLeft)+" seconds left)";
  } else {
    clock.textContent = clock.textContent + " ("+Math.round(secLeft)+" seconds left)";
  }

  if (secLeft <= 0) {
    //clockBeep(1.0);
    attackComplete();
  } else {
    if (secLeft < 5){ playSound("playerPhaseTick", 0.7); }
    setTimeout(updateTurnClock, 1000);
  }
}

function beginTurn(yourEnemysCards, yourEnemysVerOfYourCards){
  changeGameModeTo("p1-active");
  playSound("yourTurnNow", 1.0);
  console.log("it's my turn! ========");
  if (TIMED_TURNS) {
    TURN_STARTED_AT = Date.now();
    setTimeout(updateTurnClock, 1000);
  }
  console.log("opponent cards look like", yourEnemysCards);

  if (yourEnemysCards != undefined){
    importAllP2Cs(yourEnemysCards);
    if (yourEnemysVerOfYourCards != undefined){
      importAllP1Cs(yourEnemysVerOfYourCards);
    }
  }

  atTurnStart(false); // if true, flip enemy
}

function atTurnStart(suppressNotif){
  poisonThePoisoned();
  passive_hestia(true, suppressNotif);
  passive_hermes(suppressNotif);
  console.log("AT TURN START");
  forAll_decreaseStatusCooldowns();

  rerenderAllGamecardsAndTokens();
}

function mouseOverTile(evt) {
    hoverMouseHighlight(false);
    CURRENT_MOUSE_Q = evt.target.cube_q;
    CURRENT_MOUSE_R = evt.target.cube_r;
    CURRENT_MOUSE_S = evt.target.cube_s;
    hoverMouseHighlight(true);
    playSound("tileHovers", rand(0.1,0.2));

    // update info box
    const gameInfoBox = document.getElementById("gameInfoBox");
    var tokenOnTile;
    if (evt.target.classList.contains("token")){
      tokenOnTile = evt.target;
    } else {
      tokenOnTile = evt.target.querySelector('.token');
    }
    if (tokenOnTile != undefined) {
      if (!(tokenOnTile.pcardLink.p1 == false && tokenOnTile.pcardLink.statuses["obscured"] == 1)) { // if not an obscured enemy
        gameInfoBox.innerHTML = get_PC_BroadcastForInfoBox(tokenOnTile.pcardLink, tokenOnTile.classList.contains("player1"));
      }
    }
}

function mouseOutOfGrid(evt) {
    hoverMouseHighlight(false);
    CURRENT_MOUSE_Q = undefined;
    CURRENT_MOUSE_R = undefined;
    CURRENT_MOUSE_S = undefined;
    if (GAME_MODE_MEMORYTARGET != undefined){
      gameInfoBox.innerHTML = get_PC_BroadcastForInfoBox(GAME_MODE_MEMORYTARGET, true);
    }
}

function mouseClickTile(evt) {
  // this should prepare to move token if in p1-active (1)
  // or move the token to this spot if in p1-moveToken (2)
  // or make an attack if in p1-abilityAim or p1-ultimateAim (3, 4)

  // find any token on the tile
  var thisTile = evt.target;
  var tokenOnTile = evt.target.querySelector('.token');

  if (tokenOnTile != undefined && GAME_MODE_MEMORYTARGET != undefined){
    if (tokenOnTile.pcardLink.dead == "defeated" && !canWorkWithDead(GAME_MODE_MEMORYTARGET.cardName)) {
      console.log("this hero has already been defeated");
      return;
    }
  }

  var cQ = thisTile.cube_q;
  var cR = thisTile.cube_r;
  var cS = thisTile.cube_s;
  
  var distanceDifference;
  if (GAME_MODE_MEMORYTARGET != undefined) {
    distanceDifference = getTileDistance(cQ, cR, cS, GAME_MODE_MEMORYTARGET.getQ(), GAME_MODE_MEMORYTARGET.getR(), GAME_MODE_MEMORYTARGET.getS()); // #TODO visually pick token up with mouse click as well
  }

  if (GAME_MODE == "p1-active") { ///// (1) p1-active
    if (tokenOnTile == null) {
      processBroadcast("alert", true, "there is no token to move on this tile"); return;
    } else if (tokenOnTile.classList.contains("player1") == false) {
      processBroadcast("alert", true, "this is "+OTHER_NAME+"'s token"); return;
    } else if (tokenOnTile.pcardLink.dead == "defeated") {
      processBroadcast("alert", true, "this hero has already been defeated"); return;
    } else { // success
      playSound("tokenPickedUp", rand(0.5,0.7));
      transitionToMoveTokenMode(tokenOnTile);
    }

  } else if (GAME_MODE == "p1-moveToken") {  ///// (2) p1-moveToken
    if (tokenOnTile != null && tokenOnTile.pcardLink != GAME_MODE_MEMORYTARGET) {
      processBroadcast("alert", true, "there is already a hero at this location");
      resetToActiveMode(); return;
    }
    if (distanceDifference > GAME_MODE_MEMORYTARGET.getCurrentMovement()) {
      let errorMsg = "MVT of " + GAME_MODE_MEMORYTARGET.getCurrentMovement() + " is not sufficient";
      processBroadcast("alert", true, errorMsg);
      resetToActiveMode(); return;
    }
    if (thisTile.classList.contains("offgrid")) {
      if (GAME_MODE_MEMORYTARGET.cardName == "Nyx") { // passive_nyx
        broadcastMsg("passive", true, "Nyx", undefined);
      } else {
        let errorMsg = GAME_MODE_MEMORYTARGET.cardName + " cannot use off-grid tiles";
        processBroadcast("alert", true, errorMsg);
        resetToActiveMode(); return;
      }
    }
    // success
    highlightSelfAndRadius("rangeHighlight", false, GAME_MODE_MEMORYTARGET.getCurrentMovement(),
    GAME_MODE_MEMORYTARGET.getQ(), GAME_MODE_MEMORYTARGET.getR(), GAME_MODE_MEMORYTARGET.getS());
    moveToken(GAME_MODE_MEMORYTARGET, true, cQ, cR);
    playSound("tokenPutDown",1.0);
    passive_hestia(false);
    toSelectAttackMode();

  } else if (GAME_MODE == "p1-abilityAim") {  ///// (3) p1-abilityAim
    if (distanceDifference > GAME_MODE_MEMORYTARGET.ability_aim_range) {
      let errorMsg = "ability range of " + GAME_MODE_MEMORYTARGET.ability_aim_range + " is not sufficient";
      processBroadcast("alert", true, errorMsg);
      relinquishAimingMouseHighlight()
      aimingTargetReachHighlight(false, GAME_MODE_MEMORYTARGET.ability_aim_range);
      toSelectAttackMode(); return;
    }
    // success
    relinquishAimingMouseHighlight();
    aimingTargetReachHighlight(false, GAME_MODE_MEMORYTARGET.ability_aim_range);
    abilityAttack(GAME_MODE_MEMORYTARGET, cQ, cR, cS);
    attackComplete();
  } else if (GAME_MODE == "p1-ultimateAim") {  ///// (3) p1-ultimateAim
    if (distanceDifference > GAME_MODE_MEMORYTARGET.ult_aim_range) {
      let errorMsg = "ultimate range of " + GAME_MODE_MEMORYTARGET.ult_aim_range + " is not sufficient";
      processBroadcast("alert", true, errorMsg);
      relinquishAimingMouseHighlight();
      aimingTargetReachHighlight(false, GAME_MODE_MEMORYTARGET.ult_aim_range);
      toSelectAttackMode(); return;
    }
    // success
    relinquishAimingMouseHighlight();
    aimingTargetReachHighlight(false, GAME_MODE_MEMORYTARGET.ult_aim_range);
    ultimateAttack(GAME_MODE_MEMORYTARGET, cQ, cR, cS);
    attackComplete();
  }
}

function attackComplete(){
  TURN_STARTED_AT = undefined;
  giveAllTurnMana(); // attack mana is given in autoattack
  passive_apollo();
  passive_kronos();
  if (GAME_MODE_MEMORYTARGET != undefined){ highlightMemoryTarget(false); }
  GAME_MODE_MEMORYTARGET = undefined;

  let gameOver = checkGameOver();
  if (gameOver == "ongoing"){
    TURNS_ALLOCATED -= 1;
    if (TURNS_ALLOCATED > 0){
      beginTurn(undefined, undefined); // includes a rerender
      MY_SOCKET.emit("tellRival_ongoingProgress", exportAllP1Cs(), exportAllP2Cs());
    } else {
      changeGameModeTo('p2-turn1');
      rerenderAllGamecardsAndTokens();
      MY_SOCKET.emit("tellRival_yourTurn", exportAllP1Cs(), exportAllP2Cs());
    }
  } else if (gameOver == "tie") {
    MY_SOCKET.emit("gameEnded_withTie", REGION_NAME, SELF_NAME, getPCNames(PLAYER_GAMECARD_OBJS), OTHER_NAME, getPCNames(ENEMY_GAMECARD_OBJS));
  } else if (gameOver == "p1win") {
    MY_SOCKET.emit("gameEnded_withMyWin", REGION_NAME, SELF_NAME, getPCNames(PLAYER_GAMECARD_OBJS), OTHER_NAME, getPCNames(ENEMY_GAMECARD_OBJS));
  } else if (gameOver == "p2win") {
    MY_SOCKET.emit("gameEnded_withEnemyWin", REGION_NAME, SELF_NAME, getPCNames(PLAYER_GAMECARD_OBJS), OTHER_NAME, getPCNames(ENEMY_GAMECARD_OBJS));
  } else {
    console.error("gameOver issue", gameOver);
  }  
}

function passButtonClick(){
  playSound("passClicked", 0.7);
  document.getElementById("passButton").disabled = true;
  document.getElementById("autoButton").disabled = true;
  document.getElementById("abilityButton").disabled = true;
  document.getElementById("ultButton").disabled = true;
  if (GAME_MODE == "p1-attackSelect"){
    attackComplete();
  }
}

function autoButtonClick(){
  playSound("autoattackClicked", 0.7);
  document.getElementById("passButton").disabled = true;
  document.getElementById("autoButton").disabled = true;
  document.getElementById("abilityButton").disabled = true;
  document.getElementById("ultButton").disabled = true;
  highlightSelfAndRadius("autoattackPreview", false, GAME_MODE_MEMORYTARGET.current_normal_attack_range, GAME_MODE_MEMORYTARGET.getQ(), GAME_MODE_MEMORYTARGET.getR(), GAME_MODE_MEMORYTARGET.getS());
  if (GAME_MODE == "p1-attackSelect"){
    changeGameModeTo('p1-autoattack');
    autoattack(GAME_MODE_MEMORYTARGET);
    attackComplete();
  }
}

function abilityButtonClick(){
  playSound("abilityClicked", 0.7);
  document.getElementById("passButton").disabled = true;
  document.getElementById("autoButton").disabled = true;
  document.getElementById("abilityButton").disabled = true;
  document.getElementById("ultButton").disabled = true;
  if (GAME_MODE == "p1-attackSelect"){
    if (GAME_MODE_MEMORYTARGET.ability_is_aimed) {
      changeGameModeTo('p1-abilityAim');
      aimAndHijackMouseHighlight(GAME_MODE_MEMORYTARGET.ability_aim_aoe);
      aimingTargetReachHighlight(true, GAME_MODE_MEMORYTARGET.ability_aim_range);
    } else {
      changeGameModeTo('p1-ability');
      abilityAttack(GAME_MODE_MEMORYTARGET);
      attackComplete();
    }
  }
}

function ultButtonClick(){
  playSound("ultimateClicked", 0.7);
  document.getElementById("passButton").disabled = true;
  document.getElementById("autoButton").disabled = true;
  document.getElementById("abilityButton").disabled = true;
  document.getElementById("ultButton").disabled = true;
  if (GAME_MODE == "p1-attackSelect"){
    if (GAME_MODE_MEMORYTARGET.ult_is_aimed) {
      changeGameModeTo('p1-ultimateAim');
      aimAndHijackMouseHighlight(GAME_MODE_MEMORYTARGET.ult_aim_aoe);
      aimingTargetReachHighlight(true, GAME_MODE_MEMORYTARGET.ult_aim_range);
    } else {
      changeGameModeTo('p1-ultimate');
      ultimateAttack(GAME_MODE_MEMORYTARGET);
      attackComplete();
    }
  }
}

function mouseHoverTile(evt) {
  /* TODO show token stats in the popup window */
}

function mouseClickToken(evt) {
  evt.target.parentNode.click();
}

function mouseEnterAuto(evt){
  highlightSelfAndRadius("autoattackPreview", true, GAME_MODE_MEMORYTARGET.current_normal_attack_range, GAME_MODE_MEMORYTARGET.getQ(), GAME_MODE_MEMORYTARGET.getR(), GAME_MODE_MEMORYTARGET.getS());
}

function mouseExitAuto(evt) {
  highlightSelfAndRadius("autoattackPreview", false, GAME_MODE_MEMORYTARGET.current_normal_attack_range, GAME_MODE_MEMORYTARGET.getQ(), GAME_MODE_MEMORYTARGET.getR(), GAME_MODE_MEMORYTARGET.getS());
}

function startBgm(){
  if (BGM_MUTE){
      SOUND_OBJECTS["bgm"][0].pause();
      SOUND_OBJECTS["bgm"][0].currentTime = 0;
  } else {
    console.log(SOUND_OBJECTS["bgm"], SOUND_OBJECTS);
    SOUND_OBJECTS["bgm"][0].volume = 0.2;
    SOUND_OBJECTS["bgm"][0].play();
  }
}

function muteBGM(){
  console.log("setting bgm mute to", !BGM_MUTE);
  BGM_MUTE = !BGM_MUTE;
  startBgm();

  if (BGM_MUTE) {
    document.getElementById("muteButton").innerText = "unmute";
  } else {
    document.getElementById("muteButton").innerText = "mute";
  }
}

function mouseOverAvailableCard(evt, referenceCard) {
  const gameInfoBox = document.getElementById("gameInfoBox");
  var gCard = onFieldCards.querySelector('#p1card-'+referenceCard.cardName);
  if (gCard != undefined){
    gameInfoBox.innerHTML = get_PC_BroadcastForInfoBox(gCard.pcardLink, true);
  } else {
    gameInfoBox.innerHTML = get_BC_BroadcastForInfoBox(referenceCard);
  }
  playSound("availableCardHovers", rand(0.4,0.6));
}

function mouseOverPowerbutton(evt) {
  // #TODO only if button active
  return;
}

function mouseClickAvailableCard(evt) {
    const thisCardName = evt.target.querySelector('.baseCardName').textContent;
    const onFieldCards = document.getElementById("onFieldCards");
    const countPlayersPicks = onFieldCards.childElementCount;
    if (GAME_MODE != "pick-phase") {
      console.error("not pick phase"); return;
    }

    var dupeCard = onFieldCards.querySelector('#p1card-'+thisCardName);
    if (dupeCard != null) { // search if card with that ID already selected to be played
      let existingPcard = dupeCard.pcardLink;
      evt.target.setAttribute("acChosen",false);
      PLAYER_GAMECARD_OBJS.splice(PLAYER_GAMECARD_OBJS.indexOf(existingPcard), 1); // remove from game cards
      removeTokenAndShiftOthers(existingPcard);
      dupeCard.remove(); // remove div
      playSound("undo", 1.0);
      return;
    }
    
    if (countPlayersPicks >= 5){
      processBroadcast("alert", true, "you can pick at most 5 cards"); return;
      return;
    }

    // define a new player card with a starter position
    playSound("availableCardSelect", 0.7);
    let newPC = selectAvailCard(thisCardName, -(HEX_RADIUS-1)+countPlayersPicks, HEX_RADIUS);
    rerenderAllGamecardsAndTokens();

    const gameInfoBox = document.getElementById("gameInfoBox");
    gameInfoBox.innerHTML = get_PC_BroadcastForInfoBox(newPC, true);
}

function mouseOverGameCard(evt, referenceCard) {
  const gameInfoBox = document.getElementById("gameInfoBox");
  gameInfoBox.innerHTML = get_PC_BroadcastForInfoBox(referenceCard, evt.target.classList.contains("player1"));
  playSound("playerCardHovers", rand(0.4,0.6));
  
  if (referenceCard.p1){
    document.getElementById("p1token-" + referenceCard.cardName).setAttribute("gameCardGlow", true);
  } else {
    document.getElementById("p2token-" + referenceCard.cardName).setAttribute("gameCardGlow", true);
  }
}

function mouseOutOfGameCard(evt, referenceCard) {
  if (referenceCard.p1){
    document.getElementById("p1token-" + referenceCard.cardName).setAttribute("gameCardGlow", false);
  } else {
    document.getElementById("p2token-" + referenceCard.cardName).setAttribute("gameCardGlow", false);
  }
}

function mouseClickGameCard(evt, pcardRef) {
  if (GAME_MODE == "pick-phase") {
    if (pcardRef.p1){
      document.getElementById("p1token-" + pcardRef.cardName).setAttribute("gameCardGlow", false);
    } else {
      document.getElementById("p2token-" + pcardRef.cardName).setAttribute("gameCardGlow", false);
    }

    document.getElementById("availCard-" + pcardRef.cardName).setAttribute("acChosen",false);
    PLAYER_GAMECARD_OBJS.splice(PLAYER_GAMECARD_OBJS.indexOf(pcardRef), 1); // remove from game cards
    evt.target.remove(); // remove div
    removeTokenAndShiftOthers(pcardRef);
    playSound("undo", 1.0);
  }
}