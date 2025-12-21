import { useState, useCallback, useEffect, useRef } from 'react';
import { api, MultibetLegRequest, MultibetSlip, MultibetListItem } from '@/services/api';

export interface BetSlipItem {
  id: string; // local id for UI
  marketId: string;
  marketTitle: string;
  side: 'YES' | 'NO';
  amount: number;
  yesPool: number;
  noPool: number;
}

const STORAGE_KEY = 'multibet_slip';
const SLIPS_STORAGE_KEY = 'multibet_slips';
const ACTIVE_SLIP_KEY = 'multibet_active_slip';
const UNDO_TIMEOUT = 5000; // 5 seconds to undo
const EXPIRY_MS = 60 * 60 * 1000; // 60 minutes

export function useMultibetSlip() {
  const [items, setItems] = useState<BetSlipItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [activeSlip, setActiveSlip] = useState<MultibetSlip | null>(null);
  const [savedSlips, setSavedSlips] = useState<MultibetSlip[]>([]);
  const [lastRemoved, setLastRemoved] = useState<{ item: BetSlipItem; index: number } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedItems = JSON.parse(stored);
          if (Array.isArray(parsedItems)) {
            setItems(parsedItems);
          }
        }
      } catch {
        // ignore
      }
    };

    const loadSlips = () => {
      try {
        const storedSlips = localStorage.getItem(SLIPS_STORAGE_KEY);
        if (storedSlips) {
          const parsedSlips = JSON.parse(storedSlips);
          if (Array.isArray(parsedSlips)) {
            setSavedSlips(parsedSlips);
          }
        }
      } catch {
        // ignore
      }
    };

    const loadActiveSlip = () => {
      try {
        const storedActiveSlip = localStorage.getItem(ACTIVE_SLIP_KEY);
        if (storedActiveSlip) {
          const slip = JSON.parse(storedActiveSlip);
          // Check if slip has expired (60 minutes from creation)
          if (slip && slip.created_at && Date.now() - slip.created_at < EXPIRY_MS) {
            setActiveSlip(slip);
          } else {
            // Clear expired slip
            localStorage.removeItem(ACTIVE_SLIP_KEY);
          }
        }
      } catch {
        // ignore
      }
    };

    // Use requestAnimationFrame to batch the updates
    requestAnimationFrame(() => {
      loadFromStorage();
      loadSlips();
      loadActiveSlip();
    });
  }, []);

  // Save to localStorage when items change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Save slips to localStorage when they change
  useEffect(() => {
    localStorage.setItem(SLIPS_STORAGE_KEY, JSON.stringify(savedSlips));
  }, [savedSlips]);

  // Save active slip to localStorage when it changes
  useEffect(() => {
    if (activeSlip) {
      localStorage.setItem(ACTIVE_SLIP_KEY, JSON.stringify(activeSlip));
    } else {
      localStorage.removeItem(ACTIVE_SLIP_KEY);
    }
  }, [activeSlip]);

  // Clear undo timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  const addToBetSlip = useCallback((
    marketId: string,
    marketTitle: string,
    side: 'YES' | 'NO',
    amount: number = 5,
    yesPool: number = 0,
    noPool: number = 0
  ) => {
    setItems(prev => {
      // Check if same market+side already exists
      const existing = prev.find(i => i.marketId === marketId && i.side === side);
      if (existing) {
        // Update amount and pools
        return prev.map(i => 
          i.id === existing.id ? { ...i, amount: i.amount + amount, yesPool, noPool } : i
        );
      }
      // Add new item
      return [...prev, {
        id: `${marketId}_${side}_${Date.now()}`,
        marketId,
        marketTitle,
        side,
        amount,
        yesPool,
        noPool,
      }];
    });
    setIsOpen(true);
  }, []);

  const removeFromBetSlip = useCallback((id: string) => {
    setItems(prev => {
      const index = prev.findIndex(i => i.id === id);
      if (index === -1) return prev;
      
      const item = prev[index];
      setLastRemoved({ item, index });
      
      // Clear any existing timeout
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
      
      // Set timeout to clear undo state
      undoTimeoutRef.current = setTimeout(() => {
        setLastRemoved(null);
      }, UNDO_TIMEOUT);
      
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const undoRemove = useCallback(() => {
    if (!lastRemoved) return;
    
    // Clear timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    
    setItems(prev => {
      const newItems = [...prev];
      // Insert at original position or at end if position is out of bounds
      const insertIndex = Math.min(lastRemoved.index, newItems.length);
      newItems.splice(insertIndex, 0, lastRemoved.item);
      return newItems;
    });
    
    setLastRemoved(null);
  }, [lastRemoved]);

  const clearLastRemoved = useCallback(() => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    setLastRemoved(null);
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
    setLastRemoved(null);
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
  }, []);

  const totalUsd = items.reduce((sum, i) => sum + i.amount, 0);

  // Calculate potential payout for a single bet
  const calculatePotentialPayout = useCallback((item: BetSlipItem): number => {
    const totalPool = item.yesPool + item.noPool + item.amount;
    const winningPool = item.side === 'YES' 
      ? item.yesPool + item.amount 
      : item.noPool + item.amount;
    
    if (winningPool === 0) return item.amount * 2; // Default 2x if no pool data
    
    // Pari-mutuel payout: (your stake / winning pool) * total pool
    const payout = (item.amount / winningPool) * totalPool;
    return payout;
  }, []);

  // Calculate combined odds for all bets (simplified parlay calculation)
  const calculateTotalPotentialPayout = useCallback((): number => {
    if (items.length === 0) return 0;
    
    // For multibet, multiply individual odds together
    let combinedMultiplier = 1;
    
    for (const item of items) {
      const totalPool = item.yesPool + item.noPool + item.amount;
      const winningPool = item.side === 'YES' 
        ? item.yesPool + item.amount 
        : item.noPool + item.amount;
      
      if (winningPool === 0) {
        combinedMultiplier *= 2; // Default 2x
      } else {
        const individualMultiplier = totalPool / winningPool;
        combinedMultiplier *= individualMultiplier;
      }
    }
    
    return totalUsd * combinedMultiplier;
  }, [items, totalUsd]);

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
    undoRemove,
    lastRemoved,
    clearLastRemoved,
    updateAmount,
    reorderItems,
    clearBetSlip,
    totalUsd,
    calculatePotentialPayout,
    calculateTotalPotentialPayout,
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
