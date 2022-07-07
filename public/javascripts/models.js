// @miya7090

// Card information class
  class Card {
    constructor(cardName) {
      const base_stats = getBaseStats(cardName);
      this.cardName = cardName;
      this.base_attack = base_stats[0];
      this.base_normal_attack_range = base_stats[1];
      this.base_defense = base_stats[2];
      this.base_health = base_stats[3];
      this.base_mana_per_turn = base_stats[4];
      this.base_mana_per_atk = base_stats[5];
      this.base_movement = base_stats[6];

      this.ability_aim_range = base_stats[7];
      this.ability_is_aimed = (this.ability_aim_range != undefined);
      this.ability_aim_aoe = base_stats[8];
      this.ult_aim_range = base_stats[9];
      this.ult_is_aimed = (this.ult_aim_range != undefined);
      this.ult_aim_aoe = base_stats[10];

      this.ability_title = base_stats[11];
      this.ability_text = base_stats[12];
      this.ult_title = base_stats[13];
      this.ult_text = base_stats[14];
      this.passive_title = base_stats[15];
      this.passive_text = base_stats[16];

      this.hero_class = base_stats[17];
    }
  }

function exportPC(pcard){
  return {
    "n": pcard.cardName, "ca": pcard.current_attack, "cnar": pcard.current_normal_attack_range,
    "cd": pcard.current_defense, "ch": pcard.current_health, "cm": pcard.current_mana,
    "cmpt": pcard.current_mana_per_turn, "cmpa": pcard.current_mana_per_atk,
    "m": pcard.current_movement, "d": pcard.dead, "hb": pcard.health_bonus, "mb": pcard.mana_bonus,
    "s": pcard.statuses, "b": pcard.blessings, "qq": pcard.getQ(), "rr": pcard.getR(), "ss": pcard.getS() // #TODO compress this?
  };
}

function getPCNames(pcArray){
  if (pcArray.length == 1){
    return pcArray[0].cardName;
  } else if (pcArray.length == 2){
    return pcArray[0].cardName + " and " + pcArray[1].cardName;
  } else {
    var ans = "";
    for(let i = 0; i < pcArray.length - 1; i++){
      ans += pcArray[i].cardName + ", "
    }
    ans += "and " + pcArray[pcArray.length - 1].cardName;
  }
}

function exportAllP1Cs(){
  let ans = [];
  PLAYER_GAMECARD_OBJS.forEach(pc => {
    ans.push(exportPC(pc));
  });
  return ans;
}

function exportAllP2Cs(){
  let ans = [];
  ENEMY_GAMECARD_OBJS.forEach(pc => {
    ans.push(exportPC(pc));
  });
  return ans;
}

function importPC(pcJson, p1){
  let ans = new PlayerCard(pcJson["n"], pcJson["qq"], pcJson["rr"], pcJson["ss"], p1);
  ans.current_attack = pcJson["ca"]; ans.current_normal_attack_range = pcJson["cnar"];
  ans.current_defense = pcJson["cd"]; ans.current_health = pcJson["ch"]; ans.current_mana = pcJson["cm"];
  ans.current_mana_per_turn = pcJson["cmpt"]; ans.current_mana_per_atk = pcJson["cmpa"];
  ans.current_movement = pcJson["m"]; ans.dead = pcJson["d"]; ans.health_bonus = pcJson["hb"];
  ans.mana_bonus = pcJson["mb"]; ans.statuses = pcJson["s"]; ans.blessings = pcJson["b"];

  if (ans.current_health > ans.getMaxHealth()){
    console.error("warning: PC imported had health issue", ans);
    ans.current_health = ans.getMaxHealth();
  }

  if (ans.current_health < 0){
    console.error("warning: PC imported had health issue", ans);
    ans.current_health = 0;
  }

  if (ans.current_mana > ans.getMaxMana()){
    console.error("warning: PC imported had mana issue", ans);
    ans.current_mana = ans.getMaxMana();
  }

  if (ans.current_mana < 0){
    console.error("warning: PC imported had mana issue", ans);
    ans.current_mana = 0;
  }

  return ans;
}

