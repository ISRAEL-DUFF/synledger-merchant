// ============================================
// Hook: useEscrow.ts - Escrow Operations
// ============================================

import { useState } from 'react';
import { ethers } from 'ethers';
import { useContract } from './useContract';
import { CONTRACTS, ABIS, getContractByName } from '../lib/contracts';
import { getTokenDecimals } from '../lib/chains-config';
import type { SupportedChain, TokenSymbol } from '../lib/chains-config';

declare global {
    interface Window {
        tronWeb: any;
    }
}

export function useEscrow() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const escrowManagerResp = useContract('escrowManager');
    const { writeContractFunc } = escrowManagerResp;

    /**
     * Create escrow - User calls this first
     */
    const createEscrow = async (
        token: string,
        amount: string, // In token decimals (e.g., "35.21" for USDT)
        paymentId: string, // From backend
        category: string,
        chain: SupportedChain = 'base',
        tokenSymbol: TokenSymbol = 'USDT'
    ) => {
        setLoading(true);
        setError(null);

        try {
            // ============================================
            // TRON IMPLEMENTATION
            // ============================================
            if (chain === 'tron') {
                if (!window.tronWeb || !window.tronWeb.ready) {
                    throw new Error('TronLink not installed or not ready');
                }

                const tronContractConfig = getContractByName('tron');
                const escrowAddress = tronContractConfig.escrowManager;

                // 1. Convert amount (use chain-aware decimals)
                // Note: TronWeb handles big numbers, but we pass integer string
                const tronDecimals = getTokenDecimals('tron', tokenSymbol);
                const amountMul = parseFloat(amount) * (10 ** tronDecimals);
                const amountInt = Math.floor(amountMul).toString();

                // 2. Approve Token
                const tokenContract = await window.tronWeb.contract().at(token);
                console.log(`Approving ${amountInt} for ${escrowAddress} on Tron...`);
                await tokenContract.approve(escrowAddress, amountInt).send();
                console.log('Approval sent');

                // 3. Create Escrow
                const abi = ABIS['escrowManager'];
                const escrowContract = await window.tronWeb.contract(abi, escrowAddress) //.at(escrowAddress);

                // Convert paymentId to bytes32 hex string for Tron
                // ethers.encodeBytes32String returns 0x..., Tron might want just hex or 0x is fine
                const paymentIdBytes = ethers.encodeBytes32String(paymentId);

                console.log('Creating escrow on Tron...', {
                    token,
                    amount: amountInt,
                    paymentId: paymentIdBytes,
                    category
                });

                const txId = await escrowContract.createEscrow(
                    token,
                    amountInt,
                    paymentIdBytes,
                    category
                ).send();

                console.log('Transaction sent:', txId);

                // Wait for confirmation logic could be added here (polling getTransactionInfo)
                // For now we return the txId

                // Poll for result
                let receipt = null;
                let retries = 0;
                let escrowId = null;

                while (!receipt && retries < 20) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    receipt = await window.tronWeb.trx.getTransactionInfo(txId);
                    if (receipt && Object.keys(receipt).length === 0) receipt = null; // empty object means not found yet
                    retries++;
                }

                if (!receipt) {
                    console.warn('Transaction confirmation timed out, but likely successful');
                } else {
                    console.log('Transaction confirmed:', receipt);

                    const events = await window.tronWeb.getEventByTransactionID(txId);
                    console.log('Events:', events);

                    // Extract escrowId from event logs
                    // parse escrowId from logs if possible, else return null (backend indexer will catch it)
                    // Tron logs are in receipt.log
                    // Parsing tron logs is complex without ABI decoder, but we index on backend
                    const escrowCreatedEvent = events.data.find(
                        (log: any) => log.event_name === 'EscrowCreated'
                    );

                    escrowId = escrowCreatedEvent?.result?.escrowId; // First argument is escrowId
                }

                if (receipt.receipt.result === 'REVERT' || receipt.result === 'FAILED') {
                    throw new Error('Transaction failed');
                }

                setLoading(false);
                return {
                    success: true,
                    txHash: txId,
                    escrowId: escrowId,
                    receipt
                };
            }

            // ============================================
            // EVM IMPLEMENTATION (Arbitrum, Base, etc.)
            // ============================================

            const escrow = await writeContractFunc();
            if (!escrow) throw new Error('Wallet not connected');

            // Convert amount to wei using chain-aware decimals
            const amountWei = ethers.parseUnits(amount, getTokenDecimals(chain, tokenSymbol));

            // Convert paymentId to bytes32
            const paymentIdBytes = ethers.encodeBytes32String(paymentId);

            // First approve token if needed
            await approveToken(token, amountWei.toString());

            // Create escrow
            const tx = await escrow.createEscrow(
                token,
                amountWei,
                paymentIdBytes,
                category
            );

            console.log('Transaction sent:', tx.hash);

            // Wait for confirmation
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);

            // Extract escrowId from event logs
            const escrowCreatedEvent = receipt.logs.find(
                (log: any) => log.fragment?.name === 'EscrowCreated'
            );

            const escrowId = escrowCreatedEvent?.args?.[0]; // First argument is escrowId

            setLoading(false);
            return {
                success: true,
                txHash: tx.hash,
                escrowId: escrowId,
                receipt
            };
        } catch (err: any) {
            console.error('Escrow creation failed:', err);
            setError(err.message || 'Transaction failed');
            setLoading(false);
            throw err;
        }
    };

    /**
     * Approve token spending
     */
    const approveToken = async (tokenAddress: string, amount: string) => {
        if (typeof window === 'undefined' || !window.ethereum) {
            throw new Error('Wallet not connected');
        }
        const escrow = await writeContractFunc();
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const signer = await provider.getSigner();
        const token = new ethers.Contract(tokenAddress, ABIS.erc20, signer);

        // Check current allowance
        const currentAllowance = await token.allowance(
            await signer.getAddress(),
            escrow.target
        );

        if (currentAllowance < BigInt(amount)) {
            console.log('Approving token...');
            const approveTx = await token.approve(escrow.target, amount);
            await approveTx.wait();
            console.log('Token approved');
        }
    };

    /**
     * Get escrow details
     */
    const getEscrow = async (escrowId: string, chain: SupportedChain = 'base', tokenSymbol: TokenSymbol = 'USDT') => {
        const escrow = await writeContractFunc();
        if (!escrow) throw new Error('Contract not initialized');

        try {
            const escrowData = await escrow.getEscrow(escrowId);

            return {
                user: escrowData.user,
                token: escrowData.token,
                amount: ethers.formatUnits(escrowData.amount, getTokenDecimals(chain, tokenSymbol)),
                createdAt: new Date(Number(escrowData.createdAt) * 1000),
                timeoutAt: new Date(Number(escrowData.timeoutAt) * 1000),
                paymentId: escrowData.paymentId,
                status: ['Active', 'Released', 'Refunded', 'Expired'][escrowData.status],
                category: escrowData.category
            };
        } catch (err) {
            console.error('Failed to get escrow:', err);
            throw err;
        }
    };

    /**
     * Get user's escrows
     */
    const getUserEscrows = async (userAddress: string) => {
        const escrow = await writeContractFunc();
        if (!escrow) throw new Error('Contract not initialized');

        try {
            const escrowIds = await escrow.getUserEscrows(userAddress);

            // Fetch details for each escrow
            const escrows = await Promise.all(
                escrowIds.map((id: string) => getEscrow(id))
            );

            return escrows;
        } catch (err) {
            console.error('Failed to get user escrows:', err);
            throw err;
        }
    };

    /**
     * Check if escrow has expired (client-side check)
     */
    const isEscrowExpired = async (escrowId: string) => {
        const escrow = await writeContractFunc();
        const escrowData = await getEscrow(escrowId);
        return escrowData.timeoutAt < new Date();
    };

    return {
        createEscrow,
        getEscrow,
        getUserEscrows,
        isEscrowExpired,
        loading,
        error
    };
}
