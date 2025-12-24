// Sport and League label utilities for prediction markets

export interface SportInfo {
  sport: string;
  sportLabel: string;
  sportEmoji: string;
  league?: string;
  leagueLabel?: string;
}

// Map of sport keys to display labels
const SPORT_LABELS: Record<string, string> = {
  'americanfootball': 'Football',
  'basketball': 'Basketball',
  'baseball': 'Baseball',
  'icehockey': 'Hockey',
  'soccer': 'Soccer',
  'mma': 'MMA',
  'cricket': 'Cricket',
  'tennis': 'Tennis',
  'golf': 'Golf',
  'boxing': 'Boxing',
  'esports': 'Esports',
  'rugbyleague': 'Rugby League',
  'rugbyunion': 'Rugby Union',
  'aussierules': 'Aussie Rules',
};

// Map of sport keys to emojis
const SPORT_EMOJIS: Record<string, string> = {
  'americanfootball': '🏈',
  'basketball': '🏀',
  'baseball': '⚾',
  'icehockey': '🏒',
  'soccer': '⚽',
  'mma': '🥊',
  'cricket': '🏏',
  'tennis': '🎾',
  'golf': '⛳',
  'boxing': '🥊',
  'esports': '🎮',
  'rugbyleague': '🏉',
  'rugbyunion': '🏉',
  'aussierules': '🏉',
};

// Map of league keys to display labels
const LEAGUE_LABELS: Record<string, string> = {
  // American Football
  'nfl': 'NFL',
  'ncaaf': 'NCAA Football',
  // Basketball
  'nba': 'NBA',
  'ncaab': 'NCAA Basketball',
  'wnba': 'WNBA',
  // Baseball
  'mlb': 'MLB',
  // Hockey
  'nhl': 'NHL',
  // Soccer
  'epl': 'Premier League',
  'laliga': 'La Liga',
  'bundesliga': 'Bundesliga',
  'seriea': 'Serie A',
  'ligue1': 'Ligue 1',
  'mls': 'MLS',
  'ucl': 'Champions League',
  'uefael': 'Europa League',
  // MMA
  'ufc': 'UFC',
  'pfl': 'PFL',
  'bellator': 'Bellator',
  // Cricket
  'big_bash': 'Big Bash',
  't20': 'T20 International',
  'test': 'Test Cricket',
  'ipl': 'IPL',
  // Tennis
  'atp': 'ATP',
  'wta': 'WTA',
  // Golf
  'pga': 'PGA Tour',
  // Esports
  'lol': 'League of Legends',
  'csgo': 'CS2',
  'cs2': 'CS2',
  'dota2': 'Dota 2',
  'valorant': 'Valorant',
  'starcraft': 'StarCraft',
  'overwatch': 'Overwatch',
};

/**
 * Extract sport and league info from a market ID
 * Market ID formats:
 * - sports_basketball_ncaab_eventid_teamslug
 * - sports_americanfootball_nfl_eventid_teamslug  
 * - cricket_eventid_teamslug
 * - esports_lol_eventid_teamslug
 */
export function extractSportInfo(marketId: string): SportInfo {
  // Handle cricket markets
  if (marketId.startsWith('cricket_')) {
    return {
      sport: 'cricket',
      sportLabel: 'Cricket',
      sportEmoji: '🏏',
    };
  }

  // Handle esports markets
  if (marketId.startsWith('esports_')) {
    const parts = marketId.split('_');
    const league = parts[1] || '';
    return {
      sport: 'esports',
      sportLabel: 'Esports',
      sportEmoji: '🎮',
      league,
      leagueLabel: LEAGUE_LABELS[league.toLowerCase()] || league.toUpperCase(),
    };
  }

  // Handle sports_ prefix markets (most common)
  if (marketId.startsWith('sports_')) {
    const parts = marketId.split('_');
    // Format: sports_<sport>_<league>_<eventid>_<team>
    const sport = parts[1] || '';
    const league = parts[2] || '';
    
    return {
      sport,
      sportLabel: SPORT_LABELS[sport.toLowerCase()] || sport,
      sportEmoji: SPORT_EMOJIS[sport.toLowerCase()] || '🏅',
      league,
      leagueLabel: LEAGUE_LABELS[league.toLowerCase()] || league.toUpperCase(),
    };
  }

  // Handle crypto/prediction markets
  if (marketId.startsWith('crypto_')) {
    return {
      sport: 'crypto',
      sportLabel: 'Crypto',
      sportEmoji: '📈',
    };
  }

  // Default fallback
  return {
    sport: 'unknown',
    sportLabel: 'Event',
    sportEmoji: '📌',
  };
}

/**
 * Get a formatted display string for sport and league
 * e.g., "🏀 NCAA Basketball" or "🏈 NFL"
 */
export function getSportLeagueDisplay(marketId: string): string {
  const info = extractSportInfo(marketId);
  
  if (info.leagueLabel) {
    return `${info.sportEmoji} ${info.leagueLabel}`;
  }
  
  return `${info.sportEmoji} ${info.sportLabel}`;
}

/**
 * Get just the league/competition label
 */
export function getLeagueLabel(marketId: string): string | null {
  const info = extractSportInfo(marketId);
  return info.leagueLabel || null;
}

/**
 * Parse both teams from a market title
 * Returns formatted "Team A vs Team B" string
 */
export function parseMatchupFromTitle(title: string): { teamA: string; teamB: string; matchup: string } {
  // Format: "Team A wins vs Team B"
  const winsVsMatch = title.match(/(.+?)\s+wins\s+vs\s+(.+)/i);
  if (winsVsMatch) {
    const teamA = winsVsMatch[1].trim();
    const teamB = winsVsMatch[2].trim();
    return { teamA, teamB, matchup: `${teamA} vs ${teamB}` };
  }
  
  // Format: "Will Team A win?"
  const willWinMatch = title.match(/Will\s+(.+?)\s+win\??/i);
  if (willWinMatch) {
    const teamA = willWinMatch[1].trim();
    return { teamA, teamB: '', matchup: teamA };
  }
  
  // Format: "Team A vs Team B"
  const vsMatch = title.match(/(.+?)\s+vs\.?\s+(.+)/i);
  if (vsMatch) {
    const teamA = vsMatch[1].trim();
    const teamB = vsMatch[2].trim();
    return { teamA, teamB, matchup: `${teamA} vs ${teamB}` };
  }
  
  return { teamA: title, teamB: '', matchup: title };
}

/**
 * Get full event context for display
 * Returns: "Army vs Navy • NCAA Football"
 */
export function getFullEventContext(marketId: string, title: string): string {
  const { matchup } = parseMatchupFromTitle(title);
  const sportInfo = extractSportInfo(marketId);
  const league = sportInfo.leagueLabel || sportInfo.sportLabel;
  
  return `${matchup} • ${league}`;
}
