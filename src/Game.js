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
const { drawDice, faceToString } = require("./utils");

class Game {
  numPlayers;
  players;
  lastBet;
  currentBet;
  isChallenge;
  lastPlayer;
  rolls;
  round;
  lastPlayerThatLostADice;

  constructor(numPlayers = 3) {
    this.numPlayers = numPlayers;
    this.players = [];
    this.lastBet = null;
    this.currentBet = null;
    this.isChallenge = false;
    this.currentPlayer = null;
    this.lastPlayer = null;
    this.lastPlayerThatLostADice = null;
    this.rolls = {};
    this.round = 1;
    this.setup();
  }

  setup() {
    this.initPlayers();
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

  reset() {
    this.isChallenge = false;
    this.currentBet = null;
    this.currentPlayer = null;
    this.lastPlayer = null;
    this.rollAllPlayersDice();
    this.updateRolls();
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
    log(chalk.gray(`Game has started with ${this.players.length} players`));

    while (!this.checkWinning()) {
      log("Current round: " + chalk.hex(chalk.error)(this.round));
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
        chalk.hex(chalk.important)(this.currentBet) +
        "\n"
    );

    this.logCurrentRolls();
    if (this.checkChallenge()) {
      this.lastPlayer.removeDie();
      this.updatePlayersPositionInTheArray(this.lastPlayer);
      this.lastPlayerThatLostADice = this.lastPlayer;

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
    log(
      `Total dice in play: ${chalk.hex(chalk.notification)(
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
        `Current bet: ${chalk.hex(chalk.important)(this.currentBet)} made by ${
          this.lastPlayer.name
        }`
      );

    let question = this.lastPlayer
      ? 'Raise the bet or challenge by pressing "C": '
      : "Place your bet: amount, face: ";

    log("\n");
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
        if (this.players[i].getIsActive()) {
          this.currentPlayer = this.players[i];

          await this.promptPlayer(this.players[i]);
          if (this.isChallenge) {
            return;
          }
        }
      }
    }
  }
}

module.exports = Game;
