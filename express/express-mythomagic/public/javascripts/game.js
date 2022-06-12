// @miya7090

const MY_SOCKET = io(); // create new instance

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get('room');
  const selfName = urlParams.get('self');
  const otherName = urlParams.get('other');
  var otherSocketId;

  MY_SOCKET.on('connect', ()=>{
    MY_SOCKET.emit("registerPlayer", roomCode);
  });

  MY_SOCKET.on('yourTurn', ()=>{
    changeGameModeTo("p1-active");
    console.log("it's my turn!");
  });

  MY_SOCKET.on('waitTurn', ()=>{
    changeGameModeTo("p2-active");
    console.log("need to wait for opponent...");
  });

  ///////////////////////////// JOIN ROOM????????????????????????

  const mainGrid = document.getElementById("hexContainer");
  const onFieldCards = document.getElementById("onFieldCards");
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