import { useState, useEffect, useCallback, useRef } from 'react';
import type { MorphoVault, MorphoPosition } from '@/types/morpho';
import {
  fetchMorphoVaults,
  fetchMorphoPositions,
  submitMorphoDeposit,
  submitMorphoWithdraw,
} from '@/lib/morphoApi';

interface UseMorphoEarnReturn {
  vaults: Record<string, MorphoVault[]>;
  flatVaults: MorphoVault[];
  positions: MorphoPosition[];
  totalDepositedUsd: number;
  loading: boolean;
  error: string | null;
  txPending: boolean;
  deposit: (asset: string, amount: number, vaultAddress?: string) => Promise<{ tx_hash?: string; error?: string }>;
  withdraw: (asset: string, amount: number, vaultAddress?: string, destinationAddress?: string) => Promise<{ withdraw_tx?: string; status?: string; error?: string }>;
  refresh: () => void;
}

export function useMorphoEarn(token: string | null): UseMorphoEarnReturn {
  const [vaults, setVaults] = useState<Record<string, MorphoVault[]>>({});
  const [positions, setPositions] = useState<MorphoPosition[]>([]);
  const [totalDepositedUsd, setTotalDepositedUsd] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txPending, setTxPending] = useState(false);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const flatVaults = Object.values(vaults).flat();

  const fetchPublicData = useCallback(async () => {
    try {
      const data = await fetchMorphoVaults();
      setVaults(data.vaults);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch Morpho data');
    }
  }, []);

  const fetchPositionData = useCallback(async () => {
    const t = tokenRef.current;
    if (!t) return;
    try {
      const data = await fetchMorphoPositions(t);
      setPositions(data.positions);
      setTotalDepositedUsd(data.total_deposited_usd);
    } catch (e: any) {
      console.warn('Morpho positions fetch failed:', e.message);
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

  // Positions polling — 30s
  useEffect(() => {
    if (!token) {
      setPositions([]);
      setTotalDepositedUsd(0);
      return;
    }
    fetchPositionData();
    const id = setInterval(fetchPositionData, 30_000);
    return () => clearInterval(id);
  }, [token, fetchPositionData]);

  const deposit = useCallback(
    async (asset: string, amount: number, vaultAddress?: string) => {
      if (!tokenRef.current) return { error: 'Not authenticated' };
      setTxPending(true);
      try {
        const res = await submitMorphoDeposit({
          token: tokenRef.current,
          asset,
          amount,
          vault_address: vaultAddress,
        });
        fetchPositionData();
        return { tx_hash: res.tx_hash };
      } catch (e: any) {
        return { error: e.message || 'Deposit failed' };
      } finally {
        setTxPending(false);
      }
    },
    [fetchPositionData],
  );

  const withdraw = useCallback(
    async (asset: string, amount: number, vaultAddress?: string, destinationAddress?: string) => {
      if (!tokenRef.current) return { error: 'Not authenticated' };
      setTxPending(true);
      try {
        const res = await submitMorphoWithdraw({
          token: tokenRef.current,
          asset,
          amount,
          vault_address: vaultAddress,
          destination_address: destinationAddress,
        });
        fetchPositionData();
        return { withdraw_tx: res.withdraw_tx, status: res.status };
      } catch (e: any) {
        return { error: e.message || 'Withdraw failed' };
      } finally {
        setTxPending(false);
      }
    },
    [fetchPositionData],
  );

  return { vaults, flatVaults, positions, totalDepositedUsd, loading, error, txPending, deposit, withdraw, refresh };
}
