
// Import from your compiled contracts
import EscrowManagerABI from '../abis/PaymentEscrow.json';
import ExpenseVerifierABI from '../abis/ExpenseVerifier.json';
import ERC20ABI from '../abis/IERC20.json';

export const TESTNET = true;

// ============================================
// Contract ABIs
// ============================================
export const ABIS = {
    escrowManager: EscrowManagerABI.abi,
    expenseVerifier: ExpenseVerifierABI.abi,
    erc20: ERC20ABI.abi
};


// USDT and USDC addresses on Arbitrum
const USDT_ADDRESS = '0x936FC3bb38AD2343E532cC4D57A8f36220ab3691' as const;
const USDC_ADDRESS = '0x1Bd26C065Ea2980323b1cD99e9C43Ab98851f51F' as const;

const USDC_ADDRESS_BASE = '0x936FC3bb38AD2343E532cC4D57A8f36220ab3691' as const;
const USDT_ADDRESS_BASE = '0x656bCAB335B667E1EA81c755A2C2736688628d24' as const;

const USDT_ADDRESS_ETHEREUM = '0xf977672Bd2f19Dc29bdECF2a45cFa4464DE9eDA9'; // '0xe8968336227b1c9DC70ed5B7E1ee063D56cBb8bc' as const;
const USDC_ADDRESS_ETHEREUM = '0xfeaE0B31C912C9Bf8480CF95D17AEfb1E2920fC3'; // '0x338A37fbB6194c8f66c8556f038C09C6bEEaCA0D' as const;

export const USDT_ADDRESS_TRON = 'TCZwWvyc9gMBJb9eKfy2Tk1J54c2zsHFqs' as const;
export const USDC_ADDRESS_TRON = 'TBRaHMt26uEw7Bf31EkNCyfjnjRSZHzGgN' as const;

export function getUSDTContractAddress(chainId: number) {
    if (chainId === 421614) {
        return USDT_ADDRESS;
    } else if (chainId === 84532) {
        return USDT_ADDRESS_BASE;
    } else if (chainId === 123) {
        return USDT_ADDRESS_TRON;
    } else if (chainId === 11155111) {
        return USDT_ADDRESS_ETHEREUM;
    } else {
        return USDT_ADDRESS;
    }
}

export function getUSDCContractAddress(chainId: number) {
    if (chainId === 421614) {
        return USDC_ADDRESS;
    } else if (chainId === 84532) {
        return USDC_ADDRESS_BASE;
    } else if (chainId === 123) {
        return USDC_ADDRESS_TRON;
    } else if (chainId === 11155111) {
        return USDC_ADDRESS_ETHEREUM;
    } else {
        return USDC_ADDRESS;
    }
}


