class Bet {
  amount;
  face;

  constructor({ amount, face }) {
    this.amount = amount;
    this.face = face;
  }

  getAsString() {
    return this.amount + ", " + this.face;
  }
}

module.exports = Bet;
