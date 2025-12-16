import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SlapPromotion {
  id: string;
  name: string;
  type: string;
  description?: string;
  youtube?: string;
  rumble?: string;
  website?: string;
}

export interface Striker {
  id: string;
  name: string;
  nickname?: string;
  division?: string;
  record?: string;
  description?: string;
}

export interface SlapMatchup {
  fighter1: string;
  fighter2: string;
  division?: string;
  title_fight?: boolean;
}

export interface SlapEvent {
  event_id: string;
  event_name: string;
  date?: string;
  date_raw?: string;
  location?: string;
  tapology_url?: string;
  matchups?: SlapMatchup[];
}

export interface SlapFeatured {
  upcoming?: {
    event: string;
    date: string;
    status?: string;
    stream?: string;
    youtube_url?: string;
    rumble_url?: string;
  };
  past_results?: Array<{
    event: string;
    date: string;
    result: string;
    note?: string;
    video_url?: string;
  }>;
}

async function proxyFetch(path: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqa29qaWFtZXh1ZnV4c3J1cGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MDc1NDcsImV4cCI6MjA4MDA4MzU0N30.3kwYnFyQv4g36TvbvPWJLIYIR8kb4Jrcl0J7Z1UZJwo';
  
  const res = await fetch(
    `https://qjkojiamexufuxsrupjq.supabase.co/functions/v1/0xnull-proxy?path=${encodeURIComponent(path)}`,
    {
      headers: {
        'Authorization': `Bearer ${session?.access_token || anonKey}`,
        'apikey': anonKey,
      },
    }
  );
  
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchPromotions(): Promise<SlapPromotion[]> {
  const data = await proxyFetch('/api/slap/promotions');
  return data.promotions || [];
}

async function fetchFeatured(): Promise<SlapFeatured> {
  const data = await proxyFetch('/api/slap/featured');
  return data || {};
}

async function fetchStrikers(): Promise<Striker[]> {
  const data = await proxyFetch('/api/slap/strikers');
  return data.strikers || [];
}

async function fetchEvents(): Promise<SlapEvent[]> {
  const data = await proxyFetch('/api/slap/events');
  return data.events || [];
}

export function useSlapPromotions() {
  return useQuery({
    queryKey: ['slap-promotions'],
    queryFn: fetchPromotions,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSlapFeatured() {
  return useQuery({
    queryKey: ['slap-featured'],
    queryFn: fetchFeatured,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSlapStrikers() {
  return useQuery({
    queryKey: ['slap-strikers'],
    queryFn: fetchStrikers,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSlapEvents() {
  return useQuery({
    queryKey: ['slap-events'],
    queryFn: fetchEvents,
    staleTime: 5 * 60 * 1000,
  });
}
