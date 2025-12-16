import { useQuery } from '@tanstack/react-query';

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

const API_BASE = 'https://api.0xnull.io/api/russian-mma';

async function fetchPromotions(): Promise<Promotion[]> {
  const res = await fetch(`${API_BASE}/promotions`);
  if (!res.ok) throw new Error('Failed to fetch promotions');
  const data = await res.json();
  return data.promotions || [];
}

async function fetchFeatured(): Promise<FeaturedFight[]> {
  const res = await fetch(`${API_BASE}/featured`);
  if (!res.ok) throw new Error('Failed to fetch featured');
  const data = await res.json();
  return data.featured || [];
}

async function fetchUpcomingEvents(): Promise<Event[]> {
  const res = await fetch(`${API_BASE}/events?upcoming_only=true`);
  if (!res.ok) throw new Error('Failed to fetch events');
  const data = await res.json();
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
