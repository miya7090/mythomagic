// @miya7090

MY_SOCKET = undefined;
OPPONENT_SOCKET_ID = undefined;
OTHER_NAME = undefined;

GITHUB_PUBLIC_PATH = "https://raw.githubusercontent.com/miya7090/mythomagic/main/public/";

BASE_DAMAGE_DIFF_SCALE_TO_HP = 20
MVMT_SPD_SCALE_TO_SAVE_THROW = 20
DEFENCE_SCALE_TO_SAVE_THROW = 20
RANDOM_DAMAGE_OFFSET = 20
STATUS_DEFAULT_LENGTH = 3
MAX_STATUS_STACKS = 7
FIGURINE_ATTACK_MULTIPLIER = 1.2
FIGURINE_INFLICT_STATUS_FLAT_BOOST = 5
FIGURINE_SAVING_THROW_FLAT_BOOST = 5
HEX_SIDELENGTH = 13;
HEX_RADIUS = (HEX_SIDELENGTH-1)/2;
CUBE_DIR_VECS = [[1,0,-1],[1,-1,0],[0,-1,1],[-1,0,1],[-1,1,0],[0,1,-1]];
MOUSE_HOVER_RADIUS = 0;
CURRENT_MOUSE_Q = undefined;
CURRENT_MOUSE_R = undefined;
CURRENT_MOUSE_S = undefined;
ABILITY_MANA_REQ = 200;
MAX_MANA = 1000;
HEXTILE_CUBIC_INDEX = {}; // keys: "q,r,s", maps to divs that are hextiles

PICK_PHASE_TIMER = 30000; // 30 sec in ms
PICK_PHASE_STARTED_AT = undefined;
GAME_MODE = "startup"; // startup, pick-phase; [p1-, p2-]active, moveToken, attackSelect, autoattack, ability, abilityAim, ultimate, ultimateAim
GAME_MODE_MEMORYTARGET = undefined; // used if moving tokens, etc

const BASE_STAT_DICT = {
    // name, base atk, normal atk range, defense, hp, mana per turn, mana per attack, mvt speed
    // ability aimed/range, ult aimed/range
    "Athena":[30000,2,15,700,100,100,2, 3,1,5,8,
      "Aegis","Target gains 10 defense, clears statuses",
      "Deliberate Strike","700 true damage to one target",
      "Well-Prepared","Player cards start game with +100 mana"], 
    "Apollo":[2000,6,10,700,100,250,3, undefined,9,undefined,9,
        "Volley","300 damage to all enemies over 6 tiles away",
        "Inspiration","Clear all statuses from all cards, recover 20% health, 20% mana for all cards",
        "Medicine","+30HP to all heroes, -30HP to all enemies on each turn"],
    "Achilles":[2900,3,20,600,100,250,2, undefined,3,undefined,2,
      "Berserk","Clear all statuses, attack all enemies within range",
      "Invulnerability", "HP set to 1HP, gain 40 def",
      "Clarity","Clear all statuses, gain 1000ATK when ally defeated"],
    "Medea":[1400,2,10,500,100,300,1, 3,1,undefined,6,
      "Poison", "Drain all mana from one enemy on-field card",
      "Cold Blood", "Remove ally card, add its current stats to self, regain full HP",
      "Vengeance", "For magical attacks, 50% chance of counterspell that casts the same damage/effect on enemy"], 
    "Poseidon":[4000,2,10,700,100,250,1, undefined,9,undefined,6,
        "Whirlpool","Pull all enemies 3 tiles towards self, 200 dmg to each",
        "Hurricane","250 dmg to all targets in 6 tiles",
        "Aquatic Healing","Gain 100HP per turn while in water"],
    "Thanatos":[2800,4,10,600,100,200,2,undefined,9,undefined,9,
      "Unexpected","Teleport next to target with less than 100HP and attack, inflicting Terrified",
      "Reaper","All cards with less than 100hp receive 100 true damage",
      "Death Grip","Range increased by +2 against enemies less than 50% health"],
    "Hestia":[500,3,15,1200,250,50,1, undefined,3,4,2,
      "Warming Hearth","All cards in range heal +300 HP",
      "Eternal Flame","Increase max hp of card by 200 and heal 300 hp",
      "Shelter", "All adjacent cards gain +10 defense, +200 max HP"],
    "Kronos":[3000,2,10,800,100,250,1, 4,2,undefined,4,
      "Scythe","400 dmg to target and grants additional turn",
      "Stasis","Movement speed of enemies in range reduced to 1",
      "Infinite Power","Gains 150 ATK and 2 DEF each turn"],
    "Perseus":[1400,2,10,500,100,250,2, undefined,2,4,1,
      "Undaunted","Make attack against enemy's base stats",
      "Swordsmanship","Gain +100 attack and +5 defense",
      "Cap of Invisibility","After defeating an enemy, become invisible and increase MVT by 1"],
    "Hera":[1400,2,15,800,100,250,1, undefined,3,4,1,
      "Protector","Grants 10 DEF, 100HP, 100 mana to hero in range",
      "Wrath","Enemy card max hp reduced to 100HP",
      "Grudge","Gain 300ATK per inactive turn, bonus resets after attack"],
    "Hermes":[1200,2,10,600,100,250,3, undefined,6,undefined,6,
      "Trade Offer","Swap an hero's current stat with target's current stat",
      "Lucky","20% chance all heroes gain 500 mana",
      "Messenger","Can teleport between any two offgrid tiles"],
    "Heracles":[3800,2,15,500,100,250,1, undefined,4,undefined,6,
      "Efficiency","Attack all targets in range",
      "Resilience","Heroes without mana regain 50% mana",
      "Determination","Will take at maximum 300 dmg per attack"]
  } // #TODO add method to preview these before game start
  
  let PLAYER_OWNED_temp = ["Athena","Apollo","Achilles","Medea","Poseidon","Thanatos","Hestia","Kronos","Perseus","Hera","Hermes","Heracles"];
  PLAYER_OWNED_temp.sort();
  const PLAYER_OWNED = PLAYER_OWNED_temp;
  const PLAYER_HOLOFOIL = ["Athena","Apollo","Hephaestus","Nyx"];
  PLAYER_GAMECARD_OBJS = [];
  ENEMY_GAMECARD_OBJS = [];