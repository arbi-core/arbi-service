import { WorkerBlockchainProvider } from '../worker-blockchain.provider';
import { DexProvider, DexProviderFactory } from '../dex/dex.provider';
import { Bot, Exchange, Token, Network } from '../../database/entities/Bot.entity';
import { ethers } from 'ethers';
import { BotStrategy } from './strategy';

export interface ArbitrageStrategyConfig {
  minProfitPercentage: number;
  tradeAmount: ethers.BigNumberish;
  gasLimitMultiplier: number;
  maxGasPrice: ethers.BigNumberish;
  arbitrageContractAddress: string;
  arbitrageContractAbi: ethers.InterfaceAbi;
  privateKey: string;
  maxConsecutiveErrors?: number;
}

export class ArbitrageStrategy implements BotStrategy {
  private workerBlockchainProvider: WorkerBlockchainProvider;
  private provider: ethers.Provider;
  private bot: Bot;
  private config: ArbitrageStrategyConfig;
  private dex1: DexProvider | null = null;
  private dex2: DexProvider | null = null;
  private unsubscribeBlockEvents: (() => void) | null = null;
  private isRunning: boolean = false;
  private errorCount: number = 0;

  constructor(
    workerBlockchainProvider: WorkerBlockchainProvider,
    bot: Bot,
    config: ArbitrageStrategyConfig
  ) {
    this.workerBlockchainProvider = workerBlockchainProvider;
    this.provider = this.workerBlockchainProvider.getProvider();
    this.bot = bot;
    this.config = config;

    if (!bot.exchange1 || !bot.exchange2 || !bot.token1 || !bot.network) {
      throw new Error('Bot configuration is incomplete. Missing exchange1, exchange2, token1, or network.');
    }

    console.log(`[ARBITRAGE STRATEGY CONSTRUCTOR] Strategy initialized: ${bot.name} (${bot.exchange1} <-> ${bot.exchange2})`);
  }
  public async execute(bot: Bot): Promise<any> {
    console.log(`[ARBITRAGE STRATEGY EXECUTE] Executing strategy for bot ${bot.id.slice(-5)}`);
    this.bot = bot;

    if (bot.status === 'active') {
      await this.start();
      return {
        status: "success",
        message: "Strategy started",
      };
    } else if (bot.status === 'stopped' || bot.status === 'paused') {
      await this.stop();
      return {
        status: "success",
        message: `Strategy ${bot.status}`
      };
    }

    return {
      status: "error",
      message: `Unknown bot status: ${bot.status}`
    };
  }

  private async start(): Promise<void> {
    if (this.isRunning) {
      console.log(`Strategy is already running for ${this.bot.name}`);
      return;
    }

    console.log(`[ARBITRAGE STRATEGY] Starting strategy for ${this.bot.id.slice(-5)}`);

    try {
      this.isRunning = true;
      // Initialize DEX providers if not already initialized
      if (!this.dex1 || !this.dex2) {
        await this.setupDexProviders();
      }

      // Start listening for new blocks

      if (!this.provider) {
        throw new Error(`[ARBITRAGE STRATEGY] No provider for network ${this.bot.network}`);
      }

      // Subscribe to new block events
      this.workerBlockchainProvider.subscribeToNewBlocks(this.onNewBlock);

    } catch (error) {
      console.error(`[ARBITRAGE STRATEGY] Error starting strategy for ${this.bot.name}:`, error);
      this.isRunning = false;
      throw error;
    }
  }

