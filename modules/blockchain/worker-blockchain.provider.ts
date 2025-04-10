import { ethers } from 'ethers';
import { Network } from '../database/entities/Bot.entity';

export class WorkerBlockchainProvider {
  private provider: ethers.AlchemyProvider;
  private network: string;
  private unsubscribeFunction: (() => void) | null = null;

  constructor(network: Network | string, apiKey: string) {
    let ethNetwork: string;
    switch (network) {
      case Network.ARB:
        ethNetwork = 'arbitrum';
        break;
      case Network.BASE:
        ethNetwork = 'base';
        break;
      case Network.POL:
        ethNetwork = 'polygon';
        break;
      default:
        ethNetwork = network as string;
    }

    this.network = ethNetwork;
    this.provider = new ethers.AlchemyProvider(ethNetwork, apiKey);
    console.log(`[WorkerBlockchainProvider] Initialized for network: ${ethNetwork}`);
  }

  public subscribeToNewBlocks(callback: (blockNumber: number) => void): void {
    this.cleanup();
    console.log(`[WorkerBlockchainProvider] Subscribing to new blocks for network: ${this.network}`)

    const blockListener = (blockNumber: number) => {
      console.log(`[WorkerBlockchainProvider] New block detected: ${blockNumber} on ${this.network}`);
      callback(blockNumber);
    };

    this.provider.on('block', blockListener);

    this.unsubscribeFunction = () => {
      this.provider.off('block', blockListener);
    };
  }

  public async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  public async getBlock(blockNumber: number): Promise<ethers.Block | null> {
    return await this.provider.getBlock(blockNumber);
  }


  public getProvider(): ethers.AlchemyProvider {
    return this.provider;
  }


  public cleanup(): void {
    console.log(`[WorkerBlockchainProvider] Cleaning up`);
    if (this.unsubscribeFunction) {
      this.unsubscribeFunction();
      this.unsubscribeFunction = null;
      console.log(`[WorkerBlockchainProvider] Unsubscribed from block events for network: ${this.network}`);
    }
  }
}