const rl = require("readline/promises").createInterface({
  input: process.stdin,
  output: process.stdout,
});
const chalk = require("chalk");
chalk.error = "#f5334d";
chalk.notification = "#178bff";
chalk.important = "#8af25a";

const log = console.log;

const Player = require("./Player");
const { NUM_DIE_SIDES } = require("./constants");
const { faceToString, drawDie } = require("./utils");

class Game {
  numPlayers;
  players;
  lastBet;
  currentBet;
  isChallenge;
  isWinning;
  lastPlayer;
  rolls;

  constructor(numPlayers = 3) {
    this.numPlayers = numPlayers;
    this.players = [];
    this.lastBet = null;
    this.currentBet = null;
    this.isChallenge = false;
    this.isWinning = false;
    this.currentPlayer = null;
    this.lastPlayer = null;
    this.rolls = {};
    this.setup();
  }

  setup() {
    this.initPlayers();
    this.updateRolls();
  }

  logCurrentRolls() {
    log(chalk.hex(chalk.notification)("Here are the current rolls: \n"));

    for (const key in this.rolls) {
      if (this.rolls[key] > 0) {
        log(`(${chalk.yellow(this.rolls[key])}) ${drawDie(key)}\n`);
      }
    }

    for (const key in this.rolls) {
      if (this.rolls[key] > 0) {
        console.log(`(${chalk.yellow(this.rolls[key])}) ${faceToString(key)}`);
      }
    }

    log("\n");
  }

  initPlayers() {
    for (let i = 0; i < this.numPlayers; i++) {
      let p;
      if (i === 0) {
        p = new Player("hladenRazum");
      } else {
        p = new Player(`computer_${i}`);
      }
      this.players.push(p);
    }
  }

  updateRolls() {
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

  play() {
    this.isChallenge = false;
    this.currentBet = null;
    this.currentPlayer = null;
    this.lastPlayer = null;

    console.clear();
    log(chalk.gray(`Game has started with ${this.players.length} players`));
    this.playRound();
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
        chalk.hex(chalk.important)(this.currentBet) +
        "\n"
    );

    // Ako currentPlayer successfully challenged last player
    this.logCurrentRolls();
    if (this.checkChallenge()) {
      //
      log(
        `CURRENT_PLAYER[${this.currentPlayer.name}] won the challenge and LAST_PLAYER[${this.lastPlayer.name}] loses a die`
      );
    }
    // Ako eo oburkal
    else {
      log(
        `CURRENT_PLAYER[${this.currentPlayer.name}] lost the challenge and loses a die`
      );
    }

    // log(
    //   chalk.greenBright(
    //     "Zaloga na lastPlayer ne e spoluchliv i toi gubi edin zar"
    //   )
    // );
    // log(
    //   chalk.greenBright(
    //     "currentPlayer neuspeshno predizvika lastPlayer. CurrentPlayer loses 1 zar"
    //   )
    // );
    // log("Rezulati: koi kolko zarove ima");
    // log(chalk.hex(chalk.error)("\nROUND ENDS"));
    // log("-----------------------------------");
    // Compare dice to rolls
    // If challenge was right, the challenged player loses 1 dic otherwise the challenger loses 1 die
    // End of round
  }

  checkChallenge() {
    let hasChallengerGuessedCorrectly;
    let bet = this.currentBet;

    let amount = bet.split(",")[0];
    let face = bet.split(",")[1];

    if (this.rolls[face] < amount || !this.rolls[face]) {
      hasChallengerGuessedCorrectly = true;
    } else {
      hasChallengerGuessedCorrectly = false;
    }

    return hasChallengerGuessedCorrectly;
  }

  async promptPlayer(player) {
    log("\n");
    log(`Total dice in play: ${chalk.hex(chalk.notification)("15")}`);
    log("Current player:", chalk.hex(chalk.notification)(player.name));
    log(
      `Current dice for ${chalk.hex(chalk.notification)(
        player.name
      )}: ${chalk.yellow(player.getDice().toString().replaceAll(",", ", "))}`
    );
    this.lastPlayer &&
      log(
        `Current bet: ${chalk.hex(chalk.important)(this.currentBet)} made by ${
          this.lastPlayer.name
        }`
      );

    let question = this.lastPlayer
      ? 'Raise the bet or challenge by pressing "C": '
      : "Place your bet: amount, face: ";

    const answer = await rl.question(question);

    if (answer.toUpperCase() === "C") {
      this.challenge();
    } else {
      this.currentBet = answer;
    }
    this.lastPlayer = player;
  }

  async playRound() {
    while (!this.isChallenge) {
      for (let i = 0; i < this.players.length; i++) {
        this.currentPlayer = this.players[i];

        await this.promptPlayer(this.players[i]);
        if (this.isChallenge) {
          // Check win
          return;
        }
      }
    }
  }
}

module.exports = Game;
