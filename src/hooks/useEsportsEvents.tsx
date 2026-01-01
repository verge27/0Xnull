import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/services/api';
import { toast } from 'sonner';

export interface EsportsEvent {
  id?: string;
  event_id?: string;
  game: string;
  team_a: string;
  team_b: string;
  team_a_image?: string;
  team_b_image?: string;
  tournament: string;
  start_time?: string;
  start_timestamp?: number;
  scheduled_at?: string | number;
  status?: 'upcoming' | 'live' | 'completed' | 'not_started' | 'running';
  // Live score data
  score_a?: number;
  score_b?: number;
  games_played?: number;
  current_game?: number;
}

export interface EsportsResult {
  id: string;
  game: string;
  team_a: string;
  team_b: string;
  winner: string;
  score_a: number;
  score_b: number;
}

export interface EsportsGame {
  key: string;
  name: string;
}

export interface LiveScores {
  [eventId: string]: {
    score_a: number;
    score_b: number;
    games_played?: number;
    current_game?: number;
    last_updated: number;
  };
}

// Backoff tracking for repeated not-found responses
interface BackoffState {
  consecutiveNotFound: number;
  backoffUntil: number; // timestamp when backoff ends
}

const BACKOFF_THRESHOLD = 3; // pause after 3 consecutive not-found
const BACKOFF_DURATION_MS = 2 * 60 * 1000; // 2 minutes

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ESPORTS_API_BASE = `${SUPABASE_URL}/functions/v1/xnull-proxy`;

// Global cache for esports data
interface EsportsCache {
  events: EsportsEvent[];
  lastFetched: number | null;
  fetchPromise: Promise<void> | null;
}

const esportsCache: EsportsCache = {
  events: [],
  lastFetched: null,
  fetchPromise: null,
};

// Cache TTL: 2 minutes
const CACHE_TTL_MS = 2 * 60 * 1000;

async function esportsRequest<T>(
  path: string,
  options?: { allowNotFound?: boolean }
): Promise<T | null> {
  const proxyUrl = new URL(ESPORTS_API_BASE);
  proxyUrl.searchParams.set('path', `/api/esports${path}`);

  const res = await fetch(proxyUrl.toString(), {
    headers: { 'Content-Type': 'application/json' },
  });

  // Be robust to non-JSON (some upstream/proxy errors can return plain text)
  let data: any = null;
  try {
    data = await res.clone().json();
  } catch {
    const text = await res.text().catch(() => '');
    data = { error: text };
  }

  // Handle the new "soft" response format from the proxy for /result endpoints
  // Proxy returns { found: boolean, result?: T, detail?: string } with HTTP 200
  if (typeof data?.found === 'boolean') {
    if (!data.found) {
      // Expected "not found" - return null gracefully
      return null;
    }
    // Unwrap the actual result
    return (data.result ?? data) as T;
  }

  // Legacy handling: Allow 404s for score requests (match in progress, no result yet)
  if (res.status === 404 && (options?.allowNotFound || data?.detail === 'Match not found')) {
    return null;
  }

  if (!res.ok) {
    throw new Error(data?.detail || data?.error || 'Request failed');
  }

  return data as T;
}

// Prefetch all esports data
export async function prefetchEsportsData(): Promise<void> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (esportsCache.lastFetched && now - esportsCache.lastFetched < CACHE_TTL_MS) {
    return;
  }
  
  // Return existing promise if already fetching
  if (esportsCache.fetchPromise) {
    return esportsCache.fetchPromise;
  }
  
  esportsCache.fetchPromise = (async () => {
    try {
      const data = await esportsRequest<{ events: EsportsEvent[], count?: number }>('/events');
      esportsCache.events = data?.events || [];
      esportsCache.lastFetched = Date.now();
    } catch (e) {
      console.error('Failed to prefetch esports events:', e);
    } finally {
      esportsCache.fetchPromise = null;
    }
  })();
  
  return esportsCache.fetchPromise;
}

// Get cached esports data
export function getCachedEsportsData() {
  return {
    events: esportsCache.events,
    isCached: esportsCache.lastFetched !== null,
  };
}

