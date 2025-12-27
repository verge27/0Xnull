// Sport and League label utilities for prediction markets

export interface SportInfo {
  sport: string;
  sportLabel: string;
  sportEmoji: string;
  league?: string;
  leagueLabel?: string;
}

// Map of league/competition prefixes found in descriptions to sport info
const DESCRIPTION_PREFIXES: Record<string, { sport: string; sportLabel: string; sportEmoji: string; leagueLabel: string }> = {
  'nba': { sport: 'basketball', sportLabel: 'Basketball', sportEmoji: '🏀', leagueLabel: 'NBA' },
  'nbl': { sport: 'basketball', sportLabel: 'Basketball', sportEmoji: '🏀', leagueLabel: 'NBL' },
  'ncaab': { sport: 'basketball', sportLabel: 'Basketball', sportEmoji: '🏀', leagueLabel: 'NCAA Basketball' },
  'wnba': { sport: 'basketball', sportLabel: 'Basketball', sportEmoji: '🏀', leagueLabel: 'WNBA' },
  'nfl': { sport: 'americanfootball', sportLabel: 'Football', sportEmoji: '🏈', leagueLabel: 'NFL' },
  'ncaaf': { sport: 'americanfootball', sportLabel: 'Football', sportEmoji: '🏈', leagueLabel: 'NCAA Football' },
  'mlb': { sport: 'baseball', sportLabel: 'Baseball', sportEmoji: '⚾', leagueLabel: 'MLB' },
  'nhl': { sport: 'icehockey', sportLabel: 'Hockey', sportEmoji: '🏒', leagueLabel: 'NHL' },
  'ufc': { sport: 'mma', sportLabel: 'MMA', sportEmoji: '🥊', leagueLabel: 'UFC' },
  'pfl': { sport: 'mma', sportLabel: 'MMA', sportEmoji: '🥊', leagueLabel: 'PFL' },
  'bellator': { sport: 'mma', sportLabel: 'MMA', sportEmoji: '🥊', leagueLabel: 'Bellator' },
  'boxing': { sport: 'boxing', sportLabel: 'Boxing', sportEmoji: '🥊', leagueLabel: 'Boxing' },
  'premier league': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Premier League' },
  'epl': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Premier League' },
  'la liga': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'La Liga' },
  'bundesliga': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Bundesliga' },
  'serie a': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Serie A' },
  'ligue 1': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Ligue 1' },
  'mls': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'MLS' },
  'champions league': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Champions League' },
  'atp': { sport: 'tennis', sportLabel: 'Tennis', sportEmoji: '🎾', leagueLabel: 'ATP' },
  'wta': { sport: 'tennis', sportLabel: 'Tennis', sportEmoji: '🎾', leagueLabel: 'WTA' },
  'pga': { sport: 'golf', sportLabel: 'Golf', sportEmoji: '⛳', leagueLabel: 'PGA Tour' },
  'ipl': { sport: 'cricket', sportLabel: 'Cricket', sportEmoji: '🏏', leagueLabel: 'IPL' },
  'big bash': { sport: 'cricket', sportLabel: 'Cricket', sportEmoji: '🏏', leagueLabel: 'Big Bash' },
  'starcraft': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'StarCraft' },
  'dota 2': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'Dota 2' },
  'league of legends': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'LoL' },
  'cs2': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'CS2' },
  'valorant': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'Valorant' },
};

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
 * Extract sport info from market description (e.g., "NBA: Team A @ Team B")
 * This is the primary method since market IDs don't contain sport info
 */
