import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePrivateKeyAuth } from './usePrivateKeyAuth';

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
  const { user } = useAuth();
  const { privateKeyUser } = usePrivateKeyAuth();
  const [token, setToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Get or create token, linking it to the authenticated user
  useEffect(() => {
    async function init() {
      setLoading(true);
      
      // Check if we have a stored token
      let storedToken = localStorage.getItem(STORAGE_KEY);
      
      // If authenticated with email/password, try to get token from profile
      if (user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('payment_token')
            .eq('id', user.id)
            .single();
          
          if (profile?.payment_token) {
            // Use the profile's token
            storedToken = profile.payment_token;
            localStorage.setItem(STORAGE_KEY, storedToken);
          } else if (storedToken) {
            // Link the existing local token to the profile
            await supabase
              .from('profiles')
              .update({ payment_token: storedToken })
              .eq('id', user.id);
          } else {
            // Create a new token and link it
            storedToken = await api.createToken();
            localStorage.setItem(STORAGE_KEY, storedToken);
            await supabase
              .from('profiles')
              .update({ payment_token: storedToken })
              .eq('id', user.id);
          }
        } catch (e) {
          console.error('Failed to sync token with profile:', e);
        }
      }
      
      // If authenticated with private key, try to get token from private_key_users
      if (privateKeyUser) {
        try {
          const { data: pkUser } = await (supabase as any)
            .from('private_key_users')
            .select('payment_token')
            .eq('public_key', privateKeyUser.publicKey)
            .single();
          
          if (pkUser?.payment_token) {
            // Use the stored token
            storedToken = pkUser.payment_token;
            localStorage.setItem(STORAGE_KEY, storedToken);
          } else if (storedToken) {
            // Link the existing local token to the private key user
            await (supabase as any)
              .from('private_key_users')
              .update({ payment_token: storedToken })
              .eq('public_key', privateKeyUser.publicKey);
          } else {
            // Create a new token and link it
            storedToken = await api.createToken();
            localStorage.setItem(STORAGE_KEY, storedToken);
            await (supabase as any)
              .from('private_key_users')
              .update({ payment_token: storedToken })
              .eq('public_key', privateKeyUser.publicKey);
          }
        } catch (e) {
          console.error('Failed to sync token with private key user:', e);
        }
      }
      
      // If no auth and no stored token, create a new anonymous token
      if (!storedToken) {
        try {
          storedToken = await api.createToken();
          localStorage.setItem(STORAGE_KEY, storedToken);
        } catch (e) {
          console.error('Failed to create token:', e);
          setLoading(false);
          return;
        }
      }
      
      setToken(storedToken);
      
      // Fetch balance
      try {
        const info = await api.getBalance(storedToken);
        setBalance(info.balance_usd);
      } catch (e) {
        console.error('Failed to get balance:', e);
      }
      
      setLoading(false);
    }
    
    init();
  }, [user, privateKeyUser]);

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
      
      // Save locally
      localStorage.setItem(STORAGE_KEY, newToken);
      setToken(newToken);
      setBalance(info.balance_usd);
      
      // Update in database if authenticated
      if (user) {
        await supabase
          .from('profiles')
          .update({ payment_token: newToken })
          .eq('id', user.id);
      }
      
      if (privateKeyUser) {
        await (supabase as any)
          .from('private_key_users')
          .update({ payment_token: newToken })
          .eq('public_key', privateKeyUser.publicKey);
      }
      
      return true;
    } catch (e) {
      console.error('Invalid token:', e);
      return false;
    }
  }, [user, privateKeyUser]);

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
