import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { StatsCard } from '@/components/StatsCard';
import { PaymentTable } from '@/components/PaymentTable';
import { RevenueChart } from '@/components/RevenueChart';
import { useMerchantAnalytics, useMerchantPayments, useMerchantBalances } from '@/hooks/useMerchant';
import { DollarSign, ArrowUpRight, TrendingUp, Clock, AlertCircle, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `₦${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `₦${(amount / 1000).toFixed(0)}K`;
  }
  return `₦${amount.toLocaleString()}`;
}

export default function Dashboard() {
  const { merchantData } = useAuth();
  const navigate = useNavigate();

  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useMerchantAnalytics();
  const { data: paymentsData, isLoading: paymentsLoading } = useMerchantPayments({ limit: 8 });
  const { data: balancesData } = useMerchantBalances();

  const recentPayments = paymentsData?.payments || [];
  const balances = balancesData?.balances || [];
  const totalCryptoBalance = balances.reduce((sum, b) => sum + parseFloat(b.receivable || '0'), 0);
  const isLoading = analyticsLoading || paymentsLoading;
  const error = analyticsError;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="space-y-2">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold">Failed to load dashboard data</h3>
        <p className="text-muted-foreground">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, <span className="gradient-primary-text">{merchantData?.businessName || 'Merchant'}</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your payments today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(analytics.totalRevenue)}
          subtitle="All time earnings"
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Total Payments"
          value={analytics.totalPayments.toString()}
          subtitle="Transactions processed"
          icon={ArrowUpRight}
        />
        <StatsCard
          title="Success Rate"
          value={`${analytics.successRate}%`}
          subtitle="Payment completion"
          icon={TrendingUp}
          trend={{ value: 3.2, isPositive: true }}
        />
        <StatsCard
          title="Pending"
          value={formatCurrency(analytics.pendingAmount)}
          subtitle="Awaiting payment"
          icon={Clock}
        />
      </div>

      {/* Crypto Balance Banner */}
      {balances.length > 0 && (
        <div
          className="rounded-xl border border-border bg-card p-6 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => navigate('/wallet')}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Crypto Balance</p>
              <p className="text-2xl font-bold">${totalCryptoBalance.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-primary font-medium">
            <span>{balances.length} token{balances.length !== 1 ? 's' : ''} across {new Set(balances.map(b => b.chain)).size} chain{new Set(balances.map(b => b.chain)).size !== 1 ? 's' : ''}</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Chart */}
      <RevenueChart data={analytics.chartData} />

      {/* Recent Payments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Recent Payments</h2>
            <p className="text-sm text-muted-foreground">Latest transactions from your customers</p>
          </div>
        </div>

        <PaymentTable
          payments={recentPayments}
          showViewAll
          onViewAll={() => navigate('/payments')}
        />
      </div>
    </div>
  );
}
