/**
 * Cryptographic utilities for private key authentication
 * Uses Ed25519-style signing via Web Crypto API
 */

// Generate a random 32-byte private key
export const generatePrivateKey = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

// Derive a public key from private key using SHA-256 hash
export const derivePublicKey = async (privateKey: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(privateKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

// Create a signature for authentication (hash of private key + timestamp)
export const createAuthSignature = async (privateKey: string, challenge: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(privateKey + challenge);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

// Verify a signature
export const verifySignature = async (
  publicKey: string,
  privateKey: string,
  challenge: string,
  signature: string
): Promise<boolean> => {
  const derivedPublic = await derivePublicKey(privateKey);
  if (derivedPublic !== publicKey) return false;
  
  const expectedSignature = await createAuthSignature(privateKey, challenge);
  return expectedSignature === signature;
};

// Generate a display-friendly key ID (first 8 chars of public key)
export const getKeyId = (publicKey: string): string => {
  return publicKey.substring(0, 8).toUpperCase();
};

// Validate private key format (64 hex chars = 32 bytes)
export const isValidPrivateKey = (key: string): boolean => {
  return /^[a-fA-F0-9]{64}$/.test(key);
};
