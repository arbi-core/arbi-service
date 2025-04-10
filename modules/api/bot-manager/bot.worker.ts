import { parentPort, workerData } from "worker_threads";
import { Bot } from "../../database/entities/Bot.entity";
import { ArbitrageStrategyConfig } from "../../blockchain/strategies/arbitrage.strategy";
import { WorkerBlockchainProvider } from "../../blockchain/worker-blockchain.provider";
import { BotStrategyFactory } from "../../blockchain/strategies/strategy.factory";
import { BotStrategy } from "../../blockchain/strategies/strategy";

const bot: Bot = workerData.bot;
const interval: number = workerData.interval || 5000;
const alchemyApiKeys: Record<string, string> = workerData.alchemyApiKeys
const arbitrageConfig: ArbitrageStrategyConfig = workerData.arbitrageConfig

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



let blockchainProvider: WorkerBlockchainProvider | null = null;
if (bot.network) {
  try {
    const apiKey = alchemyApiKeys[bot.network]

    if (apiKey) {
      blockchainProvider = new WorkerBlockchainProvider(bot.network, apiKey);


      console.log(`[Worker ${bot.id}] Blockchain provider initialized successfully`);
    } else {
      console.error(`[Worker ${bot.id}] No Alchemy API key found for network ${bot.network}`);
    }
  } catch (error) {
    console.error(`[Worker ${bot.id}] Error initializing blockchain provider:`, error);
  }
}

let strategyFactory: BotStrategyFactory | null = null;
let strategy: BotStrategy | null = null;

if (blockchainProvider) {
  strategyFactory = new BotStrategyFactory(blockchainProvider, arbitrageConfig);
  strategy = strategyFactory.getStrategy(bot);
}

async function executeBot() {
  try {
    if (!running) return;

    if (!strategy) {
      console.error(`[Worker ${bot.id}] No strategy found`);
      return;
    }
    console.log(`[WORKER ID:${bot.id.slice(-5)}] Executing strategy`);
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
  }
}

function cleanup() {
  if (blockchainProvider) {
    blockchainProvider.cleanup();
    blockchainProvider = null;
  }

  if (strategyFactory) {
    strategyFactory.cleanup();
    strategyFactory = null;
  }
}

if (parentPort) {
  parentPort.on("message", (message) => {
    if (message.command === "stop") {
      running = false;
      cleanup();
      if (parentPort) {
        parentPort.postMessage({
          type: "stopped",
          botId: bot.id
        });
      }
    }
  });
}

console.log(`[DEBUG] Starting worker for bot ${bot.id}`);
executeBot();