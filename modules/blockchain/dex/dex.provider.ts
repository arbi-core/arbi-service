import { ethers } from 'ethers';
import { Exchange, Network, Token } from '../../database/entities/Bot.entity';

export interface DexProvider {
  getExchangeName(): Exchange;
  getNetwork(): Network | string;
  getTokenPrice(tokenAddress: string): Promise<number>;
  getTokenAddress(token: Token): string;
  isPairSupported(tokenAddress: string, baseTokenAddress: string): Promise<boolean>;
}

export class DexProviderFactory {
  static createProvider(
    exchange: Exchange,
    network: Network | string,
    ethereumProvider: ethers.Provider
  ): DexProvider {
    switch (exchange) {
      case Exchange.UNISWAP2:
        return new UniswapV2Provider(network, ethereumProvider);
      case Exchange.SUSHISWAP:
        return new SushiSwapProvider(network, ethereumProvider);
      case Exchange.PANCAKE:
        return new PancakeSwapProvider(network, ethereumProvider);
      default:
        throw new Error(`Unsupported exchange: ${exchange}`);
    }
  }
}


const TOKEN_ADDRESSES: Record<string, Record<Token, string>> = {
  'ethereum': {
    [Token.ETH]: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    [Token.USDT]: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    [Token.USDC]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  },
  'polygon': {
    [Token.ETH]: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH on Polygon
    [Token.USDT]: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    [Token.USDC]: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
  }
};

abstract class BaseDexProvider implements DexProvider {
  protected network: Network | string;
  protected ethereumProvider: ethers.Provider;
  protected volatilityFactor: number;

  constructor(network: Network | string, ethereumProvider: ethers.Provider) {
    this.network = network;
    this.ethereumProvider = ethereumProvider;
    this.volatilityFactor = 0.95 + Math.random() * 0.1;
  }

  abstract getExchangeName(): Exchange;

  getNetwork(): Network | string {
    return this.network;
  }

  getTokenAddress(token: Token): string {
    const networkAddresses = TOKEN_ADDRESSES[this.network.toString()] || TOKEN_ADDRESSES['ethereum'];
    return networkAddresses[token] || '0x0000000000000000000000000000000000000000';
  }

  async isPairSupported(tokenAddress: string, baseTokenAddress: string): Promise<boolean> {
    return true
  }


  async getTokenPrice(tokenAddress: string): Promise<number> {
    // For ETH, return 3000 ± 100
    if (tokenAddress === this.getTokenAddress(Token.ETH)) {
      // Generate a random value between 2900 and 3100
      return 3000 + (Math.random() * 200 - 100) * this.volatilityFactor;
    }
    // For stablecoins (USDT/USDC), always return 1
    else if (tokenAddress === this.getTokenAddress(Token.USDT) ||
      tokenAddress === this.getTokenAddress(Token.USDC)) {
      return 1;
    }
    // For other tokens, use original logic
    else {
      const tokenHash = this.hashString(tokenAddress);
      const basePrice = 0.1 + (tokenHash % 5000) / 10;
      return basePrice * this.volatilityFactor;
    }
  }


  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

export class UniswapV2Provider extends BaseDexProvider {
  getExchangeName(): Exchange {
    return Exchange.UNISWAP2;
  }

  async getTokenPrice(tokenAddress: string): Promise<number> {
    // For ETH, return 3000 ± 100 with Uniswap-specific volatility
    if (tokenAddress === this.getTokenAddress(Token.ETH)) {
      return (3000 + (Math.random() * 200 - 100)) * 1.02;
    }
    // For stablecoins, always return 1 (no volatility for stablecoins)
    else if (tokenAddress === this.getTokenAddress(Token.USDT) ||
      tokenAddress === this.getTokenAddress(Token.USDC)) {
      return 1;
    }
    // For other tokens, use original logic
    else {
      const basePrice = await super.getTokenPrice(tokenAddress);
      return basePrice * 1.02;
    }
  }
}

export class SushiSwapProvider extends BaseDexProvider {
  getExchangeName(): Exchange {
    return Exchange.SUSHISWAP;
  }

  async getTokenPrice(tokenAddress: string): Promise<number> {
    // For ETH, return 3000 ± 100 with SushiSwap-specific volatility
    if (tokenAddress === this.getTokenAddress(Token.ETH)) {
      return (3000 + (Math.random() * 200 - 100)) * 0.98;
    }
    // For stablecoins, always return 1 (no volatility for stablecoins)
    else if (tokenAddress === this.getTokenAddress(Token.USDT) ||
      tokenAddress === this.getTokenAddress(Token.USDC)) {
      return 1;
    }
    // For other tokens, use original logic
    else {
      const basePrice = await super.getTokenPrice(tokenAddress);
      return basePrice * 0.98;
    }
  }
}

export class PancakeSwapProvider extends BaseDexProvider {
  getExchangeName(): Exchange {
    return Exchange.PANCAKE;
  }

  async getTokenPrice(tokenAddress: string): Promise<number> {
    // For ETH, return 3000 ± 100 with PancakeSwap-specific volatility
    if (tokenAddress === this.getTokenAddress(Token.ETH)) {
      return (3000 + (Math.random() * 200 - 100)) * 0.97;
    }
    // For stablecoins, always return 1 (no volatility for stablecoins)
    else if (tokenAddress === this.getTokenAddress(Token.USDT) ||
      tokenAddress === this.getTokenAddress(Token.USDC)) {
      return 1;
    }
    // For other tokens, use original logic
    else {
      const basePrice = await super.getTokenPrice(tokenAddress);
      return basePrice * 0.97;
    }
  }
}