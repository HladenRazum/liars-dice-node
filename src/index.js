const rl = require("readline/promises").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const chalk = require("chalk");
const Game = require("./Game");

async function main() {
  let withWildOnes = false;

  console.clear();
  console.log(chalk.red("Welcome to Liar's Dice!\n"));

  let wildOnes = await rl.question(
    "Do you want to include 'The Wild Ones'? (y/n): "
  );

  if (wildOnes.toLowerCase() === "y") {
    withWildOnes = true;
  }

  let numPlayers = await rl.question("Number of players: ");
  numPlayers = parseInt(numPlayers);

  while (numPlayers < 2) {
    console.log("Players should be at least two. Please try again.");
    numPlayers = await rl.question("Number of players: ");
    numPlayers = parseInt(numPlayers);
  }

  const game = new Game(numPlayers, withWildOnes);
  game.play();
}

main();
