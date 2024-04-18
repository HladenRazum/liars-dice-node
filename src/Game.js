const rl = require("readline/promises").createInterface({
  input: process.stdin,
  output: process.stdout,
});
const chalk = require("chalk");
const Player = require("./Player");
const Bet = require("./Bet");
const { drawDice, faceToString, factorial } = require("./utils");
const {
  NUM_DIE_SIDES,
  CHALLENGE_SYMBOL,
  DEFAULT_NUM_PLAYERS,
  PLAYER_TYPES,
} = require("./constants");

chalk.error = "#f5334d";
chalk.notification = "#178bff";
chalk.important = "#8af25a";
const log = console.log;

class Game {
  numPlayers;
  players;
  lastBet;
  currentBet;
  isChallenge;
  lastPlayer;
  rolls;
  round;

  constructor(numPlayers = DEFAULT_NUM_PLAYERS) {
    this.numPlayers = numPlayers;
    this.players = [];
    this.lastBet = null;
    this.currentBet = null;
    this.isChallenge = false;
    this.currentPlayer = null;
    this.lastPlayer = null;
    this.rolls = {};
    this.round = 1;
    this.setup();
  }

  setup() {
    this.createPlayers();
  }

  getActivePlayersCount() {
    let count = 0;

    this.players.forEach((player) => {
      if (player.getIsActive()) {
        count++;
      }
    });

    return count;
  }

  logCurrentRolls() {
    let rolls = "";

    log(chalk.hex(chalk.notification)("Here are the rolls for this round:"));

    for (const key in this.rolls) {
      for (let i = 0; i < this.rolls[key]; i++) {
        rolls += key + " ";
      }
    }

    drawDice(this.rolls);
    log("\n");

    for (const key in this.rolls) {
      console.log(
        `(${chalk.yellow(this.rolls[key] ?? 0)}) ${faceToString(key)}`
      );
    }

    log("\n");
  }

  getTotalDiceCount() {
    let count = 0;

    for (const key in this.rolls) {
      count += this.rolls[key];
    }

    return count;
  }

  createPlayers() {
    for (let i = 0; i < this.numPlayers; i++) {
      let p;
      if (i === 0) {
        p = new Player({ name: "hladenRazum", type: PLAYER_TYPES.HUMAN });
      } else {
        p = new Player({ name: `computer_${i}`, type: PLAYER_TYPES.COMPUTER });
      }
      this.players.push(p);
    }
  }

  updatePlayersPositionInTheArray(player) {
    let playerIndex = this.players.indexOf(player);
    this.players = this.players
      .slice(playerIndex)
      .concat(this.players.slice(0, playerIndex));
  }

  updateRolls() {
    this.rolls = {};
    let dice = [];

    for (const player of this.players) {
      dice.push(...player.getDice());
    }

    dice.forEach((die) => {
      if (this.rolls[die]) {
        this.rolls[die]++;
      } else {
        this.rolls[die] = 1;
      }
    });
  }

  rollAllPlayersDice() {
    this.players.forEach((player) => player.rollDice());
  }

  placeBet(bet) {
    this.currentBet = bet;
  }

  reset() {
    this.isChallenge = false;
    this.currentBet = null;
    this.currentPlayer = null;
    this.lastPlayer = null;
    this.rollAllPlayersDice();
    this.updateRolls();
  }

  validateBet(answer) {
    let isValid = true;
    let [amount, face] = answer.split(",");

    amount = parseInt(amount);
    face = parseInt(face);

    const isNotNumber = isNaN(amount) || isNaN(face);
    const isInLimits =
      face <= NUM_DIE_SIDES && amount <= this.getTotalDiceCount();

    const isFollowingPreviousBet = this.currentBet
      ? amount > this.currentBet.amount || face > this.currentBet.face
      : true;

    if (!isInLimits || isNotNumber || !isFollowingPreviousBet) {
      isValid = false;
    }
    return isValid;
  }

  checkWinning() {
    let playersWithDiceCount = 0;

    this.players.forEach((player) => {
      if (player.hasDice()) {
        playersWithDiceCount++;
      }
    });

    return playersWithDiceCount < 2;
  }

