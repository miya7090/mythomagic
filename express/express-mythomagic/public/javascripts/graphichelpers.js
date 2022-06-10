// @miya7090

function getPlayerTurnText() {
  if (GAME_MODE == "startup") {
    return "n/a";
  } else if (GAME_MODE == "p1-active") {
    return "Your turn";
  } else if (GAME_MODE == "p1-moveToken") {
    return "Your turn (placing token...)";
  } else if (GAME_MODE == "p2-active") {
    return "Waiting for other player...";
  } else if (GAME_MODE == "p2-moveToken") {
    return "Waiting for other player... (placing token...)";
  } else {
    console.error("issue with GAME_MODE", GAME_MODE);
  }
}

function updateTurnText() {
  const playerTurn = document.getElementById("playerTurn");
  playerTurn.textContent=getPlayerTurnText();
}

// fancy tile highlighting and clearing of highlights
function highlightSelfAndRadius(turnOn, cubeQ, cubeR, cubeS){
  const coordsInRange = getCoordinatesWithinRadius(cubeQ,cubeR,cubeS,MOUSE_HOVER_RADIUS,true);
  const tileNeighbors = filterOnlyCoordinatesOnBoard(coordsInRange);
  // console.log(cubeQ+"/"+cubeR+"/"+cubeS); // for debug

  if (tileNeighbors !== undefined) {
    tileNeighbors.forEach((tileNeighbor) => {
        HEXTILE_CUBIC_INDEX[tileNeighbor].setAttribute("hoverHighlight", turnOn);
    });
  }
}

function createTileDiv(rowDiv, q, r) {
  const square = document.createElement("div"); // create tile and add to row

  square.classList.add("gameSquare"); // #TODO rename as tiles not squares
  rowDiv.appendChild(square);

  // store tile coordinates
  square.offset_q = q;
  square.offset_r = r;
  const cubeQ = q - (r - (r&1)) / 2; // this works! (probably)
  const cubeR = r;
  const cubeS = -cubeQ-r;
  square.cube_q = cubeQ;
  square.cube_r = cubeR;
  square.cube_s = cubeS;

  // select tiles outside edge as off field
  if (getTileDistance(cubeQ,cubeR,cubeS,0,0,0) > HEX_RADIUS) {
    square.classList.add("offgrid");
  }

  // save reference to the tile
  HEXTILE_CUBIC_INDEX[cubeQ+","+cubeR+","+cubeS] = square;

  // fancy highlighting of tile & neighbors
  square.addEventListener('mouseenter', mouseOverTile);

  // tile moving receptor
  // token mover function
  square.addEventListener('mouseup', mouseClickTile);
};

function createAvailableCardDiv(pcToRender) {
  const acard = document.createElement("div");
  acard.classList.add("card");
  acard.name = pcToRender;
  acard.innerHTML = getBaseCardHTML(pcToRender);
  myAvailableCards.appendChild(acard);

  const referenceCard = new Card(pcToRender); // show stats on hover
  acard.addEventListener('mouseenter', function(evt){mouseOverAvailableCard(evt, referenceCard);});
  acard.addEventListener('mouseup', mouseClickAvailableCard);
};

function createGameCardDiv(pcToRender) {
  const ccard = document.createElement("div");

  ccard.classList.add("player1");
  ccard.classList.add("card");
  ccard.id = "p1card-"+pcToRender.cardName;
  ccard.innerHTML = getGameCardHTML(pcToRender);
  ccard.name = pcToRender.cardName;
  ccard.setAttribute("figurine",pcToRender.is_figurine);
  
  onFieldCards.appendChild(ccard);

  ccard.addEventListener('mouseenter', function(evt){mouseOverGameCard(evt, pcToRender);});
  ccard.addEventListener('mouseup', function(evt){mouseClickGameCard(evt, pcToRender);});
};

function createTokenDiv(pcToRender) {
  const token = document.createElement("div");
  token.classList.add("player1");
  token.classList.add("token");
  token.id = "p1token-" + pcToRender.cardName;
  token.name = pcToRender.cardName;
  token.pcardLink = pcToRender;
  token.setAttribute("figurine",pcToRender.is_figurine);
  token.q = pcToRender.q; // used for location initialization

  // place token on board
  HEXTILE_CUBIC_INDEX[pcToRender.tag].appendChild(token);

  token.addEventListener('mouseup', mouseClickToken);
};

// for formatting display of cards available to player
function getBaseCardHTML(cardName) {
  // cardName, imgLink, cardHP, cardMana, statusList
  var res = cardName + "\n";
  res += '<img class="baseCardImg" src="../images/portraits/'+cardName+'.png" onerror="javascript:this.src=\'../images/portraits/default.png\'"/>';
  return res;
}

