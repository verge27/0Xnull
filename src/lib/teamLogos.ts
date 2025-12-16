// Team logo mappings using ESPN CDN and other public sources

// NFL Teams - ESPN CDN format: https://a.espncdn.com/i/teamlogos/nfl/500/{abbrev}.png
const NFL_TEAM_ABBREVS: Record<string, string> = {
  'Arizona Cardinals': 'ari',
  'Atlanta Falcons': 'atl',
  'Baltimore Ravens': 'bal',
  'Buffalo Bills': 'buf',
  'Carolina Panthers': 'car',
  'Chicago Bears': 'chi',
  'Cincinnati Bengals': 'cin',
  'Cleveland Browns': 'cle',
  'Dallas Cowboys': 'dal',
  'Denver Broncos': 'den',
  'Detroit Lions': 'det',
  'Green Bay Packers': 'gb',
  'Houston Texans': 'hou',
  'Indianapolis Colts': 'ind',
  'Jacksonville Jaguars': 'jax',
  'Kansas City Chiefs': 'kc',
  'Las Vegas Raiders': 'lv',
  'Los Angeles Chargers': 'lac',
  'Los Angeles Rams': 'lar',
  'Miami Dolphins': 'mia',
  'Minnesota Vikings': 'min',
  'New England Patriots': 'ne',
  'New Orleans Saints': 'no',
  'New York Giants': 'nyg',
  'New York Jets': 'nyj',
  'Philadelphia Eagles': 'phi',
  'Pittsburgh Steelers': 'pit',
  'San Francisco 49ers': 'sf',
  'Seattle Seahawks': 'sea',
  'Tampa Bay Buccaneers': 'tb',
  'Tennessee Titans': 'ten',
  'Washington Commanders': 'wsh',
};

// Premier League Teams - ESPN CDN format: https://a.espncdn.com/i/teamlogos/soccer/500/{id}.png
const PREMIER_LEAGUE_IDS: Record<string, string> = {
  'Arsenal': '359',
  'Aston Villa': '362',
  'Bournemouth': '349',
  'Brentford': '337',
  'Brighton': '331',
  'Brighton and Hove Albion': '331',
  'Chelsea': '363',
  'Crystal Palace': '384',
  'Everton': '368',
  'Fulham': '370',
  'Ipswich Town': '373',
  'Ipswich': '373',
  'Leicester City': '375',
  'Leicester': '375',
  'Liverpool': '364',
  'Manchester City': '382',
  'Manchester United': '360',
  'Newcastle United': '361',
  'Newcastle': '361',
  'Nottingham Forest': '393',
  "Nott'm Forest": '393',
  'Southampton': '376',
  'Tottenham Hotspur': '367',
  'Tottenham': '367',
  'Spurs': '367',
  'West Ham United': '371',
  'West Ham': '371',
  'Wolverhampton Wanderers': '380',
  'Wolves': '380',
};

export function getTeamLogo(teamName: string | null | undefined, sport: string): string {
  if (!teamName) return '';
  const normalizedName = teamName.trim();
  
  if (sport === 'nfl' || sport === 'americanfootball_nfl') {
    const abbrev = NFL_TEAM_ABBREVS[normalizedName];
    if (abbrev) {
      return `https://a.espncdn.com/i/teamlogos/nfl/500/${abbrev}.png`;
    }
  }
  
  if (sport === 'premier_league' || sport === 'soccer_epl') {
    const id = PREMIER_LEAGUE_IDS[normalizedName];
    if (id) {
      return `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png`;
    }
  }
  
  if (sport === 'ufc' || sport === 'mma_mixed_martial_arts') {
    // UFC doesn't have team logos, return UFC logo
    return 'https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png';
  }
  
  // Fallback - return empty string (will show placeholder)
  return '';
}

export function getLeagueLogo(sport: string): string {
  switch (sport) {
    case 'nfl':
    case 'americanfootball_nfl':
      return 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png';
    case 'premier_league':
    case 'soccer_epl':
      return 'https://a.espncdn.com/i/teamlogos/leagues/500/eng.1.png';
    case 'ufc':
    case 'mma_mixed_martial_arts':
      return 'https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png';
    default:
      return '';
  }
}

// Component for displaying team logo with fallback
export interface TeamLogoProps {
  teamName: string;
  sport: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
