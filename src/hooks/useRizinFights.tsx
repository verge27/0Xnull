import { useQuery } from '@tanstack/react-query';

export interface RizinFight {
  bout_id: string;
  fighter_a: string;
  fighter_b: string;
  event_name: string;
  event_date: string;
}

async function fetchRizinFights(): Promise<RizinFight[]> {
  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/xnull-proxy`;
  const url = `${baseUrl}?path=${encodeURIComponent('/api/rizin/upcoming')}`;
  
  const res = await fetch(url, {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
    }
  });
  
  if (!res.ok) {
    console.error('Failed to fetch Rizin fights:', res.status);
    return [];
  }
  
  const data = await res.json();
  return data.fights || [];
}

export function useRizinFights() {
  return useQuery({
    queryKey: ['rizin-fights'],
    queryFn: fetchRizinFights,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
