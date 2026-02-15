// paymentHelper.ts
// Standardized payment helper functions for building and signing transactions
// Copied and adapted from frontend-v2.1

import { parseUnits, encodeFunctionData, Hash } from 'viem';
import { SupportedChain, TokenSymbol, getCurrentChainId } from '@/lib/chains-config';
import { getContractByName, ABIS } from '@/lib/contracts';
import { ethers } from 'ethers';

const ESCROW_ABI = ABIS.escrowManager;
const ERC20_ABI = ABIS.erc20;

/**
 * Payment transaction parameters
 */
export interface PaymentParams {
    chain: SupportedChain;
    tokenSymbol: TokenSymbol;
    amount: string;
    fromAddress: string;
    toAddress: string; // Usually your escrow contract
    reference: string; // Payment intent ID
    category: string;
}

/**
 * Main function: Build and sign payment transaction
 * This is chain-aware and token-aware
 */
export async function buildAndSignPayment(
    params: PaymentParams
): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const { chain, tokenSymbol, amount, fromAddress, toAddress, reference, category } = params;

    try {
        console.log('💳 Building payment transaction:', {
            chain,
            token: tokenSymbol,
            amount,
            from: fromAddress,
            to: toAddress,
        });

        // Step 1: Build the appropriate transaction for this chain/token
        const tx = await buildTransactionForChain(params);

        // Step 2: Check if token approval is needed (for ERC20)
        if (tokenSymbol !== 'native' as any && tokenSymbol !== 'ETH' as any) {
            const approved = await ensureTokenApproval(params);
            if (!approved) {
                return {
                    success: false,
                    error: 'Token approval rejected',
                };
            }
        }

        // Step 3: Sign and send the transaction
        const txHash = await signAndSendTransaction(tx, chain);

        if (!txHash) {
            return {
                success: false,
                error: 'User rejected transaction',
            };
        }

        console.log('✅ Transaction signed:', txHash);

        return {
            success: true,
            txHash,
        };
    } catch (error: any) {
        console.error('❌ Payment error:', error);
        return {
            success: false,
            error: error.message || 'Payment failed',
        };
    }
}

/**
 * Build transaction based on chain and token
 */
async function buildTransactionForChain(params: PaymentParams): Promise<any> {
    const { chain } = params;

    switch (chain) {
        case 'ethereum':
        case 'arbitrum':
        case 'base':
            return buildEVMTransaction(params);

        case 'tron':
            return buildTronTransaction(params);

        case 'solana':
            return buildSolanaTransaction(params);

        default:
            throw new Error(`Unsupported chain: ${chain}`);
    }
}

/**
 * Build EVM (Ethereum-compatible) transaction
 */
async function buildEVMTransaction(params: PaymentParams): Promise<any> {
    const { chain, tokenSymbol, amount, fromAddress, toAddress, reference, category } = params;

    const contractByChain = getContractByName(chain);
    const escrowAddress = contractByChain.escrowManager;

    console.log('Building EVM transaction:', {
        chain,
        tokenSymbol,
        amount,
        fromAddress,
        toAddress,
        reference,
        category,
    }, contractByChain);

    // Get token address
    let tokenAddress: string;
    let decimals: number;

    if (tokenSymbol === 'native' as any || tokenSymbol === 'ETH' as any) {
        // Native token transfer
        tokenAddress = '0x0000000000000000000000000000000000000000'; // Zero address for native
        decimals = 18;
    } else {
        // ERC20 token
        tokenAddress = tokenSymbol === 'USDT' ? contractByChain.usdt : contractByChain.usdc;
        decimals = 6; // USDT/USDC use 6 decimals
    }

    if (!tokenAddress) {
        throw new Error(`Token ${tokenSymbol} not found on ${chain}`);
    }

    // Convert amount to wei/smallest unit
    const amountInWei = parseUnits(amount, decimals);
    const paymentReferenceBytes = ethers.encodeBytes32String(reference);

    // Encode escrow creation call
    const data = encodeFunctionData({
        abi: ESCROW_ABI,
        functionName: 'createEscrow',
        args: [tokenAddress, amountInWei, paymentReferenceBytes, category],
    });

    // Build transaction object
    const tx: any = {
        from: fromAddress,
        to: escrowAddress,
        data,
    };

    // Add value if native token
    if (tokenSymbol === 'native' as any || tokenSymbol === 'ETH' as any) {
        tx.value = `0x${amountInWei.toString(16)}`;
    } else {
        tx.value = '0x0';
    }

    return tx;
}

