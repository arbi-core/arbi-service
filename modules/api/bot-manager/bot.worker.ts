import { parentPort, workerData } from "worker_threads";
import { Bot } from "../../database/entities/Bot.entity";
import { ArbitrageStrategyConfig } from "../../blockchain/strategies/arbitrage.strategy";
import { WorkerBlockchainProvider } from "../../blockchain/worker-blockchain.provider";
import { BotStrategyFactory } from "../../blockchain/strategies/strategy.factory";
import { BotStrategy } from "../../blockchain/strategies/strategy";

const bot: Bot = workerData.bot;
const alchemyApiKeys: Record<string, string> = workerData.alchemyApiKeys
const arbitrageConfig: ArbitrageStrategyConfig = workerData.arbitrageConfig
const workerId: string = workerData.workerId

console.log(`[BOT WORKER] Start bot.worker.ts execution. Bot data:`, bot.id.slice(-5));

let running = true;
let blockchainProvider: WorkerBlockchainProvider | null = null;
let strategyFactory: BotStrategyFactory | null = null;
let strategy: BotStrategy | null = null;

// Listen for messages from the parent thread
if (parentPort) {
  parentPort.on('message', async (message) => {
    console.log(`[BOT WORKER] Worker ${bot.id.slice(-5)} Received message:`, message);

    if (message.command === 'stop') {
      console.log(`[BOT WORKER] Worker ${bot.id.slice(-5)} Stopping worker...`);
      running = false;

      // Perform cleanup
      await cleanup();

      // Notify the parent that we've stopped
      parentPort?.postMessage({
        type: 'stopped',
        botId: bot.id,
        workerId: workerId
      });

      console.log(`[BOT WORKER] Worker ${bot.id.slice(-5)} Worker stopped successfully`);
    }
  });
}

async function initializeBlockchainProvider() {
  if (bot.network) {
    try {
      const apiKey = alchemyApiKeys[bot.network]
      if (apiKey) {
        blockchainProvider = new WorkerBlockchainProvider(bot.network, apiKey);
        console.log(`[BOT WORKER] Worker ${bot.id.slice(-5)} Blockchain provider initialized successfully`);
      } else {
        console.error(`[BOT WORKER] Worker ${bot.id.slice(-5)} No Alchemy API key found for network ${bot.network}`);
      }
    } catch (error) {
      console.error(`[BOT WORKER] Worker ${bot.id.slice(-5)} Error initializing blockchain provider:`, error);
    }
  }
}

async function initializeStrategy() {
  if (blockchainProvider) {
    strategyFactory = new BotStrategyFactory(blockchainProvider, arbitrageConfig);
    strategy = strategyFactory.getStrategy(bot);
  }
}

async function executeBot() {
  try {
    if (!running) return;

    if (!strategy) {
      console.error(`[BOT WORKER] Worker ${bot.id.slice(-5)} No strategy found`);
      return;
    }
    console.log(`[BOT WORKER] Worker ${bot.id.slice(-5)} Executing strategy`);
    const result = await strategy.execute(bot);
    if (parentPort) {
      parentPort.postMessage({
        type: "result",
        botId: bot.id,
        data: result,
        workerId: workerId,
      });
    }
  } catch (error: any) {
    if (parentPort) {
      parentPort.postMessage({
        type: "error",
        botId: bot.id,
        error: error.message,
        workerId: workerId,
      });
    }
  }
}

async function cleanup() {
  console.log(`[BOT WORKER] Worker ${bot.id.slice(-5)} Running cleanup...`);

  try {
    if (blockchainProvider) {
      await blockchainProvider.cleanup();
      blockchainProvider = null;
    }

    if (strategyFactory) {
      await strategyFactory.cleanup();
      strategyFactory = null;
    }

    strategy = null;
    console.log(`[BOT WORKER] Worker ${bot.id.slice(-5)} Cleanup completed successfully`);
  } catch (error) {
    console.error(`[BOT WORKER] Worker ${bot.id.slice(-5)} Error during cleanup:`, error);
  }
}

export async function startWorker() {
  await cleanup();
  if (parentPort) {
    parentPort.postMessage({
      type: "result",
      botId: bot.id,
      data: {
        message: "Worker statring",
        workerId: workerId
      }
    });
  }

  console.log(`[BOT WORKER] Initializing blockchain provider`);
  await initializeBlockchainProvider();
  console.log(`[BOT WORKER] Initializing strategy`);
  await initializeStrategy();
  console.log(`[BOT WORKER] Executing bot`);
  await executeBot();
}
