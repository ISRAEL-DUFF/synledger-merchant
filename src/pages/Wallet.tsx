import { useState } from 'react';
import { useMerchantBalances, useWithdraw } from '@/hooks/useMerchant';
import { MerchantBalance, ChainType } from '@/types/merchant';
import { ChainBadge } from '@/components/ChainBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wallet as WalletIcon, ArrowUpRight, Loader2, AlertCircle, Copy, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const KNOWN_CHAINS: ChainType[] = ['tron', 'base', 'arbitrum', 'solana'];

function formatBalance(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return '0.00';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

export default function Wallet() {
  const { data: balancesData, isLoading, error } = useMerchantBalances();
  const withdraw = useWithdraw();

  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<MerchantBalance | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  const balances = balancesData?.balances || [];
  const totalBalance = balances.reduce((sum, b) => sum + parseFloat(b.receivable || '0'), 0);

  const openWithdrawDialog = (balance: MerchantBalance) => {
    setSelectedBalance(balance);
    setWithdrawAmount('');
    setWithdrawAddress('');
    setWithdrawSuccess(null);
    setWithdrawDialogOpen(true);
  };

  const handleWithdraw = () => {
    if (!selectedBalance || !withdrawAmount || !withdrawAddress) {
      toast.error('Please fill in all fields');
      return;
    }
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount > parseFloat(selectedBalance.receivable)) {
      toast.error('Insufficient balance');
      return;
    }
    withdraw.mutate(
      {
        chain: selectedBalance.chain as ChainType,
        tokenSymbol: selectedBalance.tokenSymbol,
        tokenAddress: selectedBalance.tokenAddress,
        amount: withdrawAmount,
        toAddress: withdrawAddress,
      },
      {
        onSuccess: (data) => {
          setWithdrawSuccess(data.txHash);
        },
      }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="space-y-2">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold">Failed to load wallet data</h3>
        <p className="text-muted-foreground">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground mt-1">
          View your crypto balances and withdraw funds
        </p>
      </div>

      {/* Total Balance Banner */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <WalletIcon className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Total Balance</p>
        </div>
        <p className="text-4xl font-bold">${formatBalance(totalBalance.toString())}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Across {balances.length} token{balances.length !== 1 ? 's' : ''} on {new Set(balances.map(b => b.chain)).size} chain{new Set(balances.map(b => b.chain)).size !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Per-chain/token Balance Cards */}
      {balances.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <WalletIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No balances yet</h3>
          <p className="text-muted-foreground mt-1">
            Balances will appear here once customers make payments
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {balances.map((balance, index) => {
            const amount = parseFloat(balance.receivable || '0');
            const isKnownChain = KNOWN_CHAINS.includes(balance.chain as ChainType);

            return (
              <div
                key={`${balance.chain}-${balance.tokenSymbol}`}
                className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 animate-fade-in"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  {isKnownChain ? (
                    <ChainBadge chain={balance.chain as ChainType} />
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wide bg-muted text-muted-foreground border-border">
                      {balance.chain}
                    </span>
                  )}
                  <span className="text-sm font-medium text-muted-foreground">
                    {balance.tokenSymbol}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-2xl font-bold">
                    {formatBalance(balance.receivable)} <span className="text-base font-normal text-muted-foreground">{balance.tokenSymbol}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {balance.tokenAddress.slice(0, 8)}...{balance.tokenAddress.slice(-6)}
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => openWithdrawDialog(balance)}
                  disabled={amount <= 0}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Withdraw
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {withdrawSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  Withdrawal Submitted
                </DialogTitle>
                <DialogDescription>
                  Your withdrawal has been submitted and is being processed.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-sm font-medium">{withdrawAmount} {selectedBalance?.tokenSymbol}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Chain</span>
                    <span className="text-sm font-medium capitalize">{selectedBalance?.chain}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tx Hash</span>
                    <button
                      onClick={() => copyToClipboard(withdrawSuccess)}
                      className="flex items-center gap-1 text-sm font-mono text-primary hover:text-primary/80 transition-colors"
                    >
                      {withdrawSuccess.slice(0, 10)}...
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setWithdrawDialogOpen(false)} className="gradient-primary">
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Withdraw {selectedBalance?.tokenSymbol}</DialogTitle>
                <DialogDescription>
                  Withdraw from {selectedBalance?.chain} to an external wallet address.
                  Available: {formatBalance(selectedBalance?.receivable || '0')} {selectedBalance?.tokenSymbol}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Amount</Label>
                  <div className="flex gap-2">
                    <Input
                      id="withdraw-amount"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="bg-muted/50"
                      type="number"
                      step="any"
                      min="0"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => setWithdrawAmount(selectedBalance?.receivable || '0')}
                    >
                      Max
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdraw-address">Destination Address</Label>
                  <Input
                    id="withdraw-address"
                    placeholder={`Enter ${selectedBalance?.chain} wallet address`}
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className="bg-muted/50 font-mono text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleWithdraw}
                  className="gradient-primary"
                  disabled={withdraw.isPending || !withdrawAmount || !withdrawAddress}
                >
                  {withdraw.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUpRight className="w-4 h-4 mr-2" />}
                  Withdraw
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
