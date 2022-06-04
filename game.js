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

  // key press handling
  document.addEventListener('keydown', logKey);

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

  // #TODO add terrain processing

  // CARD TIME
  var playerCards = [];

  // show all available cards of player
  PLAYER_OWNED.forEach((availCard) => {
    const acard = document.createElement("div");
    acard.classList.add("card");
    acard.setAttribute("name", availCard);
    acard.innerHTML = getBaseCardHTML(availCard);
    myAvailableCards.appendChild(acard);

    acard.onmouseup = (function() {
      return function() {
        const countPlayersPicks = onFieldCards.childElementCount;
        if (countPlayersPicks >= 5){
          console.error("player has already picked 5 cards"); // #TODO express error nicely
        } else if (playerCards.map(x => x.cardName).includes(availCard)) {
          console.error(availCard+" card already selected");
        } else {
          // define a new player card with a starter position
          var hasHolo = PLAYER_HOLOFOIL.includes(availCard);
          var newPC = new PlayerCard(availCard, hasHolo, -(HEX_RADIUS-1)+countPlayersPicks,HEX_RADIUS,-1-countPlayersPicks);
          renderCard(newPC);
          renderToken(newPC);
          playerCards.push(newPC);
        }
      }
    })();

    const referenceCard = new Card(availCard); // show stats on hover
    acard.onmouseenter = (function(BCard) {
      return function() {
        gameInfoBox.innerHTML = get_BC_BroadcastForInfoBox(BCard);
      }
    })(referenceCard);
  }); 

  // draw cards and tokens
  function renderCard(pcToRender) {
    const ccard = document.createElement("div");
    ccard.classList.add("card");
    ccard.id = "p1card-"+pcToRender.cardName;
    ccard.setAttribute("name",pcToRender.cardName);
    ccard.innerHTML = getGameCardHTML(pcToRender);

    if (pcToRender.is_figurine) {
      ccard.setAttribute("figurine",true);
    }
    
    onFieldCards.appendChild(ccard);

    ccard.onmouseenter = (function(PCard) {
      return function() {
        gameInfoBox.innerHTML = get_PC_BroadcastForInfoBox(PCard);
      }
    })(pcToRender);

    ccard.onmouseup = (function() { // remove card
      return function() {
        playerCards.splice(playerCards.indexOf(pcToRender), 1); // remove from playerCards
        ccard.remove(); // remove div
        removeToken(pcToRender);
      }
    })();
  };

  function renderToken(pcToRender) {
    const token = document.createElement("div");
    token.classList.add("token");
    token.classList.add("player1");
    token.id = "p1token-" + pcToRender.cardName;
    console.log("created token with id "+token.id);
    token.q = pcToRender.q;

    if (pcToRender.is_figurine) {
      token.setAttribute("figurine",true);
    }
    
    // place token on board
    HEXTILE_CUBIC_INDEX[pcToRender.tag].appendChild(token);
  };

  function removeToken(pcardOfThisToken) { // only valid before game starts
    const tokenToRemove = document.getElementById("p1token-" + pcardOfThisToken.cardName);
    const ttrQ = pcardOfThisToken.q;
    tokenToRemove.remove();
    // move tokens to the right, left one space
    Object.keys(playerCards).forEach(key => {
      const pcardOfOtherToken = playerCards[key];
      const ttmQ = pcardOfOtherToken.q;
      if (ttmQ > ttrQ) {
        moveToken(pcardOfOtherToken, -1, 0);
      }
    });
  };

  function moveToken(tokenPcard, diffQ, diffR) {
    const tokenDiv = document.getElementById("p1token-" + tokenPcard.cardName);
    tokenDiv.remove();
    tokenPcard.q += diffQ;
    tokenPcard.r += diffR;
    tokenPcard.s = -tokenPcard.q - tokenPcard.r;
    tokenPcard.tag = tokenPcard.q+","+tokenPcard.r+","+tokenPcard.s;
    // check if this coordinate is invalid
    if (HEXTILE_CUBIC_INDEX[tokenPcard.tag] == undefined){
      console.error(tokenPcard.cardName+" cannot be moved to "+tokenPcard.tag+" since this is out of bounds");
    }
    renderToken(tokenPcard);
  };

  // use clearInterval, setInterval, card.timerId or similar, setTimeout
  // document.removeEventListener
  // event? event.keyCode, addEventListener
});