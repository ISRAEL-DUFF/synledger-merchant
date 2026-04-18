/**
 * Centralized chain configuration for the payment system.
 * Toggle between testnet and mainnet easily, and add/remove chains as needed.
 */

import { getUSDTAddressTron } from "./contracts";

// Environment toggle - switch this to 'mainnet' for production
export const NETWORK_ENV: 'testnet' | 'mainnet' = 'testnet';

export type SupportedChain = 'ethereum' | 'base' | 'arbitrum' | 'tron' | 'solana';
export type TokenSymbol = 'USDT' | 'USDC';

interface TokenConfig {
  symbol: TokenSymbol;
  decimals: number;
  mainnet: string;
  testnet: string;
}

interface ChainConfig {
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

// Main chain configurations
export const CHAIN_CONFIGS: Record<SupportedChain, ChainConfig> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    displayName: 'Ethereum Mainnet',
    icon: '⟠',
    chainId: {
      mainnet: 1,
      testnet: 11155111, // Sepolia
    },
    rpcUrl: {
      mainnet: 'https://eth.llamarpc.com',
      testnet: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    },
    blockExplorer: {
      mainnet: 'https://etherscan.io',
      testnet: 'https://sepolia.etherscan.io',
    },
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    tokens: [
      {
        symbol: 'USDT',
        decimals: 6,
        mainnet: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        testnet: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', // Sepolia USDT
      },
      {
        symbol: 'USDC',
        decimals: 6,
        mainnet: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        testnet: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia USDC
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
    chainId: {
      mainnet: 8453,
      testnet: 84532, // Base Sepolia
    },
    rpcUrl: {
      mainnet: 'https://mainnet.base.org',
      testnet: 'https://sepolia.base.org',
    },
    blockExplorer: {
      mainnet: 'https://basescan.org',
      testnet: 'https://sepolia.basescan.org',
    },
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    tokens: [
      {
        symbol: 'USDC',
        decimals: 6,
        mainnet: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        testnet: '0x936FC3bb38AD2343E532cC4D57A8f36220ab3691', // Base Sepolia USDC
      },
      {
        symbol: 'USDT',
        decimals: 6,
        mainnet: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        testnet: '0x656bCAB335B667E1EA81c755A2C2736688628d24', // Base Sepolia USDT
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
    chainId: {
      mainnet: 42161,
      testnet: 421614, // Arbitrum Sepolia
    },
    rpcUrl: {
      mainnet: 'https://arb1.arbitrum.io/rpc',
      testnet: 'https://sepolia-rollup.arbitrum.io/rpc',
    },
    blockExplorer: {
      mainnet: 'https://arbiscan.io',
      testnet: 'https://sepolia.arbiscan.io',
    },
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    tokens: [
      {
        symbol: 'USDT',
        decimals: 6,
        mainnet: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        testnet: '0x0000000000000000000000000000000000000000', // No official testnet USDT
      },
      {
        symbol: 'USDC',
        decimals: 6,
        mainnet: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        testnet: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Arbitrum Sepolia USDC
      },
    ],
    fee: 'Low (~$0.10)',
    isEVM: true,
    enabled: true,
  },
  tron: {
    id: 'tron',
    name: 'Tron',
    displayName: 'Tron (TRC20)',
    icon: '🔷',
    chainId: {
      mainnet: 728126428, // Tron mainnet
      testnet: 2494104990, // Nile testnet
    },
    rpcUrl: {
      mainnet: 'https://api.trongrid.io',
      testnet: 'https://nile.trongrid.io',
    },
    blockExplorer: {
      mainnet: 'https://tronscan.org',
      testnet: 'https://nile.tronscan.org',
    },
    nativeCurrency: {
      name: 'Tronix',
      symbol: 'TRX',
      decimals: 6,
    },
    tokens: [
      {
        symbol: 'USDT',
        decimals: 6,
        mainnet: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        // testnet: 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj', // Nile USDT
        testnet: getUSDTAddressTron()
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
    icon: '🟣',
    chainId: {
      mainnet: 101,
      testnet: 102, // Devnet
    },
    rpcUrl: {
      mainnet: 'https://api.mainnet-beta.solana.com',
      testnet: 'https://api.devnet.solana.com',
    },
    blockExplorer: {
      mainnet: 'https://solscan.io',
      testnet: 'https://solscan.io?cluster=devnet',
    },
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
    tokens: [
      {
        symbol: 'USDC',
        decimals: 6,
        mainnet: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        testnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet USDC
      },
      {
        symbol: 'USDT',
        decimals: 6,
        mainnet: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        testnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Same as USDC for testing
      },
    ],
    fee: 'Extremely Low (~$0.001)',
    isEVM: false,
    enabled: true,
  },
};

// Get enabled chains for the checkout
export function getEnabledChains(): ChainConfig[] {
  return Object.values(CHAIN_CONFIGS).filter(chain => chain.enabled);
}

// Get chain config by ID
export function getChainConfig(chainId: SupportedChain): ChainConfig | undefined {
  return CHAIN_CONFIGS[chainId];
}

// Get the current chain ID based on network environment
export function getCurrentChainId(chain: SupportedChain): number {
  return CHAIN_CONFIGS[chain]?.chainId[NETWORK_ENV] ?? 0;
}

// Get the current RPC URL based on network environment
export function getCurrentRpcUrl(chain: SupportedChain): string {
  return CHAIN_CONFIGS[chain]?.rpcUrl[NETWORK_ENV] ?? '';
}

// Get the current block explorer based on network environment
export function getCurrentBlockExplorer(chain: SupportedChain): string {
  return CHAIN_CONFIGS[chain]?.blockExplorer[NETWORK_ENV] ?? '';
}

// Get token address for a chain and token symbol
export function getTokenAddress(chain: SupportedChain, token: TokenSymbol): string | undefined {
  const chainConfig = CHAIN_CONFIGS[chain];
  if (!chainConfig) return undefined;

  const tokenConfig = chainConfig.tokens.find(t => t.symbol === token);
  return tokenConfig?.[NETWORK_ENV];
}

// Get token decimals for a chain and token symbol
export function getTokenDecimals(chain: SupportedChain, token: TokenSymbol): number {
  const chainConfig = CHAIN_CONFIGS[chain];
  if (!chainConfig) return 6;

  const tokenConfig = chainConfig.tokens.find(t => t.symbol === token);
  return tokenConfig?.decimals ?? 6;
}

// Get available tokens for a chain
export function getAvailableTokens(chain: SupportedChain): TokenSymbol[] {
  const chainConfig = CHAIN_CONFIGS[chain];
  if (!chainConfig) return [];

  return chainConfig.tokens
    .filter(t => t[NETWORK_ENV] && t[NETWORK_ENV] !== '0x0000000000000000000000000000000000000000')
    .map(t => t.symbol);
}

// Get block explorer URL for a transaction
export function getExplorerTxUrl(chain: SupportedChain, txHash: string): string {
  const explorer = getCurrentBlockExplorer(chain);
  if (!explorer) return '#';

  switch (chain) {
    case 'tron':
      return `${explorer}/#/transaction/${txHash}`;
    case 'solana':
      return NETWORK_ENV === 'testnet'
        ? `${explorer}/tx/${txHash}?cluster=devnet`
        : `${explorer}/tx/${txHash}`;
    default:
      return `${explorer}/tx/${txHash}`;
  }
}

// Get hex chain ID for EVM wallet switching
export function getHexChainId(chain: SupportedChain): string {
  const chainId = getCurrentChainId(chain);
  return `0x${chainId.toString(16)}`;
}

// Check if we're on testnet
export function isTestnet(): boolean {
  return NETWORK_ENV === 'testnet';
}

// Wallet types mapping per chain
export type WalletType = 'metamask' | 'trustwallet' | 'phantom' | 'tronlink' | 'walletconnect';

export interface WalletConfig {
  type: WalletType;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export function getWalletsForChain(chain: SupportedChain): WalletConfig[] {
  const evmWallets: WalletConfig[] = [
    { type: 'metamask', name: 'MetaMask', icon: '🦊', color: 'bg-orange-500', description: 'Browser extension' },
    { type: 'trustwallet', name: 'Trust Wallet', icon: '🛡️', color: 'bg-blue-500', description: 'Mobile wallet' },
  ];

  switch (chain) {
    case 'ethereum':
    case 'base':
    case 'arbitrum':
      return evmWallets;
    case 'tron':
      return [
        { type: 'tronlink', name: 'TronLink', icon: '🔷', color: 'bg-red-500', description: 'Tron wallet' },
      ];
    case 'solana':
      return [
        { type: 'phantom', name: 'Phantom', icon: '👻', color: 'bg-purple-500', description: 'Solana wallet' },
      ];
    default:
      return [];
  }
}

// Merchant receiving addresses (configure these for your use case)
// In production, these would come from your backend API
export const MERCHANT_ADDRESSES: Record<SupportedChain, string> = {
  ethereum: '0x742d35Cc6634C0532925a3b844Bc9e7595f1e123',
  base: '0x742d35Cc6634C0532925a3b844Bc9e7595f1e123',
  arbitrum: '0x742d35Cc6634C0532925a3b844Bc9e7595f1e123',
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
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;
