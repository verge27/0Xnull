import { useState, useEffect, useCallback, useRef } from 'react';
import { api, type PredictionMarket } from '@/services/api';

// Types for live score data
export interface SportsScore {
  id: string;
  sport_key: string;
  commence_time: string;
  completed: boolean;
  scores: Array<{
    name: string;
    score: string;
  }> | null;
}

export interface EsportsMatch {
  id: number;
  status: 'not_started' | 'running' | 'finished' | 'canceled';
  results: Array<{
    team_id: number;
    score: number;
  }> | null;
  begin_at: string | null;
}

export interface MarketStatus {
  isClosed: boolean;
  reason: 'resolved' | 'started' | 'live_scores' | 'time_passed' | null;
  displayText: string;
}

/**
 * Get market status using a three-layer detection system:
 * 1. Check betting_closes_at from Markets API
 * 2. Check live scores from Sports API
 * 3. Check esports match status from PandaScore API
 */
export function getMarketStatus(
  market: PredictionMarket,
  liveScores?: SportsScore | null,
  esportsMatch?: EsportsMatch | null
): MarketStatus {
  const now = Math.floor(Date.now() / 1000);

  // 1. Already resolved
  if (market.resolved === 1 || market.outcome !== null) {
    return {
      isClosed: true,
      reason: 'resolved',
      displayText: market.outcome === 'YES' ? 'Resolved: YES' : market.outcome === 'NO' ? 'Resolved: NO' : 'Resolved',
    };
  }

  // 2. API says betting is closed
  if (market.betting_open === false) {
    return {
      isClosed: true,
      reason: 'started',
      displayText: 'Betting Closed',
    };
  }

  // 3. Past commence/betting_closes_at time
  const closesAt = market.betting_closes_at || market.commence_time || 0;
  if (closesAt > 0 && closesAt < now) {
    return {
      isClosed: true,
      reason: 'time_passed',
      displayText: 'Betting Closed',
    };
  }

  // 4. Live sports scores detected
  if (liveScores?.scores?.some(s => s.score !== null && s.score !== '')) {
    return {
      isClosed: true,
      reason: 'live_scores',
      displayText: 'Match In Progress',
    };
  }

  // 5. Sports match completed
  if (liveScores?.completed) {
    return {
      isClosed: true,
      reason: 'live_scores',
      displayText: 'Match Finished',
    };
  }

  // 6. Esports match running or finished
  if (esportsMatch && (esportsMatch.status === 'running' || esportsMatch.status === 'finished')) {
    return {
      isClosed: true,
      reason: 'live_scores',
      displayText: esportsMatch.status === 'running' ? 'Match In Progress' : 'Match Finished',
    };
  }

  // 7. Esports has scores (any team scored)
  if (esportsMatch?.results?.some(r => r.score > 0)) {
    return {
      isClosed: true,
      reason: 'live_scores',
      displayText: 'Match In Progress',
    };
  }

  return {
    isClosed: false,
    reason: null,
    displayText: 'Betting Open',
  };
}

/**
 * Extract event ID from market_id
 * Sports: sports_abc123_team_name -> abc123
 * Esports: esports_12345_team_name -> 12345
 */
export function extractEventId(marketId: string): string | null {
  const match = marketId.match(/^(?:sports|esports)_([^_]+)/);
  return match ? match[1] : null;
}

/**
 * Check if market is a sports market
 */
export function isSportsMarket(marketId: string): boolean {
  return marketId.startsWith('sports_');
}

/**
 * Check if market is an esports market
 */
export function isEsportsMarket(marketId: string): boolean {
  return marketId.startsWith('esports_');
}

/**
 * Validate bet slip items before submission
 */
export interface BetSlipValidation {
  valid: boolean;
  errors: string[];
  closedMarketIds: string[];
}

