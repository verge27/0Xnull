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
  // Basketball
  'nba': { sport: 'basketball', sportLabel: 'Basketball', sportEmoji: '🏀', leagueLabel: 'NBA' },
  'nbl': { sport: 'basketball', sportLabel: 'Basketball', sportEmoji: '🏀', leagueLabel: 'NBL' },
  'ncaab': { sport: 'basketball', sportLabel: 'Basketball', sportEmoji: '🏀', leagueLabel: 'NCAA Basketball' },
  'wnba': { sport: 'basketball', sportLabel: 'Basketball', sportEmoji: '🏀', leagueLabel: 'WNBA' },
  'euroleague': { sport: 'basketball', sportLabel: 'Basketball', sportEmoji: '🏀', leagueLabel: 'EuroLeague' },
  'cba': { sport: 'basketball', sportLabel: 'Basketball', sportEmoji: '🏀', leagueLabel: 'CBA' },
  
  // American Football
  'nfl': { sport: 'americanfootball', sportLabel: 'Football', sportEmoji: '🏈', leagueLabel: 'NFL' },
  'ncaaf': { sport: 'americanfootball', sportLabel: 'Football', sportEmoji: '🏈', leagueLabel: 'NCAA Football' },
  'cfl': { sport: 'americanfootball', sportLabel: 'Football', sportEmoji: '🏈', leagueLabel: 'CFL' },
  'xfl': { sport: 'americanfootball', sportLabel: 'Football', sportEmoji: '🏈', leagueLabel: 'XFL' },
  
  // Baseball
  'mlb': { sport: 'baseball', sportLabel: 'Baseball', sportEmoji: '⚾', leagueLabel: 'MLB' },
  'npb': { sport: 'baseball', sportLabel: 'Baseball', sportEmoji: '⚾', leagueLabel: 'NPB' },
  'kbo': { sport: 'baseball', sportLabel: 'Baseball', sportEmoji: '⚾', leagueLabel: 'KBO' },
  
  // Hockey
  'nhl': { sport: 'icehockey', sportLabel: 'Hockey', sportEmoji: '🏒', leagueLabel: 'NHL' },
  'khl': { sport: 'icehockey', sportLabel: 'Hockey', sportEmoji: '🏒', leagueLabel: 'KHL' },
  'ahl': { sport: 'icehockey', sportLabel: 'Hockey', sportEmoji: '🏒', leagueLabel: 'AHL' },
  'shl': { sport: 'icehockey', sportLabel: 'Hockey', sportEmoji: '🏒', leagueLabel: 'SHL' },
  
  // MMA / Combat Sports
  'ufc': { sport: 'mma', sportLabel: 'MMA', sportEmoji: '🥊', leagueLabel: 'UFC' },
  'pfl': { sport: 'mma', sportLabel: 'MMA', sportEmoji: '🥊', leagueLabel: 'PFL' },
  'bellator': { sport: 'mma', sportLabel: 'MMA', sportEmoji: '🥊', leagueLabel: 'Bellator' },
  'one championship': { sport: 'mma', sportLabel: 'MMA', sportEmoji: '🥊', leagueLabel: 'ONE' },
  'one fc': { sport: 'mma', sportLabel: 'MMA', sportEmoji: '🥊', leagueLabel: 'ONE' },
  'cage warriors': { sport: 'mma', sportLabel: 'MMA', sportEmoji: '🥊', leagueLabel: 'Cage Warriors' },
  'ksw': { sport: 'mma', sportLabel: 'MMA', sportEmoji: '🥊', leagueLabel: 'KSW' },
  'rizin': { sport: 'mma', sportLabel: 'MMA', sportEmoji: '🥊', leagueLabel: 'RIZIN' },
  'ares': { sport: 'mma', sportLabel: 'MMA', sportEmoji: '🥊', leagueLabel: 'ARES' },
  'lfa': { sport: 'mma', sportLabel: 'MMA', sportEmoji: '🥊', leagueLabel: 'LFA' },
  'invicta': { sport: 'mma', sportLabel: 'MMA', sportEmoji: '🥊', leagueLabel: 'Invicta FC' },
  'ufc fight night': { sport: 'mma', sportLabel: 'MMA', sportEmoji: '🥊', leagueLabel: 'UFC' },
  'road fc': { sport: 'mma', sportLabel: 'MMA', sportEmoji: '🥊', leagueLabel: 'Road FC' },
  
  // Boxing
  'boxing': { sport: 'boxing', sportLabel: 'Boxing', sportEmoji: '🥊', leagueLabel: 'Boxing' },
  'wbc': { sport: 'boxing', sportLabel: 'Boxing', sportEmoji: '🥊', leagueLabel: 'WBC' },
  'wba': { sport: 'boxing', sportLabel: 'Boxing', sportEmoji: '🥊', leagueLabel: 'WBA' },
  'ibf': { sport: 'boxing', sportLabel: 'Boxing', sportEmoji: '🥊', leagueLabel: 'IBF' },
  'wbo': { sport: 'boxing', sportLabel: 'Boxing', sportEmoji: '🥊', leagueLabel: 'WBO' },
  'pbc': { sport: 'boxing', sportLabel: 'Boxing', sportEmoji: '🥊', leagueLabel: 'PBC' },
  'matchroom': { sport: 'boxing', sportLabel: 'Boxing', sportEmoji: '🥊', leagueLabel: 'Matchroom' },
  'top rank': { sport: 'boxing', sportLabel: 'Boxing', sportEmoji: '🥊', leagueLabel: 'Top Rank' },
  'golden boy': { sport: 'boxing', sportLabel: 'Boxing', sportEmoji: '🥊', leagueLabel: 'Golden Boy' },
  
  // Bare Knuckle / Slap Fighting
  'bkfc': { sport: 'combat', sportLabel: 'Combat', sportEmoji: '👊', leagueLabel: 'BKFC' },
  'bare knuckle': { sport: 'combat', sportLabel: 'Combat', sportEmoji: '👊', leagueLabel: 'Bare Knuckle' },
  'bare knuckle fc': { sport: 'combat', sportLabel: 'Combat', sportEmoji: '👊', leagueLabel: 'BKFC' },
  'power slap': { sport: 'combat', sportLabel: 'Combat', sportEmoji: '👋', leagueLabel: 'Power Slap' },
  'slap fighting': { sport: 'combat', sportLabel: 'Combat', sportEmoji: '👋', leagueLabel: 'Slap Fighting' },
  'slap': { sport: 'combat', sportLabel: 'Combat', sportEmoji: '👋', leagueLabel: 'Slap Fighting' },
  'slapfight': { sport: 'combat', sportLabel: 'Combat', sportEmoji: '👋', leagueLabel: 'Slap Fighting' },
  
  // Kickboxing / Muay Thai
  'kickboxing': { sport: 'kickboxing', sportLabel: 'Kickboxing', sportEmoji: '🦵', leagueLabel: 'Kickboxing' },
  'glory': { sport: 'kickboxing', sportLabel: 'Kickboxing', sportEmoji: '🦵', leagueLabel: 'GLORY' },
  'glory kickboxing': { sport: 'kickboxing', sportLabel: 'Kickboxing', sportEmoji: '🦵', leagueLabel: 'GLORY' },
  'k-1': { sport: 'kickboxing', sportLabel: 'Kickboxing', sportEmoji: '🦵', leagueLabel: 'K-1' },
  'k1': { sport: 'kickboxing', sportLabel: 'Kickboxing', sportEmoji: '🦵', leagueLabel: 'K-1' },
  'one kickboxing': { sport: 'kickboxing', sportLabel: 'Kickboxing', sportEmoji: '🦵', leagueLabel: 'ONE Kickboxing' },
  'muay thai': { sport: 'kickboxing', sportLabel: 'Muay Thai', sportEmoji: '🦵', leagueLabel: 'Muay Thai' },
  'one muay thai': { sport: 'kickboxing', sportLabel: 'Muay Thai', sportEmoji: '🦵', leagueLabel: 'ONE Muay Thai' },
  'lumpinee': { sport: 'kickboxing', sportLabel: 'Muay Thai', sportEmoji: '🦵', leagueLabel: 'Lumpinee' },
  'rajadamnern': { sport: 'kickboxing', sportLabel: 'Muay Thai', sportEmoji: '🦵', leagueLabel: 'Rajadamnern' },
  
  // Wrestling / Grappling
  'wrestling': { sport: 'wrestling', sportLabel: 'Wrestling', sportEmoji: '🤼', leagueLabel: 'Wrestling' },
  'adcc': { sport: 'grappling', sportLabel: 'Grappling', sportEmoji: '🤼', leagueLabel: 'ADCC' },
  'ibjjf': { sport: 'grappling', sportLabel: 'Grappling', sportEmoji: '🤼', leagueLabel: 'IBJJF' },
  'bjj': { sport: 'grappling', sportLabel: 'Grappling', sportEmoji: '🤼', leagueLabel: 'BJJ' },
  'jiu jitsu': { sport: 'grappling', sportLabel: 'Grappling', sportEmoji: '🤼', leagueLabel: 'Jiu Jitsu' },
  'who\'s number one': { sport: 'grappling', sportLabel: 'Grappling', sportEmoji: '🤼', leagueLabel: 'WNO' },
  'wno': { sport: 'grappling', sportLabel: 'Grappling', sportEmoji: '🤼', leagueLabel: 'WNO' },
  
  // Karate / Taekwondo
  'karate': { sport: 'combat', sportLabel: 'Combat', sportEmoji: '🥋', leagueLabel: 'Karate' },
  'taekwondo': { sport: 'combat', sportLabel: 'Combat', sportEmoji: '🥋', leagueLabel: 'Taekwondo' },
  'judo': { sport: 'combat', sportLabel: 'Combat', sportEmoji: '🥋', leagueLabel: 'Judo' },
  
  // Soccer / Football
  'premier league': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Premier League' },
  'epl': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Premier League' },
  'english premier league': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Premier League' },
  'la liga': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'La Liga' },
  'laliga': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'La Liga' },
  'bundesliga': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Bundesliga' },
  'serie a': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Serie A' },
  'ligue 1': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Ligue 1' },
  'mls': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'MLS' },
  'champions league': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Champions League' },
  'ucl': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Champions League' },
  'europa league': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Europa League' },
  'eredivisie': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Eredivisie' },
  'primeira liga': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Primeira Liga' },
  'liga mx': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Liga MX' },
  'a-league': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'A-League' },
  'j-league': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'J-League' },
  'k league': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'K League' },
  'saudi pro league': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Saudi Pro League' },
  'spl': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'Saudi Pro League' },
  'world cup': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'World Cup' },
  'fifa': { sport: 'soccer', sportLabel: 'Soccer', sportEmoji: '⚽', leagueLabel: 'FIFA' },
  
  // Tennis
  'atp': { sport: 'tennis', sportLabel: 'Tennis', sportEmoji: '🎾', leagueLabel: 'ATP' },
  'wta': { sport: 'tennis', sportLabel: 'Tennis', sportEmoji: '🎾', leagueLabel: 'WTA' },
  'australian open': { sport: 'tennis', sportLabel: 'Tennis', sportEmoji: '🎾', leagueLabel: 'Australian Open' },
  'french open': { sport: 'tennis', sportLabel: 'Tennis', sportEmoji: '🎾', leagueLabel: 'French Open' },
  'roland garros': { sport: 'tennis', sportLabel: 'Tennis', sportEmoji: '🎾', leagueLabel: 'French Open' },
  'wimbledon': { sport: 'tennis', sportLabel: 'Tennis', sportEmoji: '🎾', leagueLabel: 'Wimbledon' },
  'us open': { sport: 'tennis', sportLabel: 'Tennis', sportEmoji: '🎾', leagueLabel: 'US Open' },
  
  // Golf
  'pga': { sport: 'golf', sportLabel: 'Golf', sportEmoji: '⛳', leagueLabel: 'PGA Tour' },
  'pga tour': { sport: 'golf', sportLabel: 'Golf', sportEmoji: '⛳', leagueLabel: 'PGA Tour' },
  'lpga': { sport: 'golf', sportLabel: 'Golf', sportEmoji: '⛳', leagueLabel: 'LPGA' },
  'liv golf': { sport: 'golf', sportLabel: 'Golf', sportEmoji: '⛳', leagueLabel: 'LIV Golf' },
  'the masters': { sport: 'golf', sportLabel: 'Golf', sportEmoji: '⛳', leagueLabel: 'The Masters' },
  'ryder cup': { sport: 'golf', sportLabel: 'Golf', sportEmoji: '⛳', leagueLabel: 'Ryder Cup' },
  
  // Cricket
  'ipl': { sport: 'cricket', sportLabel: 'Cricket', sportEmoji: '🏏', leagueLabel: 'IPL' },
  'big bash': { sport: 'cricket', sportLabel: 'Cricket', sportEmoji: '🏏', leagueLabel: 'Big Bash' },
  'bbl': { sport: 'cricket', sportLabel: 'Cricket', sportEmoji: '🏏', leagueLabel: 'Big Bash' },
  't20': { sport: 'cricket', sportLabel: 'Cricket', sportEmoji: '🏏', leagueLabel: 'T20' },
  'test cricket': { sport: 'cricket', sportLabel: 'Cricket', sportEmoji: '🏏', leagueLabel: 'Test' },
  'odi': { sport: 'cricket', sportLabel: 'Cricket', sportEmoji: '🏏', leagueLabel: 'ODI' },
  'the hundred': { sport: 'cricket', sportLabel: 'Cricket', sportEmoji: '🏏', leagueLabel: 'The Hundred' },
  'psl': { sport: 'cricket', sportLabel: 'Cricket', sportEmoji: '🏏', leagueLabel: 'PSL' },
  'cpl': { sport: 'cricket', sportLabel: 'Cricket', sportEmoji: '🏏', leagueLabel: 'CPL' },
  
  // Rugby
  'super rugby': { sport: 'rugbyunion', sportLabel: 'Rugby', sportEmoji: '🏉', leagueLabel: 'Super Rugby' },
  'six nations': { sport: 'rugbyunion', sportLabel: 'Rugby', sportEmoji: '🏉', leagueLabel: 'Six Nations' },
  'premiership rugby': { sport: 'rugbyunion', sportLabel: 'Rugby', sportEmoji: '🏉', leagueLabel: 'Premiership' },
  'nrl': { sport: 'rugbyleague', sportLabel: 'Rugby League', sportEmoji: '🏉', leagueLabel: 'NRL' },
  'super league': { sport: 'rugbyleague', sportLabel: 'Rugby League', sportEmoji: '🏉', leagueLabel: 'Super League' },
  
  // Aussie Rules
  'afl': { sport: 'aussierules', sportLabel: 'AFL', sportEmoji: '🏉', leagueLabel: 'AFL' },
  
  // Esports
  'starcraft': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'StarCraft' },
  'starcraft ii': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'StarCraft II' },
  'dota 2': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'Dota 2' },
  'dota2': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'Dota 2' },
  'league of legends': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'LoL' },
  'lol': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'LoL' },
  'cs2': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'CS2' },
  'csgo': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'CS2' },
  'counter-strike': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'CS2' },
  'valorant': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'Valorant' },
  'overwatch': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'Overwatch' },
  'call of duty': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'Call of Duty' },
  'cod': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'Call of Duty' },
  'rocket league': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'Rocket League' },
  'fifa esports': { sport: 'esports', sportLabel: 'Esports', sportEmoji: '🎮', leagueLabel: 'EA FC' },
  
  // Motorsport
  'f1': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏎️', leagueLabel: 'Formula 1' },
  'formula 1': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏎️', leagueLabel: 'Formula 1' },
  'formula one': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏎️', leagueLabel: 'Formula 1' },
  'nascar': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏎️', leagueLabel: 'NASCAR' },
  'nascar cup': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏎️', leagueLabel: 'NASCAR' },
  'motogp': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏍️', leagueLabel: 'MotoGP' },
  'moto gp': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏍️', leagueLabel: 'MotoGP' },
  'moto2': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏍️', leagueLabel: 'Moto2' },
  'moto3': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏍️', leagueLabel: 'Moto3' },
  'indycar': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏎️', leagueLabel: 'IndyCar' },
  'indy 500': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏎️', leagueLabel: 'Indy 500' },
  'wrc': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏎️', leagueLabel: 'WRC' },
  'world rally': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏎️', leagueLabel: 'WRC' },
  'formula e': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏎️', leagueLabel: 'Formula E' },
  'le mans': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏎️', leagueLabel: 'Le Mans' },
  'wec': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏎️', leagueLabel: 'WEC' },
  'dtm': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏎️', leagueLabel: 'DTM' },
  'supercars': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏎️', leagueLabel: 'Supercars' },
  'v8 supercars': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏎️', leagueLabel: 'Supercars' },
  'imsa': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏎️', leagueLabel: 'IMSA' },
  'f2': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏎️', leagueLabel: 'Formula 2' },
  'f3': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏎️', leagueLabel: 'Formula 3' },
  'sbk': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏍️', leagueLabel: 'Superbike' },
  'world superbike': { sport: 'motorsport', sportLabel: 'Motorsport', sportEmoji: '🏍️', leagueLabel: 'Superbike' },
  
  // Winter Sports
  'skiing': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '⛷️', leagueLabel: 'Skiing' },
  'alpine skiing': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '⛷️', leagueLabel: 'Alpine Skiing' },
  'downhill': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '⛷️', leagueLabel: 'Downhill' },
  'slalom': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '⛷️', leagueLabel: 'Slalom' },
  'giant slalom': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '⛷️', leagueLabel: 'Giant Slalom' },
  'super-g': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '⛷️', leagueLabel: 'Super-G' },
  'cross-country skiing': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '⛷️', leagueLabel: 'Cross-Country' },
  'nordic skiing': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '⛷️', leagueLabel: 'Nordic' },
  'ski jumping': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '⛷️', leagueLabel: 'Ski Jumping' },
  'freestyle skiing': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '⛷️', leagueLabel: 'Freestyle' },
  'snowboarding': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '🏂', leagueLabel: 'Snowboarding' },
  'snowboard': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '🏂', leagueLabel: 'Snowboarding' },
  'halfpipe': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '🏂', leagueLabel: 'Halfpipe' },
  'slopestyle': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '🏂', leagueLabel: 'Slopestyle' },
  'biathlon': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '🎿', leagueLabel: 'Biathlon' },
  'figure skating': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '⛸️', leagueLabel: 'Figure Skating' },
  'ice skating': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '⛸️', leagueLabel: 'Ice Skating' },
  'speed skating': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '⛸️', leagueLabel: 'Speed Skating' },
  'short track': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '⛸️', leagueLabel: 'Short Track' },
  'bobsled': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '🛷', leagueLabel: 'Bobsled' },
  'bobsleigh': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '🛷', leagueLabel: 'Bobsled' },
  'luge': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '🛷', leagueLabel: 'Luge' },
  'skeleton': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '🛷', leagueLabel: 'Skeleton' },
  'curling': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '🥌', leagueLabel: 'Curling' },
  'winter olympics': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '🏔️', leagueLabel: 'Winter Olympics' },
  'x games': { sport: 'wintersports', sportLabel: 'Winter Sports', sportEmoji: '🏂', leagueLabel: 'X Games' },
  
  // Olympic / Athletics
  'olympics': { sport: 'olympics', sportLabel: 'Olympics', sportEmoji: '🏅', leagueLabel: 'Olympics' },
  'olympic games': { sport: 'olympics', sportLabel: 'Olympics', sportEmoji: '🏅', leagueLabel: 'Olympics' },
  'summer olympics': { sport: 'olympics', sportLabel: 'Olympics', sportEmoji: '🏅', leagueLabel: 'Summer Olympics' },
  'athletics': { sport: 'athletics', sportLabel: 'Athletics', sportEmoji: '🏃', leagueLabel: 'Athletics' },
  'track and field': { sport: 'athletics', sportLabel: 'Athletics', sportEmoji: '🏃', leagueLabel: 'Track & Field' },
  'track & field': { sport: 'athletics', sportLabel: 'Athletics', sportEmoji: '🏃', leagueLabel: 'Track & Field' },
  'marathon': { sport: 'athletics', sportLabel: 'Athletics', sportEmoji: '🏃', leagueLabel: 'Marathon' },
  'world athletics': { sport: 'athletics', sportLabel: 'Athletics', sportEmoji: '🏃', leagueLabel: 'World Athletics' },
  'diamond league': { sport: 'athletics', sportLabel: 'Athletics', sportEmoji: '🏃', leagueLabel: 'Diamond League' },
  
  // Swimming / Aquatics
  'swimming': { sport: 'aquatics', sportLabel: 'Aquatics', sportEmoji: '🏊', leagueLabel: 'Swimming' },
  'fina': { sport: 'aquatics', sportLabel: 'Aquatics', sportEmoji: '🏊', leagueLabel: 'World Aquatics' },
  'world aquatics': { sport: 'aquatics', sportLabel: 'Aquatics', sportEmoji: '🏊', leagueLabel: 'World Aquatics' },
  'diving': { sport: 'aquatics', sportLabel: 'Aquatics', sportEmoji: '🤿', leagueLabel: 'Diving' },
  'water polo': { sport: 'aquatics', sportLabel: 'Aquatics', sportEmoji: '🤽', leagueLabel: 'Water Polo' },
  'synchronized swimming': { sport: 'aquatics', sportLabel: 'Aquatics', sportEmoji: '🏊', leagueLabel: 'Artistic Swimming' },
  'artistic swimming': { sport: 'aquatics', sportLabel: 'Aquatics', sportEmoji: '🏊', leagueLabel: 'Artistic Swimming' },
  
  // Gymnastics
  'gymnastics': { sport: 'gymnastics', sportLabel: 'Gymnastics', sportEmoji: '🤸', leagueLabel: 'Gymnastics' },
  'artistic gymnastics': { sport: 'gymnastics', sportLabel: 'Gymnastics', sportEmoji: '🤸', leagueLabel: 'Artistic' },
  'rhythmic gymnastics': { sport: 'gymnastics', sportLabel: 'Gymnastics', sportEmoji: '🤸', leagueLabel: 'Rhythmic' },
  'trampoline': { sport: 'gymnastics', sportLabel: 'Gymnastics', sportEmoji: '🤸', leagueLabel: 'Trampoline' },
  
  // Fencing / Archery / Shooting
  'fencing': { sport: 'combat', sportLabel: 'Combat', sportEmoji: '🤺', leagueLabel: 'Fencing' },
  'archery': { sport: 'precision', sportLabel: 'Precision', sportEmoji: '🏹', leagueLabel: 'Archery' },
  'shooting': { sport: 'precision', sportLabel: 'Precision', sportEmoji: '🎯', leagueLabel: 'Shooting' },
  
  // Cycling
  'cycling': { sport: 'cycling', sportLabel: 'Cycling', sportEmoji: '🚴', leagueLabel: 'Cycling' },
  'tour de france': { sport: 'cycling', sportLabel: 'Cycling', sportEmoji: '🚴', leagueLabel: 'Tour de France' },
  'giro d\'italia': { sport: 'cycling', sportLabel: 'Cycling', sportEmoji: '🚴', leagueLabel: 'Giro d\'Italia' },
  'vuelta': { sport: 'cycling', sportLabel: 'Cycling', sportEmoji: '🚴', leagueLabel: 'Vuelta' },
  'uci': { sport: 'cycling', sportLabel: 'Cycling', sportEmoji: '🚴', leagueLabel: 'UCI' },
  'track cycling': { sport: 'cycling', sportLabel: 'Cycling', sportEmoji: '🚴', leagueLabel: 'Track Cycling' },
  'bmx': { sport: 'cycling', sportLabel: 'Cycling', sportEmoji: '🚴', leagueLabel: 'BMX' },
  'mountain biking': { sport: 'cycling', sportLabel: 'Cycling', sportEmoji: '🚵', leagueLabel: 'Mountain Biking' },
  
  // Rowing / Canoeing
  'rowing': { sport: 'rowing', sportLabel: 'Rowing', sportEmoji: '🚣', leagueLabel: 'Rowing' },
  'canoeing': { sport: 'rowing', sportLabel: 'Rowing', sportEmoji: '🛶', leagueLabel: 'Canoeing' },
  'kayaking': { sport: 'rowing', sportLabel: 'Rowing', sportEmoji: '🛶', leagueLabel: 'Kayaking' },
  
  // Equestrian
  'equestrian': { sport: 'equestrian', sportLabel: 'Equestrian', sportEmoji: '🏇', leagueLabel: 'Equestrian' },
  'horse racing': { sport: 'equestrian', sportLabel: 'Horse Racing', sportEmoji: '🏇', leagueLabel: 'Horse Racing' },
  'kentucky derby': { sport: 'equestrian', sportLabel: 'Horse Racing', sportEmoji: '🏇', leagueLabel: 'Kentucky Derby' },
  'royal ascot': { sport: 'equestrian', sportLabel: 'Horse Racing', sportEmoji: '🏇', leagueLabel: 'Royal Ascot' },
  'dressage': { sport: 'equestrian', sportLabel: 'Equestrian', sportEmoji: '🏇', leagueLabel: 'Dressage' },
  'show jumping': { sport: 'equestrian', sportLabel: 'Equestrian', sportEmoji: '🏇', leagueLabel: 'Show Jumping' },
  
  // Other Olympic Sports
  'volleyball': { sport: 'volleyball', sportLabel: 'Volleyball', sportEmoji: '🏐', leagueLabel: 'Volleyball' },
  'beach volleyball': { sport: 'volleyball', sportLabel: 'Volleyball', sportEmoji: '🏐', leagueLabel: 'Beach Volleyball' },
  'handball': { sport: 'handball', sportLabel: 'Handball', sportEmoji: '🤾', leagueLabel: 'Handball' },
  'badminton': { sport: 'badminton', sportLabel: 'Badminton', sportEmoji: '🏸', leagueLabel: 'Badminton' },
  'table tennis': { sport: 'tabletennis', sportLabel: 'Table Tennis', sportEmoji: '🏓', leagueLabel: 'Table Tennis' },
  'ping pong': { sport: 'tabletennis', sportLabel: 'Table Tennis', sportEmoji: '🏓', leagueLabel: 'Table Tennis' },
  'weightlifting': { sport: 'weightlifting', sportLabel: 'Weightlifting', sportEmoji: '🏋️', leagueLabel: 'Weightlifting' },
  'triathlon': { sport: 'triathlon', sportLabel: 'Triathlon', sportEmoji: '🏊', leagueLabel: 'Triathlon' },
  'pentathlon': { sport: 'pentathlon', sportLabel: 'Pentathlon', sportEmoji: '🏅', leagueLabel: 'Pentathlon' },
  'decathlon': { sport: 'athletics', sportLabel: 'Athletics', sportEmoji: '🏃', leagueLabel: 'Decathlon' },
  'heptathlon': { sport: 'athletics', sportLabel: 'Athletics', sportEmoji: '🏃', leagueLabel: 'Heptathlon' },
  
  // Extreme / Action Sports
  'skateboarding': { sport: 'actionsports', sportLabel: 'Action Sports', sportEmoji: '🛹', leagueLabel: 'Skateboarding' },
  'surfing': { sport: 'actionsports', sportLabel: 'Action Sports', sportEmoji: '🏄', leagueLabel: 'Surfing' },
  'wsl': { sport: 'actionsports', sportLabel: 'Action Sports', sportEmoji: '🏄', leagueLabel: 'WSL' },
  'climbing': { sport: 'actionsports', sportLabel: 'Action Sports', sportEmoji: '🧗', leagueLabel: 'Climbing' },
  'sport climbing': { sport: 'actionsports', sportLabel: 'Action Sports', sportEmoji: '🧗', leagueLabel: 'Sport Climbing' },
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
  'motorsport': 'Motorsport',
  'combat': 'Combat',
  'kickboxing': 'Kickboxing',
  'grappling': 'Grappling',
  'wrestling': 'Wrestling',
  'wintersports': 'Winter Sports',
  'olympics': 'Olympics',
  'athletics': 'Athletics',
  'aquatics': 'Aquatics',
  'gymnastics': 'Gymnastics',
  'cycling': 'Cycling',
  'rowing': 'Rowing',
  'equestrian': 'Equestrian',
  'volleyball': 'Volleyball',
  'handball': 'Handball',
  'badminton': 'Badminton',
  'tabletennis': 'Table Tennis',
  'weightlifting': 'Weightlifting',
  'triathlon': 'Triathlon',
  'pentathlon': 'Pentathlon',
  'actionsports': 'Action Sports',
  'precision': 'Precision',
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
  'motorsport': '🏎️',
  'combat': '👊',
  'kickboxing': '🦵',
  'grappling': '🤼',
  'wrestling': '🤼',
  'wintersports': '⛷️',
  'olympics': '🏅',
  'athletics': '🏃',
  'aquatics': '🏊',
  'gymnastics': '🤸',
  'cycling': '🚴',
  'rowing': '🚣',
  'equestrian': '🏇',
  'volleyball': '🏐',
  'handball': '🤾',
  'badminton': '🏸',
  'tabletennis': '🏓',
  'weightlifting': '🏋️',
  'triathlon': '🏊',
  'pentathlon': '🏅',
  'actionsports': '🛹',
  'precision': '🎯',
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