  getActivePlayersNames() {
    let names = "";
    this.players.forEach((player) => {
      if (player.hasDice()) {
        names += player.name + " ";
      }
    });

    return names;
  }

  async play() {
    console.clear();
    log(
      chalk.yellowBright(
        `Game has started with ${this.players.length} players\n`
      )
    );

    while (!this.checkWinning()) {
      log("Current round: " + chalk.hex(chalk.notification)(this.round));
      log(
        "Active players: " +
          chalk.hex(chalk.important)(this.getActivePlayersNames())
      );
      this.reset();
      await this.playRound();
      this.round++;
    }

    console.log(
      "GAME ENDED AT " + chalk.hex(chalk.notification)(this.round) + "th ROUND"
    );
    console.log("SHOW SOME INFO");
    console.log(
      "WINNER IS: " + chalk.hex(chalk.notification)(this.currentPlayer.name)
    );
  }

  challenge() {
    this.isChallenge = true;

    log("\n");
    log("-----------------------------------");
    log(chalk.hex(chalk.error)("CHALLENGE\n"));
    log(
      chalk.hex(chalk.notification)(this.currentPlayer.name) +
        " has challenged " +
        chalk.hex(chalk.notification)(this.lastPlayer.name) +
        " on their bet: " +
        chalk.hex(chalk.important)(this.currentBet.getAsString()) +
        "\n"
    );

    this.logCurrentRolls();
    if (this.checkChallenge()) {
      this.lastPlayer.removeDie();
      this.updatePlayersPositionInTheArray(this.lastPlayer);

      log(
        `${chalk.hex(chalk.notification)(
          this.currentPlayer.name
        )} won the challenge and ${chalk.hex(chalk.notification)(
          this.lastPlayer.name
        )} loses a die`
      );

      if (!this.lastPlayer.hasDice()) {
        log(
          `${chalk.hex(chalk.notification)(
            this.lastPlayer.name
          )} drop out as they have no dice left`
        );
      }
    } else {
      this.currentPlayer.removeDie();
      this.updatePlayersPositionInTheArray(this.currentPlayer);
      this.lastPlayerThatLostADice = this.currentPlayer;

      log(
        `${chalk.hex(chalk.notification)(
          this.currentPlayer.name
        )} lost the challenge and loses a die`
      );

      if (!this.currentPlayer.hasDice()) {
        log(
          `${chalk.hex(chalk.notification)(
            this.lastPlayer.name
          )} drop out as they have no dice left`
        );
      }
    }

    log(chalk.hex(chalk.error)("\nROUND ENDS"));
    log("-----------------------------------");
    log("\n");
  }

  checkChallenge() {
    let hasChallengerGuessedCorrectly;
    let bet = this.currentBet;

    if (this.rolls[bet.face] < bet.amount || !this.rolls[bet.face]) {
      hasChallengerGuessedCorrectly = true;
    } else {
      hasChallengerGuessedCorrectly = false;
    }

    return hasChallengerGuessedCorrectly;
  }

  // Return a random boolean that occasionally will be true
  feelingLucky(amountOfLuck = 0.27) {
    const randomValue = Math.random();
    return randomValue <= amountOfLuck;
  }

  // // Calculate the chance of amount of die to occur in the current roll
  // calclucateProbabilityOfBet(amount, face) {
  //   log(chalk.red("CALCULATE THE POSSIBILITY..."));
  //   log(chalk.blue("WHAT SHOULD BE THE RETURN VALUE?"));

  //   // const atLeastCurrentAmount = P

  //   return false;
  // }

  // calculateMaximumAmountProbabilty(bet) {
  //   const { amount, face } = bet;
  //   const totalDiceCount = this.getTotalDiceCount();
  //   // const currentPlayerAmountOfSameFace = this.currentPlayer.getFaceAmount(face);
  //   // const newAmount = amount + currentPlayerAmountOfSameFace;

