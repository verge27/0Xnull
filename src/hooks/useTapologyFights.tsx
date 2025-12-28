import { useQuery } from '@tanstack/react-query';

export interface TapologyFight {
  bout_id: string;
  fighter_a: string;
  fighter_b: string;
  event_name: string;
  event_date: string;
  promotion: string;
}

const PROMOTIONS = ['rizin', 'aca', 'one', 'pfl', 'bellator'];

async function fetchTapologyFights(): Promise<TapologyFight[]> {
  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/xnull-proxy`;
  const promotionsParam = PROMOTIONS.join(',');
  const url = `${baseUrl}?path=${encodeURIComponent(`/api/tapology/upcoming?promotions=${promotionsParam}`)}`;
  
  const res = await fetch(url, {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
    }
  });
  
  if (!res.ok) {
    console.error('Failed to fetch Tapology fights:', res.status);
    return [];
  }
  
  const data = await res.json();
  return data.fights || [];
}

export function useTapologyFights() {
  return useQuery({
    queryKey: ['tapology-fights', PROMOTIONS],
    queryFn: fetchTapologyFights,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// Promotion badge colors
export const PROMOTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  rizin: { bg: 'bg-orange-600', text: 'text-orange-400', border: 'border-orange-500' },
  aca: { bg: 'bg-red-700', text: 'text-red-400', border: 'border-red-600' },
  one: { bg: 'bg-yellow-600', text: 'text-yellow-400', border: 'border-yellow-500' },
  pfl: { bg: 'bg-blue-600', text: 'text-blue-400', border: 'border-blue-500' },
  bellator: { bg: 'bg-purple-600', text: 'text-purple-400', border: 'border-purple-500' },
};

export const PROMOTION_LABELS: Record<string, string> = {
  rizin: '🇯🇵 RIZIN',
  aca: '🇷🇺 ACA',
  one: '🌏 ONE',
  pfl: '🇺🇸 PFL',
  bellator: '🇺🇸 BELLATOR',
};
