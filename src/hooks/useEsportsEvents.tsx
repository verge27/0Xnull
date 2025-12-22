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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ESPORTS_API_BASE = `${SUPABASE_URL}/functions/v1/xnull-proxy`;

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

  // Allow 404s for score requests (match in progress, no result yet)
  if (res.status === 404 && (options?.allowNotFound || data?.detail === 'Match not found')) {
    return null;
  }

  if (!res.ok) {
    throw new Error(data?.detail || data?.error || 'Request failed');
  }

  return data as T;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scoresPollingActive, setScoresPollingActive] = useState(false);
  const scoresIntervalRef = useRef<number | null>(null);

  const fetchEvents = useCallback(async (game?: string, category?: string) => {
    setLoading(true);
    setError(null);
    try {
      let path = '/events';
      const params = new URLSearchParams();
      if (game) params.set('game', game);
      if (category) params.set('category', category);
      if (params.toString()) path += `?${params.toString()}`;
      
      const data = await esportsRequest<{ events: EsportsEvent[], count?: number }>(path);
      setEvents(data.events || []);
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

  // Fetch live scores for specific events
  const fetchLiveScores = useCallback(async (eventIds: string[], games: string[]) => {
    const newScores: LiveScores = { ...liveScores };

    await Promise.all(
      eventIds.map(async (eventId, index) => {
        try {
          const game = games[index] || 'csgo';
          // Use allowNotFound since 404 is expected for in-progress matches
          const result = await esportsRequest<EsportsResult>(`/result/${eventId}?game=${game}`, { allowNotFound: true });
          if (result) {
            newScores[eventId] = {
              score_a: result.score_a || 0,
              score_b: result.score_b || 0,
              last_updated: Date.now(),
            };
          }
          // If result is null (404), we just don't update scores - this is expected
        } catch (e) {
          // Never let one failing score request crash the page/polling loop
          console.warn('Live score fetch failed:', e);
        }
      })
    );

    setLiveScores(newScores);
    return newScores;
  }, [liveScores]);

  // Start polling for live scores
  const startScoresPolling = useCallback((eventIds: string[], games: string[]) => {
    if (scoresIntervalRef.current) {
      clearInterval(scoresIntervalRef.current);
    }
    
    setScoresPollingActive(true);
    
    // Fetch immediately
    fetchLiveScores(eventIds, games);
    
    // Then poll every 30 seconds
    scoresIntervalRef.current = window.setInterval(() => {
      fetchLiveScores(eventIds, games);
    }, 30000);
  }, [fetchLiveScores]);

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

  const getEventResult = useCallback(async (eventId: string, game: string): Promise<EsportsResult | null> => {
    try {
      // Results can legitimately be missing while a match is live or recently finished.
      return await esportsRequest<EsportsResult>(`/result/${eventId}?game=${game}`, { allowNotFound: true });
    } catch (e) {
      console.error('Failed to get event result:', e);
      return null;
    }
  }, []);

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
      
      // Get resolution time from various possible timestamp formats
      let resolutionTime: number;
      if (typeof event.start_timestamp === 'number' && event.start_timestamp > 0) {
        resolutionTime = event.start_timestamp + 14400; // +4 hours
      } else if (typeof event.scheduled_at === 'number' && event.scheduled_at > 0) {
        resolutionTime = event.scheduled_at + 14400;
      } else if (typeof event.scheduled_at === 'string') {
        resolutionTime = Math.floor(new Date(event.scheduled_at).getTime() / 1000) + 14400;
      } else if (typeof event.start_time === 'string') {
        resolutionTime = Math.floor(new Date(event.start_time).getTime() / 1000) + 14400;
      } else {
        // Default: 24 hours from now
        resolutionTime = Math.floor(Date.now() / 1000) + 86400;
      }
      
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
    loading,
    error,
    scoresPollingActive,
    fetchEvents,
    fetchLiveEvents,
    fetchLiveScores,
    startScoresPolling,
    stopScoresPolling,
    getEventResult,
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
