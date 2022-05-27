import random

BASE_DAMAGE_DIFF_SCALE_TO_HP = 20
MVMT_SPD_SCALE_TO_SAVE_THROW = 20
DEFENCE_SCALE_TO_SAVE_THROW = 20
RANDOM_DAMAGE_OFFSET = 20
STATUS_DEFAULT_LENGTH = 3
MAX_STATUS_STACKS = 7
FIGURINE_ATTACK_MULTIPLIER = 1.2
FIGURINE_INFLICT_STATUS_FLAT_BOOST = 5
FIGURINE_SAVING_THROW_FLAT_BOOST = 5

base_stat_dictionary = {"test1":(100,200,100,20, 50), "test2":(10,200,300,20, 20), "test3":(500,200,100,0, 60)}

def getBaseStats(cardType):
    return base_stat_dictionary[cardType]

class Card:
    def __init__(self, cardType):
        base_stats = getBaseStats(cardType)
        self.name = "XXXX"
        self.base_attack = base_stats[0]
        self.base_defense = base_stats[1]
        self.base_health = base_stats[2]
        self.base_mana = base_stats[3]
        self.base_movement = base_stats[3]

    def inputSides(self):
        self.sides = [float(input("Enter side "+str(i+1)+" : ")) for i in range(self.n)]

    def dispSides(self):
        for i in range(self.n):
            print("Side",i+1,"is",self.sides[i])

class CardInstance(Card):
    def __init__(self, cardType, isFigurine, aggressive, coordinates):
        Card.__init__(self, cardType)
        self.current_attack = self.base_attack
        self.current_defense = self.base_defense
        self.current_health = self.base_health
        self.current_mana = self.base_mana
        self.current_movement = self.base_movement
        self.dead = False

        self.attack_bonus = 0
        self.defense_bonus = 0
        self.health_bonus = 0
        self.mana_bonus = 0
        self.movement_bonus = 0

        self.is_figurine = isFigurine
        self.statuses = {"blinded":0, "charmed":0, "poisoned":0, "stunned":0, "terrified":0}

        self.aggressive = aggressive # whether in attack or defense stance
        self.coordinates = coordinates # tuple of x and y

    def savingThrow(self, savingThrowThreshold):
        # augmented by movement speed and defense
        mvmtOffset = (self.current_movement + self.movement_bonus) / MVMT_SPD_SCALE_TO_SAVE_THROW
        defOffset = (self.current_defense + self.defense_bonus) / DEFENCE_SCALE_TO_SAVE_THROW
        figBoost = 0
        if self.is_figurine:
            figBoost = FIGURINE_SAVING_THROW_FLAT_BOOST
        return (random.randint(0,20) + mvmtOffset + defOffset + figBoost) > savingThrowThreshold

class Player:
    def __init__(self, name, figurine, cardsPicked):
        self.name = name
        self.card_instances = []
        for cardPicked in cardsPicked:
            self.card_instances.append(CardInstance(cardPicked), cardPicked == figurine)

    def updateAllCards(self):
        for card_instance in self.card_instances:
            card_instance.update()

    def attack(self, opponent, attacker, defender, savingThrowThreshold):  # requires that attack must be in range first!!
        baseDamageDone = 0
        if defender.aggressive:
            baseDamageDone = (attacker.current_attack + attacker.attack_bonus) - (defender.current_attack + defender.attack_bonus)
        else:
            baseDamageDone = (attacker.current_attack + attacker.attack_bonus) - (defender.current_defense + defender.defense_bonus)

        damageDone = baseDamageDone / BASE_DAMAGE_DIFF_SCALE_TO_HP
        damageDone += random.randint(-RANDOM_DAMAGE_OFFSET, RANDOM_DAMAGE_OFFSET)
        if attacker.is_figurine:
            damageDone *= FIGURINE_ATTACK_MULTIPLIER

        if defender.savingThrow(attacker, savingThrowThreshold) == True:
            notif(self.name, defender.name + " made a successful saving throw")
            damageDone /= 2

        notif(self.name, defender.name + " took " + damageDone + " damage")
        defender.current_health -= damageDone
        if defender.current_health <= 0:
            defender.current_health = 0
            defender.dead = True
            notif(self.name, defender.name + " has been defeated by " + attacker)

    def inflictStatus(self, opponent, attacker, defender, statusName, savingThrowThreshold):  # requires that attack must be in range first!!
        statBoost = 0
        if attacker.is_figurine:
            statBoost = FIGURINE_INFLICT_STATUS_FLAT_BOOST

        if defender.savingThrow(savingThrowThreshold + statBoost) == False:
            defender.statuses[statusName] += STATUS_DEFAULT_LENGTH
            if defender.statuses[statusName] > MAX_STATUS_STACKS:
                defender.statuses[statusName] = MAX_STATUS_STACKS
            notif(self.name, defender.name + " is now " + statusName + "for" + defender.statuses[statusName] + "turns")
        else:
            notif(self.name, defender.name + " has resisted " + attacker + "'s " + statusName + "!")

def startGame():
    # select figurines
    # select decks
    pass

def notif(player, message):
    print(player.name + ": " + message + "\n")