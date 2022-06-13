// @miya7090

HIGHLIGHT_TILE_MEMORY_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--highlightedTileMemory');
HIGHLIGHT_TILE_ATTACK_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--highlightedTileAttack');

// what to do when key pressed
function keyProcessing(event) {
  if (event.keyCode === 80) { // switch player turn (for debugging)
    nextTurn();
    console.error("note this does not update opponent");
  }
  if ((event.keyCode === 90 || event.keyCode === 88) && GAME_MODE != "p1-moveToken") { // mouse hover radius stuff
    // first clear hover highlights
    if (CURRENT_MOUSE_Q !== undefined) {
      highlightSelfAndRadius(false, CURRENT_MOUSE_Q, CURRENT_MOUSE_R, CURRENT_MOUSE_S);
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
      highlightSelfAndRadius(true, CURRENT_MOUSE_Q, CURRENT_MOUSE_R, CURRENT_MOUSE_S);
    }
  }
  return;
}

function mouseOverTile(evt) {
    highlightSelfAndRadius(false, CURRENT_MOUSE_Q, CURRENT_MOUSE_R, CURRENT_MOUSE_S);
    CURRENT_MOUSE_Q = evt.target.cube_q;
    CURRENT_MOUSE_R = evt.target.cube_r;
    CURRENT_MOUSE_S = evt.target.cube_s;
    highlightSelfAndRadius(true, CURRENT_MOUSE_Q, CURRENT_MOUSE_R, CURRENT_MOUSE_S);
}

function mouseOutOfGrid(evt) {
    highlightSelfAndRadius(false, CURRENT_MOUSE_Q, CURRENT_MOUSE_R, CURRENT_MOUSE_S);
    CURRENT_MOUSE_Q = undefined;
    CURRENT_MOUSE_R = undefined;
    CURRENT_MOUSE_S = undefined;
}

function mouseClickTile(evt) {
  if (GAME_MODE != "p1-active" && GAME_MODE != "p1-moveToken") {
    console.error("not the active player's turn", GAME_MODE, getTurn());
    return;
  }

  // find any token on the tile
  var tokenOnTile;
  if (evt.target.classList.contains("token")){
    tokenOnTile = evt.target;
  } else {
    tokenOnTile = evt.target.querySelector('.token');
  }

  // logic for moving tokens
  if (GAME_MODE == "p1-moveToken") {
    if (tokenOnTile != null) {
      console.error("there is already a tile at this location, try again"); // #TODO allow the token to stay still and re-autoattack
      changeGameModeTo("p1-active");
      GAME_MODE_MEMORYTARGET = undefined;
      highlightSelfAndRadius(false, CURRENT_MOUSE_Q, CURRENT_MOUSE_R, CURRENT_MOUSE_S);
      MOUSE_HOVER_RADIUS = 0;
      document.documentElement.style.setProperty('--highlightedTile', HIGHLIGHT_TILE_MEMORY_COLOR);
      highlightSelfAndRadius(true, CURRENT_MOUSE_Q, CURRENT_MOUSE_R, CURRENT_MOUSE_S);
    } else {
      const tQ = evt.target.cube_q;
      const tR = evt.target.cube_r;
      moveToken(GAME_MODE_MEMORYTARGET, true, tQ, tR); // #TODO check if this is a valid move for the tile first
      changeGameModeTo('p1-autoattack');
      autoattack(GAME_MODE_MEMORYTARGET);
      changeGameModeTo('p2-active');
      MY_SOCKET.emit("tellRival_yourTurn", exportAllP1Cs(false), exportAllP2Cs(true));
      rerenderAllGamecardsAndTokens();
      GAME_MODE_MEMORYTARGET = undefined;
      highlightSelfAndRadius(false, CURRENT_MOUSE_Q, CURRENT_MOUSE_R, CURRENT_MOUSE_S);
      MOUSE_HOVER_RADIUS = 0;
      document.documentElement.style.setProperty('--highlightedTile', HIGHLIGHT_TILE_MEMORY_COLOR);
      highlightSelfAndRadius(true, CURRENT_MOUSE_Q, CURRENT_MOUSE_R, CURRENT_MOUSE_S);
    }
  } else {
    console.error("cannot place tokens until your turn begins");
  }

  if (GAME_MODE == "p1-active" && tokenOnTile != null) {
    if (tokenOnTile.classList.contains("player1")) {
      changeGameModeTo("p1-moveToken");
      
      highlightSelfAndRadius(false, CURRENT_MOUSE_Q, CURRENT_MOUSE_R, CURRENT_MOUSE_S);
      GAME_MODE_MEMORYTARGET = tokenOnTile.pcardLink;
      MOUSE_HOVER_RADIUS = tokenOnTile.pcardLink.current_normal_attack_range;
      document.documentElement.style.setProperty('--highlightedTile', HIGHLIGHT_TILE_ATTACK_COLOR);
      highlightSelfAndRadius(true, CURRENT_MOUSE_Q, CURRENT_MOUSE_R, CURRENT_MOUSE_S);
    }
  } else {
    console.error("this tile has no token");
  }
}

function mouseHoverTile(evt) {
  /* TODO show token stats in the popup window */
}

function mouseClickToken(evt) {
  evt.target.parentNode.click();
}

function mouseOverAvailableCard(evt, referenceCard) {
  const gameInfoBox = document.getElementById("gameInfoBox");
  gameInfoBox.innerHTML = get_BC_BroadcastForInfoBox(referenceCard);
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
}

function mouseClickGameCard(evt, pcardRef) {
  if (GAME_MODE == "pick-phase") {
    PLAYER_GAMECARD_OBJS.splice(PLAYER_GAMECARD_OBJS.indexOf(pcardRef), 1); // remove from game cards
    evt.target.remove(); // remove div
    removeTokenAndShiftOthers(pcardRef);
  }
}