export const ESPORTS_GAMES = [
  { key: 'lol', name: 'League of Legends', icon: '🎮', category: 'moba' },
  { key: 'csgo', name: 'CS2', icon: '🔫', category: 'fps' },
  { key: 'dota2', name: 'Dota 2', icon: '⚔️', category: 'moba' },
  { key: 'valorant', name: 'Valorant', icon: '🎯', category: 'fps' },
  { key: 'ow', name: 'Overwatch', icon: '🦸', category: 'fps' },
  { key: 'rl', name: 'Rocket League', icon: '🚗', category: 'sports' },
  { key: 'cod', name: 'Call of Duty', icon: '💥', category: 'fps' },
  { key: 'r6siege', name: 'R6 Siege', icon: '🛡️', category: 'fps' },
  { key: 'starcraft-2', name: 'StarCraft 2', icon: '🌌', category: 'strategy' },
  { key: 'starcraft-brood-war', name: 'SC: Brood War', icon: '👾', category: 'strategy' },
  { key: 'pubg', name: 'PUBG', icon: '🪂', category: 'fps' },
  { key: 'fifa', name: 'EA Sports FC', icon: '⚽', category: 'sports' },
  { key: 'kog', name: 'King of Glory', icon: '👑', category: 'moba' },
  { key: 'lol-wild-rift', name: 'Wild Rift', icon: '📱', category: 'moba' },
  { key: 'mlbb', name: 'Mobile Legends', icon: '📲', category: 'moba' },
] as const;

export const GAME_DOWNLOAD_URLS: Record<string, string> = {
  'csgo': 'https://store.steampowered.com/app/730/CounterStrike_2/',
  'cs2': 'https://store.steampowered.com/app/730/CounterStrike_2/',
  'dota2': 'https://store.steampowered.com/app/570/Dota_2/',
  'lol': 'https://www.leagueoflegends.com/',
  'lol-wild-rift': 'https://wildrift.leagueoflegends.com/',
  'valorant': 'https://playvalorant.com/',
  'starcraft-2': 'https://starcraft2.blizzard.com/',
  'starcraft-brood-war': 'https://starcraft2.blizzard.com/',
  'ow': 'https://overwatch.blizzard.com/',
  'rl': 'https://www.rocketleague.com/',
  'apex': 'https://www.ea.com/games/apex-legends',
  'r6siege': 'https://www.ubisoft.com/game/rainbow-six/siege',
  'pubg': 'https://store.steampowered.com/app/578080/PUBG_BATTLEGROUNDS/',
  'cod': 'https://www.callofduty.com/',
  'fifa': 'https://www.ea.com/games/ea-sports-fc',
  'tekken8': 'https://store.steampowered.com/app/1778820/TEKKEN_8/',
  'sf6': 'https://store.steampowered.com/app/1364780/Street_Fighter_6/',
};

export const ESPORTS_CATEGORIES = [
  { key: 'fps', name: 'FPS', icon: '🔫' },
  { key: 'moba', name: 'MOBA', icon: '🎮' },
  { key: 'sports', name: 'Sim Sports', icon: '🚗' },
  { key: 'strategy', name: 'Strategy', icon: '🧠' },
] as const;

