/**
 * Shared chain helpers for checkout and wallet flows.
 *
 * Backend `/app-config` is the primary source of truth for:
 * - enabled chains
 * - current network environment
 * - chain ids / RPC URLs / explorers
 * - token addresses
 *
 * This file only keeps UI metadata and resilient fallbacks.
 */

import { getAppConfigSync, type ChainConfigEntry } from './appConfig';
import { getUSDTAddressTron } from './contracts';

export type SupportedChain =
  | 'ethereum'
  | 'base'
  | 'arbitrum'
  | 'bsc'
  | 'polygon'
  | 'tron'
  | 'solana';

export type TokenSymbol = 'USDT' | 'USDC';
export type WalletType = 'metamask' | 'trustwallet' | 'phantom' | 'tronlink' | 'walletconnect';

export interface WalletConfig {
  type: WalletType;
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface TokenConfig {
  symbol: TokenSymbol;
  decimals: number;
  mainnet: string;
  testnet: string;
}

export interface ChainConfig {
  id: SupportedChain;
  name: string;
  displayName: string;
  icon: string;
  chainId: {
    mainnet: number;
    testnet: number;
  };
  rpcUrl: {
    mainnet: string;
    testnet: string;
  };
  blockExplorer: {
    mainnet: string;
    testnet: string;
  };
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  tokens: TokenConfig[];
  fee: string;
  isEVM: boolean;
  enabled: boolean;
}

type NetworkEnvironment = 'testnet' | 'mainnet';

const FALLBACK_NETWORK_ENV: NetworkEnvironment = 'testnet';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const SUPPORTED_CHAINS: SupportedChain[] = ['ethereum', 'base', 'arbitrum', 'bsc', 'polygon', 'tron', 'solana'];

const EVM_WALLETS: WalletConfig[] = [
  { type: 'metamask', name: 'MetaMask', icon: '🦊', color: 'bg-orange-500', description: 'Browser extension' },
  { type: 'trustwallet', name: 'Trust Wallet', icon: '🛡️', color: 'bg-blue-500', description: 'Mobile wallet' },
];

const CHAIN_WALLETS: Record<SupportedChain, WalletConfig[]> = {
  ethereum: EVM_WALLETS,
  base: EVM_WALLETS,
  arbitrum: EVM_WALLETS,
  bsc: EVM_WALLETS,
  polygon: EVM_WALLETS,
  tron: [
    { type: 'tronlink', name: 'TronLink', icon: '🔷', color: 'bg-red-500', description: 'Tron wallet' },
  ],
  solana: [
    { type: 'phantom', name: 'Phantom', icon: '👻', color: 'bg-purple-500', description: 'Solana wallet' },
  ],
};

const CHAIN_FALLBACKS: Record<SupportedChain, ChainConfig> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    displayName: 'Ethereum Mainnet',
    icon: '⟠',
    chainId: { mainnet: 1, testnet: 11155111 },
    rpcUrl: {
      mainnet: 'https://eth.llamarpc.com',
      testnet: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    },
    blockExplorer: {
      mainnet: 'https://etherscan.io',
      testnet: 'https://sepolia.etherscan.io',
    },
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    tokens: [
      {
        symbol: 'USDT',
        decimals: 6,
        mainnet: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        testnet: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
      },
      {
        symbol: 'USDC',
        decimals: 6,
        mainnet: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        testnet: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      },
    ],
    fee: 'High (~$5-20)',
    isEVM: true,
    enabled: true,
  },
  base: {
    id: 'base',
    name: 'Base',
    displayName: 'Base',
    icon: '🔵',
    chainId: { mainnet: 8453, testnet: 84532 },
    rpcUrl: {
      mainnet: 'https://mainnet.base.org',
      testnet: 'https://sepolia.base.org',
    },
    blockExplorer: {
      mainnet: 'https://basescan.org',
      testnet: 'https://sepolia.basescan.org',
    },
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    tokens: [
      {
        symbol: 'USDC',
        decimals: 6,
        mainnet: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        testnet: '0x936FC3bb38AD2343E532cC4D57A8f36220ab3691',
      },
      {
        symbol: 'USDT',
        decimals: 6,
        mainnet: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
        testnet: '0x656bCAB335B667E1EA81c755A2C2736688628d24',
      },
    ],
    fee: 'Very Low (~$0.01)',
    isEVM: true,
    enabled: true,
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum',
    displayName: 'Arbitrum One',
    icon: '🔴',
    chainId: { mainnet: 42161, testnet: 421614 },
    rpcUrl: {
      mainnet: 'https://arb1.arbitrum.io/rpc',
      testnet: 'https://sepolia-rollup.arbitrum.io/rpc',
    },
    blockExplorer: {
      mainnet: 'https://arbiscan.io',
      testnet: 'https://sepolia.arbiscan.io',
    },
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    tokens: [
      {
        symbol: 'USDT',
        decimals: 6,
        mainnet: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        testnet: ZERO_ADDRESS,
      },
      {
        symbol: 'USDC',
        decimals: 6,
        mainnet: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        testnet: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
      },
    ],
    fee: 'Low (~$0.10)',
    isEVM: true,
    enabled: true,
  },
  bsc: {
    id: 'bsc',
    name: 'BSC',
    displayName: 'BNB Smart Chain',
    icon: '🟡',
    chainId: { mainnet: 56, testnet: 97 },
    rpcUrl: {
      mainnet: 'https://bsc-dataseed.binance.org',
      testnet: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    },
    blockExplorer: {
      mainnet: 'https://bscscan.com',
      testnet: 'https://testnet.bscscan.com',
    },
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    tokens: [
      {
        symbol: 'USDT',
        decimals: 18,
        mainnet: '0x55d398326f99059fF775485246999027B3197955',
        testnet: ZERO_ADDRESS,
      },
      {
        symbol: 'USDC',
        decimals: 18,
        mainnet: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        testnet: ZERO_ADDRESS,
      },
    ],
    fee: 'Low (~$0.05)',
    isEVM: true,
    enabled: true,
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    displayName: 'Polygon',
    icon: '🟣',
    chainId: { mainnet: 137, testnet: 80002 },
    rpcUrl: {
      mainnet: 'https://polygon-rpc.com',
      testnet: 'https://rpc-amoy.polygon.technology',
    },
    blockExplorer: {
      mainnet: 'https://polygonscan.com',
      testnet: 'https://amoy.polygonscan.com',
    },
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    tokens: [
      {
        symbol: 'USDT',
        decimals: 6,
        mainnet: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        testnet: ZERO_ADDRESS,
      },
      {
        symbol: 'USDC',
        decimals: 6,
        mainnet: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
        testnet: ZERO_ADDRESS,
      },
    ],
    fee: 'Low (~$0.02)',
    isEVM: true,
    enabled: true,
  },
  tron: {
    id: 'tron',
    name: 'Tron',
    displayName: 'Tron (TRC20)',
    icon: '🔷',
    chainId: { mainnet: 728126428, testnet: 2494104990 },
    rpcUrl: {
      mainnet: 'https://api.trongrid.io',
      testnet: 'https://nile.trongrid.io',
    },
    blockExplorer: {
      mainnet: 'https://tronscan.org',
      testnet: 'https://nile.tronscan.org',
    },
    nativeCurrency: { name: 'Tronix', symbol: 'TRX', decimals: 6 },
    tokens: [
      {
        symbol: 'USDT',
        decimals: 6,
        mainnet: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        testnet: getUSDTAddressTron(),
      },
    ],
    fee: 'Low (~$1-2)',
    isEVM: false,
    enabled: true,
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    displayName: 'Solana',
    icon: '🟢',
    chainId: { mainnet: 101, testnet: 102 },
    rpcUrl: {
      mainnet: 'https://api.mainnet-beta.solana.com',
      testnet: 'https://api.devnet.solana.com',
    },
    blockExplorer: {
      mainnet: 'https://solscan.io',
      testnet: 'https://solscan.io?cluster=devnet',
    },
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    tokens: [
      {
        symbol: 'USDC',
        decimals: 6,
        mainnet: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        testnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
      },
      {
        symbol: 'USDT',
        decimals: 6,
        mainnet: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        testnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
      },
    ],
    fee: 'Extremely Low (~$0.001)',
    isEVM: false,
    enabled: true,
  },
};

