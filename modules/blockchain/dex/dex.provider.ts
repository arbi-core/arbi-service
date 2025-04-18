import { ethers } from 'ethers';
import { Exchange, Network, Token } from '../../database/entities/Bot.entity';
const abi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_feeToSetter",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenA",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "tokenB",
        "type": "address"
      }
    ],
    "name": "getPair",
    "outputs": [
      {
        "internalType": "address",
        "name": "pair",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenA",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "tokenB",
        "type": "address"
      }
    ],
    "name": "createPair",
    "outputs": [
      {
        "internalType": "address",
        "name": "pair",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "allPairsLength",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

const UNISWAP_V2_PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)"
];

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


const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  'ethereum': {
    [Token.ETH]: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    [Token.USDT]: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    [Token.USDC]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  },
  'polygon': {
    [Token.ETH]: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH on Polygon
    [Token.USDT]: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    [Token.USDC]: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
  },
  'base': {
    [Token.ETH]: '0x4200000000000000000000000000000000000006', // WETH on Base
    [Token.USDT]: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    [Token.USDC]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    [Token.AETX]: '0xFe0c0B15798B8c9107CD4aa556A87Eb031263e8b'
  }
};

abstract class BaseDexProvider implements DexProvider {
  protected network: Network | string;
  protected ethereumProvider: ethers.Provider;
  protected volatilityFactor: number;
  protected factoryAdress: string;
  protected pollAddress: string;

  constructor(network: Network | string, ethereumProvider: ethers.Provider) {
    this.network = network;
    this.ethereumProvider = ethereumProvider;
    this.volatilityFactor = 0.95 + Math.random() * 0.1;
    this.ethereumProvider = ethereumProvider;
  }

  abstract getExchangeName(): Exchange;

  getNetwork(): Network | string {
    return this.network;
  }

  getTokenAddress(token: Token): string {
    const networkAddresses = TOKEN_ADDRESSES[this.network.toString()] || TOKEN_ADDRESSES['ethereum'];
    return networkAddresses[token] || '0x0000000000000000000000000000000000000000';
  }

  async getTokenPrice(tokenAddress: string): Promise<number> {
    return 1;
  }

  async isPairSupported(tokenAddress: string, baseTokenAddress: string): Promise<boolean> {
    return true
  }

}

export class UniswapV2Provider extends BaseDexProvider {

  private factoryContract: ethers.Contract;

  constructor(network: Network | string, ethereumProvider: ethers.Provider) {
    super(network, ethereumProvider);
    this.ethereumProvider = ethereumProvider;
    this.factoryAdress = '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6';
    this.factoryContract = new ethers.Contract(this.factoryAdress, abi, this.ethereumProvider);
    this.initializePollAddress();
  }

  private async initializePollAddress() {
    this.pollAddress = await this.factoryContract.getPair(
      '0xE248c0bCE837B8dFb21fdfa51Fb31D22fbbB4380',
      TOKEN_ADDRESSES['base'][Token.USDC]
    );
    console.log('GET POLL ADDRESS', this.pollAddress);
  }

  getExchangeName(): Exchange {
    return Exchange.UNISWAP2;
  }


  async getTokenPrice(): Promise<number> {
    const pairContract = new ethers.Contract(
      this.pollAddress,
      UNISWAP_V2_PAIR_ABI,
      this.ethereumProvider
    );

    const [reserve0, reserve1] = await pairContract.getReserves();






    const _token0 = await pairContract.token0();
    const _token1 = await pairContract.token1();

    const getTokenDecimals = async (tokenAddress: string) => {
      const erc20Abi = [
        "function decimals() external view returns (uint8)"
      ];
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, this.ethereumProvider);
      return await tokenContract.decimals();
    }

    const token0Decimals = await getTokenDecimals(_token0);
    const token1Decimals = await getTokenDecimals(_token1);

    const r0 = parseFloat(ethers.formatUnits(reserve0, token0Decimals));
    const r1 = parseFloat(ethers.formatUnits(reserve1, token1Decimals));



    console.log("Token0:", _token0);
    console.log("Token1:", _token1);
    console.log("Reserve0:", reserve0.toString());
    console.log("Reserve1:", reserve1.toString());
    console.log("Token0 Decimals:", Number(token0Decimals));
    console.log("Token1 Decimals:", Number(token1Decimals));
    console.log("Reserve0:", r0);
    console.log("Reserve1:", r1);

    let priceAinB;

    if (_token0.toLowerCase() === _token1.toLowerCase()) {
      priceAinB = r1 / r0;
    } else {
      priceAinB = r0 / r1;
    }

    console.log(`Price A in B: ${priceAinB}`);

    return 1;
  }
}

export class SushiSwapProvider extends BaseDexProvider {
  getExchangeName(): Exchange {
    return Exchange.SUSHISWAP;
  }

  async getTokenPrice(tokenAddress: string): Promise<number> {
    return 1;
    // // For ETH, return 3000 ± 100 with SushiSwap-specific volatility
    // if (tokenAddress === this.getTokenAddress(Token.ETH)) {
    //   return (3000 + (Math.random() * 200 - 100)) * 0.98;
    // }
    // // For stablecoins, always return 1 (no volatility for stablecoins)
    // else if (tokenAddress === this.getTokenAddress(Token.USDT) ||
    //   tokenAddress === this.getTokenAddress(Token.USDC)) {
    //   return 1;
    // }
    // // For other tokens, use original logic
    // else {
    //   // const basePrice = await super.getTokenPrice(tokenAddress);
    //   // return basePrice * 0.98;
    // }
  }
}

export class PancakeSwapProvider extends BaseDexProvider {
  getExchangeName(): Exchange {
    return Exchange.PANCAKE;
  }

  async getTokenPrice(tokenAddress: string): Promise<number> {
    return 1;
    // // For ETH, return 3000 ± 100 with PancakeSwap-specific volatility
    // if (tokenAddress === this.getTokenAddress(Token.ETH)) {
    //   return (3000 + (Math.random() * 200 - 100)) * 0.97;
    // }
    // // For stablecoins, always return 1 (no volatility for stablecoins)
    // else if (tokenAddress === this.getTokenAddress(Token.USDT) ||
    //   tokenAddress === this.getTokenAddress(Token.USDC)) {
    //   return 1;
    // }
    // // For other tokens, use original logic
    // else {
    //   const basePrice = await super.getTokenPrice(tokenAddress);
    //   return basePrice * 0.97;
    // }
  }
}