export function extractSportFromDescription(description: string): SportInfo | null {
  if (!description) return null;
  
  const lowerDesc = description.toLowerCase();
  
  // Check each known prefix
  for (const [prefix, info] of Object.entries(DESCRIPTION_PREFIXES)) {
    // Check if description starts with prefix followed by colon (e.g., "NBA:")
    if (lowerDesc.startsWith(prefix + ':') || lowerDesc.startsWith(prefix + ' ')) {
      return {
        sport: info.sport,
        sportLabel: info.sportLabel,
        sportEmoji: info.sportEmoji,
        league: prefix,
        leagueLabel: info.leagueLabel,
      };
    }
    // Also check if prefix appears anywhere (for formats like "StarCraft II: ...")
    if (lowerDesc.includes(prefix)) {
      return {
        sport: info.sport,
        sportLabel: info.sportLabel,
        sportEmoji: info.sportEmoji,
        league: prefix,
        leagueLabel: info.leagueLabel,
      };
    }
  }
  
  return null;
}

/**
 * Extract sport and league info from a market ID
 * Market ID formats:
 * - sports_basketball_ncaab_eventid_teamslug
 * - sports_americanfootball_nfl_eventid_teamslug  
 * - sports_mma_ufc_eventid_fighter
 * - cricket_eventid_teamslug
 * - esports_lol_eventid_teamslug
 * 
 * NOTE: Most sports_ markets from the API use format: sports_<hash>_<team>
 * without sport/league info. Use extractSportFromDescription() as primary method.
 */
export function extractSportInfo(marketId: string, description?: string): SportInfo {
  // FIRST: Try to extract from description (most reliable for API markets)
  if (description) {
    const fromDesc = extractSportFromDescription(description);
    if (fromDesc) return fromDesc;
  }
  
  const lowerMarketId = marketId.toLowerCase();
  
  // Handle cricket markets
  if (lowerMarketId.startsWith('cricket_')) {
    return {
      sport: 'cricket',
      sportLabel: 'Cricket',
      sportEmoji: '🏏',
    };
  }

  // Handle esports markets
  if (lowerMarketId.startsWith('esports_')) {
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

  // Handle sports_ prefix markets 
  if (lowerMarketId.startsWith('sports_')) {
    const parts = marketId.split('_');
    // Try format: sports_<sport>_<league>_<eventid>_<team>
    const sport = parts[1] || '';
    const league = parts[2] || '';
    
    // Only return if sport exists in SPORT_LABELS (rules out hash IDs)
    const sportLower = sport.toLowerCase();
    if (SPORT_LABELS[sportLower]) {
      const isCombat = ['mma', 'boxing'].includes(sportLower);
      return {
        sport,
        sportLabel: SPORT_LABELS[sportLower],
        sportEmoji: SPORT_EMOJIS[sportLower] || '🏅',
        league,
        leagueLabel: LEAGUE_LABELS[league.toLowerCase()] || (isCombat ? sport.toUpperCase() : league.toUpperCase()),
      };
    }
  }

  // Handle crypto/prediction markets
  if (lowerMarketId.startsWith('crypto_')) {
    return {
      sport: 'crypto',
      sportLabel: 'Crypto',
      sportEmoji: '📈',
    };
  }

  // Try to detect combat sports from keywords in market ID
  if (lowerMarketId.includes('ufc')) {
    return {
      sport: 'mma',
      sportLabel: 'MMA',
      sportEmoji: '🥊',
      league: 'ufc',
      leagueLabel: 'UFC',
    };
  }
  
  if (lowerMarketId.includes('bellator')) {
    return {
      sport: 'mma',
      sportLabel: 'MMA',
      sportEmoji: '🥊',
      league: 'bellator',
      leagueLabel: 'Bellator',
    };
  }
  
  if (lowerMarketId.includes('pfl')) {
    return {
      sport: 'mma',
      sportLabel: 'MMA',
      sportEmoji: '🥊',
      league: 'pfl',
      leagueLabel: 'PFL',
    };
  }
  
  if (lowerMarketId.includes('mma')) {
    return {
      sport: 'mma',
      sportLabel: 'MMA',
      sportEmoji: '🥊',
    };
  }
  
  if (lowerMarketId.includes('boxing')) {
    return {
      sport: 'boxing',
      sportLabel: 'Boxing',
      sportEmoji: '🥊',
      league: 'boxing',
      leagueLabel: 'Boxing',
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
