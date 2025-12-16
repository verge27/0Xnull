import { useState, useEffect, useCallback } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SPORTS_API_BASE = `${SUPABASE_URL}/functions/v1/0xnull-proxy`;

export interface SportsCategories {
  [category: string]: string[];
}

export interface SportsMatch {
  event_id: string;
  sport: string;
  sport_key: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  commence_timestamp: number;
}

export interface SportsOdds {
  event_id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  best_odds: {
    home: number;
    away: number;
    draw?: number;
  };
  bookmaker_count: number;
}

// Category metadata with emojis and display names
export const CATEGORY_META: Record<string, { emoji: string; label: string }> = {
  football: { emoji: '🏈', label: 'Football' },
  basketball: { emoji: '🏀', label: 'Basketball' },
  soccer: { emoji: '⚽', label: 'Soccer' },
  cricket: { emoji: '🏏', label: 'Cricket' },
  mma: { emoji: '🥋', label: 'MMA' },
  boxing: { emoji: '🥊', label: 'Boxing' },
  combat: { emoji: '🥊', label: 'Combat' }, // fallback
  hockey: { emoji: '🏒', label: 'Hockey' },
  golf: { emoji: '⛳', label: 'Golf' },
  rugby: { emoji: '🏉', label: 'Rugby' },
  other: { emoji: '📊', label: 'Other' },
};

// Priority sports for Middle East market
export const PRIORITY_SPORTS = [
  'premier_league',
  'la_liga', 
  'champions_league',
  'big_bash',
  't20_international',
  'ufc',
];

// Sport display names
export const SPORT_LABELS: Record<string, string> = {
  // Football
  nfl: 'NFL',
  ncaaf: 'NCAA Football',
  nfl_superbowl: 'Super Bowl',
  ncaaf_championship: 'NCAA Championship',
  // Basketball
  nba: 'NBA',
  ncaab: 'NCAA Basketball',
  euroleague: 'EuroLeague',
  nbl: 'NBL',
  nba_championship: 'NBA Finals',
  ncaab_championship: 'March Madness',
  // Soccer
  premier_league: 'Premier League',
  la_liga: 'La Liga',
  bundesliga: 'Bundesliga',
  serie_a: 'Serie A',
  ligue_1: 'Ligue 1',
  champions_league: 'Champions League',
  europa_league: 'Europa League',
  mls: 'MLS',
  saudi_pro_league: 'Saudi Pro League',
  // Cricket
  big_bash: 'Big Bash',
  t20_international: 'T20 International',
  test_match: 'Test Matches',
  ipl: 'IPL',
  // Combat
  ufc: 'UFC',
  boxing: 'Boxing',
  // Hockey
  nhl: 'NHL',
  ahl: 'AHL',
  shl: 'SHL',
  allsvenskan: 'Allsvenskan',
  liiga: 'Liiga',
  mestis: 'Mestis',
  nhl_championship: 'Stanley Cup',
  // Golf
  masters: 'The Masters',
  pga_championship: 'PGA Championship',
  the_open: 'The Open',
  us_open_golf: 'US Open Golf',
  // Rugby
  nrl: 'NRL',
  state_of_origin: 'State of Origin',
  six_nations: 'Six Nations',
  // Other
  aussie_rules: 'Aussie Rules',
  handball_bundesliga: 'Handball',
  mlb_world_series: 'World Series',
  us_election: 'US Election',
};

async function sportsRequest<T>(path: string): Promise<T> {
  const proxyUrl = new URL(SPORTS_API_BASE);
  proxyUrl.searchParams.set('path', `/api/sports${path}`);
  
  const res = await fetch(proxyUrl.toString(), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.error || 'Request failed');
  }
  return data;
}

