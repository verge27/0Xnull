import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as apiService from '@/services/api';

interface TokenContextType {
  token: string | null;
  balance: number | null;
  isLoading: boolean;
  error: string | null;
  hasToken: boolean;
  createToken: () => Promise<string | null>;
  enterToken: (token: string) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
  clearToken: () => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

const STORAGE_KEY = 'oxnull_token';

export function TokenProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEY);
    if (savedToken) {
      setToken(savedToken);
      refreshBalanceWithToken(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshBalanceWithToken = async (t: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiService.getBalance(t);
      setBalance(data.balance_cents / 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get balance';
      if (message.includes('not found') || message.includes('invalid') || message.includes('Invalid')) {
        clearTokenState();
        setError('Token is invalid or expired');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBalance = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    await refreshBalanceWithToken(token);
  }, [token]);

  const createTokenHandler = async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiService.createToken();
      const newToken = data.token;
      setToken(newToken);
      // API returns balance_usd, convert to balance if needed
      const balanceValue = data.balance_cents !== undefined 
        ? data.balance_cents / 100 
        : data.balance_usd;
      setBalance(balanceValue);
      localStorage.setItem(STORAGE_KEY, newToken);
      return newToken;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create token');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const enterToken = async (inputToken: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiService.getTokenInfo(inputToken);
      setToken(inputToken);
      // Handle both balance_cents and balance_usd
      const balanceValue = data.balance_cents !== undefined 
        ? data.balance_cents / 100 
        : data.balance_usd;
      setBalance(balanceValue);
      localStorage.setItem(STORAGE_KEY, inputToken);
      return true;
    } catch (err) {
      setError('Invalid token');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearTokenState = () => {
    setToken(null);
    setBalance(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateBalance = (newBalance: number) => {
    setBalance(newBalance);
  };

  return (
    <TokenContext.Provider
      value={{
        token,
        balance,
        isLoading,
        error,
        hasToken: !!token,
        createToken: createTokenHandler,
        enterToken,
        refreshBalance,
        updateBalance,
        clearToken: clearTokenState,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
}

export function useToken() {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error('useToken must be used within a TokenProvider');
  }
  return context;
}
