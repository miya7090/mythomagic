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

    case "p2-turn1":       return OTHER_NAME+" is on turn 1/2...";
    case "p2-turn2":       return OTHER_NAME+" is on turn 2/2...";
  }
  return GAME_MODE;
}

function updateTurnText() {
  const playerTurn = document.getElementById("playerTurn");
  playerTurn.textContent=getPlayerTurnText();
}

function broadcastMsg(msgType, p1, arg1, arg2){
  MY_SOCKET.emit("tellRival_message", msgType, !p1, arg1, arg2);

  processBroadcast(msgType, p1, arg1, arg2);
}

function processBroadcast(msgType, p1, arg1, arg2){
  console.log(msgType, p1, arg1, arg2);
  
  var bIcon;
  var bText;

  if (msgType == "alert") {
    bIcon = GITHUB_PUBLIC_PATH + "images/alert.png";
    bText = arg1;
    console.log("okay", bIcon, bText, p1);
  } else {
    bIcon = GITHUB_PUBLIC_PATH + "images/portraits/"+arg1.toLowerCase()+".png";
    bText = formatBroadcast(msgType, p1, arg1, arg2);
  }
  
  if (!BROADCASTING){
    BROADCASTING = true;
    startBroadcast(p1, bIcon, bText);
  } else {
    BROADCAST_QUEUE.push([p1, bIcon, bText]);
  }
}

function startBroadcast(p1, bIcon, bText){
  document.getElementById("notifBox").setAttribute('p1', p1);
  document.getElementById("notifIcon").src = bIcon;
  document.getElementById("notifIconBacking").src = bIcon;
  document.getElementById("notifText").innerHTML = bText;

  let fadeInLength = 100;
  let messageLength = 1700;
  let fadeOutLength = 800;
  if (BROADCAST_QUEUE.length > 0){ fadeInLength = 10; }

  $("#notifBox").fadeIn(fadeInLength, function(){
    if (BROADCAST_QUEUE.length > 0){ messageLength = 1600; }
    setTimeout( function(){ 
      if (BROADCAST_QUEUE.length > 0){ fadeOutLength = 1; }
      $("#notifBox").fadeOut(fadeOutLength, function(){
        if (BROADCAST_QUEUE.length > 0){
          var bq = BROADCAST_QUEUE.shift();
          startBroadcast(bq[0], bq[1], bq[2]);
        } else {
          BROADCASTING = false;
        }
      });
    }, messageLength );
  });
}

