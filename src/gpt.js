class Player {
  constructor(name, numDice) {
    this.name = name;
    this.numDice = numDice;
    this.dice = [];
    for (let i = 0; i < this.numDice; i++) {
      this.rollDice();
    }
  }

  rollDice() {
    return Math.floor(Math.random() * 6) + 1;
  }

  removeDice() {
    this.numDice--;
    this.dice.pop();
  }
}

class LiarsDiceGame {
  constructor(player1Name, player2Name, numDice) {
    this.player1 = new Player(player1Name, numDice);
    this.player2 = new Player(player2Name, numDice);
    this.currentPlayer = this.player1;
    this.previousBid = { value: 0, quantity: 0 };
  }

  switchTurn() {
    this.currentPlayer =
      this.currentPlayer === this.player1 ? this.player2 : this.player1;
  }

  makeBid(value, quantity) {
    if (
      value > 0 &&
      value <= 6 &&
      quantity > 0 &&
      quantity <= this.player1.numDice + this.player2.numDice
    ) {
      this.previousBid.value = value;
      this.previousBid.quantity = quantity;
      this.switchTurn();
      return true;
    } else {
      return false;
    }
  }

  challenge() {
    let totalDice = this.player1.numDice + this.player2.numDice;
    let count = 0;
    for (let player of [this.player1, this.player2]) {
      for (let die of player.dice) {
        if (die === this.previousBid.value || die === 1) {
          count++;
        }
      }
    }
    if (count >= this.previousBid.quantity) {
      this.currentPlayer.removeDice();
      console.log(`${this.currentPlayer.name} lost a die.`);
    } else {
      this.switchTurn();
      this.currentPlayer.removeDice();
      console.log(`${this.currentPlayer.name} lost a die.`);
    }
    console.log(`${this.currentPlayer.name} wins the challenge.`);
    console.log(`${this.player1.name} has ${this.player1.numDice} dice left.`);
    console.log(`${this.player2.name} has ${this.player2.numDice} dice left.`);
    this.switchTurn();
  }

  get currentPlayerName() {
    return this.currentPlayer.name;
  }
}

// Example usage:

let game = new LiarsDiceGame("Player 1", "Player 2", 5);

console.log(
  `Starting the game between ${game.player1.name} and ${game.player2.name}.`
);

// Example round
console.log(`${game.currentPlayerName}'s turn.`);
console.log(`${game.currentPlayer.name}'s dice: ${game.currentPlayer.dice}`);
game.makeBid(3, 2);
console.log(`${game.currentPlayerName} bids 2 threes.`);
game.switchTurn();
console.log(`${game.currentPlayerName}'s turn.`);
game.challenge();
