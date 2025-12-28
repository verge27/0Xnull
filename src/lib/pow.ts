/**
 * Proof of Work utilities for Sybil resistance
 * Uses SHA-256 with adjustable difficulty
 */

const DIFFICULTY = 4; // Number of leading zeros required

/**
 * Solve a PoW puzzle for the given challenge
 * Returns the nonce that produces a hash with DIFFICULTY leading zeros
 */
export const solvePoW = async (
  challenge: string,
  onProgress?: (attempts: number) => void
): Promise<{ nonce: number; hash: string }> => {
  const encoder = new TextEncoder();
  let nonce = 0;
  const target = '0'.repeat(DIFFICULTY);

  while (true) {
    const data = challenge + nonce.toString();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hash.startsWith(target)) {
      return { nonce, hash };
    }

    nonce++;
    if (onProgress && nonce % 10000 === 0) {
      onProgress(nonce);
    }
  }
};

/**
 * Verify a PoW solution
 */
export const verifyPoW = async (challenge: string, nonce: number): Promise<boolean> => {
  const encoder = new TextEncoder();
  const data = challenge + nonce.toString();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const target = '0'.repeat(DIFFICULTY);
  return hash.startsWith(target);
};

export const POW_DIFFICULTY = DIFFICULTY;
