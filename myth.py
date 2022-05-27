import random

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
            damageDone /= 2

        defender.current_health -= damageDone
        if defender.current_health <= 0:
            defender.current_health = 0
            defender.dead = True
            
    def inflictStatus(self, opponent, attacker, defender, statusName, savingThrowThreshold):  # requires that attack must be in range first!!
        statBoost = 0
        if attacker.is_figurine:
            statBoost = FIGURINE_INFLICT_STATUS_FLAT_BOOST

        if defender.savingThrow(savingThrowThreshold + statBoost) == False:
            defender.statuses[statusName] += STATUS_DEFAULT_LENGTH
            if defender.statuses[statusName] > MAX_STATUS_STACKS:
                defender.statuses[statusName] = MAX_STATUS_STACKS
        else:
            