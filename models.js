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

      this.attack_bonus = 0;
      this.defense_bonus = 0;
      this.health_bonus = 0;
      this.mana_bonus = 0;
      this.mana_turnRegen_bonus = 0;
      this.mana_atkRegen_bonus = 0;
      this.movement_bonus = 0;

      this.is_figurine = isFigurine;
      this.statuses = {"blinded":0, "charmed":0, "poisoned":0, "stunned":0, "terrified":0};

      this.q = pc_q; // location on grid
      this.r = pc_r;
      if (pc_s !== -pc_q -pc_r){
          console.error("attempted to make a player card with invalid cubic coordinates: "+pc_q+","+pc_r+","+pc_s);
      }
      this.s = pc_s;
      this.tag = pc_q+","+pc_r+","+pc_s;
    }
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