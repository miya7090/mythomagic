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
    }
  }

function exportPC(pcard){
  return {
    "n": pcard.cardName, "ca": pcard.current_attack, "cnar": pcard.current_normal_attack_range,
    "cd": pcard.current_defense, "ch": pcard.current_health, "cm": pcard.current_mana,
    "cmpt": pcard.current_mana_per_turn, "cmpa": pcard.current_mana_per_atk,
    "m": pcard.current_movement, "d": pcard.dead, "hb": pcard.health_bonus, "mb": pcard.mana_bonus,
    "if": pcard.is_figurine, "s": pcard.statuses, "qq": pcard.q, "rr": pcard.r, "ss": pcard.s // #TODO compress this?
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
      this.statuses = {"blinded":0, "charmed":0, "poisoned":0, "stunned":0, "terrified":0};

      this.q = pc_q; // location on grid
      this.r = pc_r;
      if (pc_s !== -pc_q -pc_r){
          console.error("attempted to make a player card with invalid cubic coordinates: "+pc_q+","+pc_r+","+pc_s);
      }
      this.s = pc_s;
      this.refreshTag();
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
      this.tag = this.q+","+this.r+","+this.s;
    }
    changeLocationTo(nq,nr){
      this.q = nq;
      this.r = nr;
      this.s = -nq - nr;
      this.refreshTag();
    }
    moveLocationBy(nq,nr){
      this.q += nq;
      this.r += nr;
      this.s = -this.q - this.r;
      this.refreshTag();
    }
    flipAcrossBoard(){
      [this.q, this.r, this.s] = getReflectedCoordinate(this.q, this.r, this.s);
      this.refreshTag();
    }
    /*getRangeOfMotion(){
      return 

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
    }*/
  }

  class Player {
    constructor(name, figurine, cardsPicked) {
      /////////////////////////////////////////////////// fill in from here #TODO
      const base_stats = getBaseStats(cardName);
      this.cardName = cardName;
      this.base_attack = base_stats[0];
      this.base_defense = base_stats[1];
      this.base_health = base_stats[2];
      this.base_mana = base_stats[3];
      this.base_movement = base_stats[4];
    }
  }