function importAllP1Cs(pcListObj){
  PLAYER_GAMECARD_OBJS = [];
  Object.keys(pcListObj).forEach(key => {
    let newPC = importPC(pcListObj[key],true);
    newPC.flipAcrossBoard();
    PLAYER_GAMECARD_OBJS.push(newPC);
  });
}

function importAllP2Cs(pcListObj){
  ENEMY_GAMECARD_OBJS = [];
  Object.keys(pcListObj).forEach(key => {
    let newEC = importPC(pcListObj[key],false);
    newEC.flipAcrossBoard();
    ENEMY_GAMECARD_OBJS.push(newEC);
  });
}

  class PlayerCard extends Card {
    #q; #r; #s; // private variables for position for better debugging
    constructor(cardName, pc_q, pc_r, pc_s, p1) {
      super(cardName);
      this.p1 = p1;
      this.current_attack = this.base_attack;
      this.current_normal_attack_range = this.base_normal_attack_range;
      this.current_defense = this.base_defense;
      this.current_health = this.base_health;
      this.current_mana = 0;
      this.current_mana_per_turn = this.base_mana_per_turn;
      this.current_mana_per_atk = this.base_mana_per_atk;
      this.current_movement = this.base_movement;
      this.dead = "active"; // "active", "defeated", or "undead"

      this.health_bonus = 0;
      this.mana_bonus = 0;

      this.clearBlessings();
      this.clearStatuses();

      if (pc_s !== -pc_q -pc_r){
          console.error("warning, requested to make a player card with invalid cubic coordinates: "+pc_q+","+pc_r+","+pc_s);
      }
      this.changeLocationTo(pc_q, pc_r);
      this.refreshTag();
    }
    reviveToHP(hpAmt){
      if (this.p1 && hasEnemyCard("Hades")){ // passive_hades
        broadcastMsg("passive", false, "Hades", undefined);
      } else if (!this.p1 && hasAllyCard("Hades")){
        broadcastMsg("passive", true, "Hades", undefined);
      } else {
        this.dead = "active";
        this.heal(hpAmt);
      }
    }
    getCurrentAttack(){
      let effectiveAttack = this.current_attack;

      if (this.cardName == "Icarus") { // passive_icarus
        effectiveAttack += 400 * this.current_movement;
      }

      if (this.p1 && hasAllyCard("Jason")) { // passive_jason
        effectiveAttack += 100 * countCardsMatching(PLAYER_GAMECARD_OBJS, ARGONAUT_LIST);
      }
      if (!this.p1 && hasEnemyCard("Jason")) {
        effectiveAttack += 100 * countCardsMatching(ENEMY_GAMECARD_OBJS, ARGONAUT_LIST);
      }

      if (this.statuses["terrified"] != 0) {
        effectiveAttack -= (0.5 * this.current_attack);
      }
      if (this.statuses["stunned"] != 0) {
        effectiveAttack = 0;
      }
      if (effectiveAttack < 0) { effectiveAttack = 0; }

      if ((this.p1 && hasEnemyCard("Themis")) || (!this.p1 && hasAllyCard("Themis"))) { // passive_themis
        if (effectiveAttack > 5000){
          effectiveAttack = 5000;
        }
      }

      return Math.round(effectiveAttack);
    }
    getCurrentDefense(){
      let effectiveDefense = this.current_defense;

      if (this.cardName == "Icarus") { // passive_icarus
        effectiveDefense -= 2 * this.current_movement;
      }

      if (this.p1 && hasAllyCard("Hera")) { // passive_hera
        effectiveDefense += countCardsMatching(PLAYER_GAMECARD_OBJS, OLYMPIAN_LIST);
      }
      if (!this.p1 && hasEnemyCard("Hera")) {
        effectiveDefense += countCardsMatching(ENEMY_GAMECARD_OBJS, OLYMPIAN_LIST);
      }

      if (this.statuses["distracted"] != 0) {
        effectiveDefense -= (0.25 * this.current_defense);
      }
      if (this.statuses["charmed"] != 0) {
        effectiveDefense = 1;
      }
      if (effectiveDefense < 1) { effectiveDefense = 1; }

      if ((this.p1 && hasEnemyCard("Themis")) || (!this.p1 && hasAllyCard("Themis"))) { // passive_themis
        if (effectiveDefense > 30){
          effectiveDefense = 30;
        }
      }

      return Math.round(effectiveDefense);
    }
    getCurrentMovement(){
      let effectiveMovement = this.current_movement;
      if (this.statuses["stunned"] != 0) {
        effectiveMovement = 0;
      }
      return effectiveMovement;
    }
    getCurrentNormAtkRange(){
      let effectiveCNAR = this.current_normal_attack_range;
      if (this.statuses["stunned"] != 0) {
        effectiveCNAR = 1;
      }
      return effectiveCNAR;
    }
    clearBlessings(){
      this.blessings = {"Hestia": false, "Hermes": false}; 
    }
    giveBlessing(blessName){
      if (this.blessings[blessName] == false) {
        this.blessings[blessName] = true;
        if (blessName == "Hestia"){
          console.log("adding hestia blessing to",this);
          blessing_hestia(true, this);
        } else if (blessName == "Hermes"){
          console.log("adding hermes blessing to",this);
          blessing_hermes(true, this);
        } else {
          console.error("blessing code missing for",blessName);
        }
      }
    }
    removeBlessing(blessName){
      if (this.blessings[blessName] == true) {
        this.blessings[blessName] = false;
        if (blessName == "Hestia"){
          console.log("removing hestia blessing for",this);
          blessing_hestia(false, this);
        } else if (blessName == "Hermes"){
          console.log("removing hermes blessing for",this);
          blessing_hermes(false, this);
        } else {
          console.error("blessing code missing for",blessName);
        }
      }
    }
    getMaxHealth(){
      let maxH = this.base_health + this.health_bonus;
      return maxH;
    }
    setMaxHealthTo(fn){
      let flatNum = Math.round(fn);
      if (this.dead != "defeated") {
        this.health_bonus = -(this.base_health - flatNum);
        if (this.current_health > this.getMaxHealth()){
          this.current_health = this.getMaxHealth();
        }
        if (this.current_health < 0){
          this.current_health = 0;
        }
      }
    }
    changeMaxHealthBy(fn){
      let flatNum = Math.round(fn);
      if (this.dead != "defeated") {
        this.health_bonus += flatNum;
        if (this.current_health > this.getMaxHealth()){
          this.current_health = this.getMaxHealth();
        }
        if (this.current_health < 0){
          this.current_health = 0;
        }
      }
    }
    getMaxMana(){
      return MAX_MANA + this.mana_bonus;
    }
    setMaxManaTo(fn){
      let flatNum = Math.round(fn);
      if (this.dead != "defeated") {
        this.mana_bonus = -(MAX_MANA - flatNum);
        if (this.current_mana > flatNum){
          this.current_mana = flatNum;
        }
      }
    }
    inflictStatus(iStat){
      if (this.dead != "defeated" && this.statuses[iStat] == 0){
        if (this.p1){ passive_medea_onAlly(this); } else { passive_medea_onEnemy(this); }
        this.statuses[iStat] += STATUS_DEFAULT_LENGTH;
      }
    }
    decreaseStatusCooldowns(){
      Object.keys(this.statuses).forEach(iStat => {
        if (this.statuses[iStat] > 0) {
          this.statuses[iStat] -= 1;
        }
      });
    }
    clearStatus(iStat){
      this.statuses[iStat] = 0;
    }
    clearStatuses() {
      this.statuses = {"charmed":0, "distracted":0, "poisoned":0, "stunned":0, "terrified":0, "obscured":0};
    }
    statusesAreClear() {
      return Object.values(this.statuses).every(v => v == 0);
    }
    giveTurnMana(){
      this.giveMana(this.current_mana_per_turn + passive_hecate(this.p1));
    }
    giveAttackMana(){
      this.giveMana(this.current_mana_per_atk);
    }
    giveMana(flatNum){
      if (this.dead != "defeated" && this.statuses["distracted"] == 0) {
        this.current_mana += Math.round(flatNum);
        if (this.current_mana >= this.getMaxMana()) {
          this.current_mana = this.getMaxMana();
        }
      }
    }
    heal(flatNum){
      if (this.dead != "defeated") {
        this.current_health += Math.round(flatNum);
        console.log(this.cardName, "healed", flatNum, "damage");
        if (this.current_health > this.getMaxHealth()) {
          this.current_health = this.getMaxHealth();
        }
      }
    }
    fullHeal(){
      if (this.dead != "defeated") {
        this.current_health = this.getMaxHealth();
      }
    }
    takeDamage(fn){
      let flatNum = Math.round(fn);
      if (this.cardName == "Heracles" && fn > 300) { // passive_heracles
        broadcastMsg("passive", this.p1, "Heracles", undefined);
        flatNum = 300;
      }
      if (this.dead != "defeated") {
        if (flatNum / this.current_health > 0.5) { // lost >50% HP in this attack
          if (this.p1){ passive_thanatos_onAlly(this); } else { passive_thanatos_onEnemy(this); }
        }
        this.current_health -= flatNum;
        console.log(this.cardName, "took", flatNum, "damage");
        passive_gaea(this);
        if (this.current_health <= 0) { // card is defeated

          if (passive_orpheus(this.p1, this.cardName)){
            this.fullHeal();
            this.current_mana = 0;
            this.clearStatuses();
          } else {
            broadcastMsg("defeat", this.p1, this.cardName, undefined);
            this.current_health = 0;
            this.current_mana = 0;
            this.clearStatuses();
            this.dead = "defeated";
            playSound("heroDeath", 1.0);
            if (this.p1){ // ally was defeated
              passive_achilles_onAlly();
              passive_perseus_onAlly();
            } else { // enemy was defeated
              passive_achilles_onEnemy();
              passive_perseus_onEnemy();
            }
            clearBestowedBlessingsFrom(this.cardName, this.p1);
            markTokenDefeated(this.p1, this.cardName);
          }
        }
      }
    }
    revertToBaseStats(){
      this.clearBlessings();
      this.clearStatuses();
      this.setMaxHealthTo(this.base_health);
      this.setMaxManaTo(MAX_MANA);
    
      this.current_attack = this.base_attack;
      this.current_normal_attack_range = this.base_normal_attack_range;
      this.current_defense = this.base_defense;
      this.current_health = this.base_health;
      this.current_mana_per_turn = this.base_mana_per_turn;
      this.current_mana_per_atk = this.base_mana_per_atk;
      this.current_movement = this.base_movement;
    }
    refreshTag(){
      this.tag = this.#q+","+this.#r+","+this.#s;
    }
    changeLocationTo(nq,nr){
      this.#q = nq;
      this.#r = nr;
      this.#s = -nq - nr;
      this.refreshTag();
    }
    moveLocationBy(nq,nr){
      this.#q += nq;
      this.#r += nr;
      this.#s = -this.#q - this.#r;
      this.refreshTag();
    }
    flipAcrossBoard(){
      [this.#q, this.#r, this.#s] = getReflectedCoordinate(this.#q, this.#r, this.#s);
      this.refreshTag();
    }
    getQ(){
      return this.#q;
    }
    getR(){
      return this.#r;
    }
    getS(){
      return this.#s;
    }
  }
