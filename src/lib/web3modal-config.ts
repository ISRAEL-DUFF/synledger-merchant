import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, base, sepolia, arbitrumSepolia, baseSepolia, bscTestnet } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { QueryClient } from '@tanstack/react-query'

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_PUBLIC_WALLETCONNECT_PROJECT_ID || '3fbb6bba6f1de962d911bb5b5c9dba88'
const appUrl = import.meta.env.VITE_API_URL;

// 2. Create wagmiConfig
const metadata = {
    name: "iSpend Checkout",
    description: "iSpend crypto payment widget",
    url: typeof window !== "undefined" ? window.location.origin : "https://ispend.ng",
    icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

const chains = [mainnet, arbitrum, base, sepolia, arbitrumSepolia, baseSepolia, bscTestnet];

// Create the Wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
    networks: chains,
    projectId
})

// 3. Create modal
if (projectId) {
    createAppKit({
        adapters: [wagmiAdapter],
        networks: [mainnet, arbitrum, base, sepolia, arbitrumSepolia, baseSepolia, bscTestnet],
        metadata: metadata,
        projectId,
        features: {
            analytics: true,
        },
        themeMode: 'light',
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
