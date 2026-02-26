import { useState, useEffect, useCallback } from "react";
import type { AaveRate, EarnPosition } from "@/types/earn";
import { fetchAaveRates, fetchEarnPositions, submitEarnDeposit, submitEarnWithdraw } from "@/lib/earnApi";

interface UseAaveEarnReturn {
  rates: AaveRate[];
  positions: EarnPosition[];
  loading: boolean;
  error: string | null;
  txPending: boolean;
  deposit: (asset: string, amount: string) => Promise<{ tx_hash?: string; error?: string }>;
  withdraw: (asset: string, amount: string, destination: "reshield" | "wallet", walletAddress?: string) => Promise<{ tx_hash?: string; error?: string }>;
  refresh: () => void;
}

export function useAaveEarn(token: string | null): UseAaveEarnReturn {
  const [rates, setRates] = useState<AaveRate[]>([]);
  const [positions, setPositions] = useState<EarnPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txPending, setTxPending] = useState(false);

  const loadRates = useCallback(async () => {
    try {
      const data = await fetchAaveRates();
      setRates(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to fetch rates");
    }
  }, []);

  const loadPositions = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchEarnPositions(token);
      setPositions(data);
    } catch (e: any) {
      setError(e.message || "Failed to fetch positions");
    }
  }, [token]);

  const refresh = useCallback(() => {
    loadRates();
    if (token) loadPositions();
  }, [loadRates, loadPositions, token]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    loadRates().finally(() => setLoading(false));
  }, [loadRates]);

  // Load positions when token changes
  useEffect(() => {
    if (token) loadPositions();
    else setPositions([]);
  }, [token, loadPositions]);

  // Auto-refresh rates every 60s
  useEffect(() => {
    const id = setInterval(loadRates, 60_000);
    return () => clearInterval(id);
  }, [loadRates]);

  // Auto-refresh positions every 30s
  useEffect(() => {
    if (!token) return;
    const id = setInterval(loadPositions, 30_000);
    return () => clearInterval(id);
  }, [token, loadPositions]);

  const deposit = useCallback(async (asset: string, amount: string) => {
    if (!token) return { error: "No token provided" };
    setTxPending(true);
    try {
      const res = await submitEarnDeposit(asset, amount, token);
      if (res.status === "ok") {
        loadPositions();
        return { tx_hash: res.tx_hash };
      }
      return { error: res.message || "Deposit failed" };
    } catch (e: any) {
      return { error: e.message || "Deposit failed" };
    } finally {
      setTxPending(false);
    }
  }, [token, loadPositions]);

  const withdraw = useCallback(async (asset: string, amount: string, destination: "reshield" | "wallet", walletAddress?: string) => {
    if (!token) return { error: "No token provided" };
    setTxPending(true);
    try {
      const res = await submitEarnWithdraw(asset, amount, token, destination, walletAddress);
      if (res.status === "ok") {
        loadPositions();
        return { tx_hash: res.tx_hash };
      }
      return { error: res.message || "Withdraw failed" };
    } catch (e: any) {
      return { error: e.message || "Withdraw failed" };
    } finally {
      setTxPending(false);
    }
  }, [token, loadPositions]);

  return { rates, positions, loading, error, txPending, deposit, withdraw, refresh };
}
