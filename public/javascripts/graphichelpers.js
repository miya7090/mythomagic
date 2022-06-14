// @miya7090

function getPlayerTurnText() {
  switch (GAME_MODE) {
    case "startup":         return "n/a";
    case "pick-phase":      return "Pick your cards";
    case "p1-active":       return "Select a token";

    case "p1-moveToken":    return "Move token to a new location";
    case "p1-attackSelect": return "Choose an action";
    case "p1-autoattack":   return "Autoattacking...";
    case "p1-ability":      return "Using ability..."; // #TODO put ability name
    case "p1-abilityAim":   return "Aiming ability...";
    case "p1-ultimate":     return "Using ultimate...";
    case "p1-ultimateAim":  return "Aiming ultimate...";

    case "p2-active":       return OTHER_NAME+" is selecting a token";
    case "p2-moveToken":    return OTHER_NAME+" is moving their token...";
    case "p2-attackSelect": return OTHER_NAME+" is choosing an action";
    case "p2-autoattack":   return OTHER_NAME+" is autoattacking...";
    case "p2-ability":      return OTHER_NAME+" is using an ability...";
    case "p2-abilityAim":   return OTHER_NAME+" is aiming an ability...";
    case "p2-ultimate":     return OTHER_NAME+" is using their ultimate...";
    case "p2-ultimateAim":  return OTHER_NAME+" is aiming their ultimate...";
  }
  return GAME_MODE;
}

function updateTurnText() {
  const playerTurn = document.getElementById("playerTurn");
  playerTurn.textContent=getPlayerTurnText();
}

// fancy tile highlighting and clearing of highlights
function highlightSelfAndRadius(highlightType, turnOn, radius, cubeQ, cubeR, cubeS){
  const coordsInRange = getCoordinatesWithinRadius(cubeQ,cubeR,cubeS,radius,true);
  const tileNeighbors = filterOnlyCoordinatesOnBoard(coordsInRange);
  // console.log(cubeQ+"/"+cubeR+"/"+cubeS); // for debug

  if (tileNeighbors !== undefined) {
    tileNeighbors.forEach((tileNeighbor) => {
        HEXTILE_CUBIC_INDEX[tileNeighbor].setAttribute(highlightType, turnOn);
    });
  }
}

function hoverMouseHighlight(turnOn){
  highlightSelfAndRadius("hoverHighlight", turnOn, MOUSE_HOVER_RADIUS, CURRENT_MOUSE_Q, CURRENT_MOUSE_R, CURRENT_MOUSE_S);
}

function aimAndHijackMouseHighlight(radius){
  hoverMouseHighlight(false);
  MOUSE_HOVER_RADIUS = radius;
  let aht = getComputedStyle(document.documentElement).getPropertyValue('--aimingHighlightedTile');
  document.documentElement.style.setProperty('--highlightedTile', aht);
  let aho = getComputedStyle(document.documentElement).getPropertyValue('--aimingHighlightedOffgrid');
  document.documentElement.style.setProperty('--highlightedOffgrid', aho);
  hoverMouseHighlight(true);
}

function relinquishAimingMouseHighlight(){
  hoverMouseHighlight(false);
  MOUSE_HOVER_RADIUS = 0;
  let dht = getComputedStyle(document.documentElement).getPropertyValue('--default_highlightedTile');
  document.documentElement.style.setProperty('--highlightedTile', dht);
  let dho = getComputedStyle(document.documentElement).getPropertyValue('--default_highlightedOffgrid');
  document.documentElement.style.setProperty('--highlightedOffgrid', dho);
  hoverMouseHighlight(true);
}

function aimingTargetReachHighlight(turnOn, radius){
  if (GAME_MODE_MEMORYTARGET == undefined){
    console.error("warning: pcard memory target cleared too early");
  }
  highlightSelfAndRadius("aimingReachHighlight", turnOn, radius, GAME_MODE_MEMORYTARGET.getQ(), GAME_MODE_MEMORYTARGET.getR(), GAME_MODE_MEMORYTARGET.getS());
}

// animation
function anim_tileHitByAttack(hitTileDiv){ //#TODO also animate the game card
  let animColor = getComputedStyle(document.documentElement).getPropertyValue('--animAtkHit');
  hitTileDiv.animate({
    backgroundColor: animColor,
  }, 700 );
};