// for formatting display of cards that player is using in game
function getGameCardHTML(PCard) {
  // cardName, imgLink, cardHP, cardMana, statusList
  var pcResult = PCard.cardName + "\n";
  
  // HP bar
  var healthPercentage = PCard.current_health / (PCard.base_health + PCard.health_bonus);
  healthPercentage = Math.round(100 * healthPercentage);
  var manaPercentage = PCard.current_mana / (MAX_MANA + PCard.mana_bonus);
  manaPercentage = Math.round(100 * manaPercentage);
  pcResult += '<div class="barPreviewContainer">'
              +'<div class="hpBar" style="width:'+healthPercentage+'%">'
              +PCard.current_health+'/'+(PCard.base_health + PCard.health_bonus)+'</div>'
              +'<div class="manaBar" style="width:'+manaPercentage+'%">'
              +PCard.current_mana+'/'+(MAX_MANA + PCard.mana_bonus)+'</div>'
              +'</div>';

  //this.statuses = {"blinded":0, "charmed":0, "poisoned":0, "stunned":0, "terrified":0};

  return pcResult;
}

function get_BC_BroadcastForInfoBox(BCard) {
  var res = "";
  res += '<div class="hoverColWrap">';
  res += "<h3>" + BCard.cardName + "</h3>";

  res += '<div class="hoverColumn">';
    res += "<p>ATK: " + BCard.base_attack + "</p>";
    res += "<p>HP: " + BCard.base_health + "</p>";
    res += "<p>DEF: " + BCard.base_defense + "</p>";
    res += "</div>";

    res += '<div class="hoverColumn">';
    res += "<p>RNG: " + BCard.base_normal_attack_range + "</p>";
    res += "<p>MVT: " + BCard.base_movement + "</p>";
    res += "</div>";

    res += '<div class="hoverColumn">';
    res += "<p>MP/turn: " + BCard.base_mana_per_turn + "</p>";
    res += "<p>MP/atk: " + BCard.base_mana_per_atk + "</p>";
    res += "</div>";
  res += "</div>";
  
  res += "<p>Sample skill: holofoil power</p>"; // #TODO display only if owned
  res += "<p>Sample skill: figurine power</p>";
  res += "<p>Sample skill: ???? power</p>";

  return res;
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function get_PC_BroadcastForInfoBox(PCard) {
  var res = "";
  
  res += '<div class="hoverColWrap">';
    res += '<p><b style="font-size: medium;">' + PCard.cardName + "</b> - " + PCard.dead;
    var statusTxt = ", statuses: ";
    for (var sKey in PCard.statuses){
        if (PCard.statuses[sKey] == 1){
            statusTxt += sKey + " ";
        }
    }
    if (statusTxt === ", statuses: ") {
        statusTxt += "none";
    }
    res += statusTxt + "</p>";

    
    res += '<div class="hoverColumn">';
    res += "<p>" + PCard.current_health + "/" + (PCard.base_health + PCard.health_bonus) + "HP <i>(+" + PCard.health_bonus + ")</i></p>";
    res += "<p>" + PCard.current_mana + "/" + (MAX_MANA + PCard.mana_bonus) + "MP <i>(+" + PCard.mana_bonus + ")</i></p>";
    res += "</div>";
    
    res += '<div class="hoverColumn">';
    res += "<p>ATK: " + PCard.current_attack + " <i>(+" + PCard.attack_bonus + ")</i></p>";
    res += "<p>DEF: " + PCard.current_defense + " <i>(+" + PCard.defense_bonus + ")</i></p>";

    
    res += "<p>RNG: " + PCard.current_normal_attack_range + " <i>(+" + PCard.base_normal_attack_range + ")</i></p>";
    res += "<p>MVT: " + PCard.current_movement + " <i>(+" + PCard.movement_bonus + ")</i></p>";
    res += "</div>";

    res += '<div class="hoverColumn">';
    res += "<p>MP/turn: " + PCard.current_mana_per_turn + " <i>(+" + PCard.mana_turnRegen_bonus + ")</i></p>";
    res += "<p>MP/atk: " + PCard.current_mana_per_atk + " <i>(+" + PCard.mana_atkRegen_bonus + ")</i></p>";
    res += "</div>";

  res += "</div>";
    
  if (PCard.is_figurine == true) {
    res += "<p>********* display holofoil power here ***********</p>";
  } else {
    res += "<p>Holofoil unavailable</p>";
  }

  return res;
}

function getClearBroadcastForInfoBox() {
  return "";
}