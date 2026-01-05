import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE = 'https://api.0xnull.io/api';
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

// Cache configuration
const SCORE_CACHE = new Map<string, { data: MatchScore | null; timestamp: number; resolutionTime?: number }>();
const CACHE_TTL_FINAL = 3600000; // 1 hour for final scores
const CACHE_TTL_IN_PROGRESS = 30000; // 30 seconds for in-progress games
const CACHE_TTL_NOT_FOUND = 120000; // 2 minutes for not found events

// Smart polling intervals based on time to resolution
const POLL_INTERVAL_SOON = 60000; // 1 minute when game is near/past end
const POLL_INTERVAL_MEDIUM = 300000; // 5 minutes when 1-2 hours out
const POLL_INTERVAL_FAR = 900000; // 15 minutes when > 2 hours out

interface PredictionMarket {
  market_id: string;
  title: string;
  description: string;
  oracle_type: string;
  oracle_asset: string;
  oracle_condition: string;
  resolution_time: number;
  resolved: number;
  outcome: 'YES' | 'NO' | 'DRAW' | null;
  yes_pool_xmr: number;
  no_pool_xmr: number;
}

interface MatchScore {
  homeScore: number;
  awayScore: number;
  homeTeam: string;
  awayTeam: string;
  status: 'final' | 'in_progress' | 'scheduled' | 'unknown';
  source: 'odds_api' | 'espn';
}

// Sport key mappings for The Odds API
const ODDS_API_SPORTS = [
  'soccer_epl', 'soccer_spain_la_liga', 'soccer_germany_bundesliga',
  'soccer_italy_serie_a', 'soccer_france_ligue_one', 'soccer_usa_mls',
  'soccer_uefa_champs_league', 'soccer_uefa_europa_league',
  'americanfootball_nfl', 'americanfootball_ncaaf',
  'basketball_nba', 'basketball_ncaab',
  'baseball_mlb',
  'icehockey_nhl',
  'mma_mixed_martial_arts',
  'boxing_boxing',
];

// Get cache TTL based on score status
function getCacheTtl(score: MatchScore | null): number {
  if (!score) return CACHE_TTL_NOT_FOUND;
  if (score.status === 'final') return CACHE_TTL_FINAL;
  return CACHE_TTL_IN_PROGRESS;
}

// Check if cached score is still valid
function getCachedScore(eventId: string): MatchScore | null | undefined {
  const cached = SCORE_CACHE.get(eventId);
  if (!cached) return undefined;
  
  const ttl = getCacheTtl(cached.data);
  if (Date.now() - cached.timestamp > ttl) {
    SCORE_CACHE.delete(eventId);
    return undefined;
  }
  
  return cached.data;
}

// Set cached score
function setCachedScore(eventId: string, score: MatchScore | null, resolutionTime?: number): void {
  SCORE_CACHE.set(eventId, {
    data: score,
    timestamp: Date.now(),
    resolutionTime
  });
}

// Determine polling priority based on resolution time
function getPollingPriority(resolutionTime: number): { priority: 'high' | 'medium' | 'low'; interval: number } {
  const now = Math.floor(Date.now() / 1000);
  const timeToResolution = resolutionTime - now;
  
  // Past resolution time or within 30 minutes - high priority
  if (timeToResolution <= 1800) {
    return { priority: 'high', interval: POLL_INTERVAL_SOON };
  }
  
  // 30 minutes to 2 hours - medium priority
  if (timeToResolution <= 7200) {
    return { priority: 'medium', interval: POLL_INTERVAL_MEDIUM };
  }
  
  // More than 2 hours out - low priority
  return { priority: 'low', interval: POLL_INTERVAL_FAR };
}

// Check if we should poll this market based on last poll time
function shouldPollMarket(eventId: string, resolutionTime: number): boolean {
  const cached = SCORE_CACHE.get(eventId);
  if (!cached) return true;
  
  // Always poll if we have a final score (just return cached)
  if (cached.data?.status === 'final') return false;
  
  const { interval } = getPollingPriority(resolutionTime);
  const timeSinceLastPoll = Date.now() - cached.timestamp;
  
  return timeSinceLastPoll >= interval;
}

