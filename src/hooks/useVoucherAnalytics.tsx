import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useVoucher } from './useVoucher';

// Read the voucher needed for transactional attribution. This does not create
// an analytics identifier or track visits across pages.
function getVoucherForAttribution(): string | null {
  const params = new URLSearchParams(window.location.search);
  const urlVoucher = params.get('voucher') || params.get('ref');
  if (urlVoucher && urlVoucher.length >= 4) {
    return urlVoucher.toUpperCase();
  }

  try {
    return localStorage.getItem('0xnull_voucher')?.toUpperCase() || null;
  } catch {
    return null;
  }
}

export type AttributionEventType = 'bet_placed' | 'bet_won' | 'bet_lost' | 'token_created';

interface AttributionEvent {
  event_type: AttributionEventType;
  market_id?: string;
  bet_amount?: number;
  metadata?: Record<string, unknown>;
}

async function recordAttributionEvent(voucherCode: string, event: AttributionEvent): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('voucher-analytics', {
      body: {
        voucher_code: voucherCode,
        event_type: event.event_type,
        market_id: event.market_id || null,
        bet_amount: event.bet_amount || null,
        metadata: event.metadata || {},
      },
    });

    if (error) {
      console.error('[VoucherAttribution] Failed to record transaction:', error.message);
    }
  } catch (error) {
    console.error('[VoucherAttribution] Transaction record failed:', error);
  }
}

export function useVoucherAnalytics() {
  const { voucher } = useVoucher();

  const trackEvent = useCallback(async (event: AttributionEvent) => {
    const voucherCode = voucher?.toUpperCase() || getVoucherForAttribution();
    if (!voucherCode) return;

    await recordAttributionEvent(voucherCode, event);
  }, [voucher]);

  const trackBetPlaced = useCallback((marketId: string, betAmount: number, metadata?: Record<string, unknown>) => {
    trackEvent({
      event_type: 'bet_placed',
      market_id: marketId,
      bet_amount: betAmount,
      metadata,
    });
  }, [trackEvent]);

  const trackBetWon = useCallback((marketId: string, betAmount: number, payout?: number) => {
    trackEvent({
      event_type: 'bet_won',
      market_id: marketId,
      bet_amount: betAmount,
      metadata: { payout },
    });
  }, [trackEvent]);

  const trackBetLost = useCallback((marketId: string, betAmount: number) => {
    trackEvent({
      event_type: 'bet_lost',
      market_id: marketId,
      bet_amount: betAmount,
    });
  }, [trackEvent]);

  return {
    voucher: voucher || getVoucherForAttribution(),
    trackBetPlaced,
    trackBetWon,
    trackBetLost,
    trackEvent,
  };
}
