const rl = require("readline/promises").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const chalk = require("chalk");
const Game = require("./Game");

async function main() {
  console.clear();
  console.log(chalk.red("Welcome to Liar's Dice!\n"));
  let answer = await rl.question("Number of players: ");
  answer = parseInt(answer);

  while (answer < 2) {
    console.log("Players should be at least two. Please try again.");
    answer = await rl.question("Number of players: ");
    answer = parseInt(answer);
  }

  const game = new Game(answer);
  game.play();
}

main();
