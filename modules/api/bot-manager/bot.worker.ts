import { parentPort, workerData } from "worker_threads";
import { BotStrategyFactory } from "../bot/bot-strategies";
import { Bot } from "../../database/entities/Bot.entity";


const bot: Bot = workerData.bot;
const interval: number = workerData.interval || 5000;


if (!bot || !bot.id) {
  console.error("Error: Invalid bot data provided to worker");
  if (parentPort) {
    parentPort.postMessage({
      type: "error",
      error: "Invalid bot data provided to worker"
    });
  }
  process.exit(1);
}

let running = true;

async function executeBot() {
  try {
    if (!running) return;

    const strategy = BotStrategyFactory.getStrategy(bot);

    const result = await strategy.execute(bot);

    if (parentPort) {
      parentPort.postMessage({
        type: "result",
        botId: bot.id,
        data: result
      });
    }
  } catch (error: any) {
    if (parentPort) {
      parentPort.postMessage({
        type: "error",
        botId: bot.id,
        error: error.message
      });
    }
  } finally {
    if (running) {
      setTimeout(executeBot, interval);
    }
  }
}

// if (parentPort) {
//   parentPort.on("message", (message) => {
//     if (message.command === "stop") {
//       running = false;
//       if (parentPort) {
//         parentPort.postMessage({
//           type: "stopped",
//           botId: bot.id
//         });
//       }
//     }
//   });
// }

console.log(`[DEBUG] Starting worker for bot ${bot.id}`);
executeBot();