  //   /**
  //    * какъв е шанса да се паднат {amount} {face} от {totalDiceCount}
  //    */
  //   const probabilityOfNotGettingTwoFace = Math.pow(5 / 6);
  //   const probabilityOfGettingExactlyOneSix =
  //     (1 / 6) * Math.pow(5 / 6, 9) * totalDiceCount;

  //   console.log({ probabilityOfGettingExactlyOneSix });

  //   //  1, 1 (amount: 1, face: one);
  //   // Kakuv e shansa v this.rolls tova da se sluchi
  //   log(
  //     `I have ${this.currentPlayer.getFaceAmount(face)} ${chalk.red(
  //       faceToString(face)
  //     )}`
  //   );

  //   // const maxPossibleAmount = calculateProbability();

  //   // const currentPlayerAmountOfSameFace = this.currentPlayer.getFaceAmount(face);
  //   // if (currentPlayerAmountOfSameFace && maxPossibleAmount) {

  //   // }

  //   console.log(bet);
  //   console.log(this.currentPlayer);
  // }
  calculateBetProbability(bet) {
    const amount = bet.amount;
    const n = this.getTotalDiceCount();
    const p = factorial(n) / (factorial(amount) * factorial(n - amount));
    return p;
  }

  /**
   * WARNING: Calulations might get heavy and slow the program (need testing)
   *
   * returns the probability of getting an amount of dice with the same face
   *
   * @param {number} amount
   */
  calclulateAtLeastAmountProbability(amount, numDice) {
    let sum = 0;

    for (let i = amount; i < numDice; i++) {
      const probability = this.calculateExactAmountProbability(i, numDice);
      sum += probability;
    }

    return sum;
  }

  calculateExactAmountProbability(amount, numDice) {
    const combinationsCoefficient =
      factorial(numDice) / (factorial(amount) * factorial(numDice - amount));
    const successProbability = 1 / NUM_DIE_SIDES;
    const failProbability = 5 / NUM_DIE_SIDES;
    return (
      combinationsCoefficient *
      Math.pow(successProbability, amount) *
      Math.pow(failProbability, numDice - amount)
    );
  }

  figureoutBet() {
    if (this.currentBet) {
      const numDice = this.getTotalDiceCount();
      const { amount, face } = this.currentBet;
      const avgAmount = numDice / NUM_DIE_SIDES;
      const isPossibleNewBet =
        this.currentBet.amount !== numDice &&
        parseInt(this.currentBet.face) !== NUM_DIE_SIDES;
      const shouldChallenge =
        (this.feelingLucky(0.3) && amount > avgAmount) || !isPossibleNewBet;

      if (shouldChallenge) {
        return this.challenge();
      } else {
        const ownedAmountOfSameFace = this.currentPlayer.getFaceAmount(face);
        let newDie = this.currentPlayer.pickHighestOccuringDie();
        let newFace, newAmount;
        // TODO: Place the bet with newFace, newAmount

        if (ownedAmountOfSameFace === 0) {
          if (parseInf(newDie.face) > face) {
            newFace = newDie.face;
          }

          let newAmount = newDie.amount;
          if (newFace < face) {
            newFace = face + 1;
          }

          // increase face and set amount
        } else if (ownedAmountOfSameFace > 1 && this.feelingLucky(0.15)) {
          // increase amount with 2
          newFace = face;
          newAmount = amount + 2;
        } else {
          // increase amount and face
        }
      }

      /**
       * 1. Check if computer should challenge the player
       *   - what is the probability of the current bet (do the computer has some amoun of the same face)
       * 2. Check if computer should increase the amount or face
       *   - should not increase the max possible bet
       */
      // What is the change that the current bet will be successful?
      // Should challenge or increase bet/
      // To add logic for the computer players to place bets in Liars Dice, you can implement a simple strategy based on the current bid and the computer's own dice rolls. Here's a basic approach:
      // Calculate probabilities: Based on the current bid, calculate the probability of the bid being true. For example, if the previous bid is "3 sixes", count how many sixes the computer already has and how many dice rolls it will have in total.
      // Evaluate the risk: Compare the calculated probability with a threshold. If the probability is above the threshold, the computer can confidently make a bid. Otherwise, the computer may choose to challenge the previous bid.
      // Bid intelligently: If the computer decides to make a bid, it can choose a value and quantity strategically. For instance, it can bid slightly higher than the previous bid to increase the chance of bluffing the opponent.
    }
    // FIXME: Ако сме първия играч за този рунд и все още няма залог
    else {
      // let { amount, face } = this.currentPlayer.pickHighestOccuringDie();
      // let n = this.getTotalDiceCount();
      // const p = (factorial(n) / factorial(amount)) * factorial(n - amount);
      // console.log(p);
      /**
       * 1. Decide which face and amount should put
       * 2. Calculate theoretical probability of the face
       * 3. Decide whether to risk it and put
       */
      // TODO: Decide what bet to place
      /** How should a computer choose a new bet
       * 1 - decide where it should challenge based on the current bet and the dice on the table + feelingRisky factor
       * 2 - choose the biggest amount of same faces
       * 3 - calculate the most optimal bet based on the amount of dice on the table + feelingRisky factor
       */
    }

    // TODO: return a new Bet object
  }

