// @miya7090

function getPlayerTurnText() {
  switch (GAME_MODE) {
    case "startup":         return "Loading...";
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

function broadcastMsg(msgType, p1, arg1, arg2){ // #TODO nice formatting and graphics
  // broadcast to P2 as well, and flip the p1 arg #TODO
  console.log(msgType, p1, arg1, arg2);

  let bs = getBaseStats(arg1);
  if (bs != undefined){
    if (msgType == "ability"){
      console.log(bs[11],bs[12]);
    } else if (msgType == "ultimate" || msgType == "ult"){
      console.log(bs[13],bs[14]);
    } else if (msgType == "passive"){
      console.log(bs[15],bs[16]);
    }
  }
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

function anim_tileHitByHeal(hitTileDiv){ //#TODO also animate the game card
  let animColor = getComputedStyle(document.documentElement).getPropertyValue('--animHealHit');
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

  const wrap = document.createElement("div"); // create tile and add to row
  wrap.classList.add("tileWrap");
  wrap.appendChild(square);
  rowDiv.appendChild(wrap);

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
  
  addGameCardStatusesOnDiv(pcToRender, ccard);
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
  
  addGameCardStatusesOnDiv(pcToRender, ccard);
  enemyCardReference.appendChild(ccard);

  ccard.addEventListener('mouseenter', function(evt){mouseOverGameCard(evt, pcToRender);});
};

function createTokenDiv(pcToRender) {
  const token = document.createElement("img");
  token.src = GITHUB_PUBLIC_PATH + "images/portraits/"+pcToRender.cardName.toLowerCase()+".png";
  token.classList.add("player1");
  token.classList.add("token");
  token.id = "p1token-" + pcToRender.cardName;
  token.pcardLink = pcToRender;
  token.q = pcToRender.getQ(); // used ONLY for location initialization
  token.setAttribute("isDefeated", pcToRender.dead == "defeated");

  token.addEventListener('mouseup', mouseClickToken);

  // place token on board
  HEXTILE_CUBIC_INDEX[pcToRender.tag].appendChild(token);
  HEXTILE_CUBIC_INDEX[pcToRender.tag].setAttribute("hasP1Token", true);

  // add tooltip with hero name to tile
  const tooltip = document.createElement("div");
  tooltip.classList.add("player1");
  tooltip.classList.add("tokenNameTooltip");
  tooltip.id ="p1tooltip-" + pcToRender.cardName;
  tooltip.textContent = pcToRender.cardName;
  HEXTILE_CUBIC_INDEX[pcToRender.tag].parentNode.appendChild(tooltip);
};

function createEnemyTokenDiv(pcToRender) {
  const token = document.createElement("img");
  token.src = GITHUB_PUBLIC_PATH + "images/portraits/"+pcToRender.cardName.toLowerCase()+".png";
  token.classList.add("player2");
  token.classList.add("token");
  token.id = "p2token-" + pcToRender.cardName;
  token.pcardLink = pcToRender;
  token.q = pcToRender.getQ(); // used for location initialization
  token.setAttribute("isDefeated", pcToRender.dead == "defeated");

  // place token on board
  HEXTILE_CUBIC_INDEX[pcToRender.tag].appendChild(token);
  HEXTILE_CUBIC_INDEX[pcToRender.tag].setAttribute("hasP2Token", true);

  // add tooltip with hero name to tile
  const tooltip = document.createElement("div");
  tooltip.classList.add("player2");
  tooltip.classList.add("tokenNameTooltip");
  tooltip.id ="p2tooltip-" + pcToRender.cardName;
  tooltip.textContent = pcToRender.cardName;
  HEXTILE_CUBIC_INDEX[pcToRender.tag].parentNode.appendChild(tooltip);
};

function markTokenDefeated(tag) {
  let hitTile = HEXTILE_CUBIC_INDEX[tag];
  let tokenOnTile = hitTile.querySelector('.token');
  tokenOnTile.setAttribute("isDefeated",true);
}

function rerenderAllGamecardsAndTokens() {
  // clear game info hover box
  gameInfoBox.innerHTML = "";

  // SELF: remove and remake gamecards and tokens
  let myGCards = document.getElementsByClassName("player1 card");
  let myTokens = document.getElementsByClassName("player1 token");
  let myTokenTooltips = document.getElementsByClassName("player1 tokenNameTooltip");
  while(myGCards.length > 0){ myGCards[0].remove(); }
  while(myTokens.length > 0){
    myTokens[0].parentNode.setAttribute("hasP1Token", false);
    myTokens[0].parentNode.setAttribute("hasP2Token", false);
    myTokens[0].remove();
  }
  while(myTokenTooltips.length > 0){ myTokenTooltips[0].remove(); }
  PLAYER_GAMECARD_OBJS.forEach(newGCard => { // enemyCardReference
    createGameCardDiv(newGCard);
    createTokenDiv(newGCard);
  });

  // ENEMY: remove and remake gamecards and tokens
  let enemyGCards = document.getElementsByClassName("player2 card");
  let enemyTokens = document.getElementsByClassName("player2 token");
  let enemyTokenTooltips = document.getElementsByClassName("player2 tokenNameTooltip");
  while(enemyGCards.length > 0){ enemyGCards[0].remove(); }
  while(enemyTokens.length > 0){
    enemyTokens[0].parentNode.setAttribute("hasP1Token", false);
    enemyTokens[0].parentNode.setAttribute("hasP2Token", false);
    enemyTokens[0].remove();
  }
  while(enemyTokenTooltips.length > 0){ enemyTokenTooltips[0].remove(); }
  
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
  var healthPercentage = PCard.current_health / PCard.getMaxHealth();
  healthPercentage = Math.round(100 * healthPercentage);
  var manaPercentage = PCard.current_mana / PCard.getMaxMana();
  manaPercentage = Math.round(100 * manaPercentage);
  pcResult += '<div class="barPreviewContainer">'
              +'<div class="hpBar" style="width:'+healthPercentage+'%">'
              +PCard.current_health+'/'+PCard.getMaxHealth()+'</div>'
              +'<div class="manaBar" style="width:'+manaPercentage+'%">'
              +PCard.current_mana+'/'+PCard.getMaxMana()+'</div>'
              +'</div>';

  return pcResult;
}

function addGameCardStatusesOnDiv(PCard, PCardDiv){
  let statusIconWrap = document.createElement("div");
  statusIconWrap.classList.add("statIconWrap");

  for (var status of Object.keys(PCard.statuses)) {
    if (PCard.statuses[status] != 0){ // has status
      let statusIcon = document.createElement("div");
      statusIcon.classList.add("statIcon");
      
      // add icon for status
      let statusIconPic = document.createElement("img")
      statusIconPic.classList.add("statIconPic");
      statusIconPic.src = GITHUB_PUBLIC_PATH + "images/statuses/"+status+".png";
      
      // add tooltip for icon
      let tooltip = document.createElement("span");
      tooltip.classList.add("statIconTooltip");
      tooltip.textContent = status+"\n"+STATUSES_DEF_DICT[status];

      statusIcon.appendChild(tooltip);
      statusIcon.appendChild(statusIconPic);
      statusIconWrap.appendChild(statusIcon);
    }
  }

  PCardDiv.appendChild(statusIconWrap);
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

function get_PC_BroadcastForInfoBox(PCard, isPlayer1) {
  var res = "";
  
  res += '<div class="hoverColWrap">';
    res += '<p id="hoverInfoTitle" p1='+isPlayer1+'><b style="font-size: medium;">' + PCard.cardName + "</b> - " + PCard.dead;
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
    res += "<p>" + PCard.current_health + "/" + PCard.getMaxHealth() + "HP <i>(max +" + PCard.health_bonus + ")</i></p>";
    res += "<p>" + PCard.current_mana + "/" + PCard.getMaxMana() + "MP <i>(max +" + PCard.mana_bonus + ")</i></p>";
    res += "</div>";
    
    res += '<div class="hoverColumn">';
    res += "<p>ATK: " + PCard.getCurrentAttack() + " <i>(+" + (PCard.getCurrentAttack() - PCard.base_attack) + ")</i></p>";
    res += "<p>DEF: " + PCard.getCurrentDefense() + " <i>(+" + (PCard.getCurrentDefense() - PCard.base_defense) + ")</i></p>";
    res += "</div>";

    res += '<div class="hoverColumn">';
    res += "<p>RC: " + PCard.getCurrentNormAtkRange() + " <i>(+" + (PCard.getCurrentNormAtkRange() - PCard.base_normal_attack_range) + ")</i></p>";
    res += "<p>MVT: " + PCard.getCurrentMovement() + " <i>(+" + (PCard.getCurrentMovement() - PCard.base_movement) + ")</i></p>";
    res += "<p>MP/turn: " + PCard.current_mana_per_turn + " <i>(+" + (PCard.current_mana_per_turn - PCard.base_mana_per_turn) + ")</i></p>";
    res += "<p>MP/atk: " + PCard.current_mana_per_atk + " <i>(+" + (PCard.current_mana_per_atk - PCard.base_mana_per_atk) + ")</i></p>";
    res += "</div>";

  res += "</div>";

  res += '<p><span id="abilityTitle" p1='+isPlayer1+'>'+PCard.ability_title+'</span>: '+PCard.ability_text+'</p>';
  res += '<p><span id="ultTitle" p1='+isPlayer1+'>'+PCard.ult_title+'</span>: '+PCard.ult_text+'</p>';
  res += '<p><span id="passiveTitle" p1='+isPlayer1+'>'+PCard.passive_title+'</span>: '+PCard.passive_text+'</p>';
  
  return res;
}

function getClearBroadcastForInfoBox() {
  return "";
}