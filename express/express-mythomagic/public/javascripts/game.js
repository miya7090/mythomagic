// @miya7090

const MY_SOCKET = io(); // create new instance

function updateTokenClock(){ // #TODO move to listeners
  let clock = document.getElementById("tokenCountdown");
  let secLeft = (PICK_PHASE_TIMER - (Date.now() - PICK_PHASE_STARTED_AT))/1000;
  clock.textContent = "pick your cards and place your tokens ("+Math.round(secLeft)+" seconds left)";
  if (secLeft <= 0) {
    clock.textContent = "";
    changeGameModeTo("startup");
    console.log("tokentransmitting", exportAllP1Cs(false));
    MY_SOCKET.emit("doneWithTokenPick", exportAllP1Cs(false));
  } else {
    setTimeout(updateTokenClock, 1000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get('room');
  const selfName = urlParams.get('self');
  const otherName = urlParams.get('other');

  MY_SOCKET.on('connect', ()=>{
    MY_SOCKET.emit("registerPlayer", roomCode);
  });

  MY_SOCKET.on('tokenPickPhase', (otherId)=>{
    OPPONENT_SOCKET_ID = otherId;
    changeGameModeTo("pick-phase");
    PICK_PHASE_STARTED_AT = Date.now();
    setTimeout(updateTokenClock, 1000); // update token clock every second
  });

  MY_SOCKET.on('yourTurn', (yourEnemysCards, yourEnemysVerOfYourCards)=>{
    changeGameModeTo("p1-active");
    console.log("it's my turn!");
    console.log("opponent cards look like", yourEnemysCards);

    importAllP2Cs(yourEnemysCards);
    if (yourEnemysVerOfYourCards != undefined){
      importAllP1Cs(yourEnemysVerOfYourCards);
    }

    rerenderAllGamecards();
  });

  MY_SOCKET.on('waitTurnAndPopulate', (yourEnemysCards)=>{
    changeGameModeTo("p2-active");
    console.log("opponent cards look like", yourEnemysCards);
    importAllP2Cs(yourEnemysCards);
    rerenderAllGamecards();
  });

  MY_SOCKET.on('waitTurn', ()=>{
    changeGameModeTo("p2-active");
    console.log("need to wait for opponent...");
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

  document.addEventListener('keydown', keyProcessing);
  mainGrid.addEventListener('mouseleave', mouseOutOfGrid);
  console.log("help");

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