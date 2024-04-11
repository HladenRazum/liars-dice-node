const rl = require("readline/promises").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const Game = require("./Game");

async function main() {
  console.log("Welcome to Liar's Dice!\n");
  let answer = await rl.question("Number of players: ");
  answer = parseInt(answer);
  const game = new Game(answer);
  game.play();
}

main();
