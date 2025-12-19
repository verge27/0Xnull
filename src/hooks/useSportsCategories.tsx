import { useState, useEffect, useCallback } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SPORTS_API_BASE = `${SUPABASE_URL}/functions/v1/xnull-proxy`;

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
  baseball: { emoji: '⚾', label: 'Baseball' },
  soccer: { emoji: '⚽', label: 'Soccer' },
  cricket: { emoji: '🏏', label: 'Cricket' },
  hockey: { emoji: '🏒', label: 'Hockey' },
  tennis: { emoji: '🎾', label: 'Tennis' },
  combat: { emoji: '🥊', label: 'Combat' },
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
  'ipl',
  'ufc',
];

// Sport display names
export const SPORT_LABELS: Record<string, string> = {
  // American Football
  nfl: 'NFL',
  ncaaf: 'NCAA Football',
  nfl_preseason: 'NFL Preseason',
  nfl_superbowl: 'Super Bowl',
  ncaaf_championship: 'NCAA Championship',
  cfl: 'CFL',
  ufl: 'UFL',
  // Basketball
  nba: 'NBA',
  ncaab: 'NCAA Basketball',
  nba_preseason: 'NBA Preseason',
  nba_summer_league: 'NBA Summer League',
  wnba: 'WNBA',
  wncaab: 'WNCAAB',
  euroleague: 'EuroLeague',
  nbl: 'NBL',
  nba_championship: 'NBA Finals',
  ncaab_championship: 'March Madness',
  // Baseball
  mlb: 'MLB',
  mlb_preseason: 'MLB Spring Training',
  mlb_world_series: 'World Series',
  milb: 'Minor League',
  npb: 'NPB (Japan)',
  kbo: 'KBO (Korea)',
  ncaa_baseball: 'NCAA Baseball',
  // Soccer - England
  premier_league: 'Premier League',
  epl: 'Premier League',
  fa_cup: 'FA Cup',
  efl_champ: 'EFL Championship',
  england_efl_cup: 'EFL Cup',
  // Soccer - Europe
  la_liga: 'La Liga',
  bundesliga: 'Bundesliga',
  serie_a: 'Serie A',
  ligue_1: 'Ligue 1',
  eredivisie: 'Eredivisie',
  portugal_primeira_liga: 'Primeira Liga',
  spl: 'Scottish Premiership',
  turkey_super_league: 'Turkish Super Lig',
  russian_premier: 'Russian Premier',
  polish_ekstraklasa: 'Ekstraklasa',
  // Soccer - Nordic
  norwegian_eliteserien: 'Eliteserien',
  swedish_allsvenskan: 'Allsvenskan',
  swedish_superettan: 'Superettan',
  finnish_veikkausliiga: 'Veikkausliiga',
  // Soccer - Europe Other
  belgium_first_div: 'Belgian Pro League',
  league_of_ireland: 'League of Ireland',
  // Soccer - UEFA Competitions
  champions_league: 'Champions League',
  europa_league: 'Europa League',
  nations_league: 'Nations League',
  euro: 'Euro',
  euro_qualification: 'Euro Qualifiers',
  champions_league_qual: 'UCL Qualifiers',
  club_world_cup: 'Club World Cup',
  // Soccer - Americas
  mls: 'MLS',
  liga_mx: 'Liga MX',
  brazil_serie_a: 'Brasileirão A',
  brazil_serie_b: 'Brasileirão B',
  brazil_campeonato: 'Brasileirão',
  argentina_primera: 'Argentina Primera',
  chile_primera: 'Chile Primera',
  copa_america: 'Copa America',
  copa_libertadores: 'Libertadores',
  copa_sudamericana: 'Sudamericana',
  concacaf_gold_cup: 'Gold Cup',
  concacaf_leagues_cup: 'Leagues Cup',
  // Soccer - Asia/Oceania
  saudi_pro_league: 'Saudi Pro League',
  j_league: 'J-League',
  k_league: 'K-League',
  china_super_league: 'Chinese Super League',
  australia_aleague: 'A-League',
  // Soccer - International
  world_cup_women: 'Women\'s World Cup',
  world_cup_qualifiers_southamerica: 'WC Qualifiers SA',
  // Cricket
  big_bash: 'Big Bash',
  t20_international: 'T20 International',
  international_t20: 'T20 International',
  test_match: 'Test Matches',
  ipl: 'IPL',
  odi: 'ODI',
  psl: 'PSL',
  t20_blast: 'T20 Blast',
  the_hundred: 'The Hundred',
  caribbean_premier_league: 'CPL',
  icc_world_cup: 'ICC World Cup',
  icc_world_cup_women: 'ICC Women\'s WC',
  icc_trophy: 'ICC Trophy',
  asia_cup: 'Asia Cup',
  // Combat
  ufc: 'UFC',
  mma: 'MMA',
  mixed_martial_arts: 'MMA',
  boxing: 'Boxing',
  // Hockey
  nhl: 'NHL',
  nhl_preseason: 'NHL Preseason',
  ahl: 'AHL',
  shl: 'SHL',
  allsvenskan_hockey: 'Allsvenskan Hockey',
  sweden_hockey_league: 'SHL',
  liiga: 'Liiga',
  mestis: 'Mestis',
  nhl_championship: 'Stanley Cup',
  // Tennis - ATP
  atp_aus_open: 'Australian Open',
  atp_french_open: 'French Open',
  atp_wimbledon: 'Wimbledon',
  atp_us_open: 'US Open',
  atp_indian_wells: 'Indian Wells',
  atp_miami: 'Miami Open',
  atp_monte_carlo: 'Monte Carlo Masters',
  atp_madrid: 'Madrid Open',
  atp_italian: 'Italian Open',
  atp_canadian: 'Canadian Open',
  atp_cincinnati: 'Cincinnati Open',
  atp_shanghai: 'Shanghai Masters',
  atp_paris: 'Paris Masters',
  atp_dubai: 'Dubai Tennis',
  atp_qatar: 'Qatar Open',
  atp_china: 'China Open',
  // Tennis - WTA
  wta_aus_open: 'AO (WTA)',
  wta_french_open: 'French Open (WTA)',
  wta_wimbledon: 'Wimbledon (WTA)',
  wta_us_open: 'US Open (WTA)',
  wta_indian_wells: 'Indian Wells (WTA)',
  wta_miami: 'Miami Open (WTA)',
  wta_madrid: 'Madrid Open (WTA)',
  wta_italian: 'Italian Open (WTA)',
  wta_canadian: 'Canadian Open (WTA)',
  wta_cincinnati: 'Cincinnati (WTA)',
  wta_dubai: 'Dubai (WTA)',
  wta_qatar: 'Qatar (WTA)',
  wta_china: 'China Open (WTA)',
  wta_wuhan: 'Wuhan Open',
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
  afl: 'AFL',
  lacrosse_pll: 'PLL Lacrosse',
  lacrosse_ncaa: 'NCAA Lacrosse',
  handball_bundesliga: 'Handball',
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
      setCategories(data.categories || {});
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch categories';
      setError(message);
      console.error('Failed to fetch categories:', e);
      // Fallback categories if API fails
      setCategories({
        football: ['nfl', 'ncaaf', 'cfl'],
        basketball: ['nba', 'ncaab', 'wnba', 'euroleague'],
        baseball: ['mlb', 'npb', 'kbo'],
        soccer: ['premier_league', 'la_liga', 'bundesliga', 'serie_a', 'champions_league', 'mls', 'liga_mx'],
        cricket: ['big_bash', 't20_international', 'ipl', 'test_match'],
        hockey: ['nhl', 'shl', 'liiga'],
        tennis: ['atp_aus_open', 'atp_french_open', 'atp_wimbledon', 'atp_us_open'],
        combat: ['ufc', 'boxing'],
        golf: ['masters', 'pga_championship'],
        rugby: ['nrl', 'six_nations'],
        other: ['aussie_rules', 'lacrosse_pll'],
      });
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
      const data = await sportsRequest<{ events: SportsMatch[] }>(`/events?category=${category}`);
      setMatches(data.events || []);
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
      // Fetch from all categories and combine results
      const allCategories = ['soccer', 'cricket', 'basketball', 'football', 'baseball', 'hockey', 'tennis', 'rugby', 'golf', 'combat', 'other'];
      const results = await Promise.allSettled(
        allCategories.map(cat => sportsRequest<{ events: SportsMatch[] }>(`/events?category=${cat}`))
      );
      
      const allEvents: SportsMatch[] = [];
      const seenIds = new Set<string>();
      
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.events) {
          for (const event of result.value.events) {
            if (!seenIds.has(event.event_id)) {
              seenIds.add(event.event_id);
              allEvents.push(event);
            }
          }
        }
      }
      
      // Sort by commence time (ensure numeric comparison)
      allEvents.sort((a, b) => Number(a.commence_timestamp) - Number(b.commence_timestamp));
      setMatches(allEvents);
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
