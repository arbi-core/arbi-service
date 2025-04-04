import { parentPort, workerData } from "worker_threads";
import { BotStrategyFactory } from "../bot/bot-strategies";
import { Bot } from "../../database/entities/Bot.entity";

// The bot data is passed via workerData when creating the worker
const bot: Bot = workerData.bot;
// Interval in milliseconds (5 seconds)
const interval: number = workerData.interval || 5000;

// Flag to track if the worker should continue running
let running = true;

// Function to execute the bot's task
async function executeBot() {
  try {
    if (!running) return;

    // Get the appropriate strategy for this bot type
    const strategy = BotStrategyFactory.getStrategy(bot);

    // Execute the bot's logic
    const result = await strategy.execute(bot);

    // Send the result back to the parent thread
    if (parentPort) {
      parentPort.postMessage({
        type: "result",
        botId: bot.id,
        data: result
      });
    }
  } catch (error) {
    // Send any errors back to the parent thread
    if (parentPort) {
      parentPort.postMessage({
        type: "error",
        botId: bot.id,
        error: error.message
      });
    }
  } finally {
    // Schedule next execution if still running
    if (running) {
      setTimeout(executeBot, interval);
    }
  }
}

// Listen for messages from the parent thread
if (parentPort) {
  parentPort.on("message", (message) => {
    if (message.command === "stop") {
      running = false;
      if (parentPort) {
        parentPort.postMessage({
          type: "stopped",
          botId: bot.id
        });
      }
    }
  });
}

// Initial execution
console.log(`Starting worker for bot ${bot.id} of type ${bot.type}`);
executeBot();