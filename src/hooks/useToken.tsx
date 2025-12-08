import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { api } from '@/services/api';

const STORAGE_KEY = 'oxnull_token';

interface TokenContextType {
  token: string | null;
  balance: number;
  loading: boolean;
  hasToken: boolean;
  refreshBalance: () => Promise<number | undefined>;
  setCustomToken: (newToken: string) => Promise<boolean>;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export function TokenProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      let stored = localStorage.getItem(STORAGE_KEY);
      
      if (!stored) {
        try {
          stored = await api.createToken();
          localStorage.setItem(STORAGE_KEY, stored);
        } catch (e) {
          console.error('Failed to create token:', e);
          setLoading(false);
          return;
        }
      }
      
      setToken(stored);
      
      try {
        const info = await api.getBalance(stored);
        setBalance(info.balance_usd);
      } catch (e) {
        console.error('Failed to get balance:', e);
      }
      
      setLoading(false);
    }
    
    init();
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!token) return;
    try {
      const info = await api.getBalance(token);
      setBalance(info.balance_usd);
      return info.balance_usd;
    } catch (e) {
      console.error('Failed to refresh balance:', e);
    }
  }, [token]);

  const setCustomToken = useCallback(async (newToken: string): Promise<boolean> => {
    try {
      // Validate the token by fetching its balance
      const info = await api.getBalance(newToken);
      
      // If successful, save and update state
      localStorage.setItem(STORAGE_KEY, newToken);
      setToken(newToken);
      setBalance(info.balance_usd);
      return true;
    } catch (e) {
      console.error('Invalid token:', e);
      return false;
    }
  }, []);

  return (
    <TokenContext.Provider value={{
      token,
      balance,
      loading,
      hasToken: !!token,
      refreshBalance,
      setCustomToken,
    }}>
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
