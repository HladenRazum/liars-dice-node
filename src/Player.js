const { generateRandomDie } = require("./utils");
const { DICE_PER_PLAYER } = require("./constants");

class Player {
  dice;
  diceObj;
  isActive;
  type;

  constructor({ name, type }) {
    this.dice = [...Array(DICE_PER_PLAYER)].fill(0);
    this.name = name;
    this.isActive = true;
    this.type = type;
    this.diceObj = {};
  }

  initDiceObj() {
    let obj = {};

    for (const face of this.dice) {
      obj[face] = obj[face] + 1 || 1;
    }

    this.diceObj = { ...obj };
  }

  rollDice() {
    this.dice = this.dice.map(() => generateRandomDie());
    this.initDiceObj();
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

  getFaceAmount(face) {
    return this.diceObj[face] ?? 0;
  }

  // Return some die face that will be used for the new bet
  pickHighestOccuringDie() {
    let counter = {};
    let die = {
      amount: 0,
      face: null,
    };

    for (const face of this.dice) {
      counter[face] = counter[face] + 1 || 1;
    }

    for (const key in counter) {
      if (counter[key] > die.amount) {
        die.amount = counter[key];
        die.face = key;
      }
    }

    return die;
  }
}

module.exports = Player;
