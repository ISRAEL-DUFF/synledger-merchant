import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  SupportedChain,
  WalletType,
  getChainConfig,
  getCurrentChainId,
  getCurrentRpcUrl,
  getCurrentBlockExplorer,
  getHexChainId,
} from '@/lib/chains-config';

// Re-export types for convenience
export type { WalletType, SupportedChain };
export type ChainType = SupportedChain;

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  walletType: WalletType | null;
  isConnecting: boolean;
  error: string | null;
}

interface UseWalletReturn extends WalletState {
  connect: (walletType: WalletType, targetChain: SupportedChain) => Promise<boolean>;
  disconnect: () => void;
  switchChain: (chain: SupportedChain) => Promise<boolean>;
}

export function useWallet(): UseWalletReturn {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    walletType: null,
    isConnecting: false,
    error: null,
  });

  // Check if MetaMask/EVM wallet is available
  const getEthereumProvider = useCallback(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return window.ethereum;
    }
    return null;
  }, []);

  // Check if Phantom (Solana) is available
  const getPhantomProvider = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).solana?.isPhantom) {
      return (window as any).solana;
    }
    return null;
  }, []);

  // Check if TronLink is available
  const getTronLinkProvider = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).tronWeb && (window as any).tronLink) {
      return (window as any).tronWeb;
    }
    return null;
  }, []);

  // Switch to a specific chain (EVM only)
  const switchChain = useCallback(async (chain: SupportedChain): Promise<boolean> => {
    const ethereum = getEthereumProvider();
    if (!ethereum) return false;

    const chainConfig = getChainConfig(chain);
    if (!chainConfig || !chainConfig.isEVM) return false;

    const targetChainId = getCurrentChainId(chain);
    const hexChainId = getHexChainId(chain);

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      return true;
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: hexChainId,
              chainName: chainConfig.displayName,
              nativeCurrency: chainConfig.nativeCurrency,
              rpcUrls: [getCurrentRpcUrl(chain)],
              blockExplorerUrls: [getCurrentBlockExplorer(chain)],
            }],
          });
          return true;
        } catch (addError) {
          console.error('Failed to add chain:', addError);
          return false;
        }
      }
      console.error('Failed to switch chain:', switchError);
      return false;
    }
  }, [getEthereumProvider]);

  // Connect to EVM wallet (MetaMask, Trust Wallet, etc.)
  const connectEVM = useCallback(async (targetChain: SupportedChain): Promise<{ address: string; chainId: number } | null> => {
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      throw new Error('No EVM wallet detected. Please install MetaMask or another Web3 wallet.');
    }

    try {
      // Request accounts
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];

      // Get current chain
      const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
      let chainId = parseInt(chainIdHex, 16);

      // Switch to target chain if needed
      const targetChainId = getCurrentChainId(targetChain);
      if (targetChainId && chainId !== targetChainId) {
        const switched = await switchChain(targetChain);
        if (switched) {
          chainId = targetChainId;
        }
      }

      return { address, chainId };
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('Connection rejected by user');
      }
      throw error;
    }
  }, [getEthereumProvider, switchChain]);

  // Connect to Phantom (Solana)
  const connectPhantom = useCallback(async (): Promise<{ address: string } | null> => {
    const phantom = getPhantomProvider();
    if (!phantom) {
      throw new Error('Phantom wallet not detected. Please install Phantom to use Solana.');
    }

    try {
      const response = await phantom.connect();
      return { address: response.publicKey.toString() };
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('Connection rejected by user');
      }
      throw error;
    }
  }, [getPhantomProvider]);

  // Connect to TronLink
  const connectTronLink = useCallback(async (): Promise<{ address: string } | null> => {
    const tronWeb = getTronLinkProvider();
    if (!tronWeb) {
      throw new Error('TronLink wallet not detected. Please install TronLink to use Tron.');
    }

    try {
      // TronLink auto-connects, just get the address
      const address = tronWeb.defaultAddress?.base58;
      if (!address) {
        // Request connection
        const tronLink = (window as any).tronLink;
        const res = await tronLink.request({ method: 'tron_requestAccounts' });
        if (res.code !== 200) {
          throw new Error('Failed to connect to TronLink');
        }
        return { address: tronWeb.defaultAddress.base58 };
      }
      return { address };
    } catch (error) {
      throw error;
    }
  }, [getTronLinkProvider]);

  // Main connect function
  const connect = useCallback(async (walletType: WalletType, targetChain: SupportedChain): Promise<boolean> => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    const chainConfig = getChainConfig(targetChain);

    try {
      let result: { address: string; chainId?: number } | null = null;

      switch (walletType) {
        case 'metamask':
        case 'trustwallet':
        case 'walletconnect':
          // All use the same EVM interface
          if (!chainConfig?.isEVM) {
            throw new Error(`${walletType} does not support ${targetChain}`);
          }
          if (targetChain === 'tron') {
            throw new Error('Use TronLink for Tron network');
          }
          result = await connectEVM(targetChain);
          break;

        case 'phantom':
          if (targetChain !== 'solana') {
            throw new Error('Phantom is for Solana network only');
          }
          result = await connectPhantom();
          break;

        case 'tronlink':
          if (targetChain !== 'tron') {
            throw new Error('TronLink is for Tron network only');
          }
          result = await connectTronLink();
          break;

        default:
          throw new Error('Unsupported wallet type');
      }

      if (result) {
        setState({
          isConnected: true,
          address: result.address,
          chainId: result.chainId || null,
          walletType,
          isConnecting: false,
          error: null,
        });
        toast.success(`Wallet connected: ${result.address.slice(0, 6)}...${result.address.slice(-4)}`);
        return true;
      }

      throw new Error('Failed to connect wallet');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to connect wallet';
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
      return false;
    }
  }, [connectEVM, connectPhantom, connectTronLink]);

  // Disconnect
  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      chainId: null,
      walletType: null,
      isConnecting: false,
      error: null,
    });
    toast.success('Wallet disconnected');
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    const ethereum = getEthereumProvider();
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (state.isConnected) {
        setState(prev => ({ ...prev, address: accounts[0] }));
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      setState(prev => ({ ...prev, chainId }));
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [getEthereumProvider, disconnect, state.isConnected]);

  return {
    ...state,
    connect,
    disconnect,
    switchChain,
  };
}

// Ethereum types are already declared globally via wagmi/viem
