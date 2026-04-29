// ============================================
// Hook: useContract.ts - Contract Hook
// ============================================

import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useWalletClient, usePublicClient } from 'wagmi';
import { CONTRACTS, ABIS, getContractByName } from '../lib/contracts';
import type { SupportedChain } from '../lib/chains-config';

export function useContract(contractName: 'escrowManager' | 'expenseVerifier', chain: SupportedChain = 'base') {
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();

    return useMemo(() => {
        // const chain = chainId === 42161 ? 'arbitrum' : 'arbitrumSepolia';
        const contractInfo = getContractByName(chain);
        const address = contractInfo[contractName]; // CONTRACTS[chain][contractName];
        const abi = ABIS[contractName];

        if (!address) {
            throw new Error(`Contract ${contractName} not found for chain ${chain}`);
        }

        // Read-only contract (for queries)
        const readContract = new ethers.Contract(
            address,
            abi,
            new ethers.JsonRpcProvider(contractInfo.rpcUrl)
        );

        // Write contract (for transactions) - needs signer
        let writeContractFunc: Function | undefined;
        if (walletClient || (typeof window !== 'undefined' && window.ethereum)) {
            writeContractFunc = async function () {
                if (typeof window === 'undefined' || !window.ethereum) {
                    throw new Error('Wallet not connected. Please connect your wallet first.');
                }
                const provider = new ethers.BrowserProvider(window.ethereum as any);
                const signer = await provider.getSigner();
                const contract = new ethers.Contract(address, abi, signer);
                return contract;
            };
        }

        return {
            address,
            readContract,
            writeContractFunc,
            abi
        };
    }, [contractName, chain, walletClient]);
}
