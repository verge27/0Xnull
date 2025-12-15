import { useState, useCallback } from 'react';
import { api } from '@/services/api';
import { toast } from 'sonner';

export interface EsportsEvent {
  id: string;
  game: string;
  team_a: string;
  team_b: string;
  team_a_image: string;
  team_b_image: string;
  tournament: string;
  start_time: string;
  start_timestamp: number;
  status: 'upcoming' | 'live' | 'completed';
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
const ESPORTS_API_BASE = `${SUPABASE_URL}/functions/v1/0xnull-proxy`;

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
      const teamSlug = selectedTeam.toLowerCase().replace(/\s+/g, '_');
      const marketId = `esports_${event.id}_${teamSlug}`;
      
      // Resolution time = start time + 4 hours (for match to complete)
      const resolutionTime = event.start_timestamp + 14400;
      
      const gameName = getGameLabel(event.game);
      
      await api.createMarket({
        market_id: marketId,
        title: `Will ${selectedTeam} win?`,
        description: `${gameName}: ${event.team_a} vs ${event.team_b} - ${event.tournament}`,
        oracle_type: 'esports',
        oracle_asset: event.id,
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