export function useEsportsEvents() {
  const [events, setEvents] = useState<EsportsEvent[]>([]);
  const [liveEvents, setLiveEvents] = useState<EsportsEvent[]>([]);
  const [liveScores, setLiveScores] = useState<LiveScores>({});
  const [backoffStates, setBackoffStates] = useState<Record<string, BackoffState>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scoresPollingActive, setScoresPollingActive] = useState(false);
  const scoresIntervalRef = useRef<number | null>(null);
  const backoffStateRef = useRef<Record<string, BackoffState>>({});
  const initialLoadDone = useRef(false);

  // Auto-populate from cache on mount if available
  useEffect(() => {
    if (!initialLoadDone.current) {
      const cached = getCachedEsportsData();
      if (cached.isCached && cached.events.length > 0) {
        setEvents(cached.events);
      }
      // Start prefetching
      prefetchEsportsData();
      initialLoadDone.current = true;
    }
  }, []);

  const fetchEvents = useCallback(async (game?: string, category?: string) => {
    // Check cache first if no filters
    if (!game && !category) {
      const cached = getCachedEsportsData();
      if (cached.isCached && cached.events.length > 0) {
        setEvents(cached.events);
        // Refresh in background if cache is getting stale
        if (esportsCache.lastFetched && Date.now() - esportsCache.lastFetched > CACHE_TTL_MS / 2) {
          prefetchEsportsData().then(() => {
            const newCached = getCachedEsportsData();
            setEvents(newCached.events);
          });
        }
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    try {
      let path = '/events';
      const params = new URLSearchParams();
      if (game) params.set('game', game);
      if (category) params.set('category', category);
      if (params.toString()) path += `?${params.toString()}`;
      
      const data = await esportsRequest<{ events: EsportsEvent[], count?: number }>(path);
      setEvents(data?.events || []);
      
      // Update cache if fetching all
      if (!game && !category && data?.events) {
        esportsCache.events = data.events;
        esportsCache.lastFetched = Date.now();
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch events';
      setError(message);
      console.error('Failed to fetch esports events:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLiveEvents = useCallback(async () => {
    try {
      const data = await esportsRequest<{ events: EsportsEvent[] }>('/live');
      setLiveEvents(data.events || []);
      return data.events || [];
    } catch (e) {
      console.error('Failed to fetch live events:', e);
      return [];
    }
  }, []);

  // NOTE: Live score polling removed - the /api/esports/result/ endpoint does not exist.
  // Resolution happens server-side via 0xNull's cron job (POST /api/predictions/resolve-due).
  // To check if a market is resolved, poll /api/predictions/pool/{market_id} instead.
  
  // Stub functions kept for API compatibility but they no-op
  const fetchLiveScores = useCallback(async (_eventIds: string[], _games: string[]) => {
    // Endpoint doesn't exist - live scores not available for esports from this API
    console.log('fetchLiveScores: esports result endpoint does not exist, skipping');
    return liveScores;
  }, [liveScores]);

  const startScoresPolling = useCallback((_eventIds: string[], _games: string[]) => {
    // No-op: endpoint doesn't exist
    console.log('startScoresPolling: esports result endpoint does not exist, polling disabled');
  }, []);

  const stopScoresPolling = useCallback(() => {
    if (scoresIntervalRef.current) {
      clearInterval(scoresIntervalRef.current);
      scoresIntervalRef.current = null;
    }
    setScoresPollingActive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scoresIntervalRef.current) {
        clearInterval(scoresIntervalRef.current);
      }
    };
  }, []);

  // NOTE: getEventResult removed - /api/esports/result/{id} does not exist.
  // Resolution is handled server-side by 0xNull's cron job.

  const createEsportsMarket = useCallback(async (
    event: EsportsEvent,
    selectedTeam: string
  ): Promise<boolean> => {
    try {
      const eventId = event.event_id || event.id;
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      
      const teamSlug = selectedTeam.toLowerCase().replace(/\s+/g, '_');
      const marketId = `esports_${eventId}_${teamSlug}`;
      
      // Get match start time from various possible timestamp formats
      let matchStartTime: number;
      if (typeof event.start_timestamp === 'number' && event.start_timestamp > 0) {
        matchStartTime = event.start_timestamp;
      } else if (typeof event.scheduled_at === 'number' && event.scheduled_at > 0) {
        matchStartTime = event.scheduled_at;
      } else if (typeof event.scheduled_at === 'string') {
        matchStartTime = Math.floor(new Date(event.scheduled_at).getTime() / 1000);
      } else if (typeof event.start_time === 'string') {
        matchStartTime = Math.floor(new Date(event.start_time).getTime() / 1000);
      } else {
        // Default: 24 hours from now
        matchStartTime = Math.floor(Date.now() / 1000) + 86400;
      }
      
      // Resolution time is 4 hours after match start (for result)
      const resolutionTime = matchStartTime + 14400;
      
      const gameName = getGameLabel(event.game);
      
      await api.createMarket({
        market_id: marketId,
        title: `Will ${selectedTeam} win?`,
        description: `${gameName}: ${event.team_a} vs ${event.team_b} - ${event.tournament}`,
        oracle_type: 'esports',
        oracle_asset: eventId,
        oracle_condition: selectedTeam,
        oracle_value: 0,
        resolution_time: resolutionTime,
        betting_closes_at: matchStartTime,  // Betting closes when match starts
        commence_time: matchStartTime,       // Match start time for display
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

  return {
    events,
    liveEvents,
    liveScores,
    backoffStates,
    loading,
    error,
    scoresPollingActive,
    fetchEvents,
    fetchLiveEvents,
    fetchLiveScores,
    startScoresPolling,
    stopScoresPolling,
    createEsportsMarket,
  };
}

export function getGameLabel(game: string): string {
  const found = ESPORTS_GAMES.find(g => g.key === game);
  return found?.name || game.toUpperCase();
}

export function getGameIcon(game: string): string {
  const found = ESPORTS_GAMES.find(g => g.key === game);
  return found?.icon || '🎮';
}

export function getGameCategory(game: string): string | undefined {
  const found = ESPORTS_GAMES.find(g => g.key === game);
  return found?.category;
}

export function getCategoryLabel(category: string): string {
  const found = ESPORTS_CATEGORIES.find(c => c.key === category);
  return found?.name || category.toUpperCase();
}

export function getCategoryIcon(category: string): string {
  const found = ESPORTS_CATEGORIES.find(c => c.key === category);
  return found?.icon || '🎮';
}

export function getGameDownloadUrl(game: string): string | null {
  return GAME_DOWNLOAD_URLS[game] || null;
}