function getNetworkEnv(): NetworkEnvironment {
  return getAppConfigSync()?.networkEnvironment ?? FALLBACK_NETWORK_ENV;
}

function isSupportedChain(value: string): value is SupportedChain {
  return SUPPORTED_CHAINS.includes(value as SupportedChain);
}

function getBackendChainEntry(chain: SupportedChain): ChainConfigEntry | null {
  return getAppConfigSync()?.chains?.[chain] ?? null;
}

function resolveBackendTokenAddress(entry: ChainConfigEntry | null, symbol: TokenSymbol): string {
  if (!entry) return '';
  return (symbol === 'USDT' ? entry.usdt : entry.usdc) ?? '';
}

function resolveChainConfig(chain: SupportedChain): ChainConfig {
  const fallback = CHAIN_FALLBACKS[chain];
  const backend = getBackendChainEntry(chain);
  if (!backend) {
    return fallback;
  }

  const env = getNetworkEnv();
  const tokenOverrides = fallback.tokens.map((token) => ({
    ...token,
    [env]: resolveBackendTokenAddress(backend, token.symbol),
  }));

  return {
    ...fallback,
    name: backend.chainName || fallback.name,
    displayName: backend.chainName || fallback.displayName,
    chainId: {
      ...fallback.chainId,
      [env]: backend.chainId,
    },
    rpcUrl: {
      ...fallback.rpcUrl,
      [env]: backend.rpcUrl || '',
    },
    blockExplorer: {
      ...fallback.blockExplorer,
      [env]: backend.blockExplorer || '',
    },
    nativeCurrency: {
      ...fallback.nativeCurrency,
      symbol: backend.symbol || fallback.nativeCurrency.symbol,
    },
    tokens: tokenOverrides,
    isEVM: backend.isEVM,
    enabled: backend.enabled,
  };
}