function anim_tileInAttackRange(hitTileDiv){
  let animColor = getComputedStyle(document.documentElement).getPropertyValue('--animAtkInRange');
  hitTileDiv.animate({
    backgroundColor: animColor,
  }, 700 );
};

// div creation
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

function createAvailableCardDiv(pcNameToRender) {
  const acard = document.createElement("div");
  putBaseCardHTML(pcNameToRender, acard);
  acard.classList.add("card");
  myAvailableCards.appendChild(acard);

  const referenceCard = new Card(pcNameToRender); // show stats on hover
  acard.addEventListener('mouseenter', function(evt){mouseOverAvailableCard(evt, referenceCard);});
  acard.addEventListener('mouseup', mouseClickAvailableCard);
};

function createGameCardDiv(pcToRender) {
  const ccard = document.createElement("div");
  ccard.innerHTML = getGameCardHTML(pcToRender);
  ccard.classList.add("player1");
  ccard.classList.add("card");
  ccard.id = "p1card-"+pcToRender.cardName;
  ccard.setAttribute("figurine",pcToRender.is_figurine);
  
  onFieldCards.appendChild(ccard);

  ccard.addEventListener('mouseenter', function(evt){mouseOverGameCard(evt, pcToRender);});
  ccard.addEventListener('mouseup', function(evt){mouseClickGameCard(evt, pcToRender);});
};

function createEnemyGameCardDiv(pcToRender) { //#TODO reduce redundant code ^
  const ccard = document.createElement("div");

  ccard.classList.add("player2");
  ccard.classList.add("card");
  ccard.id = "p2card-"+pcToRender.cardName;
  ccard.innerHTML = getGameCardHTML(pcToRender);
  ccard.setAttribute("figurine",pcToRender.is_figurine);
  
  enemyCardReference.appendChild(ccard);

  ccard.addEventListener('mouseenter', function(evt){mouseOverGameCard(evt, pcToRender);});
};

function createTokenDiv(pcToRender) {
  const token = document.createElement("div");
  token.classList.add("player1");
  token.classList.add("token");
  token.id = "p1token-" + pcToRender.cardName;
  token.pcardLink = pcToRender;
  token.setAttribute("figurine",pcToRender.is_figurine);
  token.q = pcToRender.getQ(); // used ONLY for location initialization

  // place token on board
  HEXTILE_CUBIC_INDEX[pcToRender.tag].appendChild(token);

  token.addEventListener('mouseup', mouseClickToken);
};

function createEnemyTokenDiv(pcToRender) {
  const token = document.createElement("div");
  token.classList.add("player2");
  token.classList.add("token");
  token.id = "p2token-" + pcToRender.cardName;
  token.pcardLink = pcToRender;
  token.setAttribute("figurine",pcToRender.is_figurine);
  token.q = pcToRender.getQ(); // used for location initialization

  // place token on board
  HEXTILE_CUBIC_INDEX[pcToRender.tag].appendChild(token);
};

function rerenderAllGamecardsAndTokens() {
  // clear game info hover box
  gameInfoBox.innerHTML = "";

  // SELF: remove and remake gamecards and tokens
  let myGCards = document.getElementsByClassName("player1 card");
  let myTokens = document.getElementsByClassName("player1 token");
  while(myGCards.length > 0){ myGCards[0].remove(); }
  while(myTokens.length > 0){ myTokens[0].remove(); }
  PLAYER_GAMECARD_OBJS.forEach(newGCard => { // enemyCardReference
    createGameCardDiv(newGCard);
    createTokenDiv(newGCard);
  });

  // ENEMY: remove and remake gamecards and tokens
  let enemyGCards = document.getElementsByClassName("player2 card");
  let enemyTokens = document.getElementsByClassName("player2 token");
  while(enemyGCards.length > 0){ enemyGCards[0].remove(); }
  while(enemyTokens.length > 0){ enemyTokens[0].remove(); }
  
  ENEMY_GAMECARD_OBJS.forEach(newGCard => { // enemyCardReference
    newGCard.flipAcrossBoard();
    createEnemyGameCardDiv(newGCard);
    createEnemyTokenDiv(newGCard);
  });
}

