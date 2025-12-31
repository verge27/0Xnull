/**
 * League/competition ordering by region and competition type for ALL sports
 * Lower numbers = higher priority (appears first)
 */

export type LeagueRegion = 
  // Soccer regions
  | 'europe_top5'      // Big 5 European leagues
  | 'europe_other'     // Other European leagues
  | 'europe_cups'      // European club competitions
  | 'uk_cups'          // English/UK domestic cups
  | 'americas'         // North/South American leagues
  | 'americas_cups'    // Copa Libertadores, Sudamericana, etc.
  | 'asia_oceania'     // Asian and Oceania leagues
  | 'africa'           // African leagues/competitions
  | 'international'    // World Cup, AFCON, Euros, etc.
  // American sports regions
  | 'us_major'         // Major US leagues (NFL, NBA, MLB, NHL)
  | 'us_college'       // US college sports
  | 'us_minor'         // Minor leagues
  // Tennis regions
  | 'tennis_grand_slam'
  | 'tennis_masters'
  | 'tennis_wta'
  | 'tennis_other'
  // Cricket regions
  | 'cricket_ipl'
  | 'cricket_international'
  | 'cricket_domestic'
  // Hockey regions
  | 'hockey_nhl'
  | 'hockey_europe'
  | 'hockey_other'
  // Combat regions
  | 'combat_ufc'
  | 'combat_boxing'
  | 'combat_other'
  // Golf regions
  | 'golf_major'
  | 'golf_tour'
  // Rugby regions
  | 'rugby_international'
  | 'rugby_domestic'
  // Generic
  | 'unknown';

export interface LeagueOrderInfo {
  region: LeagueRegion;
  regionOrder: number;    // Order within regions (lower = first)
  competitionOrder: number; // Order within the region (lower = first)
  displayRegion: string;  // Human-readable region name with emoji
}

// Region ordering by sport category
const REGION_ORDER: Record<LeagueRegion, number> = {
  // Soccer (1-9)
  europe_top5: 1,
  europe_other: 2,
  uk_cups: 3,
  europe_cups: 4,
  americas: 5,
  americas_cups: 6,
  asia_oceania: 7,
  africa: 8,
  international: 9,
  // American sports (10-12)
  us_major: 10,
  us_college: 11,
  us_minor: 12,
  // Hockey (13-15)
  hockey_nhl: 13,
  hockey_europe: 14,
  hockey_other: 15,
  // Tennis (16-19)
  tennis_grand_slam: 16,
  tennis_masters: 17,
  tennis_wta: 18,
  tennis_other: 19,
  // Cricket (20-22)
  cricket_ipl: 20,
  cricket_international: 21,
  cricket_domestic: 22,
  // Combat (23-25)
  combat_ufc: 23,
  combat_boxing: 24,
  combat_other: 25,
  // Golf (26-27)
  golf_major: 26,
  golf_tour: 27,
  // Rugby (28-29)
  rugby_international: 28,
  rugby_domestic: 29,
  // Unknown
  unknown: 99,
};

// Region display names for grouping headers
export const REGION_DISPLAY_NAMES: Record<LeagueRegion, string> = {
  // Soccer
  europe_top5: '🇪🇺 Europe - Top Leagues',
  europe_other: '🇪🇺 Europe - Other Leagues',
  uk_cups: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 UK Cups',
  europe_cups: '🏆 European Competitions',
  americas: '🌎 Americas',
  americas_cups: '🏆 Americas Competitions',
  asia_oceania: '🌏 Asia & Oceania',
  africa: '🌍 Africa',
  international: '🌐 International',
  // American sports
  us_major: '🇺🇸 Major Leagues',
  us_college: '🎓 College Sports',
  us_minor: '🏟️ Minor Leagues',
  // Hockey
  hockey_nhl: '🏒 NHL',
  hockey_europe: '🏒 European Hockey',
  hockey_other: '🏒 Other Hockey',
  // Tennis
  tennis_grand_slam: '🎾 Grand Slams',
  tennis_masters: '🎾 ATP Masters',
  tennis_wta: '🎾 WTA',
  tennis_other: '🎾 Other Tennis',
  // Cricket
  cricket_ipl: '🏏 IPL & Premier Leagues',
  cricket_international: '🏏 International Cricket',
  cricket_domestic: '🏏 Domestic Cricket',
  // Combat
  combat_ufc: '🥊 UFC',
  combat_boxing: '🥊 Boxing',
  combat_other: '🥊 Other Combat',
  // Golf
  golf_major: '⛳ Major Championships',
  golf_tour: '⛳ Tour Events',
  // Rugby
  rugby_international: '🏉 International Rugby',
  rugby_domestic: '🏉 Domestic Rugby',
  // Unknown
  unknown: '📊 Other',
};