  private onNewBlock = async (blockNumber: number): Promise<void> => {
    if (!this.isRunning) return;

    try {
      // console.log(`[ARBITRAGE STRATEGY] Block ${blockNumber}: Checking prices for ${this.bot.name}`);


      // Check prices and execute arbitrage if profitable
      await this.checkPricesAndExecute(blockNumber);
    } catch (error) {
      console.error(`[ARBITRAGE STRATEGY] Error on block ${blockNumber}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log(`[ARBITRAGE STRATEGY] Strategy is not running for ${this.bot.name}`);
      return;
    }

    console.log(`[ARBITRAGE STRATEGY] Stopping strategy for ${this.bot.name}`);

    if (this.unsubscribeBlockEvents) {
      this.unsubscribeBlockEvents();
      this.unsubscribeBlockEvents = null;
    }
    this.errorCount = 0;
    this.isRunning = false;

    console.log(`[ARBITRAGE STRATEGY] Strategy stopped for ${this.bot.name}`);
  }


  private async setupDexProviders(): Promise<void> {
    console.log(`[ARBITRAGE STRATEGY] Initializing DEX providers: ${this.bot.exchange1} <-> ${this.bot.exchange2} on network ${this.bot.network}`);

    try {
      if (!this.provider) {
        throw new Error(`[ARBITRAGE STRATEGY] No provider for network ${this.bot.network}`);
      }

      this.dex1 = DexProviderFactory.createProvider(this.bot.exchange1, this.bot.network, this.provider);
      this.dex2 = DexProviderFactory.createProvider(this.bot.exchange2, this.bot.network, this.provider);

      if (!this.dex1 || !this.dex2) {
        throw new Error(`[ARBITRAGE STRATEGY] Failed to initialize DEX providers: ${this.bot.exchange1} or ${this.bot.exchange2} on network ${this.bot.network}`);
      }

      console.log(`[ARBITRAGE STRATEGY] DEX providers initialized successfully: ${this.dex1.getExchangeName()} and ${this.dex2.getExchangeName()}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[ARBITRAGE STRATEGY] Error initializing DEX providers: ${errorMessage}`);
      throw new Error(`[ARBITRAGE STRATEGY] Failed to initialize DEX providers: ${errorMessage}`);
    }
  }

  private async checkPricesAndExecute(blockNumber: number): Promise<void> {
    if (!this.dex1 || !this.dex2) {
      throw new Error(`[ARBITRAGE STRATEGY ${blockNumber}] DEX providers are not initialized`);
    }

    try {
      console.log(`[ARBITRAGE STRATEGY ${blockNumber}] Checking price differences for ${this.bot.name} between ${this.dex1.getExchangeName()} and ${this.dex2.getExchangeName()}`);

      const tokenAddress = this.dex1.getTokenAddress(this.bot.token1);

      const baseTokenAddress = this.dex1.getTokenAddress(Token.USDT);


      const pair1Supported = await this.dex1.isPairSupported(tokenAddress, baseTokenAddress);
      const pair2Supported = await this.dex2.isPairSupported(tokenAddress, baseTokenAddress);

      if (!pair1Supported || !pair2Supported) {
        console.log(`[ARBITRAGE STRATEGY ${blockNumber}] Token ${this.bot.token1} pair not supported on one or both DEXes: ${this.dex1.getExchangeName()} (${pair1Supported}), ${this.dex2.getExchangeName()} (${pair2Supported})`);
        return;
      }

      const price1 = await this.dex1.getTokenPrice(tokenAddress);
      const price2 = await this.dex2.getTokenPrice(tokenAddress);

      const priceDifference = Math.abs(price1 - price2);
      const percentage = (priceDifference / Math.min(price1, price2)) * 100;

      console.log(`[ARBITRAGE STRATEGY ${blockNumber}] ${this.bot.token1}: ${this.dex1.getExchangeName()}: $${price1.toFixed(6)}, ${this.dex2.getExchangeName()}: $${price2.toFixed(6)}`);
      console.log(`[ARBITRAGE STRATEGY ${blockNumber}] Difference: ${priceDifference.toFixed(6)} (${percentage.toFixed(2)}%)`);

      if (percentage >= this.config.minProfitPercentage) {
        console.log(`[ARBITRAGE STRATEGY ${blockNumber}] !!! Profitable arbitrage opportunity found for ${this.bot.name} !!!`);
      }
    } catch (error) {
      console.error(`[ARBITRAGE STRATEGY ${blockNumber}] Error checking price differences for ${this.bot.name}:`, error);
    }
  }


  public cleanup(): void {
    if (this.isRunning) {
      this.stop().catch(error => {
        console.error(`Error stopping strategy during cleanup: ${error}`);
      });
    }

    this.dex1 = null;
    this.dex2 = null;
    this.unsubscribeBlockEvents = null;
    this.errorCount = 0;

    console.log(`Cleanup complete for ${this.bot.name}`);
  }
}