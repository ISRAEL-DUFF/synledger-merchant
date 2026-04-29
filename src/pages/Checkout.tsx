import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wallet, Copy, Check, AlertCircle, Loader2, ExternalLink, X, CheckCircle2 } from 'lucide-react';
import { useMerchantPayments, useExchangeRate } from '@/hooks/useMerchant';
import { useWallet, WalletType, SupportedChain, ChainType } from '@/hooks/useWallet';
import { useTokenTransfer } from '@/hooks/useTokenTransfer';
import {
  getEnabledChains,
  getWalletsForChain,
  getAvailableTokens,
  TokenSymbol,
  isTestnet,
  WalletConfig,
  getDefaultToken,
} from '@/lib/chains-config';
import { toast } from 'sonner';
import { getContractByName } from '@/lib/contracts';
import { useEscrow } from '@/hooks/useEscrow';
import { API_URL } from '@/lib/api';

interface PaymentData {
  merchantName: string;
  merchantLogo: string;
  amount: number;
  currency: string;
  reference: string;
  email: string;
  description?: string;
  publicKey: string;
  callbackUrl: string;
  metadata: {
    orderId: string;
    customerName: string;
  };
}

interface Chain {
  id: SupportedChain;
  name: string;
  icon: string;
  fee: string;
  popular?: boolean;
  wallets: WalletConfig[];
  tokens: TokenSymbol[];
}

type Step = 'initial' | 'wallet-connect' | 'payment' | 'processing' | 'success' | 'failed';

