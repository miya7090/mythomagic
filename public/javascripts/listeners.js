// @miya7090

const clack1 = '../sounds/clack1.mp3'
const clack2 = '../sounds/clack2.mp3'
const clack3 = '../sounds/clack3.mp3'
const clack4 = '../sounds/clack4.mp3'
const clack5 = '../sounds/clack5.mp3'
const clack6 = '../sounds/clack6.mp3'
const boop = '../sounds/boop.mp3'
const beep = '../sounds/beep.mp3'
const bgmSource = '../sounds/50 mulling.mp3';

HIGHLIGHT_TILE_MEMORY_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--highlightedTileMemory');
HIGHLIGHT_TILE_ATTACK_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--highlightedTileAttack');

// what to do when key pressed
function keyProcessing(event) {
  if ((event.keyCode === 90 || event.keyCode === 88) && GAME_MODE != "p1-moveToken") { // mouse hover radius stuff
    // first clear hover highlights
    if (CURRENT_MOUSE_Q !== undefined) {
      hoverMouseHighlight(false);
    }
    if (event.keyCode === 90 && MOUSE_HOVER_RADIUS > 0) { // z, reduce radius
      MOUSE_HOVER_RADIUS -= 1;
      previewRadius.textContent="Preview radius: "+MOUSE_HOVER_RADIUS;
    } else if (event.keyCode === 88 && MOUSE_HOVER_RADIUS < 12) { // x, increase radius
      MOUSE_HOVER_RADIUS += 1;
      previewRadius.textContent="Preview radius: "+MOUSE_HOVER_RADIUS;
    }
    // then redo hover highlights
    if (CURRENT_MOUSE_Q !== undefined) {
      hoverMouseHighlight(true);
    }
  }
  return;
}

function mouseOverTile(evt) {
    hoverMouseHighlight(false);
    CURRENT_MOUSE_Q = evt.target.cube_q;
    CURRENT_MOUSE_R = evt.target.cube_r;
    CURRENT_MOUSE_S = evt.target.cube_s;
    hoverMouseHighlight(true);
    playSoundRandom([clack4, clack5, clack6], rand(0.3,0.5));
}

function mouseOutOfGrid(evt) {
    hoverMouseHighlight(false);
    CURRENT_MOUSE_Q = undefined;
    CURRENT_MOUSE_R = undefined;
    CURRENT_MOUSE_S = undefined;
}

function resetToActiveMode(){
  changeGameModeTo("p1-active");
  highlightSelfAndRadius("rangeHighlight", false, GAME_MODE_MEMORYTARGET.current_movement,
  GAME_MODE_MEMORYTARGET.getQ(), GAME_MODE_MEMORYTARGET.getR(), GAME_MODE_MEMORYTARGET.getS());
  GAME_MODE_MEMORYTARGET = undefined;
}

function toSelectAttackMode(){
  changeGameModeTo("p1-attackSelect");
  document.getElementById("autoButton").disabled = false;
  document.getElementById("abilityButton").disabled = false; //#TODO check mana first
  document.getElementById("ultButton").disabled = false;
}

function transitionToMoveTokenMode(tokenOnTile){
  changeGameModeTo("p1-moveToken");
  GAME_MODE_MEMORYTARGET = tokenOnTile.pcardLink;
  highlightSelfAndRadius("rangeHighlight", true, GAME_MODE_MEMORYTARGET.current_movement,
    GAME_MODE_MEMORYTARGET.getQ(), GAME_MODE_MEMORYTARGET.getR(), GAME_MODE_MEMORYTARGET.getS());
}

function mouseClickTile(evt) {
  playSoundRandom([clack2, clack3], 0.9);
  // this should prepare to move token if in p1-active (1)
  // or move the token to this spot if in p1-moveToken (2)
  // or make an attack if in p1-abilityAim or p1-ultimateAim (3, 4)

  // find any token on the tile
  var thisTile;
  var tokenOnTile;
  if (evt.target.classList.contains("token")){
    thisTile = evt.target.parentNode;
    tokenOnTile = evt.target;
  } else {
    thisTile = evt.target;
    tokenOnTile = evt.target.querySelector('.token');
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
      console.error("there is no token to move on this tile"); return;
    } else if (tokenOnTile.classList.contains("player1") == false) {
      console.error("this is not your token"); return;
    } else { // success
      transitionToMoveTokenMode(tokenOnTile);
    }

  } else if (GAME_MODE == "p1-moveToken") {  ///// (2) p1-moveToken
    if (tokenOnTile != null && tokenOnTile.pcardLink != GAME_MODE_MEMORYTARGET) {
      console.error("there is already a tile at this location, try again");
      resetToActiveMode(); return;
    }
    if (distanceDifference > GAME_MODE_MEMORYTARGET.current_movement) {
      console.error("tile of distance", distanceDifference, "cannot be reached with movement", GAME_MODE_MEMORYTARGET.current_movement);
      resetToActiveMode(); return;
    }
    // success
    highlightSelfAndRadius("rangeHighlight", false, GAME_MODE_MEMORYTARGET.current_movement,
    GAME_MODE_MEMORYTARGET.getQ(), GAME_MODE_MEMORYTARGET.getR(), GAME_MODE_MEMORYTARGET.getS());
    moveToken(GAME_MODE_MEMORYTARGET, true, cQ, cR);
    toSelectAttackMode();

  } else if (GAME_MODE == "p1-abilityAim") {  ///// (3) p1-abilityAim
    if (distanceDifference > GAME_MODE_MEMORYTARGET.ability_aim_range) {
      console.error("tile of distance", distanceDifference, "cannot be reached with ability range", GAME_MODE_MEMORYTARGET.ability_aim_range);
      relinquishAimingMouseHighlight()
      aimingTargetReachHighlight(false, GAME_MODE_MEMORYTARGET.ability_aim_range);
      toSelectAttackMode(); return;
    }
    // success
    relinquishAimingMouseHighlight();
    aimingTargetReachHighlight(false, GAME_MODE_MEMORYTARGET.ability_aim_range);
    abilityAttack(cQ, cR, cS);
    attackComplete();
  } else if (GAME_MODE == "p1-ultimateAim") {  ///// (3) p1-ultimateAim
    if (distanceDifference > GAME_MODE_MEMORYTARGET.ult_aim_range) {
      console.error("tile of distance", distanceDifference, "cannot be reached with ultimate range", GAME_MODE_MEMORYTARGET.ult_aim_range);
      relinquishAimingMouseHighlight();
      aimingTargetReachHighlight(false, GAME_MODE_MEMORYTARGET.ult_aim_range);
      toSelectAttackMode(); return;
    }
    // success
    relinquishAimingMouseHighlight();
    aimingTargetReachHighlight(false, GAME_MODE_MEMORYTARGET.ult_aim_range);
    ultimateAttack(cQ, cR, cS);
    attackComplete();
  }
}

