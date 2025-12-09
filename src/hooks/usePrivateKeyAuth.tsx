import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generatePrivateKey, derivePublicKey, getKeyId, isValidPrivateKey } from '@/lib/crypto';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PrivateKeyUser {
  publicKey: string;
  keyId: string;
  displayName: string;
}

interface PrivateKeyAuthContextType {
  privateKeyUser: PrivateKeyUser | null;
  isLoading: boolean;
  generateNewKeys: () => Promise<{ privateKey: string; publicKey: string; keyId: string } | null>;
  signInWithKey: (privateKey: string) => Promise<boolean>;
  signOut: () => void;
  isAuthenticated: boolean;
}

const STORAGE_KEY = 'pk_session';

const PrivateKeyAuthContext = createContext<PrivateKeyAuthContextType | undefined>(undefined);

export const PrivateKeyAuthProvider = ({ children }: { children: ReactNode }) => {
  const [privateKeyUser, setPrivateKeyUser] = useState<PrivateKeyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    setIsLoading(false);
  }, []);

  const generateNewKeys = async () => {
    try {
      const privateKey = generatePrivateKey();
      const publicKey = await derivePublicKey(privateKey);
      const keyId = getKeyId(publicKey);
      const displayName = `Anon_${keyId}`;

      // Register the public key in the database
      const { error } = await supabase
        .from('private_key_users')
        .insert({
          public_key: publicKey,
          display_name: displayName
        });

      if (error) {
        console.error('Failed to register key:', error);
        toast.error('Failed to create anonymous account');
        return null;
      }

      const user: PrivateKeyUser = { publicKey, keyId, displayName };
      setPrivateKeyUser(user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

      return { privateKey, publicKey, keyId };
    } catch (error) {
      console.error('Key generation failed:', error);
      toast.error('Failed to generate keys');
      return null;
    }
  };

  const signInWithKey = async (privateKey: string): Promise<boolean> => {
    if (!isValidPrivateKey(privateKey)) {
      toast.error('Invalid private key format');
      return false;
    }

    try {
      const publicKey = await derivePublicKey(privateKey);
      
      // Look up the public key in the database
      const { data, error } = await supabase
        .from('private_key_users')
        .select('*')
        .eq('public_key', publicKey)
        .single();

      if (error || !data) {
        toast.error('Private key not registered. Generate a new key pair first.');
        return false;
      }

      const keyId = getKeyId(publicKey);
      const user: PrivateKeyUser = {
        publicKey,
        keyId,
        displayName: data.display_name
      };

      setPrivateKeyUser(user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      toast.success(`Welcome back, ${user.displayName}!`);
      return true;
    } catch (error) {
      console.error('Sign in failed:', error);
      toast.error('Failed to sign in');
      return false;
    }
  };

  const signOut = () => {
    setPrivateKeyUser(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Signed out');
  };

  return (
    <PrivateKeyAuthContext.Provider
      value={{
        privateKeyUser,
        isLoading,
        generateNewKeys,
        signInWithKey,
        signOut,
        isAuthenticated: !!privateKeyUser
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