/**
 * Build Tron transaction
 */
async function buildTronTransaction(params: PaymentParams): Promise<any> {
    const { tokenSymbol, amount, fromAddress, toAddress, reference, category } = params;

    if (!window.tronWeb || !window.tronWeb.ready) {
        throw new Error('TronLink not connected');
    }

    const tronWeb = window.tronWeb;
    const contractByChain = getContractByName('tron');

    if (tokenSymbol === 'native' as any) {
        // TRX transfer
        const amountSun = tronWeb.toSun(amount);

        // Build TRC20 escrow creation (pseudo-code, adjust to your contract)
        const contract = await tronWeb.contract().at(contractByChain.escrowManager);
        const tx = await contract.createEscrow(
            'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb', // TRX address (zero equivalent)
            amountSun,
            reference,
            category
        ).send({ from: fromAddress, callValue: amountSun });

        return tx;
    } else {
        // TRC20 token (USDT)
        const tokenAddress = tokenSymbol === 'USDT' ? contractByChain.usdt || 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' : contractByChain.usdc || '';
        const decimals = 6;
        const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, decimals)).toString();

        const contract = await tronWeb.contract().at(contractByChain.escrowManager);
        const tx = await contract.createEscrow(
            tokenAddress,
            amountInSmallestUnit,
            reference,
            category
        ).send({ from: fromAddress });

        return tx;
    }
}

/**
 * Build Solana transaction
 */
async function buildSolanaTransaction(params: PaymentParams): Promise<any> {
    // Solana implementation
    throw new Error('Solana not yet implemented');
}

/**
 * Ensure token approval for ERC20 transfers
 */
async function ensureTokenApproval(params: PaymentParams): Promise<boolean> {
    const { chain, tokenSymbol, amount, fromAddress } = params;

    if (tokenSymbol === 'native' as any || tokenSymbol === 'ETH' as any) {
        return true; // No approval needed for native tokens
    }

    const contractByChain = getContractByName(chain);
    const escrowAddress = contractByChain.escrowManager;
    const tokenAddress = tokenSymbol === 'USDT' ? contractByChain.usdt : contractByChain.usdc;
    const decimals = 6;
    const amountInWei = parseUnits(amount, decimals);

    console.log('🔍 Checking token approval...', {
        token: tokenSymbol,
        tokenAddress,
        spender: escrowAddress,
        amount,
    }, contractByChain, chain);

    try {
        // Check current allowance
        const currentAllowance = await checkAllowance(
            tokenAddress,
            fromAddress,
            escrowAddress,
            chain
        );

        console.log('Current allowance:', currentAllowance.toString());

        // If allowance is sufficient, no need to approve
        if (currentAllowance >= amountInWei) {
            console.log('✅ Sufficient allowance already exists');
            return true;
        }

        // Request approval
        console.log('📝 Requesting token approval...');
        const approved = await approveToken(
            tokenAddress,
            escrowAddress,
            amount,
            fromAddress,
            chain
        );

        if (!approved) {
            console.log('❌ User rejected approval');
            return false;
        }

        console.log('✅ Token approved successfully');

        // Wait for approval transaction to be mined
        await waitForTransactionConfirmation(approved, chain);

        return true;
    } catch (error) {
        console.error('❌ Approval check failed:', error);
        throw error;
    }
}

/**
 * Check ERC20 allowance
 */
async function checkAllowance(
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string,
    chain: SupportedChain
): Promise<bigint> {
    if (!window.ethereum) {
        throw new Error('Wallet not available');
    }

    try {
        const data = encodeFunctionData({
            abi: ERC20_ABI as any,
            functionName: 'allowance',
            args: [ownerAddress as `0x${string}`, spenderAddress as `0x${string}`],
        });

        const result = await window.ethereum.request({
            method: 'eth_call',
            params: [
                {
                    to: tokenAddress as `0x${string}`,
                    data,
                },
                'latest',
            ],
        });

        if (!result || result === '0x') {
            return BigInt(0);
        }

        return BigInt(result);
    } catch (error) {
        console.error('Check allowance error:', error);
        return BigInt(0);
    }
}

