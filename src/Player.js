const { generateRandomDie } = require("./utils");
const { DICE_PER_PLAYER } = require("./constants");

class Player {
  dice;

  constructor(name) {
    this.dice = [...Array(DICE_PER_PLAYER)].fill(0);
    this.name = name;
    this.rollDice();
  }

  rollDice() {
    this.dice = this.dice.map(() => generateRandomDie());
  }

  haveDice() {
    return this.dice.length > 0;
  }

  removeDie() {
    if (this.dice.length > 0) {
      this.dice.pop();
    }
  }

  getDice() {
    return this.dice;
  }
}

module.exports = Player;
