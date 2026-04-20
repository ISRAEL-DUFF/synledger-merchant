import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const TOKEN_KEY = 'merchant_token';
const MERCHANT_KEY = 'merchant_data';

export interface MerchantData {
  id: string;
  businessName: string;
  email: string;
  testMode: boolean;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );
  const [merchantData, setMerchantData] = useState<MerchantData | null>(() => {
    const stored = localStorage.getItem(MERCHANT_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post<{ access_token: string; merchant: MerchantData }>(
        '/api/merchant/auth/login',
        { email, password }
      );

      localStorage.setItem(TOKEN_KEY, response.access_token);
      localStorage.setItem(MERCHANT_KEY, JSON.stringify(response.merchant));

      setToken(response.access_token);
      setMerchantData(response.merchant);

      return true;
    } catch (error: any) {
      toast.error(error?.message || 'Invalid email or password');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(MERCHANT_KEY);
    setToken(null);
    setMerchantData(null);
  }, []);

  const isAuthenticated = !!token;

  return {
    token,
    merchantData,
    login,
    logout,
    isAuthenticated
  };
}
