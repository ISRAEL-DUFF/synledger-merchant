
// Import from your compiled contracts
import EscrowManagerABI from '../abis/PaymentEscrow.json';
import ExpenseVerifierABI from '../abis/ExpenseVerifier.json';
import ERC20ABI from '../abis/IERC20.json';
import { getAppConfigSync, getChainConfigSync, type ChainConfigEntry } from './appConfig';

// ============================================
// Contract ABIs (remain on frontend — static JSON)
// ============================================
export const ABIS = {
    escrowManager: EscrowManagerABI.abi,
    expenseVerifier: ExpenseVerifierABI.abi,
    erc20: ERC20ABI.abi
};

// ============================================
// Helpers to fetch token addresses from backend config
// ============================================

export function getUSDTContractAddress(chainId: number): string {
    const config = getAppConfigSync();
    if (!config) {
        console.warn('App config not loaded yet, returning empty USDT address');
        return '';
    }
    const chain = Object.values(config.chains).find(c => c.chainId === chainId);
    return chain?.usdt || '';
}

export function getUSDCContractAddress(chainId: number): string {
    const config = getAppConfigSync();
    if (!config) {
        console.warn('App config not loaded yet, returning empty USDC address');
        return '';
    }
    const chain = Object.values(config.chains).find(c => c.chainId === chainId);
    return chain?.usdc || '';
}

// Tron exports (used by chains-config.ts)
export function getUSDTAddressTron(): string {
    return getChainConfigSync('tron')?.usdt || '';
}

export function getUSDCAddressTron(): string {
    return getChainConfigSync('tron')?.usdc || '';
}


export function getContractByName(name: 'ethereum' | 'arbitrum' | 'base' | 'tron' | 'solana') {
    const chainConfig = getChainConfigSync(name);

    if (!chainConfig) {
        console.warn(`Chain config for "${name}" not loaded yet, returning fallback`);
        // Minimal fallback so callers don't crash during initial load
        return {
            chainId: 0,
            chainName: name,
            rpcUrl: '',
            escrowManager: '',
            expenseVerifier: '',
            usdt: '',
            usdc: '',
            blockExplorer: '',
            symbol: 'ETH',
        };
    }

    return {
        chainId: chainConfig.chainId,
        chainName: chainConfig.chainName,
        rpcUrl: chainConfig.rpcUrl || '',
        escrowManager: chainConfig.escrowManager || '',
        expenseVerifier: chainConfig.expenseVerifier || '',
        usdt: chainConfig.usdt || '',
        usdc: chainConfig.usdc || '',
        blockExplorer: chainConfig.blockExplorer || '',
        symbol: chainConfig.symbol,
    };
}


// ============================================
// Legacy Contract Configuration (for backwards compatibility)
// ============================================
export const CONTRACTS = {
    get arbitrum() {
        return getContractByName('arbitrum');
    },
    get arbitrumSepolia() {
        return getContractByName('arbitrum');
    },
};