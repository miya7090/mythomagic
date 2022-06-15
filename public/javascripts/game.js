// @miya7090

const MY_SOCKET = io(); // create new instance

// #TODO get rid of figurine code

document.addEventListener("DOMContentLoaded", () => {
  /* ui bgm set up */
  setTimeout(startBgm, 2000); // start music 2 secs in

  // clack the powerbox buttons
  var powerButtons = document.getElementsByClassName("button");
  for(let i=0; i < powerButtons.length; i++){
    powerButtons[i].addEventListener('mouseenter', mouseOverPowerbutton);
    powerButtons[i].addEventListener('mouseup', mouseClickPowerbutton);
  }
  
  /* get url parameters */
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get('room');
  const selfName = urlParams.get('self');
  OTHER_NAME = urlParams.get('other');

  /* socket stuff */
  MY_SOCKET.on('connect', ()=>{
    MY_SOCKET.emit("registerPlayer", roomCode);
  });

  MY_SOCKET.on('tokenPickPhase', (otherId)=>{ // #TODO make opponent plans visible live (ghost coloring?)
    OPPONENT_SOCKET_ID = otherId;
    changeGameModeTo("pick-phase");
    PICK_PHASE_STARTED_AT = Date.now();
    setTimeout(updateTokenClock, 1000); // update token clock every second
  });

  MY_SOCKET.on('winThroughForfeit', (reason)=>{
    alert(OTHER_NAME+" has forfeited the game ("+reason+")");
    window.location.href = "/";
  });

  MY_SOCKET.on('forfeit', (reason)=>{
    alert("you have forfeited the game ("+reason+")");
    window.location.href = "/";
  });

  MY_SOCKET.on('yourTurn', (yourEnemysCards, yourEnemysVerOfYourCards)=>{
    changeGameModeTo("p1-active");
    soundNextTurn(1.0);
    console.log("it's my turn!");
    console.log("opponent cards look like", yourEnemysCards);

    importAllP2Cs(yourEnemysCards);
    if (yourEnemysVerOfYourCards != undefined){
      importAllP1Cs(yourEnemysVerOfYourCards);
    }

    rerenderAllGamecardsAndTokens();
  });

  MY_SOCKET.on('waitTurnAndPopulate', (yourEnemysCards)=>{
    changeGameModeTo("p2-active");
    console.log("opponent cards look like", yourEnemysCards);
    importAllP2Cs(yourEnemysCards);
    rerenderAllGamecardsAndTokens();
  });

  MY_SOCKET.on('waitTurn', ()=>{
    changeGameModeTo("p2-active");
    console.log("need to wait for opponent...");
    rerenderAllGamecardsAndTokens();
  });

  ///////////////////////////// JOIN ROOM????????????????????????

  const mainGrid = document.getElementById("hexContainer");
  const onFieldCards = document.getElementById("onFieldCards");
  const enemyCardReference = document.getElementById("enemyCardReference");
  const gameInfoBox = document.getElementById("gameInfoBox");
  const gameOptions = document.getElementById("gameOptions");
  const previewRadius = document.getElementById("previewRadius");
  const playerTurn = document.getElementById("playerTurn");
  const myAvailableCards = document.getElementById("myAvailableCards");

  previewRadius.textContent="Preview radius: "+MOUSE_HOVER_RADIUS;
  playerTurn.textContent=getPlayerTurnText();

  document.addEventListener('keyup', keyProcessing);
  mainGrid.addEventListener('mouseleave', mouseOutOfGrid);

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