// for formatting display of cards available to player
function putBaseCardHTML(cardName, cardDiv) {
  let fontString = undefined;
  if (cardName.length > 9) {
    fontString = "smallestFont";
  } else if (cardName.length > 7) {
    fontString = "smallFont";
  }

  const bcn = document.createElement("p"); // add name
  bcn.classList.add("baseCardName");
  if (fontString != undefined) { bcn.classList.add(fontString); }
  bcn.textContent = cardName;
  cardDiv.appendChild(bcn);

  const bcih = document.createElement("div"); // add image holder
  bcih.classList.add("baseCardImgHolder");
  cardDiv.appendChild(bcih);

  const bci1 = document.createElement("img"); // add image backing
  bci1.classList.add("baseCardImg1");
  if (fontString != undefined) { bci1.classList.add(fontString); }
  bci1.src = GITHUB_PUBLIC_PATH + "images/portraits/"+cardName.toLowerCase()+".png";
  console.log();
  bci1.alt = "card image";
  bcih.appendChild(bci1);

  const bci2 = document.createElement("img"); // add image front
  bci2.classList.add("baseCardImg2");
  if (fontString != undefined) { bci2.classList.add(fontString); }
  bci2.src = GITHUB_PUBLIC_PATH + "images/portraits/"+cardName.toLowerCase()+".png";
  bci2.alt = "card image";
  bcih.appendChild(bci2);
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
  res += '<h3 id="hoverInfoTitle">' + BCard.cardName + "</h3>";

  res += '<div class="hoverColumn">';
    res += "<p>ATK: " + BCard.base_attack + "</p>";
    res += "<p>HP: " + BCard.base_health + "</p>";
    res += "<p>DEF: " + BCard.base_defense + "</p>";
    res += "</div>";

    res += '<div class="hoverColumn">';
    res += "<p>RC: " + BCard.base_normal_attack_range + "</p>";
    res += "<p>MVT: " + BCard.base_movement + "</p>";
    res += "</div>";

    res += '<div class="hoverColumn">';
    res += "<p>MP/turn: " + BCard.base_mana_per_turn + "</p>";
    res += "<p>MP/atk: " + BCard.base_mana_per_atk + "</p>";
    res += "</div>";
  res += "</div>";
  
  res += '<p><span id="abilityTitle">'+BCard.ability_title+'</span>: '+BCard.ability_text+'</p>';
  res += '<p><span id="ultTitle">'+BCard.ult_title+'</span>: '+BCard.ult_text+'</p>';
  res += '<p><span id="passiveTitle">'+BCard.passive_title+'</span>: '+BCard.passive_text+'</p>';

  return res;
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function get_PC_BroadcastForInfoBox(PCard) {
  var res = "";
  
  res += '<div class="hoverColWrap">';
    res += '<p id="hoverInfoTitle"><b style="font-size: medium;">' + PCard.cardName + "</b> - " + PCard.dead;
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
    res += "<p>" + PCard.current_health + "/" + (PCard.base_health + PCard.health_bonus) + "HP <i>(max +" + PCard.health_bonus + ")</i></p>";
    res += "<p>" + PCard.current_mana + "/" + (MAX_MANA + PCard.mana_bonus) + "MP <i>(max +" + PCard.mana_bonus + ")</i></p>";
    res += "</div>";
    
    res += '<div class="hoverColumn">';
    res += "<p>ATK: " + PCard.current_attack + " <i>(+" + (PCard.current_attack - PCard.base_attack) + ")</i></p>";
    res += "<p>DEF: " + PCard.current_defense + " <i>(+" + (PCard.current_defense - PCard.base_defense) + ")</i></p>";

    
    res += "<p>RC: " + PCard.current_normal_attack_range + " <i>(+" + (PCard.current_normal_attack_range - PCard.base_normal_attack_range) + ")</i></p>";
    res += "<p>MVT: " + PCard.current_movement + " <i>(+" + (PCard.current_movement - PCard.base_movement) + ")</i></p>";
    res += "</div>";

    res += '<div class="hoverColumn">';
    res += "<p>MP/turn: " + PCard.current_mana_per_turn + " <i>(+" + (PCard.current_mana_per_turn - PCard.base_mana_per_turn) + ")</i></p>";
    res += "<p>MP/atk: " + PCard.current_mana_per_atk + " <i>(+" + (PCard.current_mana_per_atk - PCard.base_mana_per_atk) + ")</i></p>";
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