export function getContractByNameOld(name: 'ethereum' | 'arbitrum' | 'base' | 'tron' | 'solana') {
    switch (name) {
        case 'arbitrum':
            if (TESTNET && name === 'arbitrum') {
                return {
                    chainId: 421614,
                    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
                    escrowManager: '0xF09DaDf498C01af003Ed6592039932163f124DDf', // Your deployed address
                    expenseVerifier: '0x41385204bab6F049CA8D34C088e7f98EA1F6A77B',
                    // usdt: '0x30fA2FbE15c1EaDfbEF28C188b7B8dbd3c1Ff2eB', // Testnet USDT
                    // usdc: '0xf3C3351D6Bd0098EEb33ca8f830FAf2a141Ea2E1'  // Testnet USDC
                    usdt: USDT_ADDRESS, // Testnet USDT
                    usdc: USDC_ADDRESS // Testnet USDC
                }
            } else {
                return {
                    chainId: 42161,
                    rpcUrl: 'https://arb1.arbitrum.io/rpc',
                    escrowManager: '0xF09DaDf498C01af003Ed6592039932163f124DDf', // Your deployed address
                    expenseVerifier: '0x41385204bab6F049CA8D34C088e7f98EA1F6A77B',
                    usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
                    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
                }
            }
        case 'base':
            if (TESTNET && name === 'base') {
                return {
                    chainId: 84531,
                    rpcUrl: 'https://base-sepolia.g.alchemy.com/v2/your-api-key',
                    escrowManager: '0xF09DaDf498C01af003Ed6592039932163f124DDf', // Your deployed address
                    expenseVerifier: '0x41385204bab6F049CA8D34C088e7f98EA1F6A77B',
                    usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
                    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
                }
            } else {
                return {
                    chainId: 8453,
                    rpcUrl: 'https://base.g.alchemy.com/v2/your-api-key',
                    escrowManager: '0xF09DaDf498C01af003Ed6592039932163f124DDf', // Your deployed address
                    expenseVerifier: '0x41385204bab6F049CA8D34C088e7f98EA1F6A77B',
                    usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
                    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
                }
            }
        case 'tron':
            if (TESTNET && name === 'tron') {
                return {
                    chainId: 84531,
                    rpcUrl: 'https://base-sepolia.g.alchemy.com/v2/your-api-key',
                    escrowManager: '0xF09DaDf498C01af003Ed6592039932163f124DDf', // Your deployed address
                    expenseVerifier: '0x41385204bab6F049CA8D34C088e7f98EA1F6A77B',
                    usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
                    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
                }
            } else {
                return {
                    chainId: 8453,
                    rpcUrl: 'https://base.g.alchemy.com/v2/your-api-key',
                    escrowManager: '0xF09DaDf498C01af003Ed6592039932163f124DDf', // Your deployed address
                    expenseVerifier: '0x41385204bab6F049CA8D34C088e7f98EA1F6A77B',
                    usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
                    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
                }
            }
    }
}