// Fetch unresolved sports markets from 0xNull
async function fetchUnresolvedSportsMarkets(): Promise<PredictionMarket[]> {
  const res = await fetch(`${API_BASE}/predictions/markets?include_resolved=false`);
  if (!res.ok) {
    throw new Error(`Failed to fetch markets: ${res.status}`);
  }
  const data = await res.json();
  const markets = data.markets || [];
  
  // Filter to only sports markets that are past resolution time
  const now = Math.floor(Date.now() / 1000);
  return markets.filter((m: PredictionMarket) => 
    m.market_id.startsWith('sports_') && 
    m.resolved === 0 && 
    m.resolution_time <= now
  );
}

// Fetch scores from The Odds API (primary source)
async function fetchOddsApiScores(eventId: string): Promise<MatchScore | null> {
  const oddsApiKey = Deno.env.get('ODDS_API_KEY');
  if (!oddsApiKey) {
    console.log('ODDS_API_KEY not configured, skipping Odds API');
    return null;
  }

  try {
    for (const sport of ODDS_API_SPORTS) {
      try {
        const url = `${ODDS_API_BASE}/sports/${sport}/scores?apiKey=${oddsApiKey}&daysFrom=3`;
        const res = await fetch(url, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(8000)
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            console.error('Odds API: Invalid API key');
            return null;
          }
          continue;
        }
        
        const events = await res.json();
        
        for (const event of events) {
          const eventIdMatch = event.id === eventId || 
            eventId.includes(event.id) ||
            event.id?.includes(eventId);
          
          if (!eventIdMatch) continue;
          
          if (!event.completed) {
            console.log(`Odds API: Game ${eventId} not completed yet`);
            return {
              homeScore: event.scores?.find((s: any) => s.name === event.home_team)?.score || 0,
              awayScore: event.scores?.find((s: any) => s.name === event.away_team)?.score || 0,
              homeTeam: event.home_team,
              awayTeam: event.away_team,
              status: 'in_progress',
              source: 'odds_api'
            };
          }
          
          const homeScoreData = event.scores?.find((s: any) => s.name === event.home_team);
          const awayScoreData = event.scores?.find((s: any) => s.name === event.away_team);
          
          const homeScore = parseInt(homeScoreData?.score || '0', 10);
          const awayScore = parseInt(awayScoreData?.score || '0', 10);
          
          console.log(`Odds API: Found final score for ${eventId}: ${event.home_team} ${homeScore} - ${event.away_team} ${awayScore}`);
          
          return {
            homeScore,
            awayScore,
            homeTeam: event.home_team,
            awayTeam: event.away_team,
            status: 'final',
            source: 'odds_api'
          };
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  } catch (e) {
    console.error('Odds API error:', e);
    return null;
  }
}

// Fetch match score from ESPN API (fallback)
async function fetchEspnScore(eventId: string): Promise<MatchScore | null> {
  try {
    const sportEndpoints = [
      'soccer/eng.1', 'soccer/usa.1', 'soccer/esp.1', 'soccer/ger.1', 'soccer/ita.1', 'soccer/fra.1',
      'soccer/uefa.champions', 'soccer/uefa.europa',
      'football/nfl', 'football/college-football',
      'basketball/nba', 'basketball/mens-college-basketball',
      'baseball/mlb',
      'hockey/nhl',
    ];
    
    for (const sport of sportEndpoints) {
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/scoreboard`;
        const res = await fetch(url, { 
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });
        
        if (!res.ok) continue;
        
        const data = await res.json();
        const events = data.events || [];
        
        for (const event of events) {
          const eventIdMatch = event.id === eventId || 
            event.uid?.includes(eventId) ||
            eventId.includes(event.id);
          
          if (!eventIdMatch) continue;
          
          const competition = event.competitions?.[0];
          if (!competition) continue;
          
          const homeTeam = competition.competitors?.find((c: any) => c.homeAway === 'home');
          const awayTeam = competition.competitors?.find((c: any) => c.homeAway === 'away');
          
          if (!homeTeam || !awayTeam) continue;
          
          const homeScore = parseInt(homeTeam.score || '0', 10);
          const awayScore = parseInt(awayTeam.score || '0', 10);
          
          const statusType = competition.status?.type?.name || event.status?.type?.name;
          const isCompleted = statusType === 'STATUS_FINAL' || 
            statusType === 'STATUS_FULL_TIME' ||
            statusType === 'FINAL' ||
            competition.status?.type?.completed === true;
          
          if (isCompleted) {
            console.log(`ESPN: Found final score for ${eventId}: ${homeTeam.team?.displayName} ${homeScore} - ${awayTeam.team?.displayName} ${awayScore}`);
            return {
              homeScore,
              awayScore,
              homeTeam: homeTeam.team?.displayName || 'Home',
              awayTeam: awayTeam.team?.displayName || 'Away',
              status: 'final',
              source: 'espn'
            };
          }
          
          return {
            homeScore,
            awayScore,
            homeTeam: homeTeam.team?.displayName || 'Home',
            awayTeam: awayTeam.team?.displayName || 'Away',
            status: competition.status?.type?.state === 'in' ? 'in_progress' : 'scheduled',
            source: 'espn'
          };
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  } catch (e) {
    console.error(`ESPN error for ${eventId}:`, e);
    return null;
  }
}

// Main score fetching function with caching
async function fetchMatchScore(eventId: string, resolutionTime?: number): Promise<MatchScore | null> {
  // Check cache first
  const cached = getCachedScore(eventId);
  if (cached !== undefined) {
    console.log(`Cache hit for ${eventId}: ${cached?.status || 'not_found'}`);
    return cached;
  }
  
  // Check if we should even poll based on timing
  if (resolutionTime && !shouldPollMarket(eventId, resolutionTime)) {
    const existingCache = SCORE_CACHE.get(eventId);
    if (existingCache) {
      console.log(`Skipping poll for ${eventId} - not time yet`);
      return existingCache.data;
    }
  }
  
  // Try The Odds API first
  console.log(`Fetching score for ${eventId} from Odds API...`);
  const oddsScore = await fetchOddsApiScores(eventId);
  if (oddsScore) {
    setCachedScore(eventId, oddsScore, resolutionTime);
    return oddsScore;
  }
  
  // Fallback to ESPN
  console.log(`Falling back to ESPN for ${eventId}...`);
  const espnScore = await fetchEspnScore(eventId);
  if (espnScore) {
    setCachedScore(eventId, espnScore, resolutionTime);
    return espnScore;
  }
  
  // Cache the null result to avoid hammering APIs
  setCachedScore(eventId, null, resolutionTime);
  console.log(`No score found for event ${eventId} from any source`);
  return null;
}

// Determine outcome based on score
function determineOutcome(score: MatchScore): 'YES' | 'NO' | 'DRAW' | null {
  if (score.status !== 'final') {
    return null;
  }
  
  if (score.homeScore > score.awayScore) {
    return 'YES';
  } else if (score.awayScore > score.homeScore) {
    return 'NO';
  } else {
    return 'DRAW';
  }
}

// Resolve market with outcome
async function resolveMarket(marketId: string, outcome: 'YES' | 'NO' | 'DRAW'): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/predictions/markets/${marketId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome }),
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.error(`Failed to resolve ${marketId}: ${error.detail || res.status}`);
      return false;
    }
    
    console.log(`Resolved market ${marketId} as ${outcome}`);
    return true;
  } catch (e) {
    console.error(`Error resolving market ${marketId}:`, e);
    return false;
  }
}

// Extract event ID from market ID
function extractEventId(marketId: string): string | null {
  if (!marketId.startsWith('sports_')) return null;
  return marketId.replace('sports_', '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('authorization');
  const url = new URL(req.url);
  const isManualTrigger = url.searchParams.get('manual') === 'true';
  
  if (!isManualTrigger && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.log('Unauthorized: Invalid or missing cron secret');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Resolve sports markets job started');
    console.log(`Odds API configured: ${!!Deno.env.get('ODDS_API_KEY')}`);
    console.log(`Cache size: ${SCORE_CACHE.size} entries`);
    
    const markets = await fetchUnresolvedSportsMarkets();
    console.log(`Found ${markets.length} unresolved sports markets pending resolution`);
    
    // Sort markets by priority - closest to resolution time first
    const sortedMarkets = [...markets].sort((a, b) => {
      const priorityA = getPollingPriority(a.resolution_time);
      const priorityB = getPollingPriority(b.resolution_time);
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[priorityA.priority] - priorityOrder[priorityB.priority];
    });
    
    const results = {
      resolved: 0,
      draws: 0,
      homeWins: 0,
      awayWins: 0,
      pending: 0,
      failed: 0,
      skipped: 0,
      cacheHits: 0,
      oddsApiHits: 0,
      espnFallbacks: 0,
      details: [] as { marketId: string; outcome: string | null; status: string; source?: string; priority?: string }[]
    };
    
    for (const market of sortedMarkets) {
      const eventId = extractEventId(market.market_id);
      if (!eventId) {
        console.log(`Invalid market ID format: ${market.market_id}`);
        results.failed++;
        continue;
      }
      
      const { priority } = getPollingPriority(market.resolution_time);
      
      // Check if we should skip based on polling interval
      if (!shouldPollMarket(eventId, market.resolution_time)) {
        const cached = SCORE_CACHE.get(eventId);
        if (cached?.data?.status === 'final') {
          // Still try to resolve if we have a final score cached
          const outcome = determineOutcome(cached.data);
          if (outcome) {
            const success = await resolveMarket(market.market_id, outcome);
            if (success) {
              results.resolved++;
              results.cacheHits++;
              if (outcome === 'DRAW') results.draws++;
              else if (outcome === 'YES') results.homeWins++;
              else results.awayWins++;
              results.details.push({
                marketId: market.market_id,
                outcome,
                status: 'resolved_from_cache',
                source: cached.data.source,
                priority
              });
              continue;
            }
          }
        }
        console.log(`Skipping ${market.market_id} - poll interval not reached (priority: ${priority})`);
        results.skipped++;
        continue;
      }
      
      const score = await fetchMatchScore(eventId, market.resolution_time);
      
      if (!score) {
        console.log(`No score data available for ${market.market_id}`);
        results.pending++;
        results.details.push({
          marketId: market.market_id,
          outcome: null,
          status: 'no_score_data',
          priority
        });
        continue;
      }
      
      if (score.source === 'odds_api') {
        results.oddsApiHits++;
      } else {
        results.espnFallbacks++;
      }
      
      if (score.status !== 'final') {
        console.log(`Game not finished for ${market.market_id}: ${score.status}`);
        results.pending++;
        results.details.push({
          marketId: market.market_id,
          outcome: null,
          status: score.status,
          source: score.source,
          priority
        });
        continue;
      }
      
      const outcome = determineOutcome(score);
      if (!outcome) {
        results.pending++;
        continue;
      }
      
      const success = await resolveMarket(market.market_id, outcome);
      
      if (success) {
        results.resolved++;
        if (outcome === 'DRAW') {
          results.draws++;
          console.log(`DRAW: ${score.homeTeam} ${score.homeScore} - ${score.awayTeam} ${score.awayScore}. All bets refunded.`);
        } else if (outcome === 'YES') {
          results.homeWins++;
        } else {
          results.awayWins++;
        }
        results.details.push({
          marketId: market.market_id,
          outcome,
          status: 'resolved',
          source: score.source,
          priority
        });
      } else {
        results.failed++;
        results.details.push({
          marketId: market.market_id,
          outcome,
          status: 'resolution_failed',
          source: score.source,
          priority
        });
      }
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    
    console.log('Resolution job completed:', {
      resolved: results.resolved,
      draws: results.draws,
      homeWins: results.homeWins,
      awayWins: results.awayWins,
      pending: results.pending,
      skipped: results.skipped,
      failed: results.failed,
      cacheHits: results.cacheHits,
      oddsApiHits: results.oddsApiHits,
      espnFallbacks: results.espnFallbacks
    });
    
    return new Response(JSON.stringify({
      success: true,
      ...results,
      cacheSize: SCORE_CACHE.size,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Resolve sports markets error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});