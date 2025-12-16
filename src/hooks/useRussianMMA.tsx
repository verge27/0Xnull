import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: string;
  youtube_subscribers?: string;
  platforms: {
    youtube?: string;
    telegram?: string;
    vk?: string;
    website?: string;
  };
}

export interface Fighter {
  name: string;
  nickname?: string;
  record?: string;
  description?: string;
}

export interface FeaturedFight {
  id: string;
  event_name: string;
  date: string;
  location: string;
  fighter1: Fighter;
  fighter2: Fighter;
  stream_info?: {
    type: string;
    url: string;
  };
  market_id?: string;
}

export interface Matchup {
  fighter1: Fighter;
  fighter2: Fighter;
  weight_class?: string;
  market_id?: string;
}

export interface Event {
  id: string;
  name: string;
  promotion: string;
  date: string;
  location?: string;
  fight_card: Matchup[];
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

async function fetchFeatured(): Promise<FeaturedFight[]> {
  const data = await proxyFetch('/api/russian-mma/featured');
  return data.featured || [];
}

async function fetchUpcomingEvents(): Promise<Event[]> {
  const data = await proxyFetch('/api/russian-mma/events?upcoming_only=true');
  return data.events || [];
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

export function useUpcomingEvents() {
  return useQuery({
    queryKey: ['russian-mma-events'],
    queryFn: fetchUpcomingEvents,
    staleTime: 2 * 60 * 1000,
  });
}
