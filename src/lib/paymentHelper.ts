// paymentHelper.ts
// Standardized payment helper functions for building and signing transactions
// Copied and adapted from frontend-v2.1

import { parseUnits, encodeFunctionData, Hash } from 'viem';
import { SupportedChain, TokenSymbol, getTokenDecimals, isEvmChain } from '@/lib/chains-config';
import { getContractByName, ABIS } from '@/lib/contracts';
import { ethers } from 'ethers';
import { getWalletClient, getPublicClient } from '@wagmi/core';
import { wagmiAdapter } from '@/lib/web3modal-config';

const ESCROW_ABI = ABIS.escrowManager;
const ERC20_ABI = ABIS.erc20;

/**
 * Get ethereum provider from wagmi or window
 * This works on both desktop and mobile browsers
 */
async function getEthereumProvider(): Promise<any> {
    try {
        // First, try to get wallet client from wagmi (works on mobile with WalletConnect)
        const walletClient = await getWalletClient(wagmiAdapter.wagmiConfig);

        if (walletClient) {
            // For wagmi/viem, we need to get the underlying provider from the account's connector
            const account = walletClient.account;
            if (account && walletClient.chain) {
                // Try to get provider from the connector
                const connector = wagmiAdapter.wagmiConfig.state.connections.get(wagmiAdapter.wagmiConfig.state.current || '');
                if (connector?.connector) {
                    const provider = await connector.connector.getProvider();
                    if (provider) {
                        console.log('✅ Using wagmi provider (mobile-compatible)');
                        return provider;
                    }
                }
            }
        }
    } catch (error) {
        console.log('Could not get wallet client from wagmi, falling back to window.ethereum:', error);
    }

    // Fallback to window.ethereum (works on desktop with injected wallets)
    const ethereum = (window as any).ethereum || (window as any).web3?.currentProvider;

    if (!ethereum) {
        throw new Error('Wallet not available. Please ensure your wallet is connected.');
    }

    console.log('✅ Using window.ethereum provider (desktop)');
    return ethereum;
}

/**
 * Payment transaction parameters
 */
export interface PaymentParams {
    chain: SupportedChain;
    tokenSymbol: TokenSymbol;
    amount: string;
    fromAddress: string;
    toAddress: string;
    reference: string; // Payment intent ID
    category: string;
    paymentMode?: 'escrow' | 'direct';
}

/**
 * Main function: Build and sign payment transaction
 * This is chain-aware and token-aware
 */
