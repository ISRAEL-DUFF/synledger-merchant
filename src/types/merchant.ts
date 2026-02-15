// Merchant Dashboard Type Definitions
// Based on Crypto Expense Payment Gateway API

export interface BankAccount {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
}

export interface MerchantSettings {
  autoSettle: boolean;
  settlementSchedule: 'instant' | 'daily' | 'weekly';
  supportedChains: ChainType[];
  defaultChain: ChainType;
}

export interface Merchant {
  id: string;
  email: string;
  businessName: string;
  businessWebsite?: string;
  logo?: string;
  publicKey: string;
  testMode: boolean;
  bankAccount?: BankAccount;
  webhookUrl?: string;
  settings?: MerchantSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';

export type ChainType = 'tron' | 'base' | 'arbitrum' | 'solana';

export interface MerchantPayment {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  metadata?: Record<string, unknown>;
  status: PaymentStatus;
  escrowId?: string;
  chain?: ChainType;
  token?: string;
  cryptoAmount?: string;
  txHash?: string;
  paidAt?: string;
  settledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type SettlementStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface MerchantSettlement {
  id: string;
  amount: number;
  paymentsCount: number;
  paymentIds: string[];
  status: SettlementStatus;
  transferReference?: string;
  settledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantWebhookLog {
  id: string;
  paymentId: string;
  url: string;
  payload: Record<string, unknown>;
  response?: string;
  statusCode?: number;
  success: boolean;
  attempts: number;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface InitializePaymentResponse {
  payment: MerchantPayment;
  checkoutUrl: string;
}

export interface PaymentsListResponse {
  payments: MerchantPayment[];
  total: number;
}

export interface AnalyticsResponse {
  totalRevenue: number;
  totalPayments: number;
  successRate: number;
  pendingAmount: number;
  chartData: Array<{ date: string; amount: number; count: number }>;
}

export interface SettlementsListResponse {
  settlements: MerchantSettlement[];
  total: number;
}

// Query Filters
export interface PaymentFilters {
  status?: PaymentStatus;
  chain?: ChainType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

// Chain Configuration
export const CHAIN_CONFIG: Record<ChainType, { name: string; fee: string; speed: string; color: string }> = {
  tron: { name: 'Tron (TRC20)', fee: '~$2', speed: 'Fast', color: 'chain-tron' },
  base: { name: 'Base', fee: '~$0.30', speed: 'Very Fast', color: 'chain-base' },
  arbitrum: { name: 'Arbitrum', fee: '~$0.50', speed: 'Fast', color: 'chain-arbitrum' },
  solana: { name: 'Solana', fee: '~$0.0001', speed: 'Instant', color: 'chain-solana' },
};

// Status Configuration
export const STATUS_CONFIG: Record<PaymentStatus, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  processing: { label: 'Processing', variant: 'secondary' },
  success: { label: 'Success', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
};

export interface PaymentLink {
  id: string;
  name: string;
  slug: string;
  amount: number;
  currency: string;
  reference?: string;
  chain?: ChainType;
  description?: string;
  customerEmail?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  url: string;
}
