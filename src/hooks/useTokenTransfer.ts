import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { parseUnits } from 'viem';
import { 
  SupportedChain,
  TokenSymbol,
  MERCHANT_ADDRESSES, 
  getTokenAddress,
  getTokenDecimals,
  getExplorerTxUrl,
  getCurrentRpcUrl,
  isEvmChain,
} from '@/lib/chains-config';

interface TransferState {
  isTransferring: boolean;
  txHash: string | null;
  error: string | null;
  status: 'idle' | 'pending' | 'confirming' | 'success' | 'failed';
}

interface UseTokenTransferReturn extends TransferState {
  transferToken: (chain: SupportedChain, token: TokenSymbol, amount: string, merchantAddress?: string) => Promise<string | null>;
  reset: () => void;
  getExplorerUrl: (chain: SupportedChain, hash: string) => string;
}

export function useTokenTransfer(): UseTokenTransferReturn {
  const [state, setState] = useState<TransferState>({
    isTransferring: false,
    txHash: null,
    error: null,
    status: 'idle',
  });

  // Parse token amount with correct decimals
  const parseTokenAmount = (amount: string, chain: SupportedChain, token: TokenSymbol): bigint => {
    const decimals = getTokenDecimals(chain, token);
    return parseUnits(amount, decimals);
  };

  // Transfer on EVM chains (Ethereum, Base, Arbitrum)
  const transferEVM = useCallback(async (
    chain: SupportedChain,
    token: TokenSymbol,
    amount: string,
    merchantAddress: string
  ): Promise<string> => {
    const ethereum = window.ethereum;
    if (!ethereum) {
      throw new Error('No wallet detected');
    }

    const tokenAddress = getTokenAddress(chain, token);
    if (!tokenAddress) {
      throw new Error(`${token} not available on ${chain}`);
    }

    const parsedAmount = parseTokenAmount(amount, chain, token);

    // Encode the transfer function call (ERC20 transfer)
    const transferData = `0xa9059cbb${merchantAddress.slice(2).padStart(64, '0')}${parsedAmount.toString(16).padStart(64, '0')}`;

    const accounts = await ethereum.request({ method: 'eth_accounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('No connected account');
    }

    // Send the transaction
    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: accounts[0],
        to: tokenAddress,
        data: transferData,
      }],
    });

    return txHash;
  }, []);

  // Transfer on Tron (TRC20)
  const transferTron = useCallback(async (
    token: TokenSymbol,
    amount: string,
    merchantAddress: string
  ): Promise<string> => {
    const tronWeb = (window as any).tronWeb;
    if (!tronWeb) {
      throw new Error('TronLink not detected');
    }

    const tokenAddress = getTokenAddress('tron', token);
    if (!tokenAddress) {
      throw new Error(`${token} not available on Tron`);
    }

    const parsedAmount = parseTokenAmount(amount, 'tron', token);

    // Create the contract instance
    const contract = await tronWeb.contract().at(tokenAddress);
    
    // Call the transfer function
    const result = await contract.transfer(merchantAddress, parsedAmount.toString()).send({
      feeLimit: 100_000_000, // 100 TRX fee limit
      callValue: 0,
      shouldPollResponse: false,
    });

    return result;
  }, []);

  // Transfer on Solana (SPL Token)
  const transferSolana = useCallback(async (
    token: TokenSymbol,
    amount: string,
    merchantAddress: string
  ): Promise<string> => {
    const solana = (window as any).solana;
    if (!solana || !solana.isPhantom) {
      throw new Error('Phantom wallet not detected');
    }

    const tokenAddress = getTokenAddress('solana', token);
    if (!tokenAddress) {
      throw new Error(`${token} not available on Solana`);
    }

    // Import required modules dynamically
    const { Connection, PublicKey, Transaction } = await import('@solana/web3.js');
    const { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } = await import('@solana/spl-token');
    
    const rpcUrl = getCurrentRpcUrl('solana');
    const connection = new Connection(rpcUrl, 'confirmed');
    const tokenMint = new PublicKey(tokenAddress);
    const fromPubkey = new PublicKey(solana.publicKey.toString());
    const toPubkey = new PublicKey(merchantAddress);
    
    // Get associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(tokenMint, fromPubkey);
    const toTokenAccount = await getAssociatedTokenAddress(tokenMint, toPubkey);
    
    const parsedAmount = parseTokenAmount(amount, 'solana', token);
    
    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPubkey,
      BigInt(parsedAmount.toString()),
      [],
      TOKEN_PROGRAM_ID
    );
    
    // Create and sign transaction
    const transaction = new Transaction().add(transferInstruction);
    transaction.feePayer = fromPubkey;
    
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    
    // Sign with Phantom
    const signedTransaction = await solana.signTransaction(transaction);
    
    // Send transaction
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    
    return signature;
  }, []);

  // Main transfer function
  const transferToken = useCallback(async (
    chain: SupportedChain,
    token: TokenSymbol,
    amount: string,
    merchantAddress?: string
  ): Promise<string | null> => {
    const toAddress = merchantAddress || MERCHANT_ADDRESSES[chain];
    
    if (!toAddress) {
      toast.error('Invalid merchant address');
      return null;
    }

    setState({
      isTransferring: true,
      txHash: null,
      error: null,
      status: 'pending',
    });

    try {
      let txHash: string;

      toast.info('Please confirm the transaction in your wallet...');

      switch (chain) {
        case 'ethereum':
        case 'base':
        case 'arbitrum':
        case 'bsc':
        case 'polygon':
          txHash = await transferEVM(chain, token, amount, toAddress);
          break;
        case 'tron':
          txHash = await transferTron(token, amount, toAddress);
          break;
        case 'solana':
          txHash = await transferSolana(token, amount, toAddress);
          break;
        default:
          if (isEvmChain(chain)) {
            txHash = await transferEVM(chain, token, amount, toAddress);
            break;
          }
          throw new Error(`Unsupported chain: ${chain}`);
      }

      setState({
        isTransferring: false,
        txHash,
        error: null,
        status: 'success',
      });

      toast.success('Transaction submitted successfully!');
      return txHash;

    } catch (error: any) {
      console.error('Transfer error:', error);
      
      let errorMessage = 'Transaction failed';
      
      if (error.code === 4001 || error.message?.includes('rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message?.includes('insufficient')) {
        errorMessage = 'Insufficient token balance';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState({
        isTransferring: false,
        txHash: null,
        error: errorMessage,
        status: 'failed',
      });

      toast.error(errorMessage);
      return null;
    }
  }, [transferEVM, transferTron, transferSolana]);

  const reset = useCallback(() => {
    setState({
      isTransferring: false,
      txHash: null,
      error: null,
      status: 'idle',
    });
  }, []);

  const getExplorerUrlFn = useCallback((chain: SupportedChain, hash: string) => {
    return getExplorerTxUrl(chain, hash);
  }, []);

  return {
    ...state,
    transferToken,
    reset,
    getExplorerUrl: getExplorerUrlFn,
  };
}
