import { Worker } from "worker_threads";
import { Bot, Network } from "../../database/entities/Bot.entity";
import { BotRepository } from "../../database/repository/Bot.repository";
import { WebSocketService } from "../../websocket/websocket.service";
import path from 'path';

export class BotManagerService {
  private static instance: BotManagerService;
  private botRepository: BotRepository;
  private wsService: WebSocketService;
  private activeWorkers: Map<string, Worker>;
  public instanceId: string

  private constructor() {
    this.botRepository = new BotRepository();
    this.wsService = WebSocketService.getInstance();

    this.activeWorkers = new Map<string, Worker>();
    this.instanceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }


  public static getInstance(): BotManagerService {

    if (!BotManagerService.instance) {
      BotManagerService.instance = new BotManagerService();
    }
    return BotManagerService.instance;
  }

  async initialize(): Promise<void> {
    try {
      const activeBots = await this.botRepository.findBotsByStatus("active");

      console.log(`[BOT MANAGER SERVICE] Found ${activeBots.length} active bots to restart`);

      for (const bot of activeBots) {
        await this.startBotWorker(bot);
      }
    } catch (error) {
      console.error("[BOT MANAGER SERVICE] Error initializing BotManagerService:", error);
    }
  }

  async startBot(botId: string): Promise<Bot | null> {
    try {
      console.log(`[BOT MANAGER SERVICE] startBot`, botId);
      const bot = await this.botRepository.getBotById(botId);

      if (!bot) {
        throw new Error(`Bot with ID ${botId} not found`);
      }

      if (bot.status === "active") {
        throw new Error(`Bot ${botId} is already running`);
      }

      const previousStatus = bot.status;

      // First update bot status in database
      const updatedBot = await this.botRepository.updateBot(botId, { status: "active" });

      if (!updatedBot) {
        throw new Error(`Failed to update bot ${botId} status`);
      }

      // Then start the worker with the updated bot data
      await this.startBotWorker(updatedBot);

      // Notify about status change via WebSocket
      this.wsService.emitBotStatusChange(updatedBot, previousStatus);

      return updatedBot;
    } catch (error) {
      this.wsService.emitBotError(botId, error as Error);
      throw error;
    }
  }

