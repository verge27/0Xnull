import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generatePrivateKey, derivePublicKey, getKeyId, isValidPrivateKey } from '@/lib/crypto';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PrivateKeyUser {
  id: string;
  publicKey: string;
  keyId: string;
  displayName: string;
}

interface PrivateKeyAuthContextType {
  privateKeyUser: PrivateKeyUser | null;
  isLoading: boolean;
  generateNewKeys: () => Promise<{ privateKey: string; publicKey: string; keyId: string } | null>;
  signInWithKey: (privateKey: string) => Promise<boolean>;
  validateKey: (privateKey: string) => Promise<PrivateKeyUser | null>;
  confirmSignIn: (user: PrivateKeyUser, privateKey?: string) => void;
  signOut: () => void;
  isAuthenticated: boolean;
  storedPrivateKey: string | null;
  clearStoredPrivateKey: () => void;
  savePrivateKey: (key: string) => void;
}

const STORAGE_KEY = 'pk_session';
const PRIVATE_KEY_STORAGE = 'pk_private_key';

const PrivateKeyAuthContext = createContext<PrivateKeyAuthContextType | undefined>(undefined);

export const PrivateKeyAuthProvider = ({ children }: { children: ReactNode }) => {
  const [privateKeyUser, setPrivateKeyUser] = useState<PrivateKeyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storedPrivateKey, setStoredPrivateKey] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPrivateKeyUser(parsed);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    // Load stored private key
    const storedKey = localStorage.getItem(PRIVATE_KEY_STORAGE);
    if (storedKey) {
      setStoredPrivateKey(storedKey);
    }
    setIsLoading(false);
  }, []);

  const clearStoredPrivateKey = () => {
    localStorage.removeItem(PRIVATE_KEY_STORAGE);
    setStoredPrivateKey(null);
    toast.success('Private key cleared from storage');
  };

  const savePrivateKey = (key: string) => {
    if (key.length === 64) {
      localStorage.setItem(PRIVATE_KEY_STORAGE, key);
      setStoredPrivateKey(key);
      toast.success('Private key saved to storage');
    }
  };

  const generateNewKeys = async () => {
    try {
      const privateKey = generatePrivateKey();
      const publicKey = await derivePublicKey(privateKey);
      const keyId = getKeyId(publicKey);
      const displayName = `Anon_${keyId}`;

      // Register the public key in the database using any type to bypass type checking
      // until types are regenerated
      const { data, error } = await (supabase as any)
        .from('private_key_users')
        .insert({
          public_key: publicKey,
          display_name: displayName
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to register key:', error);
        toast.error('Failed to create anonymous account');
        return null;
      }

      const user: PrivateKeyUser = { 
        id: data.id,
        publicKey, 
        keyId, 
        displayName 
      };
      setPrivateKeyUser(user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      // Also store the private key for easy access
      localStorage.setItem(PRIVATE_KEY_STORAGE, privateKey);
      setStoredPrivateKey(privateKey);

      return { privateKey, publicKey, keyId };
    } catch (error) {
      console.error('Key generation failed:', error);
      toast.error('Failed to generate keys');
      return null;
    }
  };

  // Validates key and returns user data WITHOUT setting state
  const validateKey = async (privateKey: string): Promise<PrivateKeyUser | null> => {
    if (!isValidPrivateKey(privateKey)) {
      toast.error('Invalid private key format');
      return null;
    }

    try {
      const publicKey = await derivePublicKey(privateKey);
      
      const { data, error } = await (supabase as any)
        .from('private_key_users')
        .select('*')
        .eq('public_key', publicKey)
        .maybeSingle();

      if (error) {
        console.error('Lookup failed:', error);
        toast.error('Failed to verify key');
        return null;
      }

      if (!data) {
        toast.error('Private key not registered. Generate a new key pair first.');
        return null;
      }

      const keyId = getKeyId(publicKey);
      return {
        id: data.id,
        publicKey,
        keyId,
        displayName: data.display_name
      };
    } catch (error) {
      console.error('Validation failed:', error);
      toast.error('Failed to verify key');
      return null;
    }
  };

  // Confirms sign-in by setting state (call after user copies key)
  const confirmSignIn = (user: PrivateKeyUser, privateKey?: string) => {
    setPrivateKeyUser(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    // Store private key if provided
    if (privateKey) {
      localStorage.setItem(PRIVATE_KEY_STORAGE, privateKey);
      setStoredPrivateKey(privateKey);
    }
    toast.success(`Welcome back, ${user.displayName}!`);
  };

  const signInWithKey = async (privateKey: string): Promise<boolean> => {
    const user = await validateKey(privateKey);
    if (user) {
      confirmSignIn(user, privateKey);
      return true;
    }
    return false;
  };

  const signOut = () => {
    setPrivateKeyUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PRIVATE_KEY_STORAGE);
    setStoredPrivateKey(null);
    toast.success('Signed out');
  };

  return (
    <PrivateKeyAuthContext.Provider
      value={{
        privateKeyUser,
        isLoading,
        generateNewKeys,
        signInWithKey,
        validateKey,
        confirmSignIn,
        signOut,
        isAuthenticated: !!privateKeyUser,
        storedPrivateKey,
        clearStoredPrivateKey,
        savePrivateKey
      }}
    >
      {children}
    </PrivateKeyAuthContext.Provider>
  );
};

export const usePrivateKeyAuth = () => {
  const context = useContext(PrivateKeyAuthContext);
  if (context === undefined) {
    throw new Error('usePrivateKeyAuth must be used within a PrivateKeyAuthProvider');
  }
  return context;
};
