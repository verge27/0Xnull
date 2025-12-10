import { useState, useCallback } from 'react';
import * as openpgp from 'openpgp';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePrivateKeyAuth } from './usePrivateKeyAuth';

interface PGPKeys {
  publicKey: string;
  privateKey: string;
}

// Local storage key for caching decrypted private key
const SESSION_KEY_STORAGE = 'pgp_session_key';
const SESSION_EXPIRY_STORAGE = 'pgp_session_expiry';
const SESSION_DURATION_DAYS = 7;

// Helper to check if session is expired
const isSessionExpired = (): boolean => {
  const expiry = localStorage.getItem(SESSION_EXPIRY_STORAGE);
  if (!expiry) return true;
  return Date.now() > parseInt(expiry, 10);
};

// Helper to set session with expiry
const setSessionWithExpiry = (key: string): void => {
  localStorage.setItem(SESSION_KEY_STORAGE, key);
  const expiryTime = Date.now() + (SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
  localStorage.setItem(SESSION_EXPIRY_STORAGE, expiryTime.toString());
};

// Helper to clear session
const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY_STORAGE);
  localStorage.removeItem(SESSION_EXPIRY_STORAGE);
};

export function usePGP() {
  const { user } = useAuth();
  const { privateKeyUser } = usePrivateKeyAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [decryptedPrivateKey, setDecryptedPrivateKey] = useState<string | null>(null);

  // Check if user has PGP keys set up
  const checkHasKeys = useCallback(async (): Promise<boolean> => {
    if (!user && !privateKeyUser) return false;

    try {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('pgp_public_key, pgp_encrypted_private_key')
          .eq('id', user.id)
          .single();
        return !!(data?.pgp_public_key && data?.pgp_encrypted_private_key);
      } else if (privateKeyUser) {
        const { data } = await supabase
          .from('private_key_users')
          .select('pgp_public_key, pgp_encrypted_private_key')
          .eq('id', privateKeyUser.id)
          .single();
        return !!(data?.pgp_public_key && data?.pgp_encrypted_private_key);
      }
    } catch (e) {
      console.error('Error checking PGP keys:', e);
    }
    return false;
  }, [user, privateKeyUser]);

  // Generate new PGP keypair and store encrypted
  const generateKeys = useCallback(async (passphrase: string): Promise<boolean> => {
    if (!user && !privateKeyUser) return false;

    try {
      const userId = user?.id || privateKeyUser?.id;
      const name = user?.email?.split('@')[0] || privateKeyUser?.displayName || 'Anonymous';
      const email = user?.email || `${userId}@tarimarket.local`;

      // Generate keypair
      const { privateKey, publicKey } = await openpgp.generateKey({
        type: 'ecc',
        curve: 'curve25519Legacy' as any,
        userIDs: [{ name, email }],
        passphrase,
      });

      // Store keys
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            pgp_public_key: publicKey,
            pgp_encrypted_private_key: privateKey // Already encrypted with passphrase
          })
          .eq('id', user.id);
        if (error) throw error;
      } else if (privateKeyUser) {
        // For private key users, we need a different approach since they can't update
        // We'll store in localStorage as fallback
        localStorage.setItem(`pgp_keys_${privateKeyUser.id}`, JSON.stringify({
          publicKey,
          encryptedPrivateKey: privateKey
        }));
      }

      // Cache decrypted key for session (7 days)
      setDecryptedPrivateKey(privateKey);
      setIsUnlocked(true);
      setSessionWithExpiry(privateKey);

      return true;
    } catch (e) {
      console.error('Error generating PGP keys:', e);
      return false;
    }
  }, [user, privateKeyUser]);

  // Unlock existing keys with passphrase
  const unlockKeys = useCallback(async (passphrase: string): Promise<boolean> => {
    if (!user && !privateKeyUser) return false;

    try {
      let encryptedPrivateKey: string | null = null;

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('pgp_encrypted_private_key')
          .eq('id', user.id)
          .single();
        encryptedPrivateKey = data?.pgp_encrypted_private_key || null;
      } else if (privateKeyUser) {
        const stored = localStorage.getItem(`pgp_keys_${privateKeyUser.id}`);
        if (stored) {
          encryptedPrivateKey = JSON.parse(stored).encryptedPrivateKey;
        }
      }

      if (!encryptedPrivateKey) return false;

      // Try to decrypt with passphrase
      const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: encryptedPrivateKey }),
        passphrase
      });

      // Store decrypted key for session (7 days)
      const armoredDecrypted = privateKey.armor();
      setDecryptedPrivateKey(armoredDecrypted);
      setIsUnlocked(true);
      setSessionWithExpiry(armoredDecrypted);

      return true;
    } catch (e) {
      console.error('Error unlocking PGP keys:', e);
      return false;
    }
  }, [user, privateKeyUser]);

  // Get recipient's public key
  const getRecipientPublicKey = useCallback(async (
    recipientUserId?: string,
    recipientPkUserId?: string
  ): Promise<string | null> => {
    try {
      if (recipientUserId) {
        const { data } = await supabase
          .from('profiles')
          .select('pgp_public_key')
          .eq('id', recipientUserId)
          .single();
        return data?.pgp_public_key || null;
      } else if (recipientPkUserId) {
        const stored = localStorage.getItem(`pgp_keys_${recipientPkUserId}`);
        if (stored) {
          return JSON.parse(stored).publicKey;
        }
      }
    } catch (e) {
      console.error('Error getting recipient public key:', e);
    }
    return null;
  }, []);

  // Encrypt message for recipient
  const encryptMessage = useCallback(async (
    message: string,
    recipientPublicKeyArmored: string
  ): Promise<string | null> => {
    try {
      const recipientKey = await openpgp.readKey({ armoredKey: recipientPublicKeyArmored });
      
      const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: message }),
        encryptionKeys: recipientKey,
      });

      return encrypted as string;
    } catch (e) {
      console.error('Error encrypting message:', e);
      return null;
    }
  }, []);

  // Decrypt message with our private key
  const decryptMessage = useCallback(async (encryptedMessage: string): Promise<string | null> => {
    if (!decryptedPrivateKey) {
      console.error('Private key not unlocked');
      return null;
    }

    try {
      const privateKey = await openpgp.readPrivateKey({ armoredKey: decryptedPrivateKey });
      
      const message = await openpgp.readMessage({ armoredMessage: encryptedMessage });
      
      const { data: decrypted } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey
      });

      return decrypted as string;
    } catch (e) {
      console.error('Error decrypting message:', e);
      return null;
    }
  }, [decryptedPrivateKey]);

  // Check if message is PGP encrypted
  const isPGPEncrypted = useCallback((message: string): boolean => {
    return message.includes('-----BEGIN PGP MESSAGE-----');
  }, []);

  // Try to restore session from localStorage (with expiry check)
  const restoreSession = useCallback(() => {
    if (isSessionExpired()) {
      clearSession();
      return false;
    }
    
    const cached = localStorage.getItem(SESSION_KEY_STORAGE);
    if (cached) {
      setDecryptedPrivateKey(cached);
      setIsUnlocked(true);
      return true;
    }
    return false;
  }, []);

  // Lock keys (clear session)
  const lockKeys = useCallback(() => {
    setDecryptedPrivateKey(null);
    setIsUnlocked(false);
    clearSession();
  }, []);

  return {
    isUnlocked,
    checkHasKeys,
    generateKeys,
    unlockKeys,
    lockKeys,
    restoreSession,
    encryptMessage,
    decryptMessage,
    getRecipientPublicKey,
    isPGPEncrypted,
  };
}
