const { generateRandomDie } = require("./utils");
const { DICE_PER_PLAYER } = require("./constants");

class Player {
  dice;
  isActive;

  constructor(name) {
    this.dice = [...Array(DICE_PER_PLAYER)].fill(0);
    this.name = name;
    this.isActive = true;
  }

  rollDice() {
    this.dice = this.dice.map(() => generateRandomDie());
  }

  hasDice() {
    return this.dice.length > 0;
  }

  removeDie() {
    if (this.dice.length > 0) {
      this.dice.pop();
    } else {
      this.isActive = false;
    }
  }

  getIsActive() {
    return this.hasDice();
  }

  getDice() {
    return this.dice;
  }
}

module.exports = Player;
