// Centralized betting configuration
// Change these values to update betting limits across the entire app

export const BETTING_CONFIG = {
  /** Minimum bet amount in USD */
  MINIMUM_BET_USD: 0.20,
  
  /** Maximum bet amount in USD */
  MAXIMUM_BET_USD: 10000,
  
  /** Default bet amount in USD */
  DEFAULT_BET_USD: 1.00,
} as const;

// Validation helpers
export const validateBetAmount = (amountUsd: number): { valid: boolean; error?: string } => {
  if (isNaN(amountUsd) || amountUsd <= 0) {
    return { valid: false, error: 'Please enter a valid amount' };
  }
  
  if (amountUsd < BETTING_CONFIG.MINIMUM_BET_USD) {
    return { 
      valid: false, 
      error: `Minimum bet is $${BETTING_CONFIG.MINIMUM_BET_USD.toFixed(2)}` 
    };
  }
  
  if (amountUsd > BETTING_CONFIG.MAXIMUM_BET_USD) {
    return { 
      valid: false, 
      error: `Maximum bet is $${BETTING_CONFIG.MAXIMUM_BET_USD.toLocaleString()}` 
    };
  }
  
  return { valid: true };
};

// Format minimum bet for display
export const formatMinimumBet = (): string => {
  return `$${BETTING_CONFIG.MINIMUM_BET_USD.toFixed(2)}`;
};
