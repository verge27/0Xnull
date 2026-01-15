import { useCallback, useRef, useEffect } from 'react';
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

// Get voucher directly from URL or localStorage for immediate tracking
function getVoucherForTracking(): string | null {
  // First check URL params (highest priority - user just arrived)
  const params = new URLSearchParams(window.location.search);
  const urlVoucher = params.get('voucher');
  if (urlVoucher && urlVoucher.length >= 4) {
    return urlVoucher.toUpperCase();
  }
  
  // Fall back to localStorage
  try {
    return localStorage.getItem('0xnull_voucher')?.toUpperCase() || null;
  } catch {
    return null;
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

// Standalone tracking function that doesn't depend on React state
async function trackAnalyticsEvent(voucherCode: string, event: AnalyticsEvent): Promise<void> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    console.log('[VoucherAnalytics] Tracking event:', event.event_type, 'voucher:', voucherCode);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/voucher_analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        voucher_code: voucherCode,
        event_type: event.event_type,
        user_token: getAnonymousToken(),
        page: event.page || window.location.pathname,
        market_id: event.market_id || null,
        bet_amount: event.bet_amount || null,
        metadata: event.metadata || {},
      }),
    });
    
    if (!response.ok) {
      console.error('[VoucherAnalytics] Failed to track:', response.status, await response.text());
    } else {
      console.log('[VoucherAnalytics] Successfully tracked:', event.event_type);
    }
  } catch (error) {
    console.error('[VoucherAnalytics] Tracking failed:', error);
  }
}

export function useVoucherAnalytics() {
  const { voucher } = useVoucher();
  const trackedViews = useRef<Set<string>>(new Set());
  const initialViewTracked = useRef(false);

  // Track initial page view on mount if voucher exists (from URL or localStorage)
  useEffect(() => {
    if (initialViewTracked.current) return;
    
    const voucherCode = getVoucherForTracking();
    if (voucherCode) {
      initialViewTracked.current = true;
      const pagePath = window.location.pathname;
      trackedViews.current.add(pagePath);
      trackAnalyticsEvent(voucherCode, { event_type: 'view', page: pagePath });
    }
  }, []);

  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    // Get voucher from multiple sources for reliability
    const voucherCode = voucher?.toUpperCase() || getVoucherForTracking();
    if (!voucherCode) return;

    await trackAnalyticsEvent(voucherCode, event);
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
    voucher: voucher || getVoucherForTracking(),
    trackView,
    trackBetPlaced,
    trackBetWon,
    trackBetLost,
    trackEvent,
  };
}
