// @miya7090

// what to do when key pressed
function keyProcessing(event) {
    if (event.keyCode === 90 || event.keyCode === 88) { // mouse hover radius stuff
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
  if (GAME_MODE == "moving") {
    const tQ = evt.target.cube_q;
    const tR = evt.target.cube_r;
    const tS = evt.target.cube_s;
    moveToken(GAME_MODE_MEMORYTARGET, true, tQ, tR); // #TODO check if this is a valid move for the tile first
    GAME_MODE = "startup";
    GAME_MODE_MEMORYTARGET = undefined;
  }
}

function mouseOverAvailableCard(evt, referenceCard) {
  const gameInfoBox = document.getElementById("gameInfoBox");
  gameInfoBox.innerHTML = get_BC_BroadcastForInfoBox(referenceCard);
}

function mouseClickAvailableCard(evt) {
    const onFieldCards = document.getElementById("onFieldCards");
    const countPlayersPicks = onFieldCards.childElementCount;
    const thisCardName = evt.target.name;
    if (countPlayersPicks >= 5){
        console.error("player has already picked 5 cards"); // #TODO express error nicely
    } else if (onFieldCards.querySelector('#p1card-'+thisCardName) != null) { // search if card with that ID already selected to be played
        console.error(thisCardName+" card already selected");
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
  PLAYER_GAMECARD_OBJS.splice(PLAYER_GAMECARD_OBJS.indexOf(pcardRef), 1); // remove from game cards
  evt.target.remove(); // remove div
  removeTokenAndShiftOthers(pcardRef);
}