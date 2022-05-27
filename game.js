//////////////////////////////////// change before commmit

document.addEventListener("DOMContentLoaded", () => {
  console.log("loaded~");
  const mainGrid = document.getElementById("mainGrid");
  const onFieldCards = document.getElementById("onFieldCards");
  const gameInfoBox = document.getElementById("gameInfoBox");
  const offFieldCards = document.getElementById("offFieldCards");
  const gameOptions = document.getElementById("gameOptions");

  // create game board
  const squares = [];
  const layout = [
    0, 0, 0, 4,
    0, 1, 1, 3,
    0, 0, 2, 2,
    0, 0, 3, 3
  ];

  function createBoard() {
    for (let i = 0; i < layout.length; i++) {
      const square = document.createElement("div");
      squares.push(square);
      squares[i].classList.add("gameSquare");
      mainGrid.appendChild(square);

      if (layout[i] === 0) {
        squares[i].classList.add("default");
      } else if (layout[i] === 1) {
        squares[i].classList.add("jungle");
      } else if (layout[i] === 2) {
        squares[i].classList.add("water");
      } else if (layout[i] === 3) {
        squares[i].classList.add("sand");
      } else if (layout[i] === 4) {
        squares[i].classList.add("obstacle");
      }
    }
  }
  console.log("loaded2~");
  createBoard();

  // card setup and playing logic
  const base_stat_dictionary = {
    "test1":(100,200,100,20,50), 
    "test2":(10,200,300,20,20), 
    "test3":(500,200,100,0,60)
  } // #TODO move this somewhere else

  // utility functions for cards
  function getBaseStats(cardType) {
    return base_stat_dictionary[cardType];
  }

  // Card information class
  class Card {
    constructor(cardName) {
      const base_stats = getBaseStats(cardName);
      this.cardName = cardName;
      this.name = "XXXX";
      this.base_attack = base_stats[0];
      this.base_defense = base_stats[1];
      this.base_health = base_stats[2];
      this.base_mana = base_stats[3];
      this.base_movement = base_stats[4];
    }
  }

  class PlayerCard extends Card {
    constructor(cardName, isFigurine, aggressive, currentIndex) {
      super(cardName);
      this.current_attack = this.base_attack
      this.current_defense = this.base_defense
      this.current_health = this.base_health
      this.current_mana = this.base_mana
      this.current_movement = this.base_movement
      this.dead = false

      this.attack_bonus = 0
      this.defense_bonus = 0
      this.health_bonus = 0
      this.mana_bonus = 0
      this.movement_bonus = 0

      this.is_figurine = isFigurine
      this.statuses = {"blinded":0, "charmed":0, "poisoned":0, "stunned":0, "terrified":0}

      this.aggressive = aggressive // whether in attack or defense stance
      this.currentIndex = currentIndex // location on grid
    }
  }

  // create some default cards
  defaultCards = [
    new PlayerCard("test1", false, true, 12),
    new PlayerCard("test2", true, true, 0),
    new PlayerCard("test1", false, false, 9)
  ];

  // draw cards and figurines
  const playerCards = [];
  defaultCards.forEach((defaultCard) => {
    const ccard = document.createElement("div");

    squares[defaultCard.currentIndex].classList.add(defaultCard.cardName);
    ccard.classList.add(defaultCard.cardName);

    const token = document.createElement("div");
    if (defaultCard.is_figurine) {
      token.classList.add("figurine");
      ccard.classList.add("cardIsFigurine");
    } else {
      token.classList.add("notFigurine");
      ccard.classList.add("cardIsNotFigurine");
    }
    token.classList.add("player1");
    squares[defaultCard.currentIndex].appendChild(token);

    squares.push(ccard);
    onFieldCards.appendChild(ccard);
  });

  // use clearInterval, setInterval, card.timerId or similar, setTimeout
  // document.removeEventListener
  // event? event.keyCode, addEventListener
});