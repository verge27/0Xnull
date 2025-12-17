import { useState, useEffect, useCallback } from 'react';
import { api, type PredictionBetResponse, type PredictionBetStatus } from '@/services/api';

// Re-export types for convenience
export type PlaceBetResponse = PredictionBetResponse;
export type BetStatusResponse = PredictionBetStatus;

// Local storage bet structure
export interface PredictionBet {
  bet_id: string;
  market_id: string;
  side: 'YES' | 'NO';
  amount_usd: number;
  amount_xmr: number;
  xmr_price: number;
  deposit_address: string;
  view_key?: string;
  payout_address?: string;
  payout_xmr?: number;
  payout_tx_hash?: string;
  status: 'awaiting_deposit' | 'confirmed' | 'won' | 'lost' | 'paid';
  created_at: string;
  expires_at: string;
}

const STORAGE_KEY = '0xnull_prediction_bets';

export function usePredictionBets() {
  const [bets, setBets] = useState<PredictionBet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load bets from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setBets(parsed);
      } catch (e) {
        console.error('Failed to parse stored bets:', e);
      }
    }
  }, []);

  // Save bets to localStorage whenever they change
  useEffect(() => {
    if (bets.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));
    }
  }, [bets]);

  // Place a new bet - just stores locally, actual API call happens in Predictions.tsx
  const placeBet = useCallback(async (
    marketId: string,
    side: 'YES' | 'NO',
    amountUsd: number
  ): Promise<PlaceBetResponse | null> => {
    // This is now just for local storage - the API call happens in the component
    return null;
  }, []);

  // Store a bet after API response
  const storeBet = useCallback((data: PlaceBetResponse) => {
    const newBet: PredictionBet = {
      bet_id: data.bet_id,
      market_id: data.market_id,
      side: data.side,
      amount_usd: data.amount_usd,
      amount_xmr: data.amount_xmr,
      xmr_price: data.xmr_price,
      deposit_address: data.deposit_address,
      view_key: data.view_key,
      status: 'awaiting_deposit',
      created_at: new Date().toISOString(),
      expires_at: data.expires_at,
    };
    setBets((prev) => [...prev, newBet]);
  }, []);

  // Check bet status
  const checkBetStatus = useCallback(async (betId: string): Promise<BetStatusResponse | null> => {
    try {
      const data = await api.getPredictionBetStatus(betId);

      // Update local storage if status changed
      setBets((prev) =>
        prev.map((bet) =>
          bet.bet_id === betId
            ? { 
                ...bet, 
                status: data.status,
                payout_xmr: data.payout_xmr,
                payout_tx_hash: data.payout_tx_hash,
                payout_address: data.payout_address || bet.payout_address,
              }
            : bet
        )
      );

      return data;
    } catch (e) {
      console.error('Failed to check bet status:', e);
      return null;
    }
  }, []);

  // Submit payout address for a bet
  const submitPayoutAddress = useCallback(async (
    betId: string,
    payoutAddress: string
  ): Promise<boolean> => {
    try {
      await api.submitPredictionPayoutAddress(betId, payoutAddress);

      // Update local storage
      setBets((prev) =>
        prev.map((bet) =>
          bet.bet_id === betId
            ? { ...bet, payout_address: payoutAddress }
            : bet
        )
      );

      return true;
    } catch (e) {
      console.error('Failed to submit payout address:', e);
      return false;
    }
  }, []);

  // Get bets for a specific market
  const getBetsForMarket = useCallback((marketId: string) => {
    return bets.filter((bet) => bet.market_id === marketId);
  }, [bets]);

  // Get bet by ID
  const getBet = useCallback((betId: string) => {
    return bets.find((bet) => bet.bet_id === betId);
  }, [bets]);

  // Remove expired/old bets from storage
  const cleanupOldBets = useCallback(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setBets((prev) =>
      prev.filter((bet) => {
        const createdAt = new Date(bet.created_at);
        // Keep confirmed bets and recent pending bets
        return bet.status !== 'awaiting_deposit' || createdAt > thirtyDaysAgo;
      })
    );
  }, []);

  // Run cleanup on mount
  useEffect(() => {
    cleanupOldBets();
  }, [cleanupOldBets]);

  return {
    bets,
    loading,
    error,
    placeBet,
    storeBet,
    checkBetStatus,
    submitPayoutAddress,
    getBetsForMarket,
    getBet,
    cleanupOldBets,
  };
}
