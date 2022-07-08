// @miya7090

const MY_SOCKET = io(); // create new instance

// #TODO get rid of figurine code

document.addEventListener("DOMContentLoaded", () => {
  /* ui bgm set up */
  initializeSoundObjects();
  setTimeout(startBgm, 2000); // start music 2 secs in

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

  /* socket stuff */
  MY_SOCKET.on('connect', ()=>{
    MY_SOCKET.emit("registerPlayer", roomCode);
  });

  MY_SOCKET.on('cannotJoinGame', ()=>{
    window.location.href = "/error.html";
  });

  MY_SOCKET.on('tokenPickPhase', (otherId)=>{ // #TODO make opponent plans visible live (ghost coloring?)
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
        window.location.href = "/";
        MY_SOCKET.emit("commandDisconnectGame");
      } else {
        if (confirm(OTHER_NAME+" has disconnected... would you like to wait for " + OTHER_NAME + " to return?")){
          setTimeout(mySocketPromptDisconnected, WAIT_FOR_RECONNECT);
          AM_WAITING_FOR_OPPONENT_RECONNECT = true;
        } else {
          MY_SOCKET.emit("gameEnded_withMyWin", REGION_NAME, SELF_NAME, getPCNames(PLAYER_GAMECARD_OBJS), OTHER_NAME, getPCNames(ENEMY_GAMECARD_OBJS));
        }
      }
    }
  });

  function mySocketPromptDisconnected() {
    if (AM_WAITING_FOR_OPPONENT_RECONNECT){
      if (confirm(OTHER_NAME+" has not yet reconnected... keep waiting?")){
        setTimeout(mySocketPromptDisconnected, WAIT_FOR_RECONNECT);
      } else {
        window.location.href = "/";
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
    window.location.href = "/";
  });

  MY_SOCKET.on('gameTie', ()=>{
    alert("game over: you have tied with "+OTHER_NAME);
    window.location.href = "/";
  });

  MY_SOCKET.on('gameWin', (wasSurrender)=>{
    if (wasSurrender == true) {
      alert("congrats! "+OTHER_NAME+" has surrendered");
    } else {
      alert("congrats! you defeated "+OTHER_NAME+"!");
    }
    window.location.href = "/";
  });

  MY_SOCKET.on('gameLoss', (wasSurrender)=>{
    if (wasSurrender == true) {
      alert("you surrendered the game to "+OTHER_NAME);
    } else {
      alert(OTHER_NAME+" has won the game");
    }
    
    window.location.href = "/";
  });

  MY_SOCKET.on('yourTurn', (yourEnemysCards, yourEnemysVerOfYourCards)=>{
    TURNS_ALLOCATED = 2;
    beginTurn(yourEnemysCards, yourEnemysVerOfYourCards);
  });

  MY_SOCKET.on('waitTurnAndPopulate', (yourEnemysCards)=>{
    changeGameModeTo("p2-turn1");
    console.log("opponent cards look like", yourEnemysCards);
    importAllP2Cs(yourEnemysCards);
    atTurnStart(true, true);
  });

  MY_SOCKET.on('enemysProgress', (yourEnemysCards, yourEnemysVerOfYourCards)=>{
    changeGameModeTo("p2-turn2");
    importAllP2Cs(yourEnemysCards);
    importAllP1Cs(yourEnemysVerOfYourCards);
    rerenderAllGamecardsAndTokens();
  });
  
  MY_SOCKET.on('giveMessage', (msgType, p1, arg1, arg2)=>{
    processBroadcast(msgType, p1, arg1, arg2);
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

  document.addEventListener('keyup', keyProcessing);
  mainGrid.addEventListener('mouseleave', mouseOutOfGrid);

  autoButton.addEventListener("mouseenter", mouseEnterAuto);
  autoButton.addEventListener("mouseleave", mouseExitAuto);

  // powerbox-hoverbox hover link
  $('#abilityButton').hover(function() {
    let p1Attr = $('#abilityTitle').attr("p1");
    if (p1Attr == "true") { $('#abilityTitle').css('color', '#ffffff'); }
    else if (p1Attr == "false") { $('#abilityTitle').css('color', '#ffffff'); }
  }, function() {
    let p1Attr = $('#abilityTitle').attr("p1");
    if (p1Attr == "true") { $('#abilityTitle').css('color', 'var(--p1ActionTextColor)'); }
    else if (p1Attr == "false") { $('#abilityTitle').css('color', 'var(--p2ActionTextColor)'); }
  });

  $('#ultButton').hover(function() {
    let p1Attr = $('#ultTitle').attr("p1");
    if (p1Attr == true) { $('#abilityTitle').css('color', '#ffffff'); }
    else if (p1Attr == false) { $('#abilityTitle').css('color', '#ffffff'); }
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

  // #TODO add terrain processing

  // display player's available cards
  PLAYER_OWNED.forEach((availCard) => {
    createAvailableCardDiv(availCard);
  }); 

  // use clearInterval, setInterval, card.timerId or similar, setTimeout
  // document.removeEventListener
  // event? event.keyCode, addEventListener
});