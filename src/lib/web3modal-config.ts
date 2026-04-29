import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, base, polygon, bsc, sepolia, arbitrumSepolia, baseSepolia, polygonAmoy, bscTestnet } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { QueryClient } from '@tanstack/react-query'
import { getEnabledChains, isTestnet, type SupportedChain } from './chains-config'

// 1. Get projectId from https://cloud.reown.com (formerly WalletConnect)
const projectId = import.meta.env.VITE_PUBLIC_WALLETCONNECT_PROJECT_ID || '3fbb6bba6f1de962d911bb5b5c9dba88'
const appUrl = import.meta.env.VITE_API_URL;

// 2. App metadata
const metadata = {
    name: "iSpend Checkout",
    description: "iSpend crypto payment widget",
    url: typeof window !== "undefined" ? window.location.origin : "https://ispend.ng",
    icons: ["https://avatars.githubusercontent.com/u/37784886"],
};


const ALL_EVM_NETWORKS = [
    mainnet,
    arbitrum,
    base,
    polygon,
    bsc,
    sepolia,
    arbitrumSepolia,
    baseSepolia,
    polygonAmoy,
    bscTestnet,
]

const APPKIT_NETWORKS_BY_CHAIN: Record<SupportedChain, { mainnet: any; testnet: any } | null> = {
    ethereum: { mainnet, testnet: sepolia },
    arbitrum: { mainnet: arbitrum, testnet: arbitrumSepolia },
    base: { mainnet: base, testnet: baseSepolia },
    polygon: { mainnet: polygon, testnet: polygonAmoy },
    bsc: { mainnet: bsc, testnet: bscTestnet },
    tron: null,
    solana: null,
}

function getConfiguredEvmNetworks() {
    const env = isTestnet() ? 'testnet' : 'mainnet'
    const networks = getEnabledChains()
        .filter((chain) => chain.isEVM)
        .map((chain) => APPKIT_NETWORKS_BY_CHAIN[chain.id]?.[env] ?? null)
        .filter(Boolean)

    return networks.length > 0 ? networks : [env === 'testnet' ? baseSepolia : base]
}

// 3. Create the Wagmi adapter with a safe EVM superset.
export const wagmiAdapter = new WagmiAdapter({
    networks: ALL_EVM_NETWORKS,
    projectId
})

let appKitInitialized = false

export function initializeAppKit() {
    if (!projectId || appKitInitialized) {
        return
    }

    createAppKit({
        adapters: [wagmiAdapter],
        networks: getConfiguredEvmNetworks(),
        metadata: metadata,
        projectId,
        features: {
            analytics: true,
        },
        themeMode: 'light',
        allWallets: 'SHOW',
    })

    appKitInitialized = true
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
})

declare module 'wagmi' {
    interface Register {
        config: typeof wagmiAdapter.wagmiConfig
    }
}