export function getContractByName(name: 'ethereum' | 'arbitrum' | 'base' | 'tron' | 'solana') {
    switch (name) {
        case 'arbitrum':
            if (TESTNET && name === 'arbitrum') {
                return {
                    chainId: 421614,
                    chainName: 'Arbitrum Sepolia',
                    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
                    escrowManager: '0xF09DaDf498C01af003Ed6592039932163f124DDf', // Your deployed address
                    expenseVerifier: '0x41385204bab6F049CA8D34C088e7f98EA1F6A77B',
                    // usdt: '0x30fA2FbE15c1EaDfbEF28C188b7B8dbd3c1Ff2eB', // Testnet USDT
                    // usdc: '0xf3C3351D6Bd0098EEb33ca8f830FAf2a141Ea2E1'  // Testnet USDC
                    usdt: USDT_ADDRESS, // Testnet USDT
                    usdc: USDC_ADDRESS, // Testnet USDC
                    blockExplorer: 'https://arbiscan.io',
                    symbol: 'ETH',
                }
            } else {
                return {
                    chainId: 42161,
                    chainName: 'Arbitrum One',
                    rpcUrl: 'https://arb1.arbitrum.io/rpc',
                    escrowManager: '0xF09DaDf498C01af003Ed6592039932163f124DDf', // Your deployed address
                    expenseVerifier: '0x41385204bab6F049CA8D34C088e7f98EA1F6A77B',
                    usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
                    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
                    blockExplorer: 'https://arbiscan.io',
                    symbol: 'ETH',
                }
            }
        case 'base':
            if (TESTNET && name === 'base') {
                return {
                    chainId: 84532,
                    chainName: 'Base Sepolia',
                    rpcUrl: 'https://sepolia.base.org',
                    escrowManager: '0xf09dadf498c01af003ed6592039932163f124ddf', // Your deployed address
                    expenseVerifier: '0x41385204bab6f049ca8d34c088e7f98ea1f6a77b',
                    usdt: USDT_ADDRESS_BASE,
                    usdc: USDC_ADDRESS_BASE,
                    blockExplorer: 'https://basescan.org',
                    symbol: 'ETH',
                }
            } else {
                return {
                    chainId: 8453,
                    chainName: 'Base',
                    rpcUrl: 'https://base.g.alchemy.com/v2/your-api-key',
                    escrowManager: '0xF09DaDf498C01af003Ed6592039932163f124DDf', // Your deployed address
                    expenseVerifier: '0x41385204bab6F049CA8D34C088e7f98EA1F6A77B',
                    usdt: USDT_ADDRESS_BASE,
                    usdc: USDC_ADDRESS_BASE,
                    blockExplorer: 'https://basescan.org',
                    symbol: 'ETH',
                }
            }
        case 'tron':
            if (TESTNET && name === 'tron') {
                return {
                    chainId: 2494104990,
                    chainName: 'Tron',
                    rpcUrl: 'https://nile.trongrid.io',
                    escrowManager: 'TWKLegNH41NRzPJ3wH7StZd3XXMK7XHVAr', // '0xF09DaDf498C01af003Ed6592039932163f124DDf', // Your deployed address
                    expenseVerifier: 'TGwF3UGReLfuPzfoKrqHMKgcuGksVY9gZC', // '0x41385204bab6F049CA8D34C088e7f98EA1F6A77B',
                    usdt: USDT_ADDRESS_TRON,
                    usdc: USDC_ADDRESS_TRON,
                    blockExplorer: 'https://nile.tronscan.org',
                    symbol: 'ETH',
                }
            } else {
                return {
                    chainId: 728126428,
                    chainName: 'Tron',
                    rpcUrl: 'https://api.trongrid.io',
                    escrowManager: '0xF09DaDf498C01af003Ed6592039932163f124DDf', // Your deployed address
                    expenseVerifier: '0x41385204bab6F049CA8D34C088e7f98EA1F6A77B',
                    usdt: USDT_ADDRESS_TRON,
                    usdc: USDC_ADDRESS_TRON,
                    blockExplorer: 'https://tronscan.org',
                    symbol: 'ETH',
                }
            }
        default: // Ethereum
            if (TESTNET) {
                return {
                    chainId: 11155111,
                    chainName: 'Ethereum Sepolia',
                    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/xuGicBKWDL0XfSUXlfVJx',
                    escrowManager: '0x0f2a882947c86abe554d820bee90bf3e25c108f8', // Your deployed address
                    expenseVerifier: '0xfb68f4db7aaab7684dccbfcd8d8465d41905aa65',
                    usdt: USDT_ADDRESS_ETHEREUM,
                    usdc: USDC_ADDRESS_ETHEREUM,
                    blockExplorer: 'https://sepolia.etherscan.io',
                    symbol: 'ETH',
                }
            } else {
                return {
                    chainId: 1,
                    chainName: 'Ethereum',
                    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
                    escrowManager: '0xF09DaDf498C01af003Ed6592039932163f124DDf', // Your deployed address
                    expenseVerifier: '0x41385204bab6F049CA8D34C088e7f98EA1F6A77B',
                    usdt: USDT_ADDRESS_ETHEREUM,
                    usdc: USDC_ADDRESS_ETHEREUM,
                    blockExplorer: 'https://etherscan.io',
                    symbol: 'ETH',
                }
            }
    }
}


// ============================================
// Contract Configuration
// ============================================
export const CONTRACTS = {
    arbitrum: {
        chainId: 42161,
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        escrowManager: '0xF09DaDf498C01af003Ed6592039932163f124DDf', // Your deployed address
        expenseVerifier: '0x41385204bab6F049CA8D34C088e7f98EA1F6A77B',
        usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
    },
    arbitrumSepolia: {
        chainId: 421614,
        rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
        escrowManager: '0xF09DaDf498C01af003Ed6592039932163f124DDf', // Your deployed address
        expenseVerifier: '0x41385204bab6F049CA8D34C088e7f98EA1F6A77B',
        // usdt: '0x30fA2FbE15c1EaDfbEF28C188b7B8dbd3c1Ff2eB', // Testnet USDT
        // usdc: '0xf3C3351D6Bd0098EEb33ca8f830FAf2a141Ea2E1'  // Testnet USDC
        usdt: USDT_ADDRESS, // Testnet USDT
        usdc: USDC_ADDRESS // Testnet USDC
    }
};