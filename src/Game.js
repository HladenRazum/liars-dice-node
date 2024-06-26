const rl = require("readline/promises").createInterface({
  input: process.stdin,
  output: process.stdout,
});
const chalk = require("chalk");
const Player = require("./Player");
const Bet = require("./Bet");
const { drawDice, faceToString } = require("./utils");
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
  currentBet;
  isChallenge;
  lastPlayer;
  rolls;
  round;
  isWildMode;

  constructor(numPlayers = DEFAULT_NUM_PLAYERS, isWildMode = false) {
    this.numPlayers = numPlayers;
    this.players = [];
    this.currentBet = null;
    this.isChallenge = false;
    this.currentPlayer = null;
    this.lastPlayer = null;
    this.rolls = {};
    this.round = 1;
    this.isWildMode = isWildMode;
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
    log(
      `${chalk.hex(chalk.notification)(
        this.currentPlayer.name
      )} is betting ${chalk.hex(chalk.important)(
        this.currentBet.getAsString()
      )}`
    );
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
      ? (amount > this.currentBet.amount && face >= this.currentBet.face) ||
        (amount >= this.currentBet.amount && face > this.currentBet.face)
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

  logWildOnesMode() {
    log(
      "Wild Ones: " +
        chalk.hex(chalk.notification)(this.isWildMode ? "ON" : "OFF")
    );
  }

  async play() {
    console.clear();
    log(
      chalk.hex(chalk.error)(
        `Game has started with ${this.players.length} players.`
      )
    );
    log("\n");
    while (!this.checkWinning()) {
      this.logWildOnesMode();
      log("Current round: " + chalk.hex(chalk.notification)(this.round));
      log(
        "Active players: " +
          chalk.hex(chalk.important)(this.getActivePlayersNames()) +
          "\n"
      );
      this.reset();
      await this.playRound();
      this.round++;
    }

    console.log(
      "GAME ENDED AFTER " +
        chalk.hex(chalk.notification)(this.round) +
        " ROUNDS"
    );
    console.log(
      "WINNER IS: " + chalk.hex(chalk.notification)(this.currentPlayer.name)
    );
  }

  challenge() {
    this.isChallenge = true;
    log("\n");
    log(chalk.hex(chalk.error)("CHALLENGE\n"));
    this.logCurrentRolls();
    log(
      chalk.hex(chalk.notification)(this.currentPlayer.name) +
        " has challenged " +
        chalk.hex(chalk.notification)(this.lastPlayer.name) +
        " on their bet: " +
        chalk.hex(chalk.important)(this.currentBet.getAsString())
    );

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
            this.currentPlayer.name
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

    if (this.isWildMode) {
      if (
        this.rolls[bet.face] + this.rolls["1"] < bet.amount ||
        !this.rolls[bet.face]
      ) {
        hasChallengerGuessedCorrectly = true;
      } else {
        hasChallengerGuessedCorrectly = false;
      }
    } else {
      if (this.rolls[bet.face] < bet.amount || !this.rolls[bet.face]) {
        hasChallengerGuessedCorrectly = true;
      } else {
        hasChallengerGuessedCorrectly = false;
      }
    }

    return hasChallengerGuessedCorrectly;
  }

  // Return a random boolean that occasionally will be true
  feelingLucky(amountOfLuck = 0.27) {
    const randomValue = Math.random();
    return randomValue <= amountOfLuck;
  }

  figureoutBet() {
    let newFace, newAmount;
    const numDice = this.getTotalDiceCount();
    const avgAmount = Math.ceil(numDice / NUM_DIE_SIDES);
    let newDie = this.currentPlayer.pickHighestOccuringDie();

    if (this.currentBet) {
      const { amount, face } = this.currentBet;
      const isPossibleNewBet =
        this.currentBet.amount !== numDice &&
        parseInt(this.currentBet.face) !== NUM_DIE_SIDES;
      const shouldChallenge =
        (this.feelingLucky(0.2) && amount > avgAmount && amount > 1) ||
        !isPossibleNewBet;

      if (shouldChallenge) {
        return this.challenge();
      } else {
        const amountSameFace = this.currentPlayer.getFaceAmount(face);

        if (amountSameFace === 0) {
          if (newDie.face > face) {
            newFace = newDie.face;
            newAmount = newDie.amount + avgAmount;
          } else {
            if (face >= 6) {
              newFace = face;
              newAmount = amount + 1;
            } else {
              newFace = +face + 1;
              newAmount = avgAmount;
            }
          }
        } else {
          if (face >= 6) {
            newFace = face;
            newAmount = amount + 1;
          } else {
            newFace = +face + 1;
            newAmount = avgAmount;
          }
        }
      }

      if (
        (newAmount <= amount && newFace < face) ||
        (newAmount < amount && newFace <= face)
      ) {
        newAmount = amount + 1;
        newFace = face;
      }
    } else {
      newAmount = newDie.amount + avgAmount;
      newFace = newDie.face;
    }

    const bet = new Bet({
      amount: newAmount,
      face: newFace.toString(),
    });

    this.placeBet(bet);
  }

  async promptComputer(computerPlayer) {
    this.figureoutBet();
    this.lastPlayer = computerPlayer;
  }

  async promptPlayer(player) {
    log(
      `\nTotal dice in play: ${chalk.hex(chalk.notification)(
        this.getTotalDiceCount()
      )}`
    );
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

    log(
      chalk.gray("hint: average amoount per face is ") +
        chalk.hex(chalk.error)(
          (this.getTotalDiceCount() / NUM_DIE_SIDES).toFixed(3)
        )
    );
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
          continue;
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
