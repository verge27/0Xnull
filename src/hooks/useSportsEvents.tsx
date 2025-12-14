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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SPORTS_API_BASE = `${SUPABASE_URL}/functions/v1/0xnull-proxy`;

async function sportsRequest<T>(path: string): Promise<T> {
  const proxyUrl = new URL(SPORTS_API_BASE);
  proxyUrl.searchParams.set('path', `/api/sports${path}`);
  
  const res = await fetch(proxyUrl.toString(), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const data = await res.json();
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
  const [pollingActive, setPollingActive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const getEventResult = useCallback(async (eventId: string): Promise<SportsScore | null> => {
    try {
      return await sportsRequest<SportsScore>(`/result/${eventId}`);
    } catch (e) {
      console.error('Failed to get event result:', e);
      return null;
    }
  }, []);

  // Fetch live scores from ESPN (unofficial API)
  const fetchLiveScores = useCallback(async (eventsToFetch: SportsEvent[]) => {
    if (eventsToFetch.length === 0) return;
    
    const scores: LiveScores = {};
    
    // Group events by sport for efficient fetching
    const sportGroups = eventsToFetch.reduce((acc, event) => {
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
    
    setLiveScores(prev => ({ ...prev, ...scores }));
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
    pollingActive,
    lastUpdated,
    fetchEvents,
    getEventResult,
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
  };
  return labels[sport] || sport.toUpperCase();
}

export function getSportEmoji(sport: string): string {
  const emojis: Record<string, string> = {
    nfl: '🏈',
    premier_league: '⚽',
    ufc: '🥊',
    nba: '🏀',
    mlb: '⚾',
  };
  return emojis[sport] || '🎯';
}
