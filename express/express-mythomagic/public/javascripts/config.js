// @miya7090

MY_SOCKET = undefined;
OPPONENT_SOCKET_ID = undefined;

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
MOUSE_HOVER_RADIUS = 3;
CURRENT_MOUSE_Q = undefined;
CURRENT_MOUSE_R = undefined;
CURRENT_MOUSE_S = undefined;
MAX_MANA = 1000;
HEXTILE_CUBIC_INDEX = {}; // keys: "q,r,s", maps to divs that are hextiles

PICK_PHASE_TIMER = 15000; // 15 sec in ms
PICK_PHASE_STARTED_AT = undefined;
GAME_MODE = "startup"; // startup, pick-phase, p1-active, p2-active, p1-moveToken, p2-moveToken
GAME_MODE_MEMORYTARGET = undefined; // used if moving tokens, etc

const BASE_STAT_DICT = {
    // name, base atk, normal attack range, defense, hp, mana per turn, mana per attack, movement speed
    "Athena":[3000,2,15,700,100,100,1], 
    "Kronos":[3000,2,10,700,100,250,1], 
    "Achilles":[2900,2,20,600,100,250,2],
    "Apollo":[2000,6,10,700,100,250,1],
    "Jason":[2100,2,10,800,100,250,1],
    "Hestia":[500,2,15,1200,250,0,1],
    "Steve":[500,2,15,1200,250,0,1],
    "Joe":[500,2,15,1200,250,0,1],
    "Bob":[500,2,15,1200,250,0,1]
  }
  
  const PLAYER_OWNED = ["Athena","Kronos","Apollo","Jason","Hestia","Steve"];
  const PLAYER_HOLOFOIL = ["Athena","Apollo","Jason","Steve"];
  PLAYER_GAMECARD_OBJS = [];
  ENEMY_GAMECARD_OBJS = [];