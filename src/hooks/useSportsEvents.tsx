import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/services/api';
import { toast } from 'sonner';

export interface SportsEvent {
  event_id: string;
  sport: string;
  sport_key: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  commence_timestamp: number;
}

export interface SportsScore {
  event_id: string;
  sport: string;
  home_team: string;
  away_team: string;
  completed: boolean;
  scores: { name: string; score: string }[];
  winner: string | null;
  // Live game status
  clock?: string;
  period?: string;
  statusDetail?: string;
}

export interface LiveScores {
  [eventId: string]: SportsScore;
}

// Backoff tracking for repeated not-found responses
interface BackoffState {
  consecutiveNotFound: number;
  backoffUntil: number; // timestamp when backoff ends
}

const BACKOFF_THRESHOLD = 3; // pause after 3 consecutive not-found
const BACKOFF_DURATION_MS = 2 * 60 * 1000; // 2 minutes

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SPORTS_API_BASE = `${SUPABASE_URL}/functions/v1/xnull-proxy`;

async function sportsRequest<T>(path: string, options?: { allowNotFound?: boolean }): Promise<T | null> {
  const proxyUrl = new URL(SPORTS_API_BASE);
  proxyUrl.searchParams.set('path', `/api/sports${path}`);
  
  const res = await fetch(proxyUrl.toString(), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  let data: any = null;
  try {
    data = await res.clone().json();
  } catch {
    const text = await res.text().catch(() => '');
    data = { error: text };
  }

  // Handle the "soft" response format from the proxy for /result endpoints
  // Proxy returns { found: boolean, result?: T, detail?: string } with HTTP 200
  if (typeof data?.found === 'boolean') {
    if (!data.found) {
      // Expected "not found" - return null gracefully
      return null;
    }
    // Unwrap the actual result
    return (data.result ?? data) as T;
  }

  // Legacy handling: Allow 404s for result requests
  if (res.status === 404 && (options?.allowNotFound || data?.detail === 'Match not found')) {
    return null;
  }

  if (!res.ok) {
    throw new Error(data.detail || data.error || 'Request failed');
  }
  return data;
}

export function useSportsEvents() {
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveScores, setLiveScores] = useState<LiveScores>({});
  const [backoffStates, setBackoffStates] = useState<Record<string, BackoffState>>({});
  const [pollingActive, setPollingActive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backoffStateRef = useRef<Record<string, BackoffState>>({});

  const fetchEvents = useCallback(async (sport?: string) => {
    setLoading(true);
    setError(null);
    try {
      const path = sport ? `/events?sport=${sport}` : '/events';
      const data = await sportsRequest<{ events: SportsEvent[] }>(path);
      setEvents(data.events || []);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch events';
      setError(message);
      console.error('Failed to fetch sports events:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // NOTE: getEventResult removed - /api/sports/result/{id} does not exist.
  // Resolution is handled server-side by 0xNull's cron job (POST /api/predictions/resolve-due).
  // To check if a market is resolved, poll /api/predictions/pool/{market_id} instead.

  // Fetch live scores from ESPN (unofficial API) with backoff for repeated failures
  const fetchLiveScores = useCallback(async (eventsToFetch: SportsEvent[]) => {
    if (eventsToFetch.length === 0) return;
    
    const scores: LiveScores = {};
    const now = Date.now();
    
    // Filter out events in backoff period
    const eventsToProcess = eventsToFetch.filter(event => {
      const backoff = backoffStateRef.current[event.event_id];
      return !backoff || backoff.backoffUntil <= now;
    });
    
    // Group events by sport for efficient fetching
    const sportGroups = eventsToProcess.reduce((acc, event) => {
      const sportKey = event.sport_key;
      if (!acc[sportKey]) acc[sportKey] = [];
      acc[sportKey].push(event);
      return acc;
    }, {} as Record<string, SportsEvent[]>);
    
    // ESPN sport mappings
    const espnSportMap: Record<string, string> = {
      'americanfootball_nfl': 'football/nfl',
      'soccer_epl': 'soccer/eng.1',
      'mma_mixed_martial_arts': 'mma/ufc',
    };

    // Track which events got matches
    const matchedEvents = new Set<string>();
    
    await Promise.allSettled(
      Object.entries(sportGroups).map(async ([sportKey, events]) => {
        const espnSport = espnSportMap[sportKey];
        if (!espnSport) return;
        
        try {
          const res = await fetch(
            `https://site.api.espn.com/apis/site/v2/sports/${espnSport}/scoreboard`
          );
          
          if (!res.ok) return;
          
          const data = await res.json();
          const espnEvents = data.events || [];
          
          // Match ESPN events to our events by team names
          for (const event of events) {
            const matchingEspn = espnEvents.find((e: any) => {
              const competitors = e.competitions?.[0]?.competitors || [];
              const teamNames = competitors.map((c: any) => c.team?.displayName?.toLowerCase() || c.athlete?.displayName?.toLowerCase());
              return teamNames.some((name: string) => 
                name?.includes(event.home_team.toLowerCase()) || 
                name?.includes(event.away_team.toLowerCase()) ||
                event.home_team.toLowerCase().includes(name) ||
                event.away_team.toLowerCase().includes(name)
              );
            });
            
            if (matchingEspn) {
              matchedEvents.add(event.event_id);
              // Reset backoff on success
              backoffStateRef.current[event.event_id] = { consecutiveNotFound: 0, backoffUntil: 0 };
              
              const competitors = matchingEspn.competitions?.[0]?.competitors || [];
              const espnScores: { name: string; score: string }[] = competitors.map((c: any) => ({
                name: c.team?.displayName || c.athlete?.displayName || 'Unknown',
                score: c.score || '0',
              }));
              
              const status = matchingEspn.status?.type?.state;
              const completed = status === 'post';
              
              // Extract clock/period info
              const clock = matchingEspn.status?.displayClock;
              const period = matchingEspn.status?.period;
              const statusDetail = matchingEspn.status?.type?.shortDetail;
              
              if (espnScores.length > 0 && (status === 'in' || completed)) {
                scores[event.event_id] = {
                  event_id: event.event_id,
                  sport: event.sport,
                  home_team: event.home_team,
                  away_team: event.away_team,
                  completed,
                  scores: espnScores,
                  winner: completed ? espnScores.reduce((a, b) => 
                    parseInt(a.score) > parseInt(b.score) ? a : b
                  ).name : null,
                  clock: clock || undefined,
                  period: period ? `${period}` : undefined,
                  statusDetail: statusDetail || undefined,
                };
              }
            }
          }
        } catch (e) {
          // Silently ignore ESPN API errors
          console.log('ESPN API error for', sportKey, e);
        }
      })
    );

    // Update backoff state for events that didn't match
    for (const event of eventsToProcess) {
      if (!matchedEvents.has(event.event_id)) {
        const currentState = backoffStateRef.current[event.event_id] || { consecutiveNotFound: 0, backoffUntil: 0 };
        const newCount = currentState.consecutiveNotFound + 1;
        
        if (newCount >= BACKOFF_THRESHOLD) {
          backoffStateRef.current[event.event_id] = {
            consecutiveNotFound: newCount,
            backoffUntil: now + BACKOFF_DURATION_MS,
          };
          console.log(`Backoff activated for sports event ${event.event_id}: pausing for 2 minutes after ${newCount} not-found responses`);
        } else {
          backoffStateRef.current[event.event_id] = { consecutiveNotFound: newCount, backoffUntil: 0 };
        }
      }
    }
    
    setLiveScores(prev => ({ ...prev, ...scores }));
    setBackoffStates({ ...backoffStateRef.current });
    setLastUpdated(new Date());
  }, []);

  const startLiveScorePolling = useCallback((liveEvents: SportsEvent[]) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    if (liveEvents.length === 0) {
      setPollingActive(false);
      return;
    }
    
    setPollingActive(true);
    
    // Fetch immediately
    fetchLiveScores(liveEvents);
    
    // Poll every 30 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchLiveScores(liveEvents);
    }, 30000);
  }, [fetchLiveScores]);

  const stopLiveScorePolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setPollingActive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const createSportsMarket = useCallback(async (
    event: SportsEvent,
    selectedTeam: string
  ): Promise<boolean> => {
    try {
      const teamSlug = selectedTeam.toLowerCase().replace(/\s+/g, '_');
      const marketId = `sports_${event.event_id}_${teamSlug}`;
      
      // Resolution time = commence time + 4 hours (for game to complete)
      const resolutionTime = event.commence_timestamp + 14400;
      
      const sportLabel = getSportLabel(event.sport);
      
      await api.createMarket({
        market_id: marketId,
        title: `Will ${selectedTeam} win?`,
        description: `${sportLabel}: ${event.away_team} @ ${event.home_team}`,
        oracle_type: 'sports',
        oracle_asset: event.event_id,
        oracle_condition: selectedTeam, // Team name for resolution
        oracle_value: 0,
        resolution_time: resolutionTime,
      });
      
      toast.success(`Market created for ${selectedTeam}`);
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create market';
      if (message.includes('already exists')) {
        toast.info('Market already exists for this team');
      } else {
        toast.error(message);
      }
      return false;
    }
  }, []);

  const autoCreateMarketsForNext24Hours = useCallback(async (
    existingMarketIds: string[]
  ): Promise<{ created: number; skipped: number }> => {
    const now = Date.now() / 1000;
    const next24Hours = now + 24 * 60 * 60;
    
    // Filter events ending in next 24 hours
    const upcomingEvents = events.filter(e => {
      const gameEndTime = e.commence_timestamp + 14400; // Game + 4h buffer
      return gameEndTime > now && gameEndTime <= next24Hours;
    });
    
    let created = 0;
    let skipped = 0;
    
    for (const event of upcomingEvents) {
      // Create market for home team
      const homeSlug = event.home_team.toLowerCase().replace(/\s+/g, '_');
      const homeMarketId = `sports_${event.event_id}_${homeSlug}`;
      
      if (!existingMarketIds.includes(homeMarketId)) {
        const success = await createSportsMarket(event, event.home_team);
        if (success) created++;
        else skipped++;
      } else {
        skipped++;
      }
      
      // Create market for away team
      const awaySlug = event.away_team.toLowerCase().replace(/\s+/g, '_');
      const awayMarketId = `sports_${event.event_id}_${awaySlug}`;
      
      if (!existingMarketIds.includes(awayMarketId)) {
        const success = await createSportsMarket(event, event.away_team);
        if (success) created++;
        else skipped++;
      } else {
        skipped++;
      }
    }
    
    return { created, skipped };
  }, [events, createSportsMarket]);

  return {
    events,
    loading,
    error,
    liveScores,
    backoffStates,
    pollingActive,
    lastUpdated,
    fetchEvents,
    fetchLiveScores,
    startLiveScorePolling,
    stopLiveScorePolling,
    createSportsMarket,
    autoCreateMarketsForNext24Hours,
  };
}

export function getSportLabel(sport: string): string {
  const labels: Record<string, string> = {
    nfl: 'NFL',
    premier_league: 'Premier League',
    ufc: 'UFC',
    nba: 'NBA',
    mlb: 'MLB',
    nhl: 'NHL',
    afl: 'AFL',
    ipl: 'IPL',
    big_bash: 'Big Bash',
    champions_league: 'Champions League',
  };
  return labels[sport] || sport.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function getSportEmoji(sport: string): string {
  const emojis: Record<string, string> = {
    nfl: '🏈',
    premier_league: '⚽',
    soccer: '⚽',
    ufc: '🥊',
    mma: '🥊',
    boxing: '🥊',
    nba: '🏀',
    basketball: '🏀',
    mlb: '⚾',
    baseball: '⚾',
    nhl: '🏒',
    hockey: '🏒',
    cricket: '🏏',
    tennis: '🎾',
    golf: '⛳',
    rugby: '🏉',
    afl: '🏉',
  };
  return emojis[sport] || '🎯';
}
