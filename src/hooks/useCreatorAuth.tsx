import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { creatorApi, CreatorProfile, CreatorStats } from '@/services/creatorApi';
import { 
  generateKeypair, 
  getPubkeyFromPrivate, 
  signChallenge, 
  isValidPrivateKey,
  truncateKey 
} from '@/lib/creatorCrypto';

interface CreatorUser {
  id: string;
  publicKey: string;
  displayName: string;
  stats?: CreatorStats;
}

interface CreatorAuthContextType {
  // State
  creator: CreatorUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Keypair generation/import
  generatedKeypair: { publicKey: string; privateKey: string } | null;
  generateNewKeypair: () => { publicKey: string; privateKey: string };
  importKeypair: (privateKey: string) => { publicKey: string; privateKey: string };
  clearKeypair: () => void;
  hasStoredKeypair: boolean;
  
  // Auth actions
  register: (privateKey: string, displayName: string, bio?: string) => Promise<void>;
  login: (privateKey: string) => Promise<void>;
  logout: () => void;
  
  // Profile
  refreshProfile: () => Promise<void>;
  
  // Helpers
  truncateKey: typeof truncateKey;
}

const CreatorAuthContext = createContext<CreatorAuthContextType | undefined>(undefined);

const PRIVATE_KEY_STORAGE = 'creator_private_key_encrypted';
const PENDING_KEYPAIR_STORAGE = 'creator_pending_keypair';

// Helper to safely get/set keypair from sessionStorage
const getStoredKeypair = (): { publicKey: string; privateKey: string } | null => {
  try {
    const stored = sessionStorage.getItem(PENDING_KEYPAIR_STORAGE);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.publicKey && parsed.privateKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse stored keypair:', e);
  }
  return null;
};

const storeKeypair = (keypair: { publicKey: string; privateKey: string } | null) => {
  try {
    if (keypair) {
      sessionStorage.setItem(PENDING_KEYPAIR_STORAGE, JSON.stringify(keypair));
    } else {
      sessionStorage.removeItem(PENDING_KEYPAIR_STORAGE);
    }
  } catch (e) {
    console.error('Failed to store keypair:', e);
  }
};

export const CreatorAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [creator, setCreator] = useState<CreatorUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedKeypair, setGeneratedKeypair] = useState<{ publicKey: string; privateKey: string } | null>(() => {
    // Initialize from sessionStorage if available
    return getStoredKeypair();
  });

  // Initialize - check for existing session
  useEffect(() => {
    const initAuth = async () => {
      if (creatorApi.isAuthenticated()) {
        try {
          const profile = await creatorApi.getMyProfile();
          setCreator({
            id: profile.id,
            publicKey: profile.pubkey,
            displayName: profile.display_name,
            stats: {
              total_earnings_xmr: profile.total_earnings_xmr,
              total_views: profile.total_views,
              total_unlocks: profile.total_unlocks,
            },
          });
        } catch (error) {
          console.error('Failed to fetch creator profile:', error);
          creatorApi.clearSession();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const generateNewKeypair = useCallback(() => {
    const keypair = generateKeypair();
    setGeneratedKeypair(keypair);
    storeKeypair(keypair);
    return keypair;
  }, []);

  const importKeypair = useCallback((privateKeyHex: string) => {
    if (!isValidPrivateKey(privateKeyHex)) {
      throw new Error('Invalid private key format. Expected 128 hex characters.');
    }
    const publicKey = getPubkeyFromPrivate(privateKeyHex);
    const keypair = { publicKey, privateKey: privateKeyHex };
    setGeneratedKeypair(keypair);
    storeKeypair(keypair);
    return keypair;
  }, []);

  const clearKeypair = useCallback(() => {
    setGeneratedKeypair(null);
    storeKeypair(null);
  }, []);

  // Check if there's a stored keypair (for UI indication)
  const hasStoredKeypair = generatedKeypair !== null;

  const performAuth = async (privateKey: string, publicKey: string): Promise<string> => {
    // Get challenge
    const { challenge } = await creatorApi.getChallenge(publicKey);
    
    // Sign challenge
    const signature = signChallenge(privateKey, challenge);
    
    // Verify and get token
    const { token, creator_id } = await creatorApi.verifySignature(publicKey, signature);
    
    // Store session with pubkey (per spec: store pubkey, not creator_id)
    creatorApi.setToken(token, publicKey);
    
    return creator_id;
  };

  const register = async (privateKey: string, displayName: string, bio?: string) => {
    if (!isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key format');
    }

    const publicKey = getPubkeyFromPrivate(privateKey);
    
    // Register profile (may fail with 403 if not whitelisted)
    try {
      await creatorApi.register(publicKey, displayName, bio);
    } catch (error) {
      if (error instanceof Error && error.message.includes('403')) {
        throw new Error('Not yet approved. Send your public key to admin for whitelist approval.');
      }
      throw error;
    }
    
    // Authenticate
    const creatorId = await performAuth(privateKey, publicKey);
    
    // Fetch full profile
    const profile = await creatorApi.getMyProfile();
    
    setCreator({
      id: creatorId,
      publicKey,
      displayName: profile.display_name,
      stats: {
        total_earnings_xmr: profile.total_earnings_xmr,
        total_views: profile.total_views,
        total_unlocks: profile.total_unlocks,
      },
    });
    
    // Clear generated keypair from memory and storage
    setGeneratedKeypair(null);
    storeKeypair(null);
  };

  const login = async (privateKey: string) => {
    if (!isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key format. Expected 128 hex characters.');
    }

    const publicKey = getPubkeyFromPrivate(privateKey);
    
    // Authenticate
    const creatorId = await performAuth(privateKey, publicKey);
    
    // Fetch profile
    const profile = await creatorApi.getMyProfile();
    
    setCreator({
      id: creatorId,
      publicKey,
      displayName: profile.display_name,
      stats: {
        total_earnings_xmr: profile.total_earnings_xmr,
        total_views: profile.total_views,
        total_unlocks: profile.total_unlocks,
      },
    });
  };

  const logout = () => {
    creatorApi.clearSession();
    setCreator(null);
    setGeneratedKeypair(null);
    storeKeypair(null);
  };

  const refreshProfile = async () => {
    if (!creatorApi.isAuthenticated()) return;
    
    try {
      const profile = await creatorApi.getMyProfile();
      setCreator(prev => prev ? {
        ...prev,
        displayName: profile.display_name,
        stats: {
          total_earnings_xmr: profile.total_earnings_xmr,
          total_views: profile.total_views,
          total_unlocks: profile.total_unlocks,
        },
      } : null);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  return (
    <CreatorAuthContext.Provider
      value={{
        creator,
        isLoading,
        isAuthenticated: !!creator,
        generatedKeypair,
        generateNewKeypair,
        importKeypair,
        clearKeypair,
        hasStoredKeypair,
        register,
        login,
        logout,
        refreshProfile,
        truncateKey,
      }}
    >
      {children}
    </CreatorAuthContext.Provider>
  );
};

export const useCreatorAuth = () => {
  const context = useContext(CreatorAuthContext);
  if (context === undefined) {
    throw new Error('useCreatorAuth must be used within a CreatorAuthProvider');
  }
  return context;
};
