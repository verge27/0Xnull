import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useVoucher } from './useVoucher';

// Get or create anonymous user token for tracking
function getAnonymousToken(): string {
  const TOKEN_KEY = '0xnull_anon_token';
  try {
    let token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(TOKEN_KEY, token);
    }
    return token;
  } catch {
    return crypto.randomUUID();
  }
}

export type AnalyticsEventType = 'view' | 'bet_placed' | 'bet_won' | 'bet_lost' | 'token_created';

interface AnalyticsEvent {
  event_type: AnalyticsEventType;
  page?: string;
  market_id?: string;
  bet_amount?: number;
  metadata?: Record<string, unknown>;
}

export function useVoucherAnalytics() {
  const { voucher } = useVoucher();
  const trackedViews = useRef<Set<string>>(new Set());

  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    // Only track if user has a voucher
    if (!voucher) return;

    try {
      // Use raw fetch since table was just created and types haven't regenerated
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      await fetch(`${supabaseUrl}/rest/v1/voucher_analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          voucher_code: voucher.toUpperCase(),
          event_type: event.event_type,
          user_token: getAnonymousToken(),
          page: event.page || window.location.pathname,
          market_id: event.market_id || null,
          bet_amount: event.bet_amount || null,
          metadata: event.metadata || {},
        }),
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
      console.debug('Analytics tracking failed:', error);
    }
  }, [voucher]);

  const trackView = useCallback((page?: string) => {
    const pagePath = page || window.location.pathname;
    // Only track unique views per session
    if (trackedViews.current.has(pagePath)) return;
    trackedViews.current.add(pagePath);
    
    trackEvent({ event_type: 'view', page: pagePath });
  }, [trackEvent]);

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
    voucher,
    trackView,
    trackBetPlaced,
    trackBetWon,
    trackBetLost,
    trackEvent,
  };
}
