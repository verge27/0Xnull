/**
 * Proof of Work utilities for Sybil prevention
 * Requires finding a nonce where SHA-256(challenge + nonce) starts with difficulty zeros
 */

const DIFFICULTY = 4; // Number of leading zeros required (4 = ~5-10 seconds)

export interface PoWResult {
  nonce: number;
  hash: string;
  timeMs: number;
}

/**
 * Solve a proof of work puzzle
 * Finds nonce where SHA-256(challenge + nonce) has DIFFICULTY leading zeros
 */
export const solvePoW = async (
  challenge: string,
  onProgress?: (hashesChecked: number) => void
): Promise<PoWResult> => {
  const startTime = Date.now();
  const target = '0'.repeat(DIFFICULTY);
  let nonce = 0;
  
  while (true) {
    const data = challenge + nonce.toString();
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (hash.startsWith(target)) {
      return {
        nonce,
        hash,
        timeMs: Date.now() - startTime
      };
    }
    
    nonce++;
    
    // Report progress every 10000 hashes
    if (onProgress && nonce % 10000 === 0) {
      onProgress(nonce);
      // Yield to UI thread
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
};

/**
 * Verify a proof of work solution
 */
export const verifyPoW = async (challenge: string, nonce: number): Promise<boolean> => {
  const data = challenge + nonce.toString();
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const target = '0'.repeat(DIFFICULTY);
  return hash.startsWith(target);
};

export const POW_DIFFICULTY = DIFFICULTY;