export function validateBetSlip(
  items: Array<{
    marketId: string;
    marketTitle: string;
    bettingClosesAt?: number;
    bettingOpen?: boolean;
    resolved?: number;
    outcome?: string | null;
  }>,
  liveScoresMap?: Map<string, SportsScore>,
  esportsMatchMap?: Map<string, EsportsMatch>
): BetSlipValidation {
  const errors: string[] = [];
  const closedMarketIds: string[] = [];
  const now = Math.floor(Date.now() / 1000);

  for (const item of items) {
    // Check resolved
    if (item.resolved === 1 || item.outcome !== null) {
      errors.push(`${item.marketTitle}: Market Resolved`);
      closedMarketIds.push(item.marketId);
      continue;
    }

    // Check betting_open flag
    if (item.bettingOpen === false) {
      errors.push(`${item.marketTitle}: Betting Closed`);
      closedMarketIds.push(item.marketId);
      continue;
    }

    // Check time-based closure
    const closesAt = item.bettingClosesAt || 0;
    if (closesAt > 0 && closesAt < now) {
      errors.push(`${item.marketTitle}: Betting Closed`);
      closedMarketIds.push(item.marketId);
      continue;
    }

    // Check live scores for sports markets
    if (isSportsMarket(item.marketId)) {
      const eventId = extractEventId(item.marketId);
      const scores = eventId ? liveScoresMap?.get(eventId) : null;
      if (scores?.scores?.some(s => s.score !== null && s.score !== '') || scores?.completed) {
        errors.push(`${item.marketTitle}: Match In Progress`);
        closedMarketIds.push(item.marketId);
        continue;
      }
    }

    // Check esports match status
    if (isEsportsMarket(item.marketId)) {
      const eventId = extractEventId(item.marketId);
      const match = eventId ? esportsMatchMap?.get(eventId) : null;
      if (match && (match.status === 'running' || match.status === 'finished' || match.results?.some(r => r.score > 0))) {
        errors.push(`${item.marketTitle}: Match In Progress`);
        closedMarketIds.push(item.marketId);
        continue;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    closedMarketIds,
  };
}

/**
 * Hook to poll and track market status with live data
 */
export function useMarketStatusPolling(
  markets: PredictionMarket[],
  options: {
    enabled?: boolean;
    pollIntervalMs?: number;
    betSlipOpen?: boolean;
  } = {}
) {
  const { enabled = true, pollIntervalMs = 60000, betSlipOpen = false } = options;
  
  const [sportsScores, setSportsScores] = useState<Map<string, SportsScore>>(new Map());
  const [esportsMatches, setEsportsMatches] = useState<Map<string, EsportsMatch>>(new Map());
  const [lastPolled, setLastPolled] = useState<number>(0);
  const [isPolling, setIsPolling] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Filter markets within 2 hours of start or that started within last 2 hours
  const getUpcomingMarkets = useCallback(() => {
    const now = Math.floor(Date.now() / 1000);
    const twoHours = 7200;
    
    return markets.filter(m => {
      if (m.resolved === 1) return false;
      const closesAt = m.betting_closes_at || m.commence_time || 0;
      // Started within last 2 hours OR starting within next 2 hours
      return closesAt > now - twoHours && closesAt < now + twoHours;
    });
  }, [markets]);

  const pollLiveData = useCallback(async () => {
    if (isPolling) return;
    
    const upcomingMarkets = getUpcomingMarkets();
    if (upcomingMarkets.length === 0) return;

    setIsPolling(true);
    
    try {
      // Collect sports market event IDs
      const sportsEventIds = new Set<string>();
      const esportsEventIds = new Set<string>();
      
      for (const market of upcomingMarkets) {
        const eventId = extractEventId(market.market_id);
        if (!eventId) continue;
        
        if (isSportsMarket(market.market_id)) {
          sportsEventIds.add(eventId);
        } else if (isEsportsMarket(market.market_id)) {
          esportsEventIds.add(eventId);
        }
      }

      // Fetch sports scores (we rely on the existing live scores from useSportsEvents)
      // The scores are passed in via the liveScores prop to getMarketStatus
      // This hook mainly manages the refresh interval

      // For esports, we could fetch match status, but the existing hooks handle this
      // This hook primarily provides the validation utilities

      setLastPolled(Date.now());
    } catch (error) {
      console.error('Error polling live data:', error);
    } finally {
      setIsPolling(false);
    }
  }, [getUpcomingMarkets, isPolling]);

  // Set up polling interval
  useEffect(() => {
    if (!enabled) return;

    // Poll more frequently when bet slip is open
    const interval = betSlipOpen ? Math.min(pollIntervalMs, 30000) : pollIntervalMs;

    // Initial poll
    pollLiveData();

    intervalRef.current = setInterval(pollLiveData, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, pollIntervalMs, betSlipOpen, pollLiveData]);

  // Get status for a specific market
  const getStatus = useCallback((
    market: PredictionMarket,
    externalSportsScore?: SportsScore | null,
    externalEsportsMatch?: EsportsMatch | null
  ): MarketStatus => {
    const eventId = extractEventId(market.market_id);
    const sportsScore = externalSportsScore ?? (eventId ? sportsScores.get(eventId) : null);
    const esportsMatch = externalEsportsMatch ?? (eventId ? esportsMatches.get(eventId) : null);
    
    return getMarketStatus(market, sportsScore, esportsMatch);
  }, [sportsScores, esportsMatches]);

  return {
    sportsScores,
    esportsMatches,
    lastPolled,
    isPolling,
    getStatus,
    pollLiveData,
  };
}

/**
 * Check if a market is closed (simple version for inline checks)
 */
export function isMarketClosed(market: PredictionMarket): boolean {
  const status = getMarketStatus(market);
  return status.isClosed;
}

/**
 * Handle backend rejection for betting closed
 */
export function isBettingClosedError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('betting closed') ||
      message.includes('betting has closed') ||
      message.includes('already resolved') ||
      message.includes('betting_closed')
    );
  }
  return false;
}
