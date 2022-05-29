// @miya7090

document.addEventListener("DOMContentLoaded", () => {
  console.log("loaded~");
  
  const mainGrid = document.getElementById("hexContainer");
  const onFieldCards = document.getElementById("onFieldCards");
  const gameInfoBox = document.getElementById("gameInfoBox");
  const gameOptions = document.getElementById("gameOptions");
  const previewRadius = document.getElementById("previewRadius");
  const myAvailableCards = document.getElementById("myAvailableCards");

  previewRadius.textContent="Preview radius: "+MOUSE_HOVER_RADIUS;

  // add tiles to game board
  for (let r = -HEX_RADIUS; r <= HEX_RADIUS; r++) {
    const row = document.createElement("div");
    row.classList.add("hexRow");
    mainGrid.appendChild(row);

    for (let full_q = -HEX_RADIUS; full_q <= HEX_RADIUS; full_q++) {
      var q = full_q; // offset number of columns in odd rows instead of just using q
      if (r&1 && full_q == HEX_RADIUS) { break; }

      const square = document.createElement("div"); // create tile and add to row
      square.classList.add("gameSquare"); // #TODO rename as tiles not squares
      row.appendChild(square);

      // store tile coordinates
      square.setAttribute("offset-q", q);
      square.setAttribute("offset-r", r);
      const cubeQ = q - (r - (r&1)) / 2; // this works! (probably)
      const cubeR = r;
      const cubeS = -cubeQ-r;
      square.setAttribute("cube-q", cubeQ);
      square.setAttribute("cube-r", cubeR);
      square.setAttribute("cube-s", cubeS);

      // select tiles outside edge as off field
      if (getTileDistance(cubeQ,cubeR,cubeS,0,0,0) > HEX_RADIUS) {
        square.classList.add("offgrid");
      }

      // save reference to the tile
      HEXTILE_CUBIC_INDEX[cubeQ+","+cubeR+","+cubeS] = square;

      // fancy highlighting of tile & neighbors
      square.onmouseenter = (function(turnOn, c_q, c_r, c_s) {
        return function() {
          CURRENT_MOUSE_Q = c_q;
          CURRENT_MOUSE_R = c_r;
          CURRENT_MOUSE_S = c_s;
          highlightSelfAndRadius(turnOn, c_q, c_r, c_s);
        }
      })(true, cubeQ, cubeR, cubeS);

      square.onmouseleave = (function(turnOn, c_q, c_r, c_s) {
        return function() {
          CURRENT_MOUSE_Q = undefined;
          CURRENT_MOUSE_R = undefined;
          CURRENT_MOUSE_S = undefined;
          highlightSelfAndRadius(turnOn, c_q, c_r, c_s);
        }
      })(false, cubeQ, cubeR, cubeS);
    }
  }

  // key press handling
  document.addEventListener('keydown', logKey);

  // #TODO add terrain processing

  // show all available cards of player
  PLAYER_OWNED.forEach((availCard) => {
    const acard = document.createElement("div");
    acard.classList.add("card");
    acard.setAttribute("name", availCard);
    acard.innerHTML = getBaseCardHTML(availCard);
    myAvailableCards.appendChild(acard);
  }); 

  // create some default cards
  var defaultCards = [
    new PlayerCard("Achilles", false, 0,1,-1), // s = -q-r
    new PlayerCard("Apollo", true, 0,-1,1),
    new PlayerCard("Athena", true, 2,3,-5),
    new PlayerCard("Hestia", false, 2,2,-4),
    new PlayerCard("Apollo", false, -1,2,-1)
  ];

  // draw cards and figurines
  const playerCards = [];
  defaultCards.forEach((defaultCard) => {
    const ccard = document.createElement("div");
    ccard.classList.add("card");
    ccard.setAttribute("name",defaultCard.cardName);
    ccard.innerHTML = getGameCardHTML(defaultCard);

    const token = document.createElement("div");
    token.classList.add("token");
    token.classList.add("player1");

    if (defaultCard.is_figurine) {
      ccard.setAttribute("figurine",true);
      token.setAttribute("figurine",true);
    }
    
    // place token on board, display card
    HEXTILE_CUBIC_INDEX[defaultCard.tag].appendChild(token);
    onFieldCards.appendChild(ccard);
  });

  // use clearInterval, setInterval, card.timerId or similar, setTimeout
  // document.removeEventListener
  // event? event.keyCode, addEventListener
});