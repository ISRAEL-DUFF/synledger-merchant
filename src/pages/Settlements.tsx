import { useMerchantSettlements, useMerchantProfile } from '@/hooks/useMerchant';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Copy, ArrowDownToLine, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Settlements() {
  const { data: settlementsData, isLoading, error } = useMerchantSettlements();
  const { data: profile } = useMerchantProfile();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <Skeleton className="h-10 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (error || !settlementsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold">Failed to load settlements</h3>
        <p className="text-muted-foreground">Please try refreshing the page</p>
      </div>
    );
  }

  const settlements = settlementsData.settlements || [];
  const feeBps = profile?.feeBps ?? 150;

  const totalSettled = settlements
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + Number(s.amount), 0);

  const pendingAmount = settlements
    .filter(s => s.status === 'pending')
    .reduce((sum, s) => sum + Number(s.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settlements</h1>
        <p className="text-muted-foreground mt-1">
          Track your NGN transfers to your bank account
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground mb-2">Total Settled</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(totalSettled)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground mb-2">Pending Settlement</p>
          <p className="text-2xl font-bold text-warning">{formatCurrency(pendingAmount)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground mb-2">Platform Fees ({(feeBps / 100).toFixed(2)}%)</p>
          <p className="text-2xl font-bold text-muted-foreground">
            {formatCurrency(Math.round((totalSettled + pendingAmount) * feeBps / 10000))}
          </p>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Settlement ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Destination
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payments
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Transfer Ref
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {settlements.map((settlement, index) => (
                <tr
                  key={settlement.id}
                  className="transition-colors hover:bg-muted/20 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <ArrowDownToLine className="w-4 h-4 text-success" />
                      <span className="font-mono text-sm font-medium">
                        {settlement.id.slice(0, 12)}...
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      settlement.type === 'CRYPTO'
                        ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                        : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                    }`}>
                      {settlement.type === 'CRYPTO' ? `Crypto${settlement.chain ? ` · ${settlement.chain}` : ''}` : `Fiat · ${settlement.currency || 'NGN'}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold">{formatCurrency(Number(settlement.amount))}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${settlement.status === 'completed'
                        ? 'bg-success/15 text-success border-success/30'
                        : 'bg-warning/15 text-warning border-warning/30'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${settlement.status === 'completed' ? 'bg-success' : 'bg-warning animate-pulse'
                        }`} />
                      {settlement.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {settlement.destination ? (
                      <span className="font-mono text-sm">{settlement.destination.slice(0, 10)}...{settlement.destination.slice(-4)}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-muted-foreground">
                      {settlement.paymentsCount} payments
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {settlement.transferReference ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{settlement.transferReference}</span>
                        <button
                          onClick={() => copyToClipboard(settlement.transferReference!, 'Transfer reference')}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(settlement.createdAt), { addSuffix: true })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