export async function buildAndSignPayment(
    params: PaymentParams
): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const { chain, tokenSymbol, amount, fromAddress, toAddress, reference, category, paymentMode = 'escrow' } = params;

    try {
        console.log('💳 Building payment transaction:', {
            chain,
            token: tokenSymbol,
            amount,
            from: fromAddress,
            to: toAddress,
            paymentMode,
        });

        // Step 1: Build the appropriate transaction for this chain/token
        const tx = await buildTransactionForChain(params);

        // Step 2: Check if token approval is needed (for ERC20)
        if (paymentMode === 'escrow' && tokenSymbol !== 'native' as any && tokenSymbol !== 'ETH' as any) {
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

    if (isEvmChain(chain)) {
        return buildEVMTransaction(params);
    }

    switch (chain) {
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
    const { chain, tokenSymbol, amount, fromAddress, toAddress, reference, category, paymentMode = 'escrow' } = params;

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
        decimals = getTokenDecimals(chain, tokenSymbol);
    }

    console.log("contract by chain>>>>>>:", contractByChain)

    if (!tokenAddress) {
        throw new Error(`Token ${tokenSymbol} not found on ${chain}`);
    }

    // Convert amount to wei/smallest unit
    const amountInWei = parseUnits(amount, decimals);
    const paymentReferenceBytes = ethers.encodeBytes32String(reference);

    let tx: any;
    if (paymentMode === 'direct') {
        if (tokenSymbol === 'native' as any || tokenSymbol === 'ETH' as any) {
            tx = {
                from: fromAddress,
                to: toAddress,
                value: `0x${amountInWei.toString(16)}`,
                data: '0x',
            };
        } else {
            const data = encodeFunctionData({
                abi: ERC20_ABI as any,
                functionName: 'transfer',
                args: [toAddress as `0x${string}`, amountInWei],
            });

            tx = {
                from: fromAddress,
                to: tokenAddress,
                data,
                value: '0x0',
            };
        }
    } else {
        // Encode escrow creation call
        const data = encodeFunctionData({
            abi: ESCROW_ABI,
            functionName: 'createEscrow',
            args: [tokenAddress, amountInWei, paymentReferenceBytes, category],
        });

        // Build transaction object
        tx = {
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
    }

    return tx;
}

/**
 * Build Tron transaction
 */
async function buildTronTransaction(params: PaymentParams): Promise<any> {
    const { tokenSymbol, amount, fromAddress, toAddress, reference, category, paymentMode = 'escrow' } = params;

    if (!window.tronWeb || !window.tronWeb.ready) {
        throw new Error('TronLink not connected');
    }

    const tronWeb = window.tronWeb;
    const contractByChain = getContractByName('tron');

    if (paymentMode === 'direct') {
        if (tokenSymbol === 'native' as any) {
            const amountSun = tronWeb.toSun(amount);
            const tx = await tronWeb.transactionBuilder.sendTrx(
                toAddress,
                amountSun,
                fromAddress
            );
            const signedTx = await tronWeb.trx.sign(tx);
            const result = await tronWeb.trx.sendRawTransaction(signedTx);
            return result.txid;
        }

        const tokenAddress = tokenSymbol === 'USDT' ? contractByChain.usdt || 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' : contractByChain.usdc || '';
        const decimals = getTokenDecimals('tron', tokenSymbol);
        const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, decimals)).toString();
        const tokenContract = await tronWeb.contract().at(tokenAddress);
        return await tokenContract.transfer(toAddress, amountInSmallestUnit).send({ from: fromAddress });
    }

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
        const decimals = getTokenDecimals('tron', tokenSymbol);
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
    const decimals = getTokenDecimals(chain, tokenSymbol);
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
            chain,
            tokenSymbol
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
    const ethereum = await getEthereumProvider();

    try {
        const data = encodeFunctionData({
            abi: ERC20_ABI as any,
            functionName: 'allowance',
            args: [ownerAddress as `0x${string}`, spenderAddress as `0x${string}`],
        });

        const result = await ethereum.request({
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
    chain: SupportedChain,
    tokenSymbol: TokenSymbol = 'USDT'
): Promise<string | null> {
    const ethereum = await getEthereumProvider();

    try {
        // Chain ID check removed - validated by UI component
        // const expectedChainId = getCurrentChainId(chain);
        // const currentChainIdHex = await ethereum.request({ method: 'eth_chainId' });
        // const currentChainId = currentChainIdHex[1] === 'x' ? parseInt(currentChainIdHex, 16) : currentChainIdHex; // parseInt(currentChainIdHex, 16);

        // if (expectedChainId !== currentChainId) {
        //     throw new Error(`Wrong network: Wallet is on chain ${currentChainId}, but ${chain} (chain ${expectedChainId}) is required.`);
        // }

        const decimals = getTokenDecimals(chain, tokenSymbol);
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

        const txHash = await ethereum.request({
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
        if (isEvmChain(chain)) {
            const ethereum = await getEthereumProvider();

            // Chain ID check removed - validated by UI component
            // const expectedChainId = getCurrentChainId(chain);
            // const currentChainIdHex = await ethereum.request({ method: 'eth_chainId' });
            // const currentChainId = parseInt(currentChainIdHex, 16);

            // if (expectedChainId !== currentChainId) {
            //     throw new Error(`Wrong network: Wallet is on chain ${currentChainId}, but ${chain} (chain ${expectedChainId}) is required.`);
            // }

            const txHash = await ethereum.request({
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

    const ethereum = await getEthereumProvider();

    const startTime = Date.now();
    const maxWaitMs = maxWaitSeconds * 1000;

    while (Date.now() - startTime < maxWaitMs) {
        try {
            const receipt = await ethereum.request({
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
        decimals: getTokenDecimals(chain, tokenSymbol as TokenSymbol),
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
