import { useState, useCallback } from 'react';

const PASSKEY_STORAGE_KEY = 'pgp_passkey_data';

interface PasskeyData {
  credentialId: string;
  encryptedPassphrase: string;
  iv: string;
  salt: string;
}

export function usePasskey() {
  const [isSupported] = useState(() => {
    return typeof window !== 'undefined' && 
           !!window.PublicKeyCredential &&
           typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
  });

  const [hasPasskey, setHasPasskey] = useState(() => {
    return !!localStorage.getItem(PASSKEY_STORAGE_KEY);
  });

  // Check if platform authenticator is available (fingerprint, Face ID, etc.)
  const checkAvailability = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }, [isSupported]);

  // Generate a random challenge
  const generateChallenge = (): Uint8Array => {
    return crypto.getRandomValues(new Uint8Array(32));
  };

  // Derive encryption key from credential
  const deriveKey = async (rawId: ArrayBuffer, salt: Uint8Array): Promise<CryptoKey> => {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(rawId) as unknown as BufferSource,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as unknown as BufferSource,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  };

  // Register a new passkey and store encrypted passphrase
  const registerPasskey = useCallback(async (passphrase: string): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const challenge = generateChallenge();
      const userId = crypto.getRandomValues(new Uint8Array(16));

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challenge as unknown as BufferSource,
          rp: {
            name: '0xNull',
            id: window.location.hostname
          },
          user: {
            id: userId as unknown as BufferSource,
            name: '0xNull User',
            displayName: '0xNull Encryption'
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred'
          },
          timeout: 60000
        }
      }) as PublicKeyCredential;

      if (!credential) return false;

      // Encrypt the passphrase using key derived from credential
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(credential.rawId, salt);

      const encoder = new TextEncoder();
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as unknown as BufferSource },
        key,
        encoder.encode(passphrase)
      );

      // Store credential data
      const passkeyData: PasskeyData = {
        credentialId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
        encryptedPassphrase: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
        iv: btoa(String.fromCharCode(...iv)),
        salt: btoa(String.fromCharCode(...salt))
      };

      localStorage.setItem(PASSKEY_STORAGE_KEY, JSON.stringify(passkeyData));
      setHasPasskey(true);

      return true;
    } catch (e) {
      console.error('Failed to register passkey:', e);
      return false;
    }
  }, [isSupported]);

  // Authenticate with passkey and retrieve passphrase
  const authenticateWithPasskey = useCallback(async (): Promise<string | null> => {
    if (!isSupported || !hasPasskey) return null;

    try {
      const stored = localStorage.getItem(PASSKEY_STORAGE_KEY);
      if (!stored) return null;

      const passkeyData: PasskeyData = JSON.parse(stored);
      const credentialId = Uint8Array.from(atob(passkeyData.credentialId), c => c.charCodeAt(0));
      const challenge = generateChallenge();

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challenge as unknown as BufferSource,
          allowCredentials: [{
            id: credentialId as unknown as BufferSource,
            type: 'public-key',
            transports: ['internal']
          }],
          userVerification: 'required',
          timeout: 60000
        }
      }) as PublicKeyCredential;

      if (!assertion) return null;

      // Decrypt the passphrase
      const salt = Uint8Array.from(atob(passkeyData.salt), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(passkeyData.iv), c => c.charCodeAt(0));
      const encryptedData = Uint8Array.from(atob(passkeyData.encryptedPassphrase), c => c.charCodeAt(0));

      const key = await deriveKey(assertion.rawId, salt);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as unknown as BufferSource },
        key,
        encryptedData
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (e) {
      console.error('Failed to authenticate with passkey:', e);
      return null;
    }
  }, [isSupported, hasPasskey]);

  // Remove stored passkey
  const removePasskey = useCallback(() => {
    localStorage.removeItem(PASSKEY_STORAGE_KEY);
    setHasPasskey(false);
  }, []);

  return {
    isSupported,
    hasPasskey,
    checkAvailability,
    registerPasskey,
    authenticateWithPasskey,
    removePasskey
  };
}