  private async startBotWorker(bot: Bot): Promise<void> {
    console.log(`[BOT MANAGER SERVICE] Starting worker for bot ${bot.id.slice(-5)}`);
    try {
      if (this.activeWorkers.has(bot.id)) {
        console.log(`[BOT MANAGER SERVICE]Worker for bot ${bot.id} already exists`);
        return;
      }

      const fullBot = await this.botRepository.getBotById(bot.id);

      if (!fullBot) {
        throw new Error(`Bot with ID ${bot.id} not found`);
      }

      const alchemyApiKeys: Record<string, string> = {
        mainnet: process.env.ALCHEMY_API_KEY_MAINNET || '',
        [Network.ARB]: process.env.ALCHEMY_API_KEY_ARBITRUM || '',
        [Network.BASE]: process.env.ALCHEMY_API_KEY_BASE || '',
        [Network.POL]: process.env.ALCHEMY_API_KEY_POLYGON || ''
      };

      const arbitrageAbi = 'arbitrageAbi'

      const arbitrageConfig = {
        minProfitPercentage: "0.5",
        tradeAmount: "1000000000000000000",
        gasLimitMultiplier: '1.5',
        maxGasPrice: "100000000000",
        arbitrageContractAddress: process.env.ARBITRAGE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
        arbitrageContractAbi: arbitrageAbi,
        privateKey: process.env.PRIVATE_KEY || ""
      };



      const workerScriptPath = path.resolve(__dirname, 'worker-loader.js');
      const workerId = `${bot.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const worker = new Worker(workerScriptPath, {
        workerData: {
          bot: fullBot,
          workerId: workerId,
          scriptPath: path.resolve(__dirname, 'bot.worker.ts'),
          alchemyApiKeys,
          arbitrageConfig
        }
      });

      worker.on('message', (message) => {
        if (message.type === 'result') {
          console.log(`[BOT MANAGER SERVICE] worker.on message RESULT bot id ${message.botId.slice(-5)} execution result:`, message.data);
          this.wsService.emitBotExecution(bot.id, message.data);
        } else if (message.type === 'error') {
          console.error(`[BOT MANAGER SERVICE] worker.on message ERROR bot id ${message.botId || bot.id} execution error:`, message.error);
          this.wsService.emitBotError(bot.id, new Error(message.error));
        } else if (message.type === 'stopped') {
          console.log(`[BOT MANAGER SERVICE] worker.on message STOPPED bot id ${message.botId} has been stopped`);
        }
      });

      worker.on('error', (error) => {
        console.error(`[BOT MANAGER SERVICE] Worker for bot ${bot.id} encountered an error:`, error);
        this.wsService.emitBotError(bot.id, error);
        this.activeWorkers.delete(bot.id);
      });

      worker.on('exit', (code) => {
        console.log(`[BOT MANAGER SERVICE] Worker for bot ${bot.id} exited with code ${code}`);
        this.activeWorkers.delete(bot.id);
      });

      this.activeWorkers.set(bot.id, worker);
      console.log(`[BOT MANAGER SERVICE] Started worker for bot  ${bot.id.slice(-5)}`);
    } catch (error) {
      console.error(`[BOT MANAGER SERVICE] Failed to start worker for bot ${bot.id}:`, error);
      throw error;
    }
  }

  /**
   * Stop a bot by its ID
   */
  async stopBot(botId: string): Promise<Bot | null> {
    try {
      // Get bot information from database
      const bot = await this.botRepository.getBotById(botId);

      if (!bot) {
        throw new Error(`Bot with ID ${botId} not found`);
      }

      if (bot.status !== "active") {
        throw new Error(`Bot ${botId} is not running`);
      }

      const previousStatus = bot.status;

      // Stop the bot worker
      await this.stopBotWorker(botId);

      // Update bot status in database
      const updatedBot = await this.botRepository.updateBot(botId, { status: "stopped" });

      // Notify about status change via WebSocket
      if (updatedBot) {
        this.wsService.emitBotStatusChange(updatedBot, previousStatus);
      }

      return updatedBot;
    } catch (error) {
      // Notify about error via WebSocket
      this.wsService.emitBotError(botId, error as Error);
      throw error;
    }
  }

  /**
   * Stop a bot worker
   */
  private async stopBotWorker(botId: string): Promise<void> {
    try {
      const worker = this.activeWorkers.get(botId);
      if (!worker) {
        console.log(`[BOT MANAGER SERVICE] No active worker found for bot ${botId}`);
        return;
      }

      console.log(`[BOT MANAGER SERVICE] Attempting to stop worker for bot ${botId}`);

      // Create a cleanup function to remove listeners and references
      const cleanup = () => {
        // Remove the worker from our map
        this.activeWorkers.delete(botId);
        console.log(`[BOT MANAGER SERVICE] Stopped worker for bot ${botId}`);
      };

      // Send stop command to worker
      worker.postMessage({ command: 'stop' });

      // Use a Promise with timeout for stopping the worker
      try {
        // Wait for worker to gracefully stop (with timeout)
        await Promise.race([
          // Promise that resolves when worker sends 'stopped' message
          new Promise<void>((resolve, reject) => {
            // Create a message handler
            const messageHandler = (message: any) => {
              // Only handle messages for this specific bot
              if (message.botId === botId && message.type === 'stopped') {
                console.log(`[BOT MANAGER SERVICE] Received stopped message from bot ${botId}`);
                // Clean up the listener
                worker.removeListener('message', messageHandler);
                resolve();
              }
            };

            // Add the message handler
            worker.on('message', messageHandler);

            // Also listen for exit event
            const exitHandler = (code: number) => {
              console.log(`[BOT MANAGER SERVICE] Worker for bot ${botId} exited with code ${code}`);
              worker.removeListener('message', messageHandler);
              worker.removeListener('exit', exitHandler);
              resolve();
            };
            worker.on('exit', exitHandler);

            // Set timeout
            setTimeout(() => {
              worker.removeListener('message', messageHandler);
              worker.removeListener('exit', exitHandler);
              reject(new Error(`Timed out waiting for bot ${botId} to stop`));
            }, 5000); // 5 second timeout
          })
        ]);
      } catch (error) {
        console.error(`Error stopping bot ${botId}:`, error);
        // Terminate the worker forcefully if it doesn't stop gracefully
        try {
          await worker.terminate();
          console.log(`[BOT MANAGER SERVICE] Forcefully terminated worker for bot ${botId}`);
        } catch (terminateError) {
          console.error(`Failed to terminate worker for bot ${botId}:`, terminateError);
        }
      } finally {
        cleanup();
      }
    } catch (error) {
      console.error(`Failed to stop worker for bot ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Get bot status by its ID
   */
  async getBotStatus(botId: string): Promise<{ botId: string; status: string; details?: any }> {
    try {
      // Get bot information from database
      const bot = await this.botRepository.getBotById(botId);

      if (!bot) {
        throw new Error(`Bot with ID ${botId} not found`);
      }

      // Check if there's an active worker for this bot
      const isWorkerRunning = this.activeWorkers.has(botId);

      // If the status is active but no worker is running, or vice versa, there's an inconsistency
      if (bot.status === "active" && !isWorkerRunning) {
        console.warn(`Inconsistency: Bot ${botId} has active status but no running worker`);
      } else if (bot.status !== "active" && isWorkerRunning) {
        console.warn(`Inconsistency: Bot ${botId} has non-active status but worker is running`);
      }

      // Return bot information including status from the database
      return {
        botId: bot.id,
        status: bot.status,
        details: {
          isWorkerRunning
        }
      };
    } catch (error) {
      // Just rethrow the error without logging during tests
      throw error;
    }
  }
}