function formatBroadcast(msgType, p1, arg1, arg2) { // helper function for broadcast
  // arg1 is name of attacker, arg2 is name of target(s)

  var ansText = "";

  if (msgType == "autoattack") {
    ansText += "<span>" + arg1 + "</span> autoattacks " + arg2;

  } else if (msgType == "ability"){
    ansText += "<span>" + arg1 + "</span> uses ability <span>" + getBaseStats(arg1)[11] + "</span>";
    if (arg2 != undefined) {
      ansText += " on " + arg2;
    }

  } else if (msgType == "ultimate" || msgType == "ult"){
    ansText += "<span>" + arg1 + "</span> uses ultimate <span>" + getBaseStats(arg1)[13] + "</span>";
    if (arg2 != undefined) {
      ansText += " on " + arg2;
    }

  } else if (msgType == "passive"){
    ansText += "<span>" + arg1 + "</span>  uses passive <span>" + getBaseStats(arg1)[15] + "</span>";
    if (arg2 != undefined) {
      ansText += " on " + arg2;
    }

  } else if (msgType == "defeat"){
    ansText += "<span>" + arg1 + "</span>  has been defeated";

  } else {
    console.error("issue with broadcast", msgType);
    return "CAN'T FORMAT BROADCAST " + msgType;
  }
  
  return ansText;
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

function createAvailableCardDiv(pcNameToRender, availCardGroupDiv) {
  const acard = document.createElement("div");
  putBaseCardHTML(pcNameToRender, acard);
  acard.classList.add("card");
  acard.id = "availCard-" + pcNameToRender;
  if (availCardGroupDiv == undefined) {
    myAvailableCards.appendChild(acard);
  } else {
    availCardGroupDiv.appendChild(acard);
  }

  const referenceCard = new Card(pcNameToRender); // show stats on hover
  acard.addEventListener('mouseenter', function(evt){mouseOverAvailableCard(evt, referenceCard);});
  acard.addEventListener('mouseup', mouseClickAvailableCard);
};

function highlightMemoryTarget(turnOn) {
  let memToken = document.getElementById("p1token-" + GAME_MODE_MEMORYTARGET.cardName);
  memToken.setAttribute("isChosen", turnOn);
}

function createGameCardDiv(pcToRender) {
  const ccard = document.createElement("div");
  ccard.innerHTML = getGameCardHTML(pcToRender);
  ccard.classList.add("player1");
  ccard.classList.add("card");
  ccard.pcardLink = pcToRender;
  ccard.id = "p1card-"+pcToRender.cardName;
  if (pcToRender.dead == "defeated"){
    ccard.classList.add("deadCard");
  }

  if (pcToRender.cardName.length > 9) {
    ccard.classList.add("smallestFontGC");
  } else if (pcToRender.cardName.length > 7) {
    ccard.classList.add("smallFontGC");
  }
  
  addGameCardStatusesOnDiv(pcToRender, ccard);
  onFieldCards.appendChild(ccard);

  ccard.addEventListener('mouseenter', function(evt){mouseOverGameCard(evt, pcToRender);});
  ccard.addEventListener('mouseleave', function(evt){mouseOutOfGameCard(evt, pcToRender);});
  ccard.addEventListener('mouseup', function(evt){mouseClickGameCard(evt, pcToRender);});
};

function createEnemyGameCardDiv(pcToRender) { //#TODO reduce redundant code ^
  const ccard = document.createElement("div");
  ccard.innerHTML = getGameCardHTML(pcToRender);
  ccard.classList.add("player2");
  ccard.classList.add("card");
  ccard.pcardLink = pcToRender;
  ccard.id = "p2card-"+pcToRender.cardName;
  if (pcToRender.dead == "defeated"){
    ccard.classList.add("deadCard");
  }

  if (pcToRender.cardName.length > 9) {
    ccard.classList.add("smallestFontGC");
  } else if (pcToRender.cardName.length > 7) {
    ccard.classList.add("smallFontGC");
  }
  
  addGameCardStatusesOnDiv(pcToRender, ccard);
  enemyCardReference.appendChild(ccard);

  ccard.addEventListener('mouseenter', function(evt){mouseOverGameCard(evt, pcToRender);});
  ccard.addEventListener('mouseleave', function(evt){mouseOutOfGameCard(evt, pcToRender);});
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
  if (GAME_MODE_MEMORYTARGET != undefined){
    token.setAttribute("isChosen", pcToRender.cardName == GAME_MODE_MEMORYTARGET.cardName);
  }

  token.addEventListener('mouseup', mouseClickToken);
  token.setAttribute("thisObscured", pcToRender.statuses["obscured"] > 0);

  // place token on board
  HEXTILE_CUBIC_INDEX[pcToRender.tag].appendChild(token);
  HEXTILE_CUBIC_INDEX[pcToRender.tag].setAttribute("hasP1Token", true);
  HEXTILE_CUBIC_INDEX[pcToRender.tag].setAttribute("tokenObscured", pcToRender.statuses["obscured"] > 0);

  // add tooltip with hero name to tile
  const tooltip = document.createElement("div");
  tooltip.classList.add("player1");
  tooltip.classList.add("tokenNameTooltip");
  tooltip.id ="p1tooltip-" + pcToRender.cardName;
  tooltip.textContent = pcToRender.cardName;
  tooltip.setAttribute("tooltipObscured", pcToRender.statuses["obscured"] > 0);
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
  token.setAttribute("thisObscured", pcToRender.statuses["obscured"] > 0);

  // place token on board
  HEXTILE_CUBIC_INDEX[pcToRender.tag].appendChild(token);
  HEXTILE_CUBIC_INDEX[pcToRender.tag].setAttribute("hasP2Token", true);
  HEXTILE_CUBIC_INDEX[pcToRender.tag].setAttribute("tokenObscured", pcToRender.statuses["obscured"] > 0);

  // add tooltip with hero name to tile
  const tooltip = document.createElement("div");
  tooltip.classList.add("player2");
  tooltip.classList.add("tokenNameTooltip");
  tooltip.id ="p2tooltip-" + pcToRender.cardName;
  tooltip.textContent = pcToRender.cardName;
  tooltip.setAttribute("tooltipObscured", pcToRender.statuses["obscured"] > 0);
  HEXTILE_CUBIC_INDEX[pcToRender.tag].parentNode.appendChild(tooltip);
};

function markTokenDefeated(p1, cName) {
  if (p1){
    document.getElementById("p1token-"+cName).setAttribute("isDefeated",true);
  }else{
    document.getElementById("p2token-"+cName).setAttribute("isDefeated",true);
  }
}

function rerenderAllGamecardsAndTokens(flipPlayer, flipEnemy) {
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
  PLAYER_GAMECARD_OBJS.forEach(newGCard => {
    if (flipPlayer) { newGCard.flipAcrossBoard(); }
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
    if (flipEnemy) { newGCard.flipAcrossBoard(); }
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

function getStatusText(statName, statCount){
  if (getTurn() == "p2") {
    return statName + "\n"+STATUSES_DEF_DICT[statName];
  }
  if (statCount == 1){
    return statName +" - 1 turn remaining\n"+STATUSES_DEF_DICT[statName];
  } else {
    return statName +" - "+statCount+" turns remaining\n"+STATUSES_DEF_DICT[statName];
  }
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
      tooltip.textContent = getStatusText(status, PCard.statuses[status]);

      statusIcon.appendChild(tooltip);
      statusIcon.appendChild(statusIconPic);
      statusIconWrap.appendChild(statusIcon);
    }
  }

  PCardDiv.appendChild(statusIconWrap);
}

function get_BC_BroadcastForInfoBox(BCard) {
  var res = "";
  res += '<div class="hoverTitleColumn">';
    res += '<h3 id="hoverInfoTitle">' + BCard.cardName + "</h3>";
    res += "</div>";

  res += '<div class="hoverTitleColumn">';
    res += '<h3 id="hoverInfoClass" class="hc-'+ BCard.hero_class + '" title="' + HERO_CLASS_DESCRIPTIONS[BCard.hero_class] + '">' + BCard.hero_class + "</h3>";
    res += "</div>";

    res += '<div class="hoverColWrap">';

  res += '<div class="hoverColumn">';
    res += "<p>HP: " + BCard.base_health + "</p>";
    res += "<p>MP/turn: " + BCard.base_mana_per_turn + "</p>";
    res += "</div>";

    res += '<div class="hoverColumn">';
    res += "<p>ATK: " + BCard.base_attack + "</p>";
    res += "<p>DEF: " + BCard.base_defense + "</p>";
    res += "</div>";

    res += '<div class="hoverColumn">';
    res += "<p>MVT: " + BCard.base_movement + "</p>";
    res += "<p>RC: " + BCard.base_normal_attack_range + "</p>";
    res += "</div>";
  res += "</div>";
  
  res += '<p class="hoverBoxSkill"><span class="hoverHintSkillText">Ability:</span> <span id="abilityTitle">'+BCard.ability_title+'</span> '+BCard.ability_text;
    res += '<span class="hoverBoxSkillTooltip">ability</span>';
    res += '</p>';
  res += '<p class="hoverBoxSkill"><span class="hoverHintSkillText">Ultimate:</span> <span id="ultTitle">'+BCard.ult_title+'</span> '+BCard.ult_text;
    res += '<span class="hoverBoxSkillTooltip">ultimate</span>';
    res += '</p>';
  res += '<p class="hoverBoxSkill"><span class="hoverHintSkillText"><i>Passive:</span> <span id="passiveTitle">'+BCard.passive_title+'</span></i> '+BCard.passive_text;
    res += '<span class="hoverBoxSkillTooltip">passive</span>';
    res += '</p>';

  return res;
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function get_PC_BroadcastForInfoBox(PCard, isPlayer1) {
  var res = "";
  
  res += '<div class="hoverTitleColumn">';
    res += '<p id="hoverInfoTitle" p1='+isPlayer1+'><b style="font-size: medium;">' + PCard.cardName + "</b>";
    if (PCard.dead == "defeated") {
      res += " - " + PCard.dead;
    }
    res += "</p></div>";

  res += '<div class="hoverTitleColumn">';
    res += '<h3 id="hoverInfoClass" class="hc-'+ PCard.hero_class + '" title="' + HERO_CLASS_DESCRIPTIONS[PCard.hero_class] + '">' + PCard.hero_class + "</h3>";
    res += "</div>";
  
  res += '<div class="hoverColWrap">';

    res += '<div class="hoverColumn">';
    res += "<p>" + PCard.current_health + "/" + PCard.getMaxHealth() + "HP <i>("; 
    if (PCard.getMaxHealth() - PCard.base_health >=0 ) { res += "+"; }
    res += (PCard.getMaxHealth() - PCard.base_health) + ")</i></p>";

    res += "<p>" + PCard.current_mana + "/" + PCard.getMaxMana() + "MP <i>(";
    if (PCard.getMaxMana() - MAX_MANA >=0 ) { res += "+"; }
    res += (PCard.getMaxMana() - MAX_MANA) + ")</i></p>";

    res += "<p>MP/turn: " + PCard.current_mana_per_turn + " <i>(";
    if (PCard.current_mana_per_turn - PCard.base_mana_per_turn >=0 ) { res += "+"; }
    res += (PCard.current_mana_per_turn - PCard.base_mana_per_turn) + ")</i></p>";
    res += "</div>";
    
    res += '<div class="hoverColumn">';
    res += "<p>ATK: " + PCard.getCurrentAttack() + " <i>(";
    if (PCard.getCurrentAttack() - PCard.base_attack >=0 ) { res += "+"; }
    res += (PCard.getCurrentAttack() - PCard.base_attack) + ")</i></p>";

    res += "<p>DEF: " + PCard.getCurrentDefense() + " <i>(";
    if (PCard.getCurrentDefense() - PCard.base_defense >=0 ) { res += "+"; }
    res += (PCard.getCurrentDefense() - PCard.base_defense) + ")</i></p>";
    res += "</div>";

    res += '<div class="hoverColumn">';
    res += "<p>MVT: " + PCard.getCurrentMovement() + " <i>(";
    if (PCard.getCurrentMovement() - PCard.base_movement >=0 ) { res += "+"; }
    res += (PCard.getCurrentMovement() - PCard.base_movement) + ")</i></p>";
    
    res += "<p>RC: " + PCard.getCurrentNormAtkRange() + " <i>(";
    if (PCard.getCurrentNormAtkRange() - PCard.base_normal_attack_range >=0 ) { res += "+"; }
    res += (PCard.getCurrentNormAtkRange() - PCard.base_normal_attack_range) + ")</i></p>";

    res += "</div>";

  res += "</div>";

  res += '<p class="hoverBoxSkill"><span class="hoverHintSkillText">Ability:</span> <span id="abilityTitle" p1='+isPlayer1+'>'+PCard.ability_title+'</span> '+PCard.ability_text;
    res += '<span class="hoverBoxSkillTooltip">ability</span>';
    res += '</p>';
  res += '<p class="hoverBoxSkill"><span class="hoverHintSkillText">Ultimate:</span> <span id="ultTitle" p1='+isPlayer1+'>'+PCard.ult_title+'</span> '+PCard.ult_text;
    res += '<span class="hoverBoxSkillTooltip">ultimate</span>';
    res += '</p>';
  res += '<p class="hoverBoxSkill"><i><span class="hoverHintSkillText">Passive:</span> <span id="passiveTitle" p1='+isPlayer1+'>'+PCard.passive_title+'</span></i> '+PCard.passive_text;
    res += '<span class="hoverBoxSkillTooltip">passive</span>';
    res += '</p>';
  
  return res;
}

function getClearBroadcastForInfoBox() {
  return "";
}