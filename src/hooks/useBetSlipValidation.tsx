import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { BetSlipItem } from './useMultibetSlip';
import { validateBetSlip } from './useMarketStatus';
import { playWarningSound, playErrorSound } from '@/lib/sounds';

const VALIDATION_INTERVAL_MS = 30000; // 30 seconds
const CLOSING_SOON_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const CLOSING_SOON_WARNING_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes for add warning

interface UseBetSlipValidationOptions {
  items: BetSlipItem[];
  onRemoveItem: (id: string) => void;
  isOpen: boolean;
  enabled?: boolean;
}

interface ValidationState {
  validCount: number;
  invalidCount: number;
  closingSoonCount: number;
  closingSoonItems: BetSlipItem[];
  closedItems: BetSlipItem[];
}

/**
 * Hook for continuous bet slip validation with:
 * - Background validation every 30s
 * - Tab visibility refresh
 * - Closing soon detection
 * - Auto-remove closed legs
 */
export function useBetSlipValidation({
  items,
  onRemoveItem,
  isOpen,
  enabled = true,
}: UseBetSlipValidationOptions) {
  const [validationState, setValidationState] = useState<ValidationState>({
    validCount: items.length,
    invalidCount: 0,
    closingSoonCount: 0,
    closingSoonItems: [],
    closedItems: [],
  });
  
  const previousClosedIdsRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check which items are closing soon (within 5 minutes)
  const getClosingSoonItems = useCallback((itemsList: BetSlipItem[]): BetSlipItem[] => {
    const now = Date.now();
    return itemsList.filter(item => {
      if (!item.bettingClosesAt) return false;
      const closesAtMs = item.bettingClosesAt * 1000;
      const timeUntilClose = closesAtMs - now;
      return timeUntilClose > 0 && timeUntilClose <= CLOSING_SOON_THRESHOLD_MS;
    });
  }, []);

  // Get closed items
  const getClosedItems = useCallback((itemsList: BetSlipItem[]): BetSlipItem[] => {
    const validation = validateBetSlip(
      itemsList.map(item => ({
        marketId: item.marketId,
        marketTitle: item.marketTitle,
        bettingClosesAt: item.bettingClosesAt,
        bettingOpen: item.bettingOpen,
        resolved: item.resolved,
        outcome: item.outcome,
      }))
    );
    
    return itemsList.filter(item => validation.closedMarketIds.includes(item.marketId));
  }, []);

  // Validate and update state
  const validate = useCallback(() => {
    if (items.length === 0) {
      setValidationState({
        validCount: 0,
        invalidCount: 0,
        closingSoonCount: 0,
        closingSoonItems: [],
        closedItems: [],
      });
      return;
    }

    const closingSoon = getClosingSoonItems(items);
    const closed = getClosedItems(items);
    
    // Check for newly closed items
    const newlyClosedItems = closed.filter(item => !previousClosedIdsRef.current.has(item.marketId));
    
    if (newlyClosedItems.length > 0) {
      // Play warning sound for newly closed items
      playWarningSound();
      
      // Show toast notification
      toast.warning(
        `${newlyClosedItems.length} market${newlyClosedItems.length > 1 ? 's' : ''} just closed`,
        {
          description: newlyClosedItems.slice(0, 2).map(i => i.marketTitle).join(', ') +
            (newlyClosedItems.length > 2 ? ` and ${newlyClosedItems.length - 2} more` : ''),
          action: {
            label: 'Remove All',
            onClick: () => removeAllClosed(),
          },
          duration: 8000,
        }
      );
    }
    
    // Update previousClosedIds
    previousClosedIdsRef.current = new Set(closed.map(item => item.marketId));

    setValidationState({
      validCount: items.length - closed.length,
      invalidCount: closed.length,
      closingSoonCount: closingSoon.length,
      closingSoonItems: closingSoon,
      closedItems: closed,
    });
  }, [items, getClosingSoonItems, getClosedItems]);

  // Remove all closed items
  const removeAllClosed = useCallback(() => {
    const closed = getClosedItems(items);
    if (closed.length === 0) return;
    
    playErrorSound();
    
    for (const item of closed) {
      onRemoveItem(item.id);
    }
    
    toast.info(`Removed ${closed.length} closed market${closed.length > 1 ? 's' : ''}`);
  }, [items, getClosedItems, onRemoveItem]);

  // Tab visibility handler
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && items.length > 0) {
        // Re-validate when tab becomes visible
        validate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, items.length, validate]);

  // Background validation interval
  useEffect(() => {
    if (!enabled || items.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial validation
    validate();

    // Set up interval - poll more frequently when slip is open
    const interval = isOpen ? 15000 : VALIDATION_INTERVAL_MS;
    intervalRef.current = setInterval(validate, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, items.length, isOpen, validate]);

  // Check if a specific item is closing soon
  const isClosingSoon = useCallback((item: BetSlipItem): boolean => {
    if (!item.bettingClosesAt) return false;
    const now = Date.now();
    const closesAtMs = item.bettingClosesAt * 1000;
    const timeUntilClose = closesAtMs - now;
    return timeUntilClose > 0 && timeUntilClose <= CLOSING_SOON_THRESHOLD_MS;
  }, []);

  // Check if a specific item is closed
  const isClosed = useCallback((item: BetSlipItem): boolean => {
    return validationState.closedItems.some(closed => closed.marketId === item.marketId);
  }, [validationState.closedItems]);

  // Get time until close for an item
  const getTimeUntilClose = useCallback((item: BetSlipItem): number | null => {
    if (!item.bettingClosesAt) return null;
    const now = Date.now();
    const closesAtMs = item.bettingClosesAt * 1000;
    const timeUntilClose = closesAtMs - now;
    return timeUntilClose > 0 ? timeUntilClose : null;
  }, []);

  return {
    ...validationState,
    validate,
    removeAllClosed,
    isClosingSoon,
    isClosed,
    getTimeUntilClose,
  };
}

/**
 * Check if an item is closing soon (for add warning)
 */
export function isAddingClosingSoonItem(bettingClosesAt?: number): boolean {
  if (!bettingClosesAt) return false;
  const now = Date.now();
  const closesAtMs = bettingClosesAt * 1000;
  const timeUntilClose = closesAtMs - now;
  return timeUntilClose > 0 && timeUntilClose <= CLOSING_SOON_WARNING_THRESHOLD_MS;
}

/**
 * Format time remaining as countdown string
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Closed';
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
