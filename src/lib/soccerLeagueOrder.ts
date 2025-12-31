/**
 * Soccer league ordering by region and competition type
 * Lower numbers = higher priority (appears first)
 */

export type LeagueRegion = 
  | 'europe_top5'      // Big 5 European leagues
  | 'europe_other'     // Other European leagues
  | 'europe_cups'      // European club competitions
  | 'uk_cups'          // English/UK domestic cups
  | 'americas'         // North/South American leagues
  | 'americas_cups'    // Copa Libertadores, Sudamericana, etc.
  | 'asia_oceania'     // Asian and Oceania leagues
  | 'africa'           // African leagues/competitions
  | 'international'    // World Cup, AFCON, Euros, etc.
  | 'unknown';

export interface LeagueOrderInfo {
  region: LeagueRegion;
  regionOrder: number;    // Order within regions (lower = first)
  competitionOrder: number; // Order within the region (lower = first)
}

// Region ordering: Europe first, then Americas, Asia, Africa, then International
const REGION_ORDER: Record<LeagueRegion, number> = {
  europe_top5: 1,
  europe_other: 2,
  uk_cups: 3,
  europe_cups: 4,
  americas: 5,
  americas_cups: 6,
  asia_oceania: 7,
  africa: 8,
  international: 9,
  unknown: 99,
};

// Map league keys to their region and order
export const LEAGUE_ORDER_MAP: Record<string, LeagueOrderInfo> = {
  // Europe - Top 5 Leagues
  premier_league: { region: 'europe_top5', regionOrder: REGION_ORDER.europe_top5, competitionOrder: 1 },
  epl: { region: 'europe_top5', regionOrder: REGION_ORDER.europe_top5, competitionOrder: 1 },
  la_liga: { region: 'europe_top5', regionOrder: REGION_ORDER.europe_top5, competitionOrder: 2 },
  bundesliga: { region: 'europe_top5', regionOrder: REGION_ORDER.europe_top5, competitionOrder: 3 },
  serie_a: { region: 'europe_top5', regionOrder: REGION_ORDER.europe_top5, competitionOrder: 4 },
  ligue_1: { region: 'europe_top5', regionOrder: REGION_ORDER.europe_top5, competitionOrder: 5 },

  // Europe - Other Leagues
  eredivisie: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 1 },
  portugal_primeira_liga: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 2 },
  spl: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 3 },
  efl_champ: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 4 },
  turkey_super_league: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 5 },
  russian_premier: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 6 },
  polish_ekstraklasa: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 7 },
  belgium_first_div: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 8 },
  league_of_ireland: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 9 },
  norwegian_eliteserien: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 10 },
  swedish_allsvenskan: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 11 },
  swedish_superettan: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 12 },
  finnish_veikkausliiga: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 13 },

  // UK - Domestic Cups
  fa_cup: { region: 'uk_cups', regionOrder: REGION_ORDER.uk_cups, competitionOrder: 1 },
  england_efl_cup: { region: 'uk_cups', regionOrder: REGION_ORDER.uk_cups, competitionOrder: 2 },

  // Europe - Club Competitions (UEFA)
  champions_league: { region: 'europe_cups', regionOrder: REGION_ORDER.europe_cups, competitionOrder: 1 },
  europa_league: { region: 'europe_cups', regionOrder: REGION_ORDER.europe_cups, competitionOrder: 2 },
  champions_league_qual: { region: 'europe_cups', regionOrder: REGION_ORDER.europe_cups, competitionOrder: 3 },
  club_world_cup: { region: 'europe_cups', regionOrder: REGION_ORDER.europe_cups, competitionOrder: 4 },

  // Americas - Leagues
  mls: { region: 'americas', regionOrder: REGION_ORDER.americas, competitionOrder: 1 },
  liga_mx: { region: 'americas', regionOrder: REGION_ORDER.americas, competitionOrder: 2 },
  brazil_serie_a: { region: 'americas', regionOrder: REGION_ORDER.americas, competitionOrder: 3 },
  brazil_serie_b: { region: 'americas', regionOrder: REGION_ORDER.americas, competitionOrder: 4 },
  brazil_campeonato: { region: 'americas', regionOrder: REGION_ORDER.americas, competitionOrder: 5 },
  argentina_primera: { region: 'americas', regionOrder: REGION_ORDER.americas, competitionOrder: 6 },
  chile_primera: { region: 'americas', regionOrder: REGION_ORDER.americas, competitionOrder: 7 },

  // Americas - Cups
  copa_libertadores: { region: 'americas_cups', regionOrder: REGION_ORDER.americas_cups, competitionOrder: 1 },
  copa_sudamericana: { region: 'americas_cups', regionOrder: REGION_ORDER.americas_cups, competitionOrder: 2 },
  concacaf_gold_cup: { region: 'americas_cups', regionOrder: REGION_ORDER.americas_cups, competitionOrder: 3 },
  concacaf_leagues_cup: { region: 'americas_cups', regionOrder: REGION_ORDER.americas_cups, competitionOrder: 4 },
  copa_america: { region: 'americas_cups', regionOrder: REGION_ORDER.americas_cups, competitionOrder: 5 },

  // Asia/Oceania
  saudi_pro_league: { region: 'asia_oceania', regionOrder: REGION_ORDER.asia_oceania, competitionOrder: 1 },
  j_league: { region: 'asia_oceania', regionOrder: REGION_ORDER.asia_oceania, competitionOrder: 2 },
  k_league: { region: 'asia_oceania', regionOrder: REGION_ORDER.asia_oceania, competitionOrder: 3 },
  china_super_league: { region: 'asia_oceania', regionOrder: REGION_ORDER.asia_oceania, competitionOrder: 4 },
  australia_aleague: { region: 'asia_oceania', regionOrder: REGION_ORDER.asia_oceania, competitionOrder: 5 },

  // International Competitions
  world_cup: { region: 'international', regionOrder: REGION_ORDER.international, competitionOrder: 1 },
  world_cup_women: { region: 'international', regionOrder: REGION_ORDER.international, competitionOrder: 2 },
  world_cup_qualifiers_southamerica: { region: 'international', regionOrder: REGION_ORDER.international, competitionOrder: 3 },
  euro: { region: 'international', regionOrder: REGION_ORDER.international, competitionOrder: 4 },
  euro_qualification: { region: 'international', regionOrder: REGION_ORDER.international, competitionOrder: 5 },
  nations_league: { region: 'international', regionOrder: REGION_ORDER.international, competitionOrder: 6 },
  afcon: { region: 'international', regionOrder: REGION_ORDER.international, competitionOrder: 7 },
};

