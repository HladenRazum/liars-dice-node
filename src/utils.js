const chalk = require("chalk");
const { NUM_DIE_SIDES, CHALLENGE_SYMBOL } = require("./constants");

function generateRandomDie() {
  return ~~(Math.random() * NUM_DIE_SIDES + 1);
}

function isChallengeSymbol(text) {
  return text.toLowerCase() === CHALLENGE_SYMBOL.toLowerCase();
}

function drawDice(dice) {
  let ones = dice["1"] ?? 0;
  let twos = dice["2"] ?? 0;
  let threes = dice["3"] ?? 0;
  let fours = dice["4"] ?? 0;
  let fives = dice["5"] ?? 0;
  let sixes = dice["6"] ?? 0;

  console.log(
    `
                 *           *     *     *     *     *     *     *                                                              
   *                      *                       *        *     *   
           *           *           *     *     *     *     *     *
  (${chalk.yellow(ones)})        (${chalk.yellow(
      twos
    )})         (${chalk.yellow(threes)})         (${chalk.yellow(
      fours
    )})         (${chalk.yellow(fives)})         (${chalk.yellow(sixes)})`
  );
}

function drawDie(face) {
  switch (face) {
    case 1:
    case "1": {
      return `
      
         *
            
      `;
    }

    case 2:
    case "2": {
      return `
      *
      
            *
      `;
    }

    case 3:
    case "3": {
      return `
      *     
         * 
            *
      `;
    }

    case 4:
    case "4": {
      return `
      *     *
      
      *     *
      `;
    }

    case 5:
    case "5": {
      return `
      *     *
         *
      *     *
      `;
    }

    case 6:
    case "6": {
      return `
      *     *
      *     *
      *     * 
      `;
    }

    default: {
      return "Invalid face. Please check the rolls on your dice again.";
    }
  }
}

function faceToString(face) {
  switch (face) {
    case 1:
    case "1": {
      return "ones";
    }

    case 2:
    case "2": {
      return "twos";
    }

    case 3:
    case "3": {
      return "threes";
    }

    case 4:
    case "4": {
      return "fours";
    }

    case 5:
    case "5": {
      return "fives";
    }

    case 6:
    case "6": {
      return "sixes";
    }

    default: {
      return "Invalid face. Please check the rolls on your dice again.";
    }
  }
}

module.exports = {
  generateRandomDie,
  isChallengeSymbol,
  faceToString,
  drawDie,
  drawDice,
};
