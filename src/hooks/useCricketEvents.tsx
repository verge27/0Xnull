import { useState, useCallback } from 'react';
import { api } from '@/services/api';
import { toast } from 'sonner';

export interface CricketMatch {
  event_id: string;
  name: string;
  match_type: string;
  status: string;
  venue: string;
  date: string;
  datetime_gmt: string;
  team_a: string;
  team_b: string;
  team_a_image: string;
  team_b_image: string;
  score: CricketScore[];
  match_started: boolean;
  match_ended: boolean;
  is_upcoming?: boolean;
}

export interface CricketScore {
  r: number;  // runs
  w: number;  // wickets
  o: number;  // overs
  inning: string;
}

export interface CricketResult {
  event_id: string;
  name: string;
  status: string;
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
  { key: 't20', name: 'T20', icon: '🏏' },
  { key: 'odi', name: 'ODI', icon: '🏟️' },
  { key: 'test', name: 'Test', icon: '🎯' },
  { key: 'ipl', name: 'IPL', icon: '🇮🇳' },
] as const;

export function useCricketEvents() {
  const [matches, setMatches] = useState<CricketMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async (matchType?: string) => {
    setLoading(true);
    setError(null);
    try {
      const path = matchType ? `/matches?match_type=${matchType}` : '/matches';
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

  // Derived states from matches
  const liveMatches = matches.filter(m => m.match_started && !m.match_ended && !m.is_upcoming);
  const upcomingMatches = matches.filter(m => m.is_upcoming);
  const completedMatches = matches.filter(m => m.match_ended && !m.is_upcoming);

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
      
      // Resolution time = match datetime + 12 hours (for match to complete, especially tests)
      const matchDate = new Date(match.datetime_gmt);
      const resolutionTime = Math.floor(matchDate.getTime() / 1000) + 43200;
      
      const matchTypeLabel = getMatchTypeLabel(match.match_type);
      
      await api.createMarket({
        market_id: marketId,
        title: `Will ${selectedTeam} win?`,
        description: `${matchTypeLabel}: ${match.team_a} vs ${match.team_b} at ${match.venue}`,
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
    getMatchResult,
    createCricketMarket,
  };
}

export function getMatchTypeLabel(matchType: string): string {
  const found = CRICKET_MATCH_TYPES.find(t => t.key === matchType);
  return found?.name || matchType.toUpperCase();
}

export function getMatchTypeIcon(matchType: string): string {
  const found = CRICKET_MATCH_TYPES.find(t => t.key === matchType);
  return found?.icon || '🏏';
}

export function formatCricketScore(score: CricketScore[]): string {
  if (!score || score.length === 0) return '';
  
  return score.map(s => `${s.r}/${s.w} (${s.o})`).join(' vs ');
}