export function useSportsCategories() {
  const [categories, setCategories] = useState<SportsCategories>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sportsRequest<{ categories: SportsCategories }>('/categories');
      // Transform combat category into separate mma and boxing
      const rawCategories = data.categories || {};
      const transformedCategories: SportsCategories = {};
      Object.entries(rawCategories).forEach(([key, sports]) => {
        if (key === 'combat') {
          // Split combat into mma and boxing
          const mmaSports = sports.filter(s => s === 'ufc' || s.includes('mma'));
          const boxingSports = sports.filter(s => s === 'boxing' || s.includes('box'));
          if (mmaSports.length > 0) transformedCategories['mma'] = mmaSports;
          if (boxingSports.length > 0) transformedCategories['boxing'] = boxingSports;
        } else {
          transformedCategories[key] = sports;
        }
      });
      setCategories(transformedCategories);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch categories';
      setError(message);
      console.error('Failed to fetch categories:', e);
      // Fallback categories if API fails
      // Transform combat into mma and boxing
      const transformedCategories: SportsCategories = {};
      const rawCategories: SportsCategories = {
        football: ['nfl', 'ncaaf'],
        basketball: ['nba', 'ncaab', 'euroleague'],
        soccer: ['premier_league', 'la_liga', 'bundesliga', 'serie_a', 'champions_league'],
        cricket: ['big_bash', 't20_international'],
        mma: ['ufc'],
        boxing: ['boxing'],
        hockey: ['nhl'],
        golf: ['masters', 'pga_championship'],
        rugby: ['nrl', 'six_nations'],
        other: ['aussie_rules', 'us_election'],
      };
      Object.entries(rawCategories).forEach(([key, value]) => {
        transformedCategories[key] = value;
      });
      setCategories(transformedCategories);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
  };
}

export function useSportsMatches() {
  const [matches, setMatches] = useState<SportsMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchByCategory = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      // Map mma/boxing to combat for API, then filter client-side
      const apiCategory = (category === 'mma' || category === 'boxing') ? 'combat' : category;
      const data = await sportsRequest<{ events: SportsMatch[] }>(`/events?category=${apiCategory}`);
      let events = data.events || [];
      
      // Filter combat sports client-side
      if (category === 'mma') {
        events = events.filter(e => e.sport === 'ufc' || e.sport?.includes('mma'));
      } else if (category === 'boxing') {
        events = events.filter(e => e.sport === 'boxing' || e.sport?.includes('box'));
      }
      
      setMatches(events);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch matches';
      setError(message);
      console.error('Failed to fetch matches:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBySport = useCallback(async (sport: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await sportsRequest<{ events: SportsMatch[] }>(`/events?sport=${sport}`);
      setMatches(data.events || []);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch matches';
      setError(message);
      console.error('Failed to fetch matches:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sportsRequest<{ events: SportsMatch[] }>('/events');
      setMatches(data.events || []);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch matches';
      setError(message);
      console.error('Failed to fetch matches:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    matches,
    loading,
    error,
    fetchByCategory,
    fetchBySport,
    fetchAll,
  };
}

export function useSportsOdds() {
  const [odds, setOdds] = useState<SportsOdds[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOdds = useCallback(async (sport: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await sportsRequest<{ matches: SportsOdds[] }>(`/odds/${sport}`);
      setOdds(data.matches || []);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch odds';
      setError(message);
      console.error('Failed to fetch odds:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    odds,
    loading,
    error,
    fetchOdds,
  };
}

// Helper to format relative time
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = timestamp - now;
  
  if (diff < 0) {
    return 'Started';
  }
  
  const hours = Math.floor(diff / 3600);
  const days = Math.floor(hours / 24);
  
  if (days > 1) {
    return `In ${days} days`;
  } else if (days === 1) {
    return 'Tomorrow';
  } else if (hours > 1) {
    return `In ${hours} hours`;
  } else if (hours === 1) {
    return 'In 1 hour';
  } else {
    const minutes = Math.floor(diff / 60);
    return minutes > 0 ? `In ${minutes} min` : 'Starting soon';
  }
}

export function getSportLabel(sport: string): string {
  return SPORT_LABELS[sport] || sport.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function getCategoryEmoji(category: string): string {
  return CATEGORY_META[category]?.emoji || '🎯';
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_META[category]?.label || category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