let BACKEND_URL = API_URL;

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const wallet = useWallet();
  const tokenTransfer = useTokenTransfer();

  // Parse URL parameters
  const paymentId = searchParams.get('paymentId');
  const slug = searchParams.get('ref');
  const urlAmount = searchParams.get('amount');
  const urlCurrency = searchParams.get('currency');
  const urlChain = searchParams.get('chain') as SupportedChain | null;
  const urlRef = searchParams.get('ref');
  const urlDesc = searchParams.get('desc');
  const urlEmail = searchParams.get('email');
  const urlToken = searchParams.get('token') as TokenSymbol | null;

  const [isOpen, setIsOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>(urlToken || getDefaultToken());

  // Payment Data State
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [fetchedPaymentData, setFetchedPaymentData] = useState<any>(null);

  const { createEscrow, loading, error } = useEscrow();

  // Fetch payment details if paymentId is present
  useEffect(() => {

    const fetchPaymentDetails = async () => {
      if (!paymentId) return;

      setLoadingPayment(true);
      setPaymentError(null);

      try {
        const response = await fetch(`${BACKEND_URL}/checkout/payment/${paymentId}`);
        if (!response.ok) {
          throw new Error('Failed to load payment details');
        }

        const data = await response.json();
        console.log("DATA>>>>>>>>>", data);
        setFetchedPaymentData(data);

        setPaymentData({
          merchantName: data.merchant.name,
          merchantLogo: data.merchant.logo || "https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=TS",
          amount: data.payment.amount,
          currency: data.payment.currency,
          reference: data.payment.reference,
          email: data.payment.email,
          description: data.payment.metadata?.description,
          publicKey: "pk_test_placeholder", // Backend should probably return this too if needed
          callbackUrl: data.payment.metadata?.callbackUrl || "https://merchant.com/verify",
          metadata: data.payment.metadata || {}
        });

      } catch (err: any) {
        console.error('Error fetching payment:', err);
        setPaymentError(err.message || 'Could not load payment details');
      } finally {
        setLoadingPayment(false);
      }
    };

    const fetchPaymentLinkBySlug = async () => {
      if (!slug) return;

      setLoadingPayment(true);
      setPaymentError(null);

      try {
        const response = await fetch(`${BACKEND_URL}/checkout/payment-link/${slug}`);
        if (!response.ok) {
          throw new Error('Failed to load payment details');
        }

        const data = await response.json();
        console.log("DATA>>>>>>>>>", data);
        setFetchedPaymentData(data);

        setPaymentData({
          merchantName: data.merchant.name,
          merchantLogo: data.merchant.logo || "https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=TS",
          amount: data.amount,
          currency: data.currency,
          reference: `${"PLNK-" + slug + "-" + Date.now()}`,
          email: data.email,
          description: data.description,
          publicKey: "pk_test_placeholder", // Backend should probably return this too if needed
          callbackUrl: data.callbackUrl || "https://merchant.com/verify",
          metadata: data.metadata || {}
        });

      } catch (err: any) {
        console.error('Error fetching payment:', err);
        setPaymentError(err.message || 'Could not load payment details');
      } finally {
        setLoadingPayment(false);
      }
    };

    if (paymentId) {
      fetchPaymentDetails();
    } else if (slug) {
      fetchPaymentLinkBySlug();
    } else {
      // Fallback to URL params if paymentId is missing
      if (urlAmount && urlCurrency) {
        setPaymentData({
          merchantName: "Tech Store Nigeria",
          merchantLogo: "https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=TS",
          amount: parseFloat(urlAmount),
          currency: urlCurrency,
          reference: urlRef || "TXN-" + Date.now(),
          email: urlEmail || "customer@example.com",
          description: urlDesc || undefined,
          publicKey: "pk_test_xxxxxxxxxxxxx",
          callbackUrl: "https://merchant.com/verify",
          metadata: {
            orderId: "ORD-12345",
            customerName: "John Doe"
          }
        });
      } else {
        // No paymentId and no valid URL params - wait for user input or show default demo data ONLY if it's a demo flow
        // For now, we initialize with default demo data just to keep the "Demo" vibe alive if accessed directly without params
        // But for production logic as requested: "if not, throw an error"
        // setPaymentError('Invalid payment link');

        // Keeping demo data logic for now as per "Demo" title in UI, but in a real scenario we'd error out.
        // Let's stick to the requested logic: throw error if no params.
        setPaymentError('Invalid payment link. Please provide payment details.');
      }
    }
  }, [paymentId, urlAmount, urlCurrency, urlRef, urlDesc, urlEmail]);

  // Build chains from configuration
  const chains: Chain[] = useMemo(() => {
    const enabledChains = getEnabledChains();
    return enabledChains.map(chainConfig => ({
      id: chainConfig.id,
      name: chainConfig.displayName,
      icon: chainConfig.icon,
      fee: chainConfig.fee,
      popular: urlChain ? urlChain === chainConfig.id : chainConfig.id === 'base',
      wallets: getWalletsForChain(chainConfig.id),
      tokens: getAvailableTokens(chainConfig.id),
    }));
  }, [urlChain]);

  // Pre-select chain if provided in URL
  const preSelectedChain = urlChain ? chains.find(c => c.id === urlChain) || null : null;

  const [step, setStep] = useState<Step>('initial');
  const [selectedChain, setSelectedChain] = useState<Chain | null>(preSelectedChain);
  const [escrowCreated, setEscrowCreated] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);

  // const [timeLeft, setTimeLeft] = useState(600);

  const { data: exchangeRateData, isLoading: isLoadingRate } = useExchangeRate(selectedToken, 'NGN'); // TODO: Use currency from paymentData
  const usdtRate = exchangeRateData?.effectiveRate || 1420; // Fallback to safe default or previous hardcoded value while loading

  // Calculate derived values only when paymentData is available
  const cryptoAmount = paymentData ? (paymentData.amount / usdtRate).toFixed(2) : '0.00';
  const platformFee = paymentData ? (parseFloat(cryptoAmount) * 0.015).toFixed(2) : '0.00';
  const totalCrypto = paymentData ? (parseFloat(cryptoAmount) + parseFloat(platformFee)).toFixed(2) : '0.00';

  // Update selected token when chain changes
  useEffect(() => {
    if (selectedChain) {
      const availableTokens = selectedChain.tokens;
      if (!availableTokens.includes(selectedToken)) {
        setSelectedToken(availableTokens[0] || getDefaultToken());
      }
    }
  }, [selectedChain, selectedToken]);

  useEffect(() => {
    if (step === 'payment' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const connectWallet = async (walletType: WalletType) => {
    if (!selectedChain) return;

    const success = await wallet.connect(walletType, selectedChain.id);
    if (success) {
      setStep('payment');
    }
  };

  const submitPayment = async (params: {
    amount: string;
    chain: ChainType;
    category: string;
  }) => {
    try {
      let pId = '';
      let pData;

      if (paymentId && fetchedPaymentData) {
        pId = paymentId;
        pData = fetchedPaymentData;

        if (!pData.payment.onchainReference) {
          throw new Error('Payment onchain reference not found');
        }
      } else {
        // 1. Call backend to initiate payment
        const response = await fetch(`${BACKEND_URL}/checkout/payment/initialize-by-slug/${slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: paymentData.reference,
            callbackUrl: 'https://merchant.com/verify',
            metadata: {
              orderId: 'ORD-12345',
              customerName: 'John Doe'
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to initiate payment');
        }

        const data = await response.json();
        console.log("DATA>>>>>>>>>", data);

        if (!data.payment.id) {
          throw new Error('Payment ID not found');
        }

        if (!data.payment.onchainReference) {
          throw new Error('Payment onchain reference not found');
        }

        pId = data.payment.id;
        pData = data;
      }

      // const response = await fetch('/api/payments/initiate-payment-intent', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     amount: parseFloat(params.amount) * 1420, // NGN amount
      //     token: 'USDT',
      //     chain: 'arbitrum'
      //   })
      // });

      // const paymentData = await response.json();

      // 2. Create escrow on-chain
      // const arbitrum = getContractByName(params.chain); // e.g 'arbitrum'
      const contractByChain = getContractByName(params.chain); // e.g 'arbitrum'
      console.log("CONTRACT BY CHAIN>>>>>>>>>", params.chain, contractByChain, selectedToken);
      const result = await createEscrow(
        contractByChain[selectedToken.toLowerCase()],
        params.amount, // Crypto amount
        pData.payment.onchainReference, // Payment ID from backend
        params.category,
        params.chain
      );
      console.log("RESULT>>>>>>>>>", result);


      // 3. Confirm escrow creation with backend
      await fetch(`${BACKEND_URL}/checkout/payment/${pId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowId: result.escrowId,
          chain: params.chain,
          token: selectedToken,
          cryptoAmount: params.amount,
          txHash: result.txHash
        })
      });

      alert('Payment initiated successfully!');

      // Reset form or redirect

      return result;
    } catch (err) {
      console.error('Payment failed:', err);
      alert('Payment failed. Please try again.');
      setStep('failed');
      throw err;
    }
  };

  const handlePayment = async () => {
    if (!wallet.isConnected || !wallet.address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!selectedChain) {
      toast.error('Please select a payment network');
      return;
    }

    setStep('processing');

    try {
      // Start the real token transfer
      // const hash = await tokenTransfer.transferToken(
      //   selectedChain.id,
      //   selectedToken,
      //   totalCrypto
      // );

      const result = await submitPayment({
        amount: totalCrypto,
        chain: selectedChain.id,
        category: 'payment',
      });

      if (!result.txHash) {
        throw new Error('Transaction failed');
      }

      setEscrowCreated(true);
      setTxHash(result.txHash);

      // Wait a moment for UI feedback
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep('success');

      toast.success('Payment completed successfully!');
    } catch (error: any) {
      console.error('Payment error:', error);
      setStep('failed');

      // Don't show duplicate toast if already shown by transfer hook
      if (!error.message?.includes('rejected')) {
        toast.error(error.message || 'Payment failed. Please try again.');
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const getBlockExplorerUrl = (chain: Chain | null, hash: string) => {
    if (!chain || !hash) return '#';
    return tokenTransfer.getExplorerUrl(chain.id, hash);
  };

  if (!isOpen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">iSpend Payment Widget</h1>
          <p className="text-muted-foreground mb-8">Checkout experience for crypto payments</p>

          <button
            onClick={() => setIsOpen(true)}
            disabled={loadingPayment || !!paymentError}
            className="gradient-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingPayment ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" /> Loading...
              </span>
            ) : paymentError ? (
              "Payment Unavailable"
            ) : (
              "Open Payment Widget"
            )}
          </button>

          {paymentError && (
            <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 max-w-md mx-auto">
              <p className="font-medium">{paymentError}</p>
            </div>
          )}

          {paymentData && (
            <div className="mt-12 bg-card/50 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto border border-border">
              <h3 className="text-foreground font-semibold mb-4">Payment Details:</h3>
              <div className="space-y-2 text-left text-muted-foreground text-sm">
                <div className="flex justify-between">
                  <span>Merchant:</span>
                  <span className="text-foreground font-medium">{paymentData.merchantName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="text-foreground font-medium">₦{paymentData.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reference:</span>
                  <span className="text-foreground font-medium text-xs">{paymentData.reference}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!paymentData) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in border border-border">

        {/* Header */}
        <div className="gradient-primary p-6 relative rounded-t-2xl">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-primary-foreground/80 hover:text-primary-foreground"
          >
            <X size={24} />
          </button>

          <div className="flex items-center gap-4">
            <img
              src={paymentData.merchantLogo}
              alt={paymentData.merchantName}
              className="w-16 h-16 rounded-xl bg-white/10 border-2 border-white/20"
            />
            <div className="text-primary-foreground">
              <p className="text-sm opacity-90">Pay to</p>
              <h2 className="text-xl font-bold">{paymentData.merchantName}</h2>
            </div>
          </div>

          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-primary-foreground/80 text-sm">Amount to pay</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary-foreground">₦{paymentData.amount.toLocaleString()}</span>
              <span className="text-primary-foreground/60 text-sm">≈ ${cryptoAmount} {selectedToken}</span>
            </div>
            {paymentData.description && (
              <p className="text-primary-foreground/70 text-sm mt-2">{paymentData.description}</p>
            )}
          </div>

          {/* Testnet Indicator */}
          {isTestnet() && (
            <div className="mt-3 bg-warning/20 border border-warning/30 rounded-lg px-3 py-2 text-center">
              <span className="text-warning text-xs font-medium">⚠️ TESTNET MODE - No real funds will be transferred</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">

          {/* Step 1: Chain Selection */}
          {step === 'initial' && (
            <div className="space-y-4 animate-slide-up">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Select Payment Network</h3>
                <p className="text-sm text-muted-foreground">Choose the blockchain network for your payment</p>
              </div>

              <div className="space-y-2">
                {chains.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => {
                      setSelectedChain(chain);
                      setStep('wallet-connect');
                    }}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left hover:border-primary hover:shadow-md ${chain.popular ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{chain.icon}</span>
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            {chain.name}
                            {chain.popular && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                Popular
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>{chain.fee}</span>
                            <span className="text-xs text-muted-foreground/70">
                              • {chain.tokens.join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-muted-foreground">→</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="text-primary flex-shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-primary">
                  Your payment will be held in escrow until the merchant confirms receipt
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Wallet Connection */}
          {step === 'wallet-connect' && (
            <div className="space-y-4 animate-slide-up">
              <button
                onClick={() => {
                  wallet.disconnect();
                  setStep('initial');
                }}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                ← Back to networks
              </button>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Connect Wallet</h3>
                <p className="text-sm text-muted-foreground">Connect your {selectedChain?.name} wallet to continue</p>
              </div>

              <div className="bg-muted rounded-xl p-4 border border-border">
                <div className="text-sm text-muted-foreground mb-1">Network</div>
                <div className="font-semibold text-foreground flex items-center gap-2">
                  <span className="text-2xl">{selectedChain?.icon}</span>
                  {selectedChain?.name}
                </div>
              </div>

              {/* Connected wallet display */}
              {wallet.isConnected && wallet.address && (
                <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-success text-sm mb-2">
                    <CheckCircle2 size={16} />
                    <span className="font-medium">Wallet Connected</span>
                  </div>
                  <div className="text-xs text-success/80 font-mono break-all">
                    {wallet.address}
                  </div>
                  <button
                    onClick={() => setStep('payment')}
                    className="mt-3 w-full gradient-primary text-primary-foreground py-2 rounded-lg font-medium text-sm"
                  >
                    Continue to Payment
                  </button>
                </div>
              )}

              {/* Wallet options */}
              {!wallet.isConnected && (
                <div className="space-y-2">
                  {selectedChain?.wallets.map((w) => (
                    <button
                      key={w.type}
                      onClick={() => connectWallet(w.type)}
                      disabled={wallet.isConnecting}
                      className="w-full p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${w.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                          {w.icon}
                        </div>
                        <div className="text-left">
                          <span className="font-semibold text-foreground block">{w.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {w.type === 'metamask' && 'Browser extension'}
                            {w.type === 'trustwallet' && 'Mobile wallet'}
                            {w.type === 'phantom' && 'Solana wallet'}
                            {w.type === 'tronlink' && 'Tron wallet'}
                          </span>
                        </div>
                      </div>
                      {wallet.isConnecting ? (
                        <Loader2 size={20} className="animate-spin text-primary" />
                      ) : (
                        <Wallet size={20} className="text-muted-foreground" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Wallet detection notice */}
              <div className="bg-muted/50 border border-border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Don't have a wallet? Install{' '}
                  {selectedChain?.id === 'solana' ? (
                    <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Phantom
                    </a>
                  ) : selectedChain?.id === 'tron' ? (
                    <a href="https://www.tronlink.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      TronLink
                    </a>
                  ) : (
                    <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      MetaMask
                    </a>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Payment Confirmation */}
          {step === 'payment' && (
            <div className="space-y-4 animate-slide-up">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Confirm Payment</h3>
                <div className="text-sm bg-warning/10 text-warning px-3 py-1 rounded-full font-medium">
                  {formatTime(timeLeft)}
                </div>
              </div>

              {/* Connected wallet */}
              {wallet.isConnected && wallet.address && (
                <div className="bg-muted rounded-xl p-3 border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-success" />
                      <span className="text-sm text-muted-foreground">Connected:</span>
                    </div>
                    <span className="text-sm font-mono text-foreground">
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </span>
                  </div>
                </div>
              )}

              {/* Token Selector */}
              {selectedChain && selectedChain.tokens.length > 1 && (
                <div className="bg-muted rounded-xl p-4 border border-border">
                  <div className="text-sm text-muted-foreground mb-2">Select Token</div>
                  <div className="flex gap-2">
                    {selectedChain.tokens.map((token) => (
                      <button
                        key={token}
                        onClick={() => setSelectedToken(token)}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${selectedToken === token
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border border-border text-foreground hover:border-primary'
                          }`}
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20">
                <div className="text-sm text-muted-foreground mb-1">You will pay</div>
                <div className="text-3xl font-bold text-foreground">{totalCrypto} {selectedToken}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  on {selectedChain?.name}
                </div>
              </div>

              <div className="space-y-2 bg-muted rounded-xl p-4 border border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Exchange Rate</span>
                  <span className="font-medium text-foreground">1 {selectedToken} = ₦{usdtRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium text-foreground">{cryptoAmount} {selectedToken}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform Fee (1.5%)</span>
                  <span className="font-medium text-foreground">{platformFee} {selectedToken}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-foreground">{totalCrypto} {selectedToken}</span>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="text-primary flex-shrink-0 mt-0.5" size={16} />
                <div className="text-xs text-primary">
                  <p className="font-medium mb-1">Escrow Protection</p>
                  <p>Your funds will be held safely until the merchant confirms your payment. If anything goes wrong, you'll get an automatic refund.</p>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={!wallet.isConnected}
                className="w-full gradient-primary text-primary-foreground py-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wallet size={20} />
                Pay {totalCrypto} {selectedToken}
              </button>

              <button
                onClick={() => {
                  wallet.disconnect();
                  setStep('wallet-connect');
                }}
                className="w-full text-muted-foreground py-2 text-sm hover:text-foreground"
              >
                Change wallet
              </button>
            </div>
          )}

          {/* Step 4: Processing */}
          {step === 'processing' && (
            <div className="space-y-6 py-8 text-center animate-scale-in">
              <div className="flex justify-center">
                <div className="relative">
                  <Loader2 className="animate-spin text-primary" size={64} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Wallet className="text-primary" size={24} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {tokenTransfer.status === 'pending'
                    ? 'Confirm in Wallet...'
                    : escrowCreated
                      ? 'Transaction Submitted!'
                      : 'Processing Payment...'}
                </h3>
                <p className="text-muted-foreground">
                  {tokenTransfer.status === 'pending'
                    ? 'Please confirm the transaction in your wallet'
                    : escrowCreated
                      ? 'Waiting for blockchain confirmation'
                      : `Preparing your ${selectedToken} transfer`
                  }
                </p>
              </div>

              {escrowCreated && txHash && (
                <div className="bg-success/10 border border-success/20 rounded-lg p-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-success text-sm mb-2">
                    <Check size={16} />
                    <span className="font-medium">Transaction Submitted</span>
                  </div>
                  <div className="text-xs text-success break-all font-mono">
                    {txHash.slice(0, 20)}...{txHash.slice(-10)}
                  </div>
                  <a
                    href={getBlockExplorerUrl(selectedChain, txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 text-success/80 hover:text-success text-xs mt-2"
                  >
                    View on explorer <ExternalLink size={12} />
                  </a>
                </div>
              )}

              <div className="flex items-center justify-center gap-2">
                <div className={`w-3 h-3 rounded-full ${tokenTransfer.status === 'pending' ? 'bg-primary animate-pulse' : 'bg-success'}`}></div>
                <div className={`w-3 h-3 rounded-full ${escrowCreated ? 'bg-success' : tokenTransfer.status !== 'pending' ? 'bg-primary animate-pulse' : 'bg-muted'}`}></div>
                <div className="w-3 h-3 rounded-full bg-muted"></div>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && (
            <div className="space-y-6 py-8 text-center animate-scale-in">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center">
                  <Check className="text-success-foreground" size={40} />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h3>
                <p className="text-muted-foreground">
                  ₦{paymentData.amount.toLocaleString()} has been sent to {paymentData.merchantName}
                </p>
              </div>

              <div className="bg-muted rounded-xl p-4 border border-border text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-medium text-foreground">{paymentData.reference}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-medium text-foreground">{selectedChain?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Wallet</span>
                  <span className="font-medium text-foreground font-mono">
                    {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Transaction</span>
                  <button
                    onClick={() => copyToClipboard(txHash)}
                    className="flex items-center gap-1 text-primary hover:text-primary/80"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <a
                href={getBlockExplorerUrl(selectedChain, txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-primary hover:text-primary/80 text-sm"
              >
                View on blockchain explorer
                <ExternalLink size={14} />
              </a>

              <button
                onClick={() => {
                  wallet.disconnect();
                  setIsOpen(false);
                }}
                className="w-full bg-foreground text-background py-4 rounded-xl font-semibold hover:bg-foreground/90 transition-all"
              >
                Done
              </button>
            </div>
          )}

          {/* Step 6: Failed */}
          {step === 'failed' && (
            <div className="space-y-6 py-8 text-center animate-scale-in">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-destructive rounded-full flex items-center justify-center">
                  <X className="text-destructive-foreground" size={40} />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Payment Failed</h3>
                <p className="text-muted-foreground">
                  {tokenTransfer.error || 'Something went wrong. Please try again.'}
                </p>
              </div>

              <button
                onClick={() => {
                  setStep('payment');
                  setEscrowCreated(false);
                  setTxHash('');
                  tokenTransfer.reset();
                }}
                className="w-full gradient-primary text-primary-foreground py-4 rounded-xl font-semibold"
              >
                Try Again
              </button>

              <button
                onClick={() => {
                  wallet.disconnect();
                  setIsOpen(false);
                }}
                className="w-full text-muted-foreground py-2 text-sm hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 bg-muted/50 text-center rounded-b-2xl">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Secured by</span>
            <span className="font-bold gradient-primary-text">CryptoExpense</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
