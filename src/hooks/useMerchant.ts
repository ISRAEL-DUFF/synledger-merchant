import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Merchant, MerchantPayment, MerchantSettlement, MerchantSettlementAddress, MerchantBalance, WithdrawRequest, WithdrawResponse, PaymentLink, SettlementFrequency, SettlementType } from '@/types/merchant';
import { toast } from 'sonner';

// Types
interface AnalyticsData {
    totalRevenue: number;
    totalPayments: number;
    successRate: number;
    pendingAmount: number;
    chartData: Array<{ date: string; amount: number; count: number }>;
}

interface PaymentsResponse {
    payments: MerchantPayment[];
    total: number;
}

interface ApiKeysResponse {
    publicKey: string;
    secretKey: string;
}

interface SettlementsResponse {
    settlements: MerchantSettlement[];
    total: number;
}

// Keys
export const merchantKeys = {
    all: ['merchant'] as const,
    profile: () => [...merchantKeys.all, 'profile'] as const,
    payments: (filters?: any) => [...merchantKeys.all, 'payments', filters] as const,
    analytics: () => [...merchantKeys.all, 'analytics'] as const,
    settlements: () => [...merchantKeys.all, 'settlements'] as const,
    paymentLinks: () => [...merchantKeys.all, 'payment-links'] as const,
    apiKeys: () => [...merchantKeys.all, 'api-keys'] as const,
    settlementAddresses: () => [...merchantKeys.all, 'settlement-addresses'] as const,
    balances: () => [...merchantKeys.all, 'balances'] as const,
};

// Profile Hooks
export function useMerchantProfile() {
    return useQuery({
        queryKey: merchantKeys.profile(),
        queryFn: () => api.get<Merchant>('/api/merchant/profile'),
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Merchant>) => api.put<Merchant>('/api/merchant/profile', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: merchantKeys.profile() });
            toast.success('Profile updated successfully');
        },
        onError: () => toast.error('Failed to update profile'),
    });
}

export function useUpdateBankAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post<Merchant>('/api/merchant/bank-account', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: merchantKeys.profile() });
            toast.success('Bank account updated successfully');
        },
        onError: () => toast.error('Failed to update bank account'),
    });
}

// Payments Hooks
export function useMerchantPayments(filters: any = {}) {
    // Clean filters
    const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== 'all' && v !== '')
    );

    return useQuery({
        queryKey: merchantKeys.payments(cleanFilters),
        queryFn: () => {
            const params = new URLSearchParams();
            Object.entries(cleanFilters).forEach(([key, value]) => {
                if (value) params.append(key, String(value));
            });
            return api.get<PaymentsResponse>(`/api/merchant/payments?${params.toString()}`);
        },
    });
}

// Analytics Hooks
export function useMerchantAnalytics() {
    return useQuery({
        queryKey: merchantKeys.analytics(),
        queryFn: () => api.get<AnalyticsData>('/api/merchant/analytics'),
    });
}

// Settlements
export function useMerchantSettlements() {
    return useQuery({
        queryKey: merchantKeys.settlements(),
        queryFn: () => api.get<SettlementsResponse>('/api/merchant/settlements'),
    });
}

// Payment Links
export function usePaymentLinks() {
    return useQuery({
        queryKey: merchantKeys.paymentLinks(),
        queryFn: () => api.get<PaymentLink[]>('/api/merchant/payment-links'),
    });
}

export function useCreatePaymentLink() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post<PaymentLink>('/api/merchant/payment-links', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: merchantKeys.paymentLinks() });
            toast.success('Payment link created');
        },
        onError: () => toast.error('Failed to create payment link'),
    });
}

export function useDeletePaymentLink() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/api/merchant/payment-links/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: merchantKeys.paymentLinks() });
            toast.success('Payment link deleted');
        },
        onError: () => toast.error('Failed to delete payment link'),
    });
}

// API Keys
export function useApiKeys() {
    return useQuery({
        queryKey: merchantKeys.apiKeys(),
        queryFn: () => api.get<ApiKeysResponse>('/api/merchant/api-keys'),
    });
}

export function useRegenerateApiKeys() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { testMode: boolean }) => api.post<ApiKeysResponse>('/api/merchant/api-keys/regenerate', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: merchantKeys.apiKeys() });
            toast.success('API keys regenerated');
        },
        onError: () => toast.error('Failed to regenerate API keys'),
    });
}

// Settlement Preferences
export function useUpdateSettlementPreferences() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { settlementType?: SettlementType; settlementFrequency?: SettlementFrequency }) =>
            api.put<Merchant>('/api/merchant/settlement-preferences', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: merchantKeys.profile() });
            toast.success('Settlement preferences updated');
        },
        onError: () => toast.error('Failed to update settlement preferences'),
    });
}

// Settlement Addresses
export function useSettlementAddresses() {
    return useQuery({
        queryKey: merchantKeys.settlementAddresses(),
        queryFn: () => api.get<MerchantSettlementAddress[]>('/api/merchant/settlement-addresses'),
    });
}

export function useUpsertSettlementAddress() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { chain: string; address: string }) =>
            api.post<MerchantSettlementAddress>('/api/merchant/settlement-addresses', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: merchantKeys.settlementAddresses() });
            toast.success('Settlement address saved');
        },
        onError: () => toast.error('Failed to save settlement address'),
    });
}

export function useDeleteSettlementAddress() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/api/merchant/settlement-addresses/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: merchantKeys.settlementAddresses() });
            toast.success('Settlement address removed');
        },
        onError: () => toast.error('Failed to remove settlement address'),
    });
}

// Wallet Balances
interface BalancesResponse {
    balances: MerchantBalance[];
}

export function useMerchantBalances() {
    return useQuery({
        queryKey: merchantKeys.balances(),
        queryFn: () => api.get<BalancesResponse>('/api/merchant/balances'),
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}

export function useWithdraw() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: WithdrawRequest) => api.post<WithdrawResponse>('/api/merchant/withdraw', data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: merchantKeys.balances() });
            toast.success(`Withdrawal submitted — tx: ${data.txHash?.slice(0, 12)}...`);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Withdrawal failed');
        },
    });
}

// Exchange Rate
interface ExchangeRateResponse {
    token: string;
    currency: string;
    marketRate: number;
    spread: number;
    effectiveRate: number;
    timestamp: number;
    expiresAt: number;
}

interface ExchangeRateCalculatedResponse {
    amountNGN: number;
    amountCrypto: number;
    rate: number;
    fee: number;
    total: number;
    token: string;
    feePercentage: number;
    feeCap: number;
}

export function useExchangeRate(token: string = 'USDT') {
    return useQuery({
        queryKey: ['exchange-rate', token],
        queryFn: () => api.get<ExchangeRateResponse>(`/exchange-rate/current/${token}`),
        refetchInterval: 60000, // Refresh every 60 seconds
    });
}

export function useExchangeRateCalculated(amountNGN: number, token: string = 'USDT') {
    return useQuery({
        queryKey: ['exchange-rate-calculated', amountNGN, token],
        queryFn: () => api.get<ExchangeRateCalculatedResponse>(`/exchange-rate/calculate/${amountNGN}?token=${token}`),
        enabled: amountNGN > 0,
        refetchInterval: 60000, // Refresh every 60 seconds
    });
}