  async promptComputer(computerPlayer) {
    // console.log(this.currentPlayer);
    // console.log(this.lastPlayer);
    log(
      `${chalk.hex(chalk.notification)(
        computerPlayer.name
      )} is placing their bet...`
    );
    // log(this.currentBet);
    // log(this.currentPlayer.dice);

    // let thinkThatLastPlayerIsBluffing = this.feelingLucky(0.1);

    // if (thinkThatLastPlayerIsBluffing) {
    //   log(
    //     `I think that ${chalk.hex(chalk.notification)(
    //       this.lastPlayer.name
    //     )} is bluffing!`
    //   );
    //   this.challenge();
    // } else {
    //   const computerBet = this.figureoutBet();
    //   this.placeBet(computerBet);
    // }

    const computer = this.figureoutBet();

    this.lastPlayer = computerPlayer;
  }

  async promptPlayer(player) {
    log(
      `\nTotal dice in play: ${chalk.hex(chalk.notification)(
        this.getTotalDiceCount()
      )}`
    );
    log(chalk.red(`average: ${this.getTotalDiceCount() / 6}`));
    log("Current player:", chalk.hex(chalk.notification)(player.name));
    log(
      `Current dice for ${chalk.hex(chalk.notification)(
        player.name
      )}: ${chalk.yellow(player.getDice().toString().replaceAll(",", ", "))}`
    );
    this.lastPlayer &&
      log(
        `Current bet: ${chalk.hex(chalk.important)(
          this.currentBet.getAsString()
        )} made by ${chalk.gray(this.lastPlayer.name)}`
      );

    let question = this.lastPlayer
      ? `Raise the bet or challenge by pressing "${CHALLENGE_SYMBOL}": `
      : "Place your bet: amount, face: ";

    log("\n");

    const answer = await rl.question(question);

    if (answer.toUpperCase() === CHALLENGE_SYMBOL && this.lastPlayer) {
      this.challenge();
    } else {
      if (this.validateBet(answer)) {
        const bet = new Bet({
          amount: parseInt(answer.split(",")[0]),
          face: parseInt(answer.split(",")[1]),
        });

        this.placeBet(bet);
      } else {
        log(chalk.hex(chalk.error)("\nInvalid bet. Please try again."));
        await this.promptPlayer(this.currentPlayer);
      }
    }
    this.lastPlayer = player;
  }

  async playRound() {
    while (!this.isChallenge) {
      for (let i = 0; i < this.players.length; i++) {
        const player = this.players[i];

        if (!player.getIsActive()) {
          return;
        }

        this.currentPlayer = player;

        if (player.type === PLAYER_TYPES.HUMAN) {
          await this.promptPlayer(player);
        } else {
          await this.promptComputer(player);
        }
        if (this.isChallenge) {
          return;
        }
      }
    }
  }
}

module.exports = Game;
