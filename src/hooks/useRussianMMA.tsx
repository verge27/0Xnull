import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Region } from '@/lib/nameFixes';

export interface Promotion {
  id: string;
  name: string;
  slug?: string;
  type: string;
  country?: string;
  youtube?: string;
  website?: string;
  telegram?: string;
  vk?: string;
  resolution?: 'auto' | 'manual';
  description?: string;
}

export interface Fighter {
  name: string;
  nickname?: string;
  record?: string;
  note?: string;
}

export interface UpcomingEvent {
  event: string;
  date: string;
  location: string;
  stream?: string;
  status?: string;
  ppv_url?: string;
  resolution?: 'auto' | 'manual';
}

export interface PastResult {
  event: string;
  date: string;
  result: string;
  note?: string;
  video_url?: string;
}

export interface FeaturedData {
  upcoming: UpcomingEvent;
  past_results: PastResult[];
  video_sources?: Record<string, string>;
}

export interface Matchup {
  fighter1?: string;
  fighter2?: string;
  fighter_1?: { name: string; slug?: string; tapology_url?: string };
  fighter_2?: { name: string; slug?: string; tapology_url?: string };
  weight_class?: string;
}

export interface Event {
  event_id: string;
  event_name: string;
  date: string;
  date_raw?: string;
  is_upcoming?: boolean;
  tapology_url?: string;
  matchups?: Matchup[];
  promotion?: string;
  promotion_name?: string;
  resolution?: 'auto' | 'manual';
  country?: string;
}

async function proxyFetch(path: string) {
  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/0xnull-proxy`;
  const url = `${baseUrl}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

async function fetchPromotions(): Promise<Promotion[]> {
  const data = await proxyFetch('/api/russian-mma/promotions');
  return data.promotions || [];
}

async function fetchFeatured(): Promise<FeaturedData> {
  const data = await proxyFetch('/api/russian-mma/featured');
  return {
    upcoming: data.upcoming || { event: '', date: '', location: '' },
    past_results: data.past_results || [],
    video_sources: data.video_sources
  };
}

async function fetchUpcomingEvents(region?: Region): Promise<Event[]> {
  const path = region && region !== 'all' 
    ? `/api/russian-mma/events?upcoming_only=true&region=${region}`
    : '/api/russian-mma/events?upcoming_only=true';
  const data = await proxyFetch(path);
  const events = data.events || [];
  // Dedupe by event_id
  const seen = new Set<string>();
  return events.filter((e: Event) => {
    if (seen.has(e.event_id)) return false;
    seen.add(e.event_id);
    return true;
  });
}

export function usePromotions() {
  return useQuery({
    queryKey: ['russian-mma-promotions'],
    queryFn: fetchPromotions,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeaturedFights() {
  return useQuery({
    queryKey: ['russian-mma-featured'],
    queryFn: fetchFeatured,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpcomingEvents(region?: Region) {
  return useQuery({
    queryKey: ['russian-mma-events', region],
    queryFn: () => fetchUpcomingEvents(region),
    staleTime: 2 * 60 * 1000,
  });
}