const DEFAULT_ORDER: LeagueOrderInfo = {
  region: 'unknown',
  regionOrder: REGION_ORDER.unknown,
  competitionOrder: 999,
};

export function getLeagueOrder(leagueKey: string): LeagueOrderInfo {
  return LEAGUE_ORDER_MAP[leagueKey] || DEFAULT_ORDER;
}

export function compareLeagues(a: string, b: string): number {
  const orderA = getLeagueOrder(a);
  const orderB = getLeagueOrder(b);
  
  // First compare by region
  if (orderA.regionOrder !== orderB.regionOrder) {
    return orderA.regionOrder - orderB.regionOrder;
  }
  
  // Then by competition order within region
  return orderA.competitionOrder - orderB.competitionOrder;
}

// Region display names for grouping headers
export const REGION_DISPLAY_NAMES: Record<LeagueRegion, string> = {
  europe_top5: '🇪🇺 Europe - Top Leagues',
  europe_other: '🇪🇺 Europe - Other Leagues',
  uk_cups: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 UK Cups',
  europe_cups: '🏆 European Competitions',
  americas: '🌎 Americas',
  americas_cups: '🏆 Americas Competitions',
  asia_oceania: '🌏 Asia & Oceania',
  africa: '🌍 Africa',
  international: '🌐 International',
  unknown: '⚽ Other',
};
