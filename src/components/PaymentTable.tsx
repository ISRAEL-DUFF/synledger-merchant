import { MerchantPayment } from '@/types/merchant';
import { StatusBadge } from './StatusBadge';
import { ChainBadge } from './ChainBadge';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface PaymentTableProps {
  payments: MerchantPayment[];
  showViewAll?: boolean;
  onViewAll?: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function truncateHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export function PaymentTable({ payments, showViewAll, onViewAll }: PaymentTableProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Reference
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Chain
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Customer
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tx Hash
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.map((payment, index) => (
              <tr
                key={payment.id}
                className="transition-colors hover:bg-muted/20 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{payment.reference}</span>
                    <button
                      onClick={() => copyToClipboard(payment.reference, 'Reference')}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                    {payment.cryptoAmount && (
                      <span className="text-xs text-muted-foreground">
                        {payment.cryptoAmount} {payment.token || 'USDT'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={payment.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {payment.chain ? (
                    <ChainBadge chain={payment.chain} />
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-muted-foreground">
                    {payment.customerEmail || '—'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true })}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {payment.txHash ? (
                    <a
                      href={`https://tronscan.org/#/transaction/${payment.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-mono text-primary hover:text-primary/80 transition-colors"
                    >
                      {truncateHash(payment.txHash)}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showViewAll && onViewAll && (
        <div className="border-t border-border p-4 text-center">
          <Button variant="ghost" onClick={onViewAll} className="text-primary hover:text-primary/80">
            View All Payments →
          </Button>
        </div>
      )}
    </div>
  );
}
