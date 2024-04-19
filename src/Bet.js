const { faceToString } = require("./utils");

class Bet {
  amount;
  face;

  constructor({ amount, face }) {
    this.amount = amount;
    this.face = face;
  }

  getAsString() {
    return this.amount + " " + faceToString(this.face);
  }
}

module.exports = Bet;
