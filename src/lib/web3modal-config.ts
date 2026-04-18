import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, base, sepolia, arbitrumSepolia, baseSepolia } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { QueryClient } from '@tanstack/react-query'

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


// 3. Create the Wagmi adapter with ONLY supported networks
// Note: Testnet mode is controlled by NETWORK_ENV in chains-config.ts
export const wagmiAdapter = new WagmiAdapter({
    networks: [mainnet, arbitrum, base, sepolia, arbitrumSepolia, baseSepolia],
    projectId
})

// 4. Create AppKit modal with ONLY supported networks
if (projectId) {
    createAppKit({
        adapters: [wagmiAdapter],
        networks: [mainnet, arbitrum, base, sepolia, arbitrumSepolia, baseSepolia],
        metadata: metadata,
        projectId,
        features: {
            analytics: true,
        },
        themeMode: 'light',
        // CRITICAL: Only allow connections to our supported networks
        allWallets: 'SHOW', // Show all compatible wallets
    })
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
