import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api, TokenInfo } from '@/lib/api';

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

export function TokenProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('0xnull_token');
    if (savedToken) {
      setToken(savedToken);
      api.setToken(savedToken);
      refreshBalance();
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!api.getToken()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await api.getTokenInfo();
    
    if (result.error) {
      // Token might be invalid
      if (result.error.includes('not found') || result.error.includes('invalid')) {
        clearToken();
        setError('Token is invalid or expired');
      } else {
        setError(result.error);
      }
    } else if (result.data) {
      setBalance(result.data.balance_usd);
    }

    setIsLoading(false);
  }, []);

  const createToken = async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    const result = await api.createToken();

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return null;
    }

    if (result.data) {
      const newToken = result.data.token;
      setToken(newToken);
      setBalance(result.data.balance_usd);
      api.setToken(newToken);
      setIsLoading(false);
      return newToken;
    }

    setIsLoading(false);
    return null;
  };

  const enterToken = async (inputToken: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    // Temporarily set the token to check it
    api.setToken(inputToken);
    const result = await api.getTokenInfo();

    if (result.error) {
      api.clearToken();
      setError('Invalid token');
      setIsLoading(false);
      return false;
    }

    if (result.data) {
      setToken(inputToken);
      setBalance(result.data.balance_usd);
      setIsLoading(false);
      return true;
    }

    api.clearToken();
    setIsLoading(false);
    return false;
  };

  const updateBalance = (newBalance: number) => {
    setBalance(newBalance);
  };

  const clearToken = () => {
    setToken(null);
    setBalance(null);
    api.clearToken();
  };

  return (
    <TokenContext.Provider
      value={{
        token,
        balance,
        isLoading,
        error,
        hasToken: !!token,
        createToken,
        enterToken,
        refreshBalance,
        updateBalance,
        clearToken,
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
