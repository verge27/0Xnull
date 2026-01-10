/**
 * Ed25519 cryptographic utilities for creator authentication
 * Uses tweetnacl for ed25519 keypair generation and signing
 */
import nacl from 'tweetnacl';

// Convert Uint8Array to hex string
export const encodeHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

// Convert hex string to Uint8Array
export const decodeHex = (hex: string): Uint8Array => {
  const matches = hex.match(/.{1,2}/g);
  if (!matches) return new Uint8Array(0);
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
};

// Generate a new ed25519 keypair
export const generateKeypair = (): { publicKey: string; privateKey: string } => {
  const keypair = nacl.sign.keyPair();
  return {
    publicKey: encodeHex(keypair.publicKey), // 64 hex chars (32 bytes)
    privateKey: encodeHex(keypair.secretKey), // 128 hex chars (64 bytes - includes pubkey)
  };
};

// Derive public key from private key (last 32 bytes of secret key)
export const getPubkeyFromPrivate = (privateKeyHex: string): string => {
  const secretKey = decodeHex(privateKeyHex);
  if (secretKey.length !== 64) {
    throw new Error('Invalid private key length. Expected 128 hex characters (64 bytes).');
  }
  // Last 32 bytes of the secret key is the public key
  return encodeHex(secretKey.slice(32));
};

// Sign a challenge message with the private key
export const signChallenge = (privateKeyHex: string, challenge: string): string => {
  const secretKey = decodeHex(privateKeyHex);
  if (secretKey.length !== 64) {
    throw new Error('Invalid private key length.');
  }
  const messageBytes = new TextEncoder().encode(challenge);
  const signature = nacl.sign.detached(messageBytes, secretKey);
  return encodeHex(signature);
};

// Verify a signature (for testing purposes)
export const verifySignature = (
  publicKeyHex: string,
  message: string,
  signatureHex: string
): boolean => {
  const publicKey = decodeHex(publicKeyHex);
  const messageBytes = new TextEncoder().encode(message);
  const signature = decodeHex(signatureHex);
  return nacl.sign.detached.verify(messageBytes, signature, publicKey);
};

// Validate private key format (128 hex chars = 64 bytes)
export const isValidPrivateKey = (key: string): boolean => {
  return /^[a-fA-F0-9]{128}$/.test(key);
};

// Validate public key format (64 hex chars = 32 bytes)
export const isValidPublicKey = (key: string): boolean => {
  return /^[a-fA-F0-9]{64}$/.test(key);
};

// Truncate key for display: "a1b2c3...f6a1b2"
export const truncateKey = (key: string | undefined | null, startChars = 6, endChars = 6): string => {
  if (!key) return '';
  if (key.length <= startChars + endChars + 3) return key;
  return `${key.slice(0, startChars)}...${key.slice(-endChars)}`;
};
