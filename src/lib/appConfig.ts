/**
 * App configuration fetched from the backend `/app-config` endpoint.
 * Provides both a React hook (`useAppConfig`) and a synchronous getter
 * (`getAppConfigSync`) for non-React code like paymentHelper.ts.
 *
 * Call `initAppConfig()` once at app startup to eagerly preload.
 */

import { useState, useEffect } from 'react';
import { API_URL } from './api';

// ============================================
// Types
// ============================================
export interface ChainConfigEntry {
  chainId: number;
  chainName: string;
  rpcUrl: string | null;
  escrowManager: string | null;
  expenseVerifier: string | null;
  usdt: string | null;
  usdc: string | null;
  blockExplorer: string | null;
  symbol: string;
  isEVM: boolean;
  enabled: boolean;
}

export interface AppConfig {
  defaultChain: string;
  defaultToken: string;
  networkEnvironment: 'testnet' | 'mainnet';
  chains: Record<string, ChainConfigEntry>;
}

// ============================================
// Module-level singleton
// ============================================
let _config: AppConfig | null = null;
let _configPromise: Promise<AppConfig> | null = null;
let _error: string | null = null;

async function fetchAppConfig(): Promise<AppConfig> {
  const response = await fetch(`${API_URL}/app-config`);
  if (!response.ok) {
    throw new Error(`Failed to fetch app config: ${response.status}`);
  }
  const data = await response.json();
  return data as AppConfig;
}

/**
 * Call once at app startup (e.g. in main.tsx) to eagerly preload config.
 */
export async function initAppConfig(): Promise<AppConfig> {
  if (_config) return _config;
  if (_configPromise) return _configPromise;

  _configPromise = fetchAppConfig()
    .then((config) => {
      _config = config;
      _error = null;
      console.log('✅ App config loaded from backend');
      return config;
    })
    .catch((err) => {
      _error = err.message;
      console.error('❌ Failed to load app config:', err);
      throw err;
    });

  return _configPromise;
}

/**
 * Synchronous getter for non-React code (e.g. paymentHelper.ts).
 * Returns null if config hasn't loaded yet.
 */
export function getAppConfigSync(): AppConfig | null {
  return _config;
}

/**
 * Get chain config by name. Falls back to null if not loaded.
 */
export function getChainConfigSync(
  chain: string
): ChainConfigEntry | null {
  if (!_config) return null;
  return _config.chains[chain] ?? null;
}

/**
 * React hook that provides the app config with loading/error states.
 */
export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(_config);
  const [loading, setLoading] = useState(!_config);
  const [error, setError] = useState<string | null>(_error);

  useEffect(() => {
    if (_config) {
      setConfig(_config);
      setLoading(false);
      return;
    }

    initAppConfig()
      .then((c) => {
        setConfig(c);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { config, loading, error };
}
