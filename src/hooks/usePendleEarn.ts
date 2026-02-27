import { useState, useEffect, useCallback, useRef } from "react";
import type { PendleMarket, PendleComparison, PendlePosition } from "@/types/pendle";
import {
  fetchPendleMarkets,
  fetchPendleCompare,
  fetchPendlePositions,
  submitPendleDeposit,
  submitPendleWithdraw,
} from "@/lib/pendleApi";

interface UsePendleEarnReturn {
  markets: PendleMarket[];
  comparisons: PendleComparison[];
  bestAdvantage: PendleComparison | null;
  positions: PendlePosition[];
  loading: boolean;
  error: string | null;
  txPending: boolean;
  deposit: (marketAddress: string, amount: number, userAddress: string) => Promise<{ deposit_address?: string; instructions?: string; error?: string }>;
  withdraw: (positionId: string, userAddress: string) => Promise<{ tx_hash?: string; error?: string }>;
  refresh: () => void;
}

export function usePendleEarn(token: string | null): UsePendleEarnReturn {
  const [markets, setMarkets] = useState<PendleMarket[]>([]);
  const [comparisons, setComparisons] = useState<PendleComparison[]>([]);
  const [bestAdvantage, setBestAdvantage] = useState<PendleComparison | null>(null);
  const [positions, setPositions] = useState<PendlePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txPending, setTxPending] = useState(false);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const fetchPublicData = useCallback(async () => {
    try {
      const [mkts, cmp] = await Promise.all([fetchPendleMarkets(), fetchPendleCompare()]);
      setMarkets(mkts.markets);
      setComparisons(cmp.comparisons);
      setBestAdvantage(cmp.summary.best_pendle_advantage);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to fetch Pendle data");
    }
  }, []);

  const fetchPositionData = useCallback(async () => {
    const t = tokenRef.current;
    if (!t) return;
    try {
      const data = await fetchPendlePositions(t);
      setPositions(data.positions);
    } catch (e: any) {
      console.warn("Pendle positions fetch failed:", e.message);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchPublicData();
    if (tokenRef.current) fetchPositionData();
  }, [fetchPublicData, fetchPositionData]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchPublicData().finally(() => setLoading(false));
  }, [fetchPublicData]);

  // Public data polling — 5 min
  useEffect(() => {
    const id = setInterval(fetchPublicData, 300_000);
    return () => clearInterval(id);
  }, [fetchPublicData]);

  // Positions polling — 30s when token exists
  useEffect(() => {
    if (!token) {
      setPositions([]);
      return;
    }
    fetchPositionData();
    const id = setInterval(fetchPositionData, 30_000);
    return () => clearInterval(id);
  }, [token, fetchPositionData]);

  const deposit = useCallback(
    async (marketAddress: string, amount: number, userAddress: string) => {
      if (!tokenRef.current) return { error: "Not authenticated" };
      setTxPending(true);
      try {
        const res = await submitPendleDeposit({
          token: tokenRef.current,
          market_address: marketAddress,
          amount,
          user_address: userAddress,
        });
        fetchPositionData();
        return { deposit_address: res.deposit_address, instructions: res.instructions };
      } catch (e: any) {
        return { error: e.message || "Deposit failed" };
      } finally {
        setTxPending(false);
      }
    },
    [fetchPositionData],
  );

  const withdraw = useCallback(
    async (positionId: string, userAddress: string) => {
      if (!tokenRef.current) return { error: "Not authenticated" };
      setTxPending(true);
      try {
        const res = await submitPendleWithdraw({
          token: tokenRef.current,
          position_id: positionId,
          user_address: userAddress,
        });
        fetchPositionData();
        return { tx_hash: res.tx_hash };
      } catch (e: any) {
        return { error: e.message || "Withdraw failed" };
      } finally {
        setTxPending(false);
      }
    },
    [fetchPositionData],
  );

  return { markets, comparisons, bestAdvantage, positions, loading, error, txPending, deposit, withdraw, refresh };
}
