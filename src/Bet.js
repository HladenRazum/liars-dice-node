class Bet {
  type;
  amount;
  num;

  constructor({ type, amount, num }) {
    this.type = type;
    this.amount = amount;
    this.num = num;
    console.log(this);
  }
}

module.exports = Bet;