export function getEnabledChains(): ChainConfig[] {
  const config = getAppConfigSync();
  if (!config) {
    return SUPPORTED_CHAINS.map((chain) => resolveChainConfig(chain)).filter((chain) => chain.enabled);
  }

  return SUPPORTED_CHAINS
    .filter((chain) => config.chains[chain]?.enabled)
    .map((chain) => resolveChainConfig(chain));
}

export function getChainConfig(chainId: SupportedChain): ChainConfig | undefined {
  if (!isSupportedChain(chainId)) return undefined;
  return resolveChainConfig(chainId);
}

export function getCurrentChainId(chain: SupportedChain): number {
  const chainConfig = getChainConfig(chain);
  if (!chainConfig) return 0;
  return chainConfig.chainId[getNetworkEnv()];
}

export function getCurrentRpcUrl(chain: SupportedChain): string {
  const chainConfig = getChainConfig(chain);
  if (!chainConfig) return '';
  return chainConfig.rpcUrl[getNetworkEnv()] ?? '';
}

export function getCurrentBlockExplorer(chain: SupportedChain): string {
  const chainConfig = getChainConfig(chain);
  if (!chainConfig) return '';
  return chainConfig.blockExplorer[getNetworkEnv()] ?? '';
}

export function getTokenAddress(chain: SupportedChain, token: TokenSymbol): string | undefined {
  const chainConfig = getChainConfig(chain);
  if (!chainConfig) return undefined;

  const tokenConfig = chainConfig.tokens.find((item) => item.symbol === token);
  return tokenConfig?.[getNetworkEnv()] || undefined;
}

export function getTokenDecimals(chain: SupportedChain, token: TokenSymbol): number {
  const chainConfig = getChainConfig(chain);
  if (!chainConfig) return 6;

  const tokenConfig = chainConfig.tokens.find((item) => item.symbol === token);
  return tokenConfig?.decimals ?? 6;
}

export function getAvailableTokens(chain: SupportedChain): TokenSymbol[] {
  const chainConfig = getChainConfig(chain);
  if (!chainConfig) return [];

  return chainConfig.tokens
    .filter((token) => {
      const address = token[getNetworkEnv()];
      return address && address !== ZERO_ADDRESS;
    })
    .map((token) => token.symbol);
}

export function getExplorerTxUrl(chain: SupportedChain, txHash: string): string {
  const explorer = getCurrentBlockExplorer(chain);
  if (!explorer) return '#';

  switch (chain) {
    case 'tron':
      return `${explorer}/#/transaction/${txHash}`;
    case 'solana': {
      const baseExplorer = explorer.split('?')[0];
      return isTestnet()
        ? `${baseExplorer}/tx/${txHash}?cluster=devnet`
        : `${baseExplorer}/tx/${txHash}`;
    }
    default:
      return `${explorer}/tx/${txHash}`;
  }
}

export function getHexChainId(chain: SupportedChain): string {
  return `0x${getCurrentChainId(chain).toString(16)}`;
}

export function isTestnet(): boolean {
  return getNetworkEnv() === 'testnet';
}

export function isEvmChain(chain: SupportedChain): boolean {
  return !!getChainConfig(chain)?.isEVM;
}

export function getWalletsForChain(chain: SupportedChain): WalletConfig[] {
  return CHAIN_WALLETS[chain] ?? [];
}

export function getDefaultChain(): SupportedChain {
  const defaultChain = getAppConfigSync()?.defaultChain;
  return defaultChain && isSupportedChain(defaultChain) ? defaultChain : 'base';
}

export function getDefaultToken(): TokenSymbol {
  const defaultToken = getAppConfigSync()?.defaultToken;
  return defaultToken === 'USDT' || defaultToken === 'USDC' ? defaultToken : 'USDT';
}

// Merchant receiving addresses (configure these for your use case)
// In production, these would come from your backend API
export const MERCHANT_ADDRESSES: Record<SupportedChain, string> = {
  ethereum: '0x742d35Cc6634C0532925a3b844Bc9e7595f1e123',
  base: '0x742d35Cc6634C0532925a3b844Bc9e7595f1e123',
  arbitrum: '0x742d35Cc6634C0532925a3b844Bc9e7595f1e123',
  bsc: '0x742d35Cc6634C0532925a3b844Bc9e7595f1e123',
  polygon: '0x742d35Cc6634C0532925a3b844Bc9e7595f1e123',
  tron: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
  solana: 'CQy8Jf9gqKjNNXcxjLCHMQgcCfHc7Dpmjz8PRxjK9s1d',
};

// ERC20 ABI for token transfers (same for all EVM chains)
export const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;
