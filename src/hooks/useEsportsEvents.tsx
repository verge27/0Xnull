import { useState, useCallback } from 'react';
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ESPORTS_API_BASE = `${SUPABASE_URL}/functions/v1/xnull-proxy`;

async function esportsRequest<T>(path: string): Promise<T> {
  const proxyUrl = new URL(ESPORTS_API_BASE);
  proxyUrl.searchParams.set('path', `/api/esports${path}`);
  
  const res = await fetch(proxyUrl.toString(), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.error || 'Request failed');
  }
  return data;
}

export const ESPORTS_GAMES = [
  { key: 'lol', name: 'League of Legends', icon: '🎮' },
  { key: 'csgo', name: 'CS2', icon: '🔫' },
  { key: 'dota2', name: 'Dota 2', icon: '⚔️' },
  { key: 'valorant', name: 'Valorant', icon: '🎯' },
  { key: 'ow', name: 'Overwatch', icon: '🦸' },
  { key: 'rl', name: 'Rocket League', icon: '🚗' },
  { key: 'cod', name: 'Call of Duty', icon: '💥' },
  { key: 'r6siege', name: 'R6 Siege', icon: '🛡️' },
] as const;

export function useEsportsEvents() {
  const [events, setEvents] = useState<EsportsEvent[]>([]);
  const [liveEvents, setLiveEvents] = useState<EsportsEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (game?: string) => {
    setLoading(true);
    setError(null);
    try {
      const path = game ? `/events?game=${game}` : '/events';
      const data = await esportsRequest<{ events: EsportsEvent[] }>(path);
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
    } catch (e) {
      console.error('Failed to fetch live events:', e);
    }
  }, []);

  const getEventResult = useCallback(async (eventId: string, game: string): Promise<EsportsResult | null> => {
    try {
      return await esportsRequest<EsportsResult>(`/result/${eventId}?game=${game}`);
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
    loading,
    error,
    fetchEvents,
    fetchLiveEvents,
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