/**
 * Approve ERC20 token
 */
async function approveToken(
    tokenAddress: string,
    spenderAddress: string,
    amount: string,
    fromAddress: string,
    chain: SupportedChain
): Promise<string | null> {
    if (!window.ethereum) {
        throw new Error('Wallet not available');
    }

    try {
        const expectedChainId = getCurrentChainId(chain);
        const currentChainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(currentChainIdHex, 16);

        if (expectedChainId !== currentChainId) {
            throw new Error(`Wrong network: Wallet is on chain ${currentChainId}, but ${chain} (chain ${expectedChainId}) is required.`);
        }

        const decimals = 6;
        const amountInWei = parseUnits(amount, decimals);

        const data = encodeFunctionData({
            abi: ERC20_ABI as any,
            functionName: 'approve',
            args: [spenderAddress as `0x${string}`, amountInWei],
        });

        const tx = {
            from: fromAddress,
            to: tokenAddress,
            data,
            value: '0x0',
        };

        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [tx],
        });

        return txHash as string;
    } catch (error: any) {
        if (error.code === 4001) {
            // User rejected
            return null;
        }
        throw error;
    }
}

/**
 * Sign and send transaction (chain-aware)
 */
async function signAndSendTransaction(
    tx: any,
    chain: SupportedChain
): Promise<string | null> {
    console.log('✍️ Requesting signature for transaction...', {
        tx,
        chain
    });

    try {
        // For EVM chains
        if (['ethereum', 'arbitrum', 'base'].includes(chain)) {
            if (!window.ethereum) {
                throw new Error('Wallet not available');
            }

            const expectedChainId = getCurrentChainId(chain);
            const currentChainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
            const currentChainId = parseInt(currentChainIdHex, 16);

            if (expectedChainId !== currentChainId) {
                throw new Error(`Wrong network: Wallet is on chain ${currentChainId}, but ${chain} (chain ${expectedChainId}) is required.`);
            }

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [tx],
            });

            return txHash as string;
        }

        // For Tron
        if (chain === 'tron') {
            // Tron transactions are already sent in buildTronTransaction
            return tx; // tx is already the transaction hash
        }

        // For Solana
        if (chain === 'solana') {
            // Implement Solana signing
            throw new Error('Solana not yet implemented');
        }

        throw new Error(`Unsupported chain: ${chain}`);
    } catch (error: any) {
        // User rejected
        if (error.code === 4001 || error.message?.includes('User denied')) {
            console.log('❌ User rejected transaction');
            return null;
        }

        // Other errors
        console.error('❌ Transaction signing error:', error);
        throw error;
    }
}

/**
 * Wait for transaction confirmation
 */
async function waitForTransactionConfirmation(
    txHash: string,
    chain: SupportedChain,
    maxWaitSeconds: number = 60
): Promise<void> {
    console.log('⏳ Waiting for transaction confirmation...', txHash);

    const startTime = Date.now();
    const maxWaitMs = maxWaitSeconds * 1000;

    while (Date.now() - startTime < maxWaitMs) {
        try {
            const receipt = await window.ethereum.request({
                method: 'eth_getTransactionReceipt',
                params: [txHash],
            });

            if (receipt) {
                if (receipt.status === '0x1') {
                    console.log('✅ Transaction confirmed');
                    return;
                } else if (receipt.status === '0x0') {
                    throw new Error('Transaction failed on-chain');
                }
            }

            // Wait 2 seconds before checking again
            await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
            console.error('Error checking transaction:', error);
            throw error;
        }
    }

    throw new Error('Transaction confirmation timeout');
}

/**
 * Get token info (helper)
 */
export function getTokenInfo(
    chain: SupportedChain,
    tokenSymbol: TokenSymbol | 'ETH' | 'native'
): { address: string; decimals: number } {
    const contractByChain = getContractByName(chain as any);

    if (tokenSymbol === 'native' as any || tokenSymbol === 'ETH' as any) {
        return {
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18,
        };
    }

    const address = tokenSymbol === 'USDT' ? contractByChain.usdt || '' : contractByChain.usdc || '';

    return {
        address,
        decimals: 6,
    };
}

/**
 * TypeScript declarations for window objects
 */
declare global {
    interface Window {
        ethereum?: any;
        tronWeb?: any;
    }
}
