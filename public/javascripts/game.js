// @miya7090

const MY_SOCKET = io(); // create new instance

function getUserLoggedIn() {
  let name = "user" + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

document.addEventListener("DOMContentLoaded", () => {
  /* ui sounds set up */
  initializeSoundObjects();

  // clack the powerbox buttons
  var powerButtons = document.getElementsByClassName("button");
  for(let i=0; i < powerButtons.length; i++){
    powerButtons[i].addEventListener('mouseenter', mouseOverPowerbutton);
    //powerButtons[i].addEventListener('mouseup', mouseClickPowerbutton);
  }
  
  /* get url parameters */
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get('room');
  SELF_NAME = urlParams.get('self');
  OTHER_NAME = urlParams.get('other');
  processLobbyCode(urlParams.get('lobby'));
  populateHeroImgCache();

  /* socket stuff */
  MY_SOCKET.on('connect', ()=>{
    MY_SOCKET.emit("registerPlayer", roomCode, getUserLoggedIn());
  });

  MY_SOCKET.on('cannotJoinGame', ()=>{
    window.location.href = "/error.html";
  });

  MY_SOCKET.on('tokenPickPhase', (otherId)=>{
    OPPONENT_SOCKET_ID = otherId;

    if (PICK_PHASE_RANDOM) {
      pickPCardsRandomly();
      tokenClockDone();
    } else {
      changeGameModeTo("pick-phase");
      PICK_PHASE_STARTED_AT = Date.now();
      setTimeout(updateTokenClock, 1000); // update token clock every second
    }
  });

  MY_SOCKET.on('opponentDisconnectWarning', ()=>{
    if (!AM_WAITING_FOR_OPPONENT_RECONNECT){
      if (GAME_MODE == "pick-phase") {
        alert(OTHER_NAME+" has disconnected");
        window.location.href = "/lobby";
        MY_SOCKET.emit("commandDisconnectGame");
      } else {
        if (confirm(OTHER_NAME+" has disconnected... would you like to wait for " + OTHER_NAME + " to return?")){
          setTimeout(mySocketPromptDisconnected, WAIT_FOR_RECONNECT);
          AM_WAITING_FOR_OPPONENT_RECONNECT = true;
        } else {
          MY_SOCKET.emit("gameEnded_withMyWin", REGION_NAME, SELF_NAME, PLAYER_HERO_INITIAL_NAMES, OTHER_NAME, ENEMY_HERO_INITIAL_NAMES, true);
        }
      }
    }
  });

  function mySocketPromptDisconnected() {
    if (AM_WAITING_FOR_OPPONENT_RECONNECT){
      if (confirm(OTHER_NAME+" has not yet reconnected... keep waiting?")){
        setTimeout(mySocketPromptDisconnected, WAIT_FOR_RECONNECT);
      } else {
        window.location.href = "/victory?opponent="+OTHER_NAME;
        MY_SOCKET.emit("commandDisconnectGame");
      }
    }
  }

  MY_SOCKET.on('rivalRejoined', (yourEnemysCards, yourEnemysVerOfYourCards)=>{ // 
    alert(OTHER_NAME + " has reconnected");
    AM_WAITING_FOR_OPPONENT_RECONNECT = false;
    TURNS_ALLOCATED = 1;
    beginTurn(yourEnemysCards, yourEnemysVerOfYourCards);
    MY_SOCKET.emit("tellRival_ongoingProgress", exportAllP1Cs(), exportAllP2Cs());
  });

  MY_SOCKET.on('forfeit', (reason)=>{
    alert("you have forfeited the game ("+reason+")");
    window.location.href = "/lobby";
  });

  MY_SOCKET.on('winThroughForfeit', (reason)=>{
    alert(OTHER_NAME + " has forfeited the game ("+reason+")"); // used only in card picking
    window.location.href = "/lobby";
  });

  MY_SOCKET.on('gameTie', (opponentCookieName)=>{
    MY_SOCKET.emit("updateUserStats", REGION_NAME, "tie", getUserLoggedIn(), opponentCookieName);
    window.location.href = "/tie?opponent="+OTHER_NAME;
  });

  MY_SOCKET.on('gameWin', (wasSurrender, opponentCookieName)=>{
    MY_SOCKET.emit("updateUserStats", REGION_NAME, "win", getUserLoggedIn(), opponentCookieName, wasSurrender);
    if (wasSurrender == true) {
      alert(OTHER_NAME+" has surrendered or left the game");
    }
    window.location.href = "/victory?opponent="+OTHER_NAME;
  });

  MY_SOCKET.on('gameLoss', (wasSurrender, opponentCookieName)=>{
    MY_SOCKET.emit("updateUserStats", REGION_NAME, "loss", getUserLoggedIn(), opponentCookieName);
    if (wasSurrender == true) {
      alert("you surrendered the game to "+OTHER_NAME);
    }    
    window.location.href = "/defeat?opponent="+OTHER_NAME;
  });

  MY_SOCKET.on('yourTurn', (yourEnemysCards, yourEnemysVerOfYourCards)=>{
    TURNS_ALLOCATED = 2;
    if ((yourEnemysCards == undefined || yourEnemysCards == null) && (yourEnemysVerOfYourCards == undefined || yourEnemysVerOfYourCards == null)) {
      // seems like a disconnection
      alert("this game had both players disconnect and has ended");
      window.location.href = "/lobby";
    }
    beginTurn(yourEnemysCards, yourEnemysVerOfYourCards);
  });

  MY_SOCKET.on('waitTurnAndPopulate', (yourEnemysCards)=>{
    changeGameModeTo("p2-turn1");
    console.log("opponent cards look like", yourEnemysCards);
    importAllP2Cs(yourEnemysCards);
    atTurnStart(true, true);
  });

  MY_SOCKET.on('enemysProgress', (yourEnemysCards, yourEnemysVerOfYourCards)=>{
    if ((yourEnemysCards == undefined || yourEnemysCards == null) && (yourEnemysVerOfYourCards == undefined || yourEnemysVerOfYourCards == null)) {
      // seems like a disconnection
      alert("this game had both players disconnect and has ended");
      window.location.href = "/lobby";
    }
    changeGameModeTo("p2-turn2");
    importAllP2Cs(yourEnemysCards);
    importAllP1Cs(yourEnemysVerOfYourCards);
    rerenderAllGamecardsAndTokens();
  });
  
  MY_SOCKET.on('giveMessage', (msgType, p1, arg1, arg2)=>{
    processBroadcast(msgType, p1, arg1, arg2);
  });

  MY_SOCKET.on('truceRequest', ()=>{
    if (confirm(OTHER_NAME + " has proposed a truce. would you like to accept?")) {
      MY_SOCKET.emit("gameEnded_withTie", REGION_NAME, SELF_NAME, PLAYER_HERO_INITIAL_NAMES, OTHER_NAME, ENEMY_HERO_INITIAL_NAMES);
    } else {
      MY_SOCKET.emit("tellRival_rejectTruce");
    }
  });

  MY_SOCKET.on('truceFailed', ()=>{
    alert(OTHER_NAME + " has rejected your truce");
  });

  /////////////////////////////

  const mainGrid = document.getElementById("hexContainer");
  const onFieldCards = document.getElementById("onFieldCards");
  const enemyCardReference = document.getElementById("enemyCardReference");
  const gameInfoBox = document.getElementById("gameInfoBox");
  const gameOptions = document.getElementById("gameOptions");
  const previewRadius = document.getElementById("previewRadius");
  const playerTurn = document.getElementById("playerTurn");
  const myAvailableCards = document.getElementById("myAvailableCards");
  const autoButton = document.getElementById("autoButton");

  previewRadius.textContent="Preview radius: "+MOUSE_HOVER_RADIUS;
  playerTurn.textContent=getPlayerTurnText();

  document.getElementById("playerNameInBox").innerText = SELF_NAME;
  document.getElementById("enemyNameInBox").innerText = OTHER_NAME;

  document.addEventListener('keyup', keyProcessing);
  mainGrid.addEventListener('mouseleave', mouseOutOfGrid);

  autoButton.addEventListener("mouseenter", mouseEnterAuto);
  autoButton.addEventListener("mouseleave", mouseExitAuto);

  // powerbox-hoverbox hover link
  $('#abilityButton').hover(function() {
    let p1Attr = $('#abilityTitle').attr("p1");
    if (p1Attr == "true") { $('#abilityTitle').css('color', 'yellow'); }
    else if (p1Attr == "false") { $('#abilityTitle').css('color', 'yellow'); }
  }, function() {
    let p1Attr = $('#abilityTitle').attr("p1");
    if (p1Attr == "true") { $('#abilityTitle').css('color', 'var(--p1ActionTextColor)'); }
    else if (p1Attr == "false") { $('#abilityTitle').css('color', 'var(--p2ActionTextColor)'); }
  });

  $('#ultButton').hover(function() {
    let p1Attr = $('#ultTitle').attr("p1");
    if (p1Attr == true) { $('#abilityTitle').css('color', 'yellow'); }
    else if (p1Attr == false) { $('#abilityTitle').css('color', 'yellow'); }
  }, function() {
    let p1Attr = $('#ultTitle').attr("p1");
    if (p1Attr == true) { $('#ultTitle').css('color', 'var(--p1ActionTextColor)'); }
    else if (p1Attr == false) { $('#ultTitle').css('color', 'var(--p2ActionTextColor)'); }
  });

  // add tiles to game board
  for (let r = -HEX_RADIUS; r <= HEX_RADIUS; r++) {
    const row = document.createElement("div");
    row.classList.add("hexRow");
    mainGrid.appendChild(row);
    for (let full_q = -HEX_RADIUS; full_q <= HEX_RADIUS; full_q++) {
      var q = full_q; // offset number of columns in odd rows instead of just using q
      if (r&1 && full_q == HEX_RADIUS) { break; }
        createTileDiv(row, q, r);      
    }
  }

  // display player's available cards
  PLAYER_OWNED.forEach((availCard) => {
    createAvailableCardDiv(availCard);
  }); 

  // use clearInterval, setInterval, card.timerId or similar, setTimeout
  // document.removeEventListener
  // event? event.keyCode, addEventListener
});