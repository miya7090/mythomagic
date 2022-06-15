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
    }
  }

function exportPC(pcard){
  return {
    "n": pcard.cardName, "ca": pcard.current_attack, "cnar": pcard.current_normal_attack_range,
    "cd": pcard.current_defense, "ch": pcard.current_health, "cm": pcard.current_mana,
    "cmpt": pcard.current_mana_per_turn, "cmpa": pcard.current_mana_per_atk,
    "m": pcard.current_movement, "d": pcard.dead, "hb": pcard.health_bonus, "mb": pcard.mana_bonus,
    "if": pcard.is_figurine, "s": pcard.statuses, "qq": pcard.getQ(), "rr": pcard.getR(), "ss": pcard.getS() // #TODO compress this?
  };
}

function exportAllP1Cs(withflip){
  let ans = [];
  PLAYER_GAMECARD_OBJS.forEach(pc => {
    let pcB = pc;
    if (withflip == true){
      pcB.flipAcrossBoard();
    }
    ans.push(exportPC(pcB));
  });
  return ans;
}

function exportAllP2Cs(withflip){
  let ans = [];
  ENEMY_GAMECARD_OBJS.forEach(pc => {
    let pcB = pc;
    if (withflip == true){
      pcB.flipAcrossBoard();
    }
    ans.push(exportPC(pcB));
  });
  return ans;
}

function importPC(pcJson){
  let ans = new PlayerCard(pcJson["n"], pcJson["if"], pcJson["qq"], pcJson["rr"], pcJson["ss"]);
  ans.current_attack = pcJson["ca"]; ans.current_normal_attack_range = pcJson["cnar"];
  ans.current_defense = pcJson["cd"]; ans.current_health = pcJson["ch"]; ans.current_mana = pcJson["cm"];
  ans.current_mana_per_turn = pcJson["cmpt"]; ans.current_mana_per_atk = pcJson["cmpa"];
  ans.current_movement = pcJson["m"]; ans.dead = pcJson["d"]; ans.health_bonus = pcJson["hb"];
  ans.mana_bonus = pcJson["mb"]; ans.statuses = pcJson["s"];
  return ans;
}

function importAllP1Cs(pcListObj){
  let ans = [];
  PLAYER_GAMECARD_OBJS = [];
  Object.keys(pcListObj).forEach(key => { PLAYER_GAMECARD_OBJS.push(importPC(pcListObj[key])); });
  return ans;
}

function importAllP2Cs(pcListObj){
  let ans = [];
  ENEMY_GAMECARD_OBJS = [];
  Object.keys(pcListObj).forEach(key => { ENEMY_GAMECARD_OBJS.push(importPC(pcListObj[key])); });
  return ans;
}

  class PlayerCard extends Card {
    #q; #r; #s; // private variables for position for better debugging
    constructor(cardName, isFigurine, pc_q, pc_r, pc_s) {
      super(cardName);
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

      this.is_figurine = isFigurine;
      this.statuses = {"charmed":0, "distracted":0, "poisoned":0, "stunned":0, "terrified":0, "obscured":0};

      if (pc_s !== -pc_q -pc_r){
          console.error("warning, requested to make a player card with invalid cubic coordinates: "+pc_q+","+pc_r+","+pc_s);
      }
      this.changeLocationTo(pc_q, pc_r);
      this.refreshTag();
    }
    giveTurnMana(){
      this.current_mana += this.current_mana_per_turn;
      if (this.current_mana >= MAX_MANA + this.mana_bonus) {
        this.current_mana = MAX_MANA + this.mana_bonus;
      }
    }
    giveAttackMana(){
      this.current_mana += this.current_mana_per_atk;
      if (this.current_mana >= MAX_MANA + this.mana_bonus) {
        this.current_mana = MAX_MANA + this.mana_bonus;
      }
    }
    takeDamage(flatNum){
      this.current_health -= flatNum;
      console.log(this.cardName, "took", flatNum, "damage");
      if (this.current_health <= 0) {
        this.current_health = 0;
        this.dead = "defeated";
        console.log(this.cardName, "has been defeated"); // #TODO change color, remove function of defeated card
      }
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
