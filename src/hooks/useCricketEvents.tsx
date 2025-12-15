import { useState, useCallback } from 'react';
import { api } from '@/services/api';
import { toast } from 'sonner';

export interface CricketMatch {
  event_id: string;
  sport: string;
  sport_key: string;
  name: string;
  team_a: string;
  team_b: string;
  commence_time: string;
  commence_timestamp: number;
  match_started: boolean;
  match_ended: boolean;
}

export interface CricketResult {
  event_id: string;
  name: string;
  team_a: string;
  team_b: string;
  winner?: string;
  match_ended: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const CRICKET_API_BASE = `${SUPABASE_URL}/functions/v1/0xnull-proxy`;

async function cricketRequest<T>(path: string): Promise<T> {
  const proxyUrl = new URL(CRICKET_API_BASE);
  proxyUrl.searchParams.set('path', `/api/cricket${path}`);
  
  const res = await fetch(proxyUrl.toString(), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.error || 'Request failed');
  }
  return data;
}

export const CRICKET_MATCH_TYPES = [
  { key: 'big_bash', name: 'Big Bash', icon: '🏏' },
  { key: 't20', name: 'T20 Int\'l', icon: '🌍' },
  { key: 'test', name: 'Test', icon: '🏆' },
] as const;

export function useCricketEvents() {
  const [matches, setMatches] = useState<CricketMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async (sport?: string) => {
    setLoading(true);
    setError(null);
    try {
      const path = sport ? `/matches?sport=${sport}` : '/matches';
      const data = await cricketRequest<{ matches: CricketMatch[] } | CricketMatch[]>(path);
      const matchList = Array.isArray(data) ? data : (data.matches || []);
      setMatches(matchList);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch matches';
      setError(message);
      console.error('Failed to fetch cricket matches:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLiveMatches = useCallback(async () => {
    try {
      const data = await cricketRequest<{ matches: CricketMatch[] } | CricketMatch[]>('/live');
      return Array.isArray(data) ? data : (data.matches || []);
    } catch (e) {
      console.error('Failed to fetch live matches:', e);
      return [];
    }
  }, []);

  const fetchUpcomingMatches = useCallback(async () => {
    try {
      const data = await cricketRequest<{ matches: CricketMatch[] } | CricketMatch[]>('/upcoming');
      return Array.isArray(data) ? data : (data.matches || []);
    } catch (e) {
      console.error('Failed to fetch upcoming matches:', e);
      return [];
    }
  }, []);

  // Derived states from matches
  const liveMatches = matches.filter(m => m.match_started && !m.match_ended);
  const upcomingMatches = matches.filter(m => !m.match_started && !m.match_ended);
  const completedMatches = matches.filter(m => m.match_ended);

  const getMatchResult = useCallback(async (eventId: string): Promise<CricketResult | null> => {
    try {
      return await cricketRequest<CricketResult>(`/result/${eventId}`);
    } catch (e) {
      console.error('Failed to get match result:', e);
      return null;
    }
  }, []);

  const createCricketMarket = useCallback(async (
    match: CricketMatch,
    selectedTeam: string
  ): Promise<boolean> => {
    try {
      const teamSlug = selectedTeam.toLowerCase().replace(/\s+/g, '_');
      const marketId = `cricket_${match.event_id}_${teamSlug}`;
      
      // Resolution time = match commence time + 12 hours (for match to complete)
      const matchDate = new Date(match.commence_time);
      const resolutionTime = Math.floor(matchDate.getTime() / 1000) + 43200;
      
      const sportLabel = getSportLabel(match.sport);
      
      await api.createMarket({
        market_id: marketId,
        title: `Will ${selectedTeam} win?`,
        description: `${sportLabel}: ${match.team_a} vs ${match.team_b}`,
        oracle_type: 'cricket',
        oracle_asset: match.event_id,
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
    matches,
    liveMatches,
    upcomingMatches,
    completedMatches,
    loading,
    error,
    fetchMatches,
    fetchLiveMatches,
    fetchUpcomingMatches,
    getMatchResult,
    createCricketMarket,
  };
}

export function getSportLabel(sport: string): string {
  const found = CRICKET_MATCH_TYPES.find(t => t.key === sport);
  return found?.name || sport.replace(/_/g, ' ').toUpperCase();
}

export function getSportIcon(sport: string): string {
  const found = CRICKET_MATCH_TYPES.find(t => t.key === sport);
  return found?.icon || '🏏';
}

// Keep old function names for backward compatibility
export const getMatchTypeLabel = getSportLabel;
export const getMatchTypeIcon = getSportIcon;