function attackComplete(){
  changeGameModeTo('p2-active');
  MY_SOCKET.emit("tellRival_yourTurn", exportAllP1Cs(false), exportAllP2Cs(true));
  GAME_MODE_MEMORYTARGET = undefined;
  rerenderAllGamecardsAndTokens();
}

function autoButtonClick(){
  document.getElementById("autoButton").disabled = true;
  document.getElementById("abilityButton").disabled = true;
  document.getElementById("ultButton").disabled = true;
  if (GAME_MODE == "p1-attackSelect"){
    changeGameModeTo('p1-autoattack');
    autoattack(GAME_MODE_MEMORYTARGET);
    attackComplete();
  }
}

function abilityButtonClick(){
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
      abilityAttack();
      attackComplete();
    }
  }
}

function ultButtonClick(){
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
      ultimateAttack();
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

function startBgm(){
  var bgm = new Audio(bgmSource); 
  bgm.addEventListener('ended', function() {
      this.currentTime = 0;
      this.play();
  }, false);
  bgm.volume = 0.6;
  bgm.play();
}

function playSoundRandom(choices, volume){
  let chosenSound = choices[Math.floor(Math.random() * choices.length)];
  let snd = new Audio(chosenSound);
  snd.volume = volume;
  snd.play();
}

function clockBoop(volume){
  let snd = new Audio(boop);
  snd.volume = volume;
  snd.play();
}

function clockBeep(volume){
  let snd = new Audio(beep);
  snd.volume = volume;
  snd.play();
}

function mouseOverAvailableCard(evt, referenceCard) {
  const gameInfoBox = document.getElementById("gameInfoBox");
  gameInfoBox.innerHTML = get_BC_BroadcastForInfoBox(referenceCard);

  playSoundRandom([clack3, clack4, clack5], rand(0.4,0.6));
}

function mouseOverPowerbutton(evt) {
  return; // no sound
}

function mouseClickPowerbutton(evt) {
  if (evt.target.disabled == false) {
    playSoundRandom([clack1, clack2], 0.7);
  }
}

function mouseClickAvailableCard(evt) {
    const onFieldCards = document.getElementById("onFieldCards");
    const countPlayersPicks = onFieldCards.childElementCount;
    if (GAME_MODE != "pick-phase") {
      console.error("cannot pick this card - it is not selection phase");
      return;
    } else if (countPlayersPicks >= 5){
      console.error("player has already picked 5 cards"); // #TODO express errors nicely
      return;
    }

    // avoid clicking on card children instead
    var clickTarget = evt.target;
    if (clickTarget.classList.contains("card") == false){
      clickTarget = clickTarget.closest(".card");
    }
    const thisCardName = clickTarget.querySelector('.baseCardName').textContent;

    if (onFieldCards.querySelector('#p1card-'+thisCardName) != null) { // search if card with that ID already selected to be played
        console.error(thisCardName+" card already picked");
    } else {
        // define a new player card with a starter position
        playSoundRandom([clack1, clack2], 0.7);
        var hasHolo = PLAYER_HOLOFOIL.includes(thisCardName);
        var newPC = new PlayerCard(thisCardName, hasHolo, -(HEX_RADIUS-1)+countPlayersPicks,HEX_RADIUS,-1-countPlayersPicks);
        createGameCardDiv(newPC);
        createTokenDiv(newPC);
        PLAYER_GAMECARD_OBJS.push(newPC);
    }
}

function mouseOverGameCard(evt, referenceCard) {
  const gameInfoBox = document.getElementById("gameInfoBox");
  gameInfoBox.innerHTML = get_PC_BroadcastForInfoBox(referenceCard);
  playSoundRandom([clack3, clack4], rand(0.4,0.6));
}

function mouseClickGameCard(evt, pcardRef) {
  if (GAME_MODE == "pick-phase") {
    PLAYER_GAMECARD_OBJS.splice(PLAYER_GAMECARD_OBJS.indexOf(pcardRef), 1); // remove from game cards
    evt.target.remove(); // remove div
    removeTokenAndShiftOthers(pcardRef);
    playSoundRandom([clack2, clack3], 0.7);
  }
}