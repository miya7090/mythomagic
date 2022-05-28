//////////////////////////////////// change before commmit

document.addEventListener("DOMContentLoaded", () => {
  console.log("loaded~");
  console.log(BASE_DAMAGE_DIFF_SCALE_TO_HP);
  const mainGrid = document.getElementById("hexContainer");
  const onFieldCards = document.getElementById("onFieldCards");
  const gameInfoBox = document.getElementById("gameInfoBox");
  const offFieldCards = document.getElementById("offFieldCards");
  const gameOptions = document.getElementById("gameOptions");

  // create game board
  const squares = [];
  const layout = [];
  // create hexagon
  addRow(3, 7); addRow(2, 8); addRow(2, 9);
  addRow(1, 10); addRow(1, 11); addRow(0, 12);
  addRow(0, 13);
  addRow(0, 12); addRow(1, 11); addRow(1, 10);
  addRow(2, 9);  addRow(2, 8); addRow(3, 7);
  
  function addRow(marginLen, mainRowLen) {
    const row = document.createElement("div");
    row.classList.add("hexRow");
    mainGrid.appendChild(row);
    for (let i = 0; i < marginLen; i++) { addTile("offgrid"); }
    for (let i = 0; i < mainRowLen; i++) { addTile("default"); }
    for (let i = 0; i < marginLen; i++) { addTile("offgrid"); }
  }

  function addTile(tileType) {
    const square = document.createElement("div");
    squares.push(square);
    square.classList.add("gameSquare");
    square.classList.add(tileType);
    mainGrid.appendChild(square);
  }
  
  // default, jungle, water, offgrid, obstacle
  console.log("loaded2~");

  // card setup and playing logic
  const base_stat_dictionary = {
    // name, base atk, normal attack range, defense, hp, mana per turn, mana per attack, movement speed
    "Athena":(3000,2,15,700,100,100,1), 
    "Kronos":(3000,2,10,700,100,250,1), 
    "Achilles":(2900,2,20,600,100,250,2),
    "Apollo":(2000,6,10,700,100,250,1),
    "Jason":(2100,2,10,800,100,250,1),
    "Hestia":(500,2,15,1200,250,0,1)
  } // #TODO move this somewhere else


  // utility functions for cards
  function getBaseStats(cardType) {
    if (base_stat_dictionary[cardType] == undefined){
      console.error(cardType+" not found in base stat dictionary");
    }
    return base_stat_dictionary[cardType];
  }

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
    constructor(cardName, isFigurine, currentIndex) {
      super(cardName);
      this.current_attack = this.base_attack;
      this.current_normal_attack_range = this.base_normal_attack_range;
      this.current_defense = this.base_defense;
      this.current_health = this.base_health;
      this.current_mana = this.base_mana;
      this.current_mana_per_turn = this.base_mana_per_turn;
      this.current_mana_per_atk = this.base_mana_per_atk;
      this.current_movement = this.base_movement;
      this.dead = false;

      this.attack_bonus = 0;
      this.defense_bonus = 0;
      this.health_bonus = 0;
      this.mana_bonus = 0;
      this.movement_bonus = 0;

      this.is_figurine = isFigurine;
      this.statuses = {"blinded":0, "charmed":0, "poisoned":0, "stunned":0, "terrified":0};

      this.currentIndex = currentIndex; // location on grid
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

  // create some default cards
  var defaultCards = [
    new PlayerCard("Achilles", false, 12),
    new PlayerCard("Apollo", true, 0),
    new PlayerCard("Athena", true, 2),
    new PlayerCard("Hestia", false, 5),
    new PlayerCard("Apollo", false, 9)
  ];

  // draw cards and figurines
  const playerCards = [];
  defaultCards.forEach((defaultCard) => {
    const ccard = document.createElement("div");
    squares[defaultCard.currentIndex].classList.add(defaultCard.cardName);
    ccard.classList.add(defaultCard.cardName);
    ccard.classList.add("ccard");

    const token = document.createElement("div");
    token.classList.add("token");
    if (defaultCard.is_figurine) {
      token.classList.add("figurine");
      ccard.classList.add("cardIsFigurine");
    } else {
      token.classList.add("notFigurine");
      ccard.classList.add("cardIsNotFigurine");
    }
    token.classList.add("player1");
    squares[defaultCard.currentIndex].appendChild(token);

    squares.push(token);
    onFieldCards.appendChild(ccard);
  });

  // use clearInterval, setInterval, card.timerId or similar, setTimeout
  // document.removeEventListener
  // event? event.keyCode, addEventListener
});