// Map league keys to their region and order
export const LEAGUE_ORDER_MAP: Record<string, LeagueOrderInfo> = {
  // ==================== SOCCER ====================
  // Europe - Top 5 Leagues
  premier_league: { region: 'europe_top5', regionOrder: REGION_ORDER.europe_top5, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.europe_top5 },
  epl: { region: 'europe_top5', regionOrder: REGION_ORDER.europe_top5, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.europe_top5 },
  la_liga: { region: 'europe_top5', regionOrder: REGION_ORDER.europe_top5, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.europe_top5 },
  bundesliga: { region: 'europe_top5', regionOrder: REGION_ORDER.europe_top5, competitionOrder: 3, displayRegion: REGION_DISPLAY_NAMES.europe_top5 },
  serie_a: { region: 'europe_top5', regionOrder: REGION_ORDER.europe_top5, competitionOrder: 4, displayRegion: REGION_DISPLAY_NAMES.europe_top5 },
  ligue_1: { region: 'europe_top5', regionOrder: REGION_ORDER.europe_top5, competitionOrder: 5, displayRegion: REGION_DISPLAY_NAMES.europe_top5 },

  // Europe - Other Leagues
  eredivisie: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.europe_other },
  portugal_primeira_liga: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.europe_other },
  spl: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 3, displayRegion: REGION_DISPLAY_NAMES.europe_other },
  efl_champ: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 4, displayRegion: REGION_DISPLAY_NAMES.europe_other },
  turkey_super_league: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 5, displayRegion: REGION_DISPLAY_NAMES.europe_other },
  russian_premier: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 6, displayRegion: REGION_DISPLAY_NAMES.europe_other },
  polish_ekstraklasa: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 7, displayRegion: REGION_DISPLAY_NAMES.europe_other },
  belgium_first_div: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 8, displayRegion: REGION_DISPLAY_NAMES.europe_other },
  league_of_ireland: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 9, displayRegion: REGION_DISPLAY_NAMES.europe_other },
  norwegian_eliteserien: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 10, displayRegion: REGION_DISPLAY_NAMES.europe_other },
  swedish_allsvenskan: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 11, displayRegion: REGION_DISPLAY_NAMES.europe_other },
  swedish_superettan: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 12, displayRegion: REGION_DISPLAY_NAMES.europe_other },
  finnish_veikkausliiga: { region: 'europe_other', regionOrder: REGION_ORDER.europe_other, competitionOrder: 13, displayRegion: REGION_DISPLAY_NAMES.europe_other },

  // UK - Domestic Cups
  fa_cup: { region: 'uk_cups', regionOrder: REGION_ORDER.uk_cups, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.uk_cups },
  england_efl_cup: { region: 'uk_cups', regionOrder: REGION_ORDER.uk_cups, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.uk_cups },

  // Europe - Club Competitions (UEFA)
  champions_league: { region: 'europe_cups', regionOrder: REGION_ORDER.europe_cups, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.europe_cups },
  europa_league: { region: 'europe_cups', regionOrder: REGION_ORDER.europe_cups, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.europe_cups },
  champions_league_qual: { region: 'europe_cups', regionOrder: REGION_ORDER.europe_cups, competitionOrder: 3, displayRegion: REGION_DISPLAY_NAMES.europe_cups },
  club_world_cup: { region: 'europe_cups', regionOrder: REGION_ORDER.europe_cups, competitionOrder: 4, displayRegion: REGION_DISPLAY_NAMES.europe_cups },

  // Americas - Leagues
  mls: { region: 'americas', regionOrder: REGION_ORDER.americas, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.americas },
  liga_mx: { region: 'americas', regionOrder: REGION_ORDER.americas, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.americas },
  brazil_serie_a: { region: 'americas', regionOrder: REGION_ORDER.americas, competitionOrder: 3, displayRegion: REGION_DISPLAY_NAMES.americas },
  brazil_serie_b: { region: 'americas', regionOrder: REGION_ORDER.americas, competitionOrder: 4, displayRegion: REGION_DISPLAY_NAMES.americas },
  brazil_campeonato: { region: 'americas', regionOrder: REGION_ORDER.americas, competitionOrder: 5, displayRegion: REGION_DISPLAY_NAMES.americas },
  argentina_primera: { region: 'americas', regionOrder: REGION_ORDER.americas, competitionOrder: 6, displayRegion: REGION_DISPLAY_NAMES.americas },
  chile_primera: { region: 'americas', regionOrder: REGION_ORDER.americas, competitionOrder: 7, displayRegion: REGION_DISPLAY_NAMES.americas },

  // Americas - Cups
  copa_libertadores: { region: 'americas_cups', regionOrder: REGION_ORDER.americas_cups, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.americas_cups },
  copa_sudamericana: { region: 'americas_cups', regionOrder: REGION_ORDER.americas_cups, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.americas_cups },
  concacaf_gold_cup: { region: 'americas_cups', regionOrder: REGION_ORDER.americas_cups, competitionOrder: 3, displayRegion: REGION_DISPLAY_NAMES.americas_cups },
  concacaf_leagues_cup: { region: 'americas_cups', regionOrder: REGION_ORDER.americas_cups, competitionOrder: 4, displayRegion: REGION_DISPLAY_NAMES.americas_cups },
  copa_america: { region: 'americas_cups', regionOrder: REGION_ORDER.americas_cups, competitionOrder: 5, displayRegion: REGION_DISPLAY_NAMES.americas_cups },

  // Asia/Oceania Soccer
  saudi_pro_league: { region: 'asia_oceania', regionOrder: REGION_ORDER.asia_oceania, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.asia_oceania },
  j_league: { region: 'asia_oceania', regionOrder: REGION_ORDER.asia_oceania, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.asia_oceania },
  k_league: { region: 'asia_oceania', regionOrder: REGION_ORDER.asia_oceania, competitionOrder: 3, displayRegion: REGION_DISPLAY_NAMES.asia_oceania },
  china_super_league: { region: 'asia_oceania', regionOrder: REGION_ORDER.asia_oceania, competitionOrder: 4, displayRegion: REGION_DISPLAY_NAMES.asia_oceania },
  australia_aleague: { region: 'asia_oceania', regionOrder: REGION_ORDER.asia_oceania, competitionOrder: 5, displayRegion: REGION_DISPLAY_NAMES.asia_oceania },

  // International Soccer Competitions
  world_cup: { region: 'international', regionOrder: REGION_ORDER.international, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.international },
  world_cup_women: { region: 'international', regionOrder: REGION_ORDER.international, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.international },
  world_cup_qualifiers_southamerica: { region: 'international', regionOrder: REGION_ORDER.international, competitionOrder: 3, displayRegion: REGION_DISPLAY_NAMES.international },
  euro: { region: 'international', regionOrder: REGION_ORDER.international, competitionOrder: 4, displayRegion: REGION_DISPLAY_NAMES.international },
  euro_qualification: { region: 'international', regionOrder: REGION_ORDER.international, competitionOrder: 5, displayRegion: REGION_DISPLAY_NAMES.international },
  nations_league: { region: 'international', regionOrder: REGION_ORDER.international, competitionOrder: 6, displayRegion: REGION_DISPLAY_NAMES.international },
  afcon: { region: 'international', regionOrder: REGION_ORDER.international, competitionOrder: 7, displayRegion: REGION_DISPLAY_NAMES.international },

  // ==================== AMERICAN FOOTBALL ====================
  nfl: { region: 'us_major', regionOrder: REGION_ORDER.us_major, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.us_major },
  nfl_preseason: { region: 'us_major', regionOrder: REGION_ORDER.us_major, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.us_major },
  nfl_superbowl: { region: 'us_major', regionOrder: REGION_ORDER.us_major, competitionOrder: 3, displayRegion: REGION_DISPLAY_NAMES.us_major },
  ncaaf: { region: 'us_college', regionOrder: REGION_ORDER.us_college, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.us_college },
  ncaaf_championship: { region: 'us_college', regionOrder: REGION_ORDER.us_college, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.us_college },
  cfl: { region: 'us_minor', regionOrder: REGION_ORDER.us_minor, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.us_minor },
  ufl: { region: 'us_minor', regionOrder: REGION_ORDER.us_minor, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.us_minor },

  // ==================== BASKETBALL ====================
  nba: { region: 'us_major', regionOrder: REGION_ORDER.us_major, competitionOrder: 10, displayRegion: REGION_DISPLAY_NAMES.us_major },
  nba_preseason: { region: 'us_major', regionOrder: REGION_ORDER.us_major, competitionOrder: 11, displayRegion: REGION_DISPLAY_NAMES.us_major },
  nba_summer_league: { region: 'us_major', regionOrder: REGION_ORDER.us_major, competitionOrder: 12, displayRegion: REGION_DISPLAY_NAMES.us_major },
  nba_championship: { region: 'us_major', regionOrder: REGION_ORDER.us_major, competitionOrder: 13, displayRegion: REGION_DISPLAY_NAMES.us_major },
  wnba: { region: 'us_major', regionOrder: REGION_ORDER.us_major, competitionOrder: 14, displayRegion: REGION_DISPLAY_NAMES.us_major },
  ncaab: { region: 'us_college', regionOrder: REGION_ORDER.us_college, competitionOrder: 10, displayRegion: REGION_DISPLAY_NAMES.us_college },
  ncaab_championship: { region: 'us_college', regionOrder: REGION_ORDER.us_college, competitionOrder: 11, displayRegion: REGION_DISPLAY_NAMES.us_college },
  wncaab: { region: 'us_college', regionOrder: REGION_ORDER.us_college, competitionOrder: 12, displayRegion: REGION_DISPLAY_NAMES.us_college },
  euroleague: { region: 'hockey_europe', regionOrder: REGION_ORDER.hockey_europe, competitionOrder: 20, displayRegion: '🏀 European Basketball' },
  nbl: { region: 'asia_oceania', regionOrder: REGION_ORDER.asia_oceania, competitionOrder: 10, displayRegion: '🏀 Australia NBL' },

  // ==================== BASEBALL ====================
  mlb: { region: 'us_major', regionOrder: REGION_ORDER.us_major, competitionOrder: 20, displayRegion: REGION_DISPLAY_NAMES.us_major },
  mlb_preseason: { region: 'us_major', regionOrder: REGION_ORDER.us_major, competitionOrder: 21, displayRegion: REGION_DISPLAY_NAMES.us_major },
  mlb_world_series: { region: 'us_major', regionOrder: REGION_ORDER.us_major, competitionOrder: 22, displayRegion: REGION_DISPLAY_NAMES.us_major },
  ncaa_baseball: { region: 'us_college', regionOrder: REGION_ORDER.us_college, competitionOrder: 20, displayRegion: REGION_DISPLAY_NAMES.us_college },
  milb: { region: 'us_minor', regionOrder: REGION_ORDER.us_minor, competitionOrder: 10, displayRegion: REGION_DISPLAY_NAMES.us_minor },
  npb: { region: 'asia_oceania', regionOrder: REGION_ORDER.asia_oceania, competitionOrder: 20, displayRegion: '⚾ Japan NPB' },
  kbo: { region: 'asia_oceania', regionOrder: REGION_ORDER.asia_oceania, competitionOrder: 21, displayRegion: '⚾ Korea KBO' },

  // ==================== HOCKEY ====================
  nhl: { region: 'hockey_nhl', regionOrder: REGION_ORDER.hockey_nhl, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.hockey_nhl },
  nhl_preseason: { region: 'hockey_nhl', regionOrder: REGION_ORDER.hockey_nhl, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.hockey_nhl },
  nhl_championship: { region: 'hockey_nhl', regionOrder: REGION_ORDER.hockey_nhl, competitionOrder: 3, displayRegion: REGION_DISPLAY_NAMES.hockey_nhl },
  ahl: { region: 'hockey_other', regionOrder: REGION_ORDER.hockey_other, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.hockey_other },
  shl: { region: 'hockey_europe', regionOrder: REGION_ORDER.hockey_europe, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.hockey_europe },
  sweden_hockey_league: { region: 'hockey_europe', regionOrder: REGION_ORDER.hockey_europe, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.hockey_europe },
  allsvenskan_hockey: { region: 'hockey_europe', regionOrder: REGION_ORDER.hockey_europe, competitionOrder: 3, displayRegion: REGION_DISPLAY_NAMES.hockey_europe },
  liiga: { region: 'hockey_europe', regionOrder: REGION_ORDER.hockey_europe, competitionOrder: 4, displayRegion: REGION_DISPLAY_NAMES.hockey_europe },
  mestis: { region: 'hockey_europe', regionOrder: REGION_ORDER.hockey_europe, competitionOrder: 5, displayRegion: REGION_DISPLAY_NAMES.hockey_europe },

  // ==================== TENNIS ====================
  // Grand Slams
  atp_aus_open: { region: 'tennis_grand_slam', regionOrder: REGION_ORDER.tennis_grand_slam, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.tennis_grand_slam },
  atp_french_open: { region: 'tennis_grand_slam', regionOrder: REGION_ORDER.tennis_grand_slam, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.tennis_grand_slam },
  atp_wimbledon: { region: 'tennis_grand_slam', regionOrder: REGION_ORDER.tennis_grand_slam, competitionOrder: 3, displayRegion: REGION_DISPLAY_NAMES.tennis_grand_slam },
  atp_us_open: { region: 'tennis_grand_slam', regionOrder: REGION_ORDER.tennis_grand_slam, competitionOrder: 4, displayRegion: REGION_DISPLAY_NAMES.tennis_grand_slam },
  // ATP Masters
  atp_indian_wells: { region: 'tennis_masters', regionOrder: REGION_ORDER.tennis_masters, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.tennis_masters },
  atp_miami: { region: 'tennis_masters', regionOrder: REGION_ORDER.tennis_masters, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.tennis_masters },
  atp_monte_carlo: { region: 'tennis_masters', regionOrder: REGION_ORDER.tennis_masters, competitionOrder: 3, displayRegion: REGION_DISPLAY_NAMES.tennis_masters },
  atp_madrid: { region: 'tennis_masters', regionOrder: REGION_ORDER.tennis_masters, competitionOrder: 4, displayRegion: REGION_DISPLAY_NAMES.tennis_masters },
  atp_italian: { region: 'tennis_masters', regionOrder: REGION_ORDER.tennis_masters, competitionOrder: 5, displayRegion: REGION_DISPLAY_NAMES.tennis_masters },
  atp_canadian: { region: 'tennis_masters', regionOrder: REGION_ORDER.tennis_masters, competitionOrder: 6, displayRegion: REGION_DISPLAY_NAMES.tennis_masters },
  atp_cincinnati: { region: 'tennis_masters', regionOrder: REGION_ORDER.tennis_masters, competitionOrder: 7, displayRegion: REGION_DISPLAY_NAMES.tennis_masters },
  atp_shanghai: { region: 'tennis_masters', regionOrder: REGION_ORDER.tennis_masters, competitionOrder: 8, displayRegion: REGION_DISPLAY_NAMES.tennis_masters },
  atp_paris: { region: 'tennis_masters', regionOrder: REGION_ORDER.tennis_masters, competitionOrder: 9, displayRegion: REGION_DISPLAY_NAMES.tennis_masters },
  atp_dubai: { region: 'tennis_other', regionOrder: REGION_ORDER.tennis_other, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.tennis_other },
  atp_qatar: { region: 'tennis_other', regionOrder: REGION_ORDER.tennis_other, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.tennis_other },
  atp_china: { region: 'tennis_other', regionOrder: REGION_ORDER.tennis_other, competitionOrder: 3, displayRegion: REGION_DISPLAY_NAMES.tennis_other },
  // WTA
  wta_aus_open: { region: 'tennis_wta', regionOrder: REGION_ORDER.tennis_wta, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.tennis_wta },
  wta_french_open: { region: 'tennis_wta', regionOrder: REGION_ORDER.tennis_wta, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.tennis_wta },
  wta_wimbledon: { region: 'tennis_wta', regionOrder: REGION_ORDER.tennis_wta, competitionOrder: 3, displayRegion: REGION_DISPLAY_NAMES.tennis_wta },
  wta_us_open: { region: 'tennis_wta', regionOrder: REGION_ORDER.tennis_wta, competitionOrder: 4, displayRegion: REGION_DISPLAY_NAMES.tennis_wta },
  wta_indian_wells: { region: 'tennis_wta', regionOrder: REGION_ORDER.tennis_wta, competitionOrder: 5, displayRegion: REGION_DISPLAY_NAMES.tennis_wta },
  wta_miami: { region: 'tennis_wta', regionOrder: REGION_ORDER.tennis_wta, competitionOrder: 6, displayRegion: REGION_DISPLAY_NAMES.tennis_wta },
  wta_madrid: { region: 'tennis_wta', regionOrder: REGION_ORDER.tennis_wta, competitionOrder: 7, displayRegion: REGION_DISPLAY_NAMES.tennis_wta },
  wta_italian: { region: 'tennis_wta', regionOrder: REGION_ORDER.tennis_wta, competitionOrder: 8, displayRegion: REGION_DISPLAY_NAMES.tennis_wta },
  wta_canadian: { region: 'tennis_wta', regionOrder: REGION_ORDER.tennis_wta, competitionOrder: 9, displayRegion: REGION_DISPLAY_NAMES.tennis_wta },
  wta_cincinnati: { region: 'tennis_wta', regionOrder: REGION_ORDER.tennis_wta, competitionOrder: 10, displayRegion: REGION_DISPLAY_NAMES.tennis_wta },
  wta_dubai: { region: 'tennis_wta', regionOrder: REGION_ORDER.tennis_wta, competitionOrder: 11, displayRegion: REGION_DISPLAY_NAMES.tennis_wta },
  wta_qatar: { region: 'tennis_wta', regionOrder: REGION_ORDER.tennis_wta, competitionOrder: 12, displayRegion: REGION_DISPLAY_NAMES.tennis_wta },
  wta_china: { region: 'tennis_wta', regionOrder: REGION_ORDER.tennis_wta, competitionOrder: 13, displayRegion: REGION_DISPLAY_NAMES.tennis_wta },
  wta_wuhan: { region: 'tennis_wta', regionOrder: REGION_ORDER.tennis_wta, competitionOrder: 14, displayRegion: REGION_DISPLAY_NAMES.tennis_wta },

  // ==================== CRICKET ====================
  ipl: { region: 'cricket_ipl', regionOrder: REGION_ORDER.cricket_ipl, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.cricket_ipl },
  big_bash: { region: 'cricket_ipl', regionOrder: REGION_ORDER.cricket_ipl, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.cricket_ipl },
  psl: { region: 'cricket_ipl', regionOrder: REGION_ORDER.cricket_ipl, competitionOrder: 3, displayRegion: REGION_DISPLAY_NAMES.cricket_ipl },
  caribbean_premier_league: { region: 'cricket_ipl', regionOrder: REGION_ORDER.cricket_ipl, competitionOrder: 4, displayRegion: REGION_DISPLAY_NAMES.cricket_ipl },
  t20_blast: { region: 'cricket_domestic', regionOrder: REGION_ORDER.cricket_domestic, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.cricket_domestic },
  the_hundred: { region: 'cricket_domestic', regionOrder: REGION_ORDER.cricket_domestic, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.cricket_domestic },
  t20_international: { region: 'cricket_international', regionOrder: REGION_ORDER.cricket_international, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.cricket_international },
  international_t20: { region: 'cricket_international', regionOrder: REGION_ORDER.cricket_international, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.cricket_international },
  test_match: { region: 'cricket_international', regionOrder: REGION_ORDER.cricket_international, competitionOrder: 3, displayRegion: REGION_DISPLAY_NAMES.cricket_international },
  odi: { region: 'cricket_international', regionOrder: REGION_ORDER.cricket_international, competitionOrder: 4, displayRegion: REGION_DISPLAY_NAMES.cricket_international },
  icc_world_cup: { region: 'cricket_international', regionOrder: REGION_ORDER.cricket_international, competitionOrder: 5, displayRegion: REGION_DISPLAY_NAMES.cricket_international },
  icc_world_cup_women: { region: 'cricket_international', regionOrder: REGION_ORDER.cricket_international, competitionOrder: 6, displayRegion: REGION_DISPLAY_NAMES.cricket_international },
  icc_trophy: { region: 'cricket_international', regionOrder: REGION_ORDER.cricket_international, competitionOrder: 7, displayRegion: REGION_DISPLAY_NAMES.cricket_international },
  asia_cup: { region: 'cricket_international', regionOrder: REGION_ORDER.cricket_international, competitionOrder: 8, displayRegion: REGION_DISPLAY_NAMES.cricket_international },

  // ==================== COMBAT ====================
  ufc: { region: 'combat_ufc', regionOrder: REGION_ORDER.combat_ufc, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.combat_ufc },
  mma: { region: 'combat_ufc', regionOrder: REGION_ORDER.combat_ufc, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.combat_ufc },
  mixed_martial_arts: { region: 'combat_ufc', regionOrder: REGION_ORDER.combat_ufc, competitionOrder: 3, displayRegion: REGION_DISPLAY_NAMES.combat_ufc },
  boxing: { region: 'combat_boxing', regionOrder: REGION_ORDER.combat_boxing, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.combat_boxing },

  // ==================== GOLF ====================
  masters: { region: 'golf_major', regionOrder: REGION_ORDER.golf_major, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.golf_major },
  pga_championship: { region: 'golf_major', regionOrder: REGION_ORDER.golf_major, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.golf_major },
  the_open: { region: 'golf_major', regionOrder: REGION_ORDER.golf_major, competitionOrder: 3, displayRegion: REGION_DISPLAY_NAMES.golf_major },
  us_open_golf: { region: 'golf_major', regionOrder: REGION_ORDER.golf_major, competitionOrder: 4, displayRegion: REGION_DISPLAY_NAMES.golf_major },

  // ==================== RUGBY ====================
  six_nations: { region: 'rugby_international', regionOrder: REGION_ORDER.rugby_international, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.rugby_international },
  state_of_origin: { region: 'rugby_domestic', regionOrder: REGION_ORDER.rugby_domestic, competitionOrder: 1, displayRegion: REGION_DISPLAY_NAMES.rugby_domestic },
  nrl: { region: 'rugby_domestic', regionOrder: REGION_ORDER.rugby_domestic, competitionOrder: 2, displayRegion: REGION_DISPLAY_NAMES.rugby_domestic },

  // ==================== OTHER ====================
  aussie_rules: { region: 'unknown', regionOrder: REGION_ORDER.unknown, competitionOrder: 1, displayRegion: '🏉 Aussie Rules' },
  afl: { region: 'unknown', regionOrder: REGION_ORDER.unknown, competitionOrder: 2, displayRegion: '🏉 AFL' },
  lacrosse_pll: { region: 'unknown', regionOrder: REGION_ORDER.unknown, competitionOrder: 10, displayRegion: '🥍 Lacrosse' },
  lacrosse_ncaa: { region: 'unknown', regionOrder: REGION_ORDER.unknown, competitionOrder: 11, displayRegion: '🥍 Lacrosse' },
  handball_bundesliga: { region: 'unknown', regionOrder: REGION_ORDER.unknown, competitionOrder: 20, displayRegion: '🤾 Handball' },
  us_election: { region: 'unknown', regionOrder: REGION_ORDER.unknown, competitionOrder: 99, displayRegion: '🗳️ Politics' },
};

const DEFAULT_ORDER: LeagueOrderInfo = {
  region: 'unknown',
  regionOrder: REGION_ORDER.unknown,
  competitionOrder: 999,
  displayRegion: REGION_DISPLAY_NAMES.unknown,
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

// Get unique regions for a given set of sports/leagues
export function getRegionsFromSports(sports: string[]): LeagueRegion[] {
  const regions = new Set<LeagueRegion>();
  sports.forEach(sport => {
    const order = getLeagueOrder(sport);
    regions.add(order.region);
  });
  return Array.from(regions).sort((a, b) => REGION_ORDER[a] - REGION_ORDER[b]);
}

// Get the display region name for a sport
export function getSportDisplayRegion(sport: string): string {
  const order = getLeagueOrder(sport);
  return order.displayRegion;
}
