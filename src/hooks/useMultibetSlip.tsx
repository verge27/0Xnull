import { useState, useCallback, useEffect } from 'react';
import { api, MultibetLegRequest, MultibetSlip, MultibetListItem } from '@/services/api';

export interface BetSlipItem {
  id: string; // local id for UI
  marketId: string;
  marketTitle: string;
  side: 'YES' | 'NO';
  amount: number;
}

const STORAGE_KEY = 'multibet_slip';
const SLIPS_STORAGE_KEY = 'multibet_slips';

export function useMultibetSlip() {
  const [items, setItems] = useState<BetSlipItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [activeSlip, setActiveSlip] = useState<MultibetSlip | null>(null);
  const [savedSlips, setSavedSlips] = useState<MultibetSlip[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
      const storedSlips = localStorage.getItem(SLIPS_STORAGE_KEY);
      if (storedSlips) {
        setSavedSlips(JSON.parse(storedSlips));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage when items change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Save slips to localStorage when they change
  useEffect(() => {
    localStorage.setItem(SLIPS_STORAGE_KEY, JSON.stringify(savedSlips));
  }, [savedSlips]);

  const addToBetSlip = useCallback((
    marketId: string,
    marketTitle: string,
    side: 'YES' | 'NO',
    amount: number = 5
  ) => {
    setItems(prev => {
      // Check if same market+side already exists
      const existing = prev.find(i => i.marketId === marketId && i.side === side);
      if (existing) {
        // Update amount
        return prev.map(i => 
          i.id === existing.id ? { ...i, amount: i.amount + amount } : i
        );
      }
      // Add new item
      return [...prev, {
        id: `${marketId}_${side}_${Date.now()}`,
        marketId,
        marketTitle,
        side,
        amount,
      }];
    });
    setIsOpen(true);
  }, []);

  const removeFromBetSlip = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateAmount = useCallback((id: string, amount: number) => {
    if (amount < 0.5) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, amount } : i));
  }, []);

  const reorderItems = useCallback((newItems: BetSlipItem[]) => {
    setItems(newItems);
  }, []);

  const clearBetSlip = useCallback(() => {
    setItems([]);
    setActiveSlip(null);
  }, []);

  const totalUsd = items.reduce((sum, i) => sum + i.amount, 0);

  const checkout = useCallback(async (payoutAddress?: string) => {
    if (items.length === 0) return null;
    
    setIsCheckingOut(true);
    try {
      const legs: MultibetLegRequest[] = items.map(item => ({
        market_id: item.marketId,
        side: item.side,
        amount_usd: item.amount,
      }));

      const slip = await api.createMultibet(legs, payoutAddress);
      setActiveSlip(slip);
      setSavedSlips(prev => [...prev, slip]);
      return slip;
    } finally {
      setIsCheckingOut(false);
    }
  }, [items]);

  const checkSlipStatus = useCallback(async (slipId: string) => {
    const slip = await api.getMultibetSlip(slipId);
    setActiveSlip(slip);
    // Update in saved slips
    setSavedSlips(prev => prev.map(s => s.slip_id === slipId ? slip : s));
    return slip;
  }, []);

  const updatePayoutAddress = useCallback(async (slipId: string, payoutAddress: string) => {
    const result = await api.updateMultibetPayoutAddress(slipId, payoutAddress);
    if (result.status === 'updated') {
      setActiveSlip(prev => prev ? { ...prev, payout_address: payoutAddress } : prev);
      setSavedSlips(prev => prev.map(s => 
        s.slip_id === slipId ? { ...s, payout_address: payoutAddress } : s
      ));
    }
    return result;
  }, []);

  const cleanupOldSlips = useCallback(() => {
    // Remove slips older than 30 days or that are paid
    const thirtyDaysAgo = Date.now() / 1000 - (30 * 24 * 60 * 60);
    setSavedSlips(prev => prev.filter(s => 
      s.status !== 'paid' || (s.created_at && s.created_at > thirtyDaysAgo)
    ));
  }, []);

  return {
    items,
    isOpen,
    setIsOpen,
    addToBetSlip,
    removeFromBetSlip,
    updateAmount,
    reorderItems,
    clearBetSlip,
    totalUsd,
    checkout,
    isCheckingOut,
    activeSlip,
    setActiveSlip,
    checkSlipStatus,
    updatePayoutAddress,
    savedSlips,
    cleanupOldSlips,
  };
}
