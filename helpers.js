  // what to do when key pressed
  function logKey(event) {
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

  // get hex distance
  function getTileDistance(aQ, aR, aS, bQ, bR, bS) {
    return Math.max(Math.abs(aQ-bQ), Math.abs(aR-bR), Math.abs(aS-bS));
  }

  // fancy tile highlighting and clearing of highlights
  function highlightSelfAndRadius(turnOn, cubeQ, cubeR, cubeS){
    const radius = MOUSE_HOVER_RADIUS;
    const tileNeighbors = getCoordinatesWithinRadius(cubeQ,cubeR,cubeS,radius,true);

    tileNeighbors.forEach((tileNeighbor) => {
        HEXTILE_CUBIC_INDEX[tileNeighbor].setAttribute("hoverHighlight", turnOn);
    });

  }

  // get list of all coordinates within range of given center tile
  function getCoordinatesWithinRadius(cQ, cR, cS, radius, includeSelf=true){
    var results = []; // returns list of strings

    for (let q = -radius; q <= radius; q++) {
      for (let r = Math.max(-radius, -q-radius); r <= Math.min(radius, -q+radius); r++) {
        var s = -q-r;
        const neighborInfo = (cQ+q)+","+(cR+r)+","+(cS+s);
        if (HEXTILE_CUBIC_INDEX[neighborInfo] !== undefined){
          results.push(neighborInfo);
        }
      }
    }

    if (includeSelf == false) { results.splice(results.indexOf(cQ+","+cR+","+cS),1); }
    return results;
  }

  // retrieve base stats of a card, return array
  function getBaseStats(cardType) {
    if (BASE_STAT_DICT[cardType] == undefined){
      console.error(cardType+" not found in base stat dictionary");
    }
    return BASE_STAT_DICT[cardType];
  }

  // #TODO change this up
  function savingThrow(savingThrowThreshold) {
    // augmented by movement speed and defense
    const mvmtOffset = (this.current_movement + this.movement_bonus) / MVMT_SPD_SCALE_TO_SAVE_THROW;
    const defOffset = (this.current_defense + this.defense_bonus) / DEFENCE_SCALE_TO_SAVE_THROW;
    var figBoost = 0;
    if (this.is_figurine){
      figBoost = FIGURINE_SAVING_THROW_FLAT_BOOST;
    }
    return (Math.floor(Math.random()*20) + mvmtOffset + defOffset + figBoost) > savingThrowThreshold;
  }

  // for formatting display of cards available to player
  function getBaseCardHTML(cardName, imgLink) {
    return cardName + "\n TODO";
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

  function getBroadcastForInfoBox(PCard) {
    var pcResult = "<p>" + PCard.cardName + " (" + PCard.dead + ")</p>";
    
    var healthPercentage = PCard.current_health / (PCard.base_health + PCard.health_bonus);
    healthPercentage = Math.round(100 * healthPercentage);
    pcResult += "<p>" + healthPercentage + "%, ";
    pcResult += PCard.current_health + "/" + (PCard.base_health + PCard.health_bonus) + "HP ";
    pcResult += "(" + PCard.base_health + "+" + PCard.health_bonus + ")</p>";
    
    var manaPercentage = PCard.current_mana / (MAX_MANA + PCard.mana_bonus);
    manaPercentage = Math.round(100 * manaPercentage);
    pcResult += "<p>" + manaPercentage + "%, ";
    pcResult += PCard.current_mana + "/" + (MAX_MANA + PCard.mana_bonus) + "MP ";
    pcResult += "(" + MAX_MANA + "+" + PCard.mana_bonus + ")</p>";
    
    pcResult += "<p>ATK: " + PCard.current_attack + " (base " + PCard.base_attack + ")</p>";
    pcResult += "<p>Normal range: " + PCard.current_normal_attack_range + " (base " + PCard.base_normal_attack_range + ")</p>";
    pcResult += "<p>DEF: " + PCard.current_defense + " (base " + PCard.base_defense + ")</p>";
    pcResult += "<p>MP/turn: " + PCard.current_mana_per_turn + " (base " + PCard.base_mana_per_turn + ")</p>";
    pcResult += "<p>MP/atk: " + PCard.current_mana_per_atk + " (base " + PCard.base_mana_per_atk + ")</p>";
    pcResult += "<p>MVT: " + PCard.current_movement + " (base " + PCard.base_movement + ")</p>";
    
    if (PCard.is_figurine == true) {
        pcResult += "<p>********* display holofoil power here ***********</p>";
    } else {
        pcResult += "<p>Holofoil unavailable</p>";
    }

    var statusTxt = "<p>Statuses: ";
    for (var sKey in PCard.statuses){
        if (PCard.statuses[sKey] == 1){
            statusTxt += sKey + " ";
        }
    }
    if (statusTxt === "<p>Statuses: ") {
        statusTxt += "none";
    }
    pcResult += statusTxt + "</p>";

    return pcResult;
  }

  function getClearBroadcastForInfoBox() {
    return "";
  }