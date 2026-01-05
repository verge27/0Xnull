import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE = 'https://api.0xnull.io/api';

interface PredictionMarket {
  market_id: string;
  title: string;
  description: string;
  oracle_type: string;
  oracle_asset: string; // event_id for sports markets
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
  status: 'final' | 'in_progress' | 'scheduled' | 'unknown';
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

// Fetch match score from ESPN API (unofficial)
async function fetchMatchScore(eventId: string): Promise<MatchScore | null> {
  try {
    // Try multiple ESPN sport endpoints
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
          // Check if this event matches our eventId (could be in various formats)
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
          
          // Check game status
          const statusType = competition.status?.type?.name || event.status?.type?.name;
          const isCompleted = statusType === 'STATUS_FINAL' || 
            statusType === 'STATUS_FULL_TIME' ||
            statusType === 'FINAL' ||
            competition.status?.type?.completed === true;
          
          if (isCompleted) {
            console.log(`Found final score for ${eventId}: Home ${homeScore} - Away ${awayScore}`);
            return {
              homeScore,
              awayScore,
              status: 'final'
            };
          }
          
          // Game in progress or scheduled
          return {
            homeScore,
            awayScore,
            status: competition.status?.type?.state === 'in' ? 'in_progress' : 'scheduled'
          };
        }
      } catch (e) {
        // Continue to next sport endpoint
        continue;
      }
    }
    
    // Try the Odds API as fallback (if event info is stored there)
    try {
      const oddsRes = await fetch(`${API_BASE}/sports/events`);
      if (oddsRes.ok) {
        const oddsData = await oddsRes.json();
        const event = (oddsData.events || []).find((e: any) => e.event_id === eventId);
        if (event && event.scores) {
          return {
            homeScore: event.scores.home || 0,
            awayScore: event.scores.away || 0,
            status: event.completed ? 'final' : 'in_progress'
          };
        }
      }
    } catch {
      // Fallback failed
    }
    
    console.log(`No score found for event ${eventId}`);
    return null;
  } catch (e) {
    console.error(`Error fetching score for ${eventId}:`, e);
    return null;
  }
}

// Determine outcome based on score
function determineOutcome(score: MatchScore): 'YES' | 'NO' | 'DRAW' | null {
  if (score.status !== 'final') {
    return null; // Game not finished
  }
  
  if (score.homeScore > score.awayScore) {
    return 'YES'; // Home team wins
  } else if (score.awayScore > score.homeScore) {
    return 'NO'; // Away team wins
  } else {
    return 'DRAW'; // Draw - trigger refunds
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

// Extract event ID from market ID (format: sports_{event_id})
function extractEventId(marketId: string): string | null {
  if (!marketId.startsWith('sports_')) return null;
  return marketId.replace('sports_', '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify cron secret for automated calls
  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('authorization');
  const url = new URL(req.url);
  const isManualTrigger = url.searchParams.get('manual') === 'true';
  
  // Allow manual trigger without auth for testing, or require cron secret
  if (!isManualTrigger && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.log('Unauthorized: Invalid or missing cron secret');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Resolve sports markets job started');
    
    // Fetch unresolved sports markets
    const markets = await fetchUnresolvedSportsMarkets();
    console.log(`Found ${markets.length} unresolved sports markets pending resolution`);
    
    const results = {
      resolved: 0,
      draws: 0,
      homeWins: 0,
      awayWins: 0,
      pending: 0,
      failed: 0,
      details: [] as { marketId: string; outcome: string | null; status: string }[]
    };
    
    for (const market of markets) {
      const eventId = extractEventId(market.market_id);
      if (!eventId) {
        console.log(`Invalid market ID format: ${market.market_id}`);
        results.failed++;
        continue;
      }
      
      // Fetch score for this event
      const score = await fetchMatchScore(eventId);
      
      if (!score) {
        console.log(`No score data available for ${market.market_id}`);
        results.pending++;
        results.details.push({
          marketId: market.market_id,
          outcome: null,
          status: 'no_score_data'
        });
        continue;
      }
      
      if (score.status !== 'final') {
        console.log(`Game not finished for ${market.market_id}: ${score.status}`);
        results.pending++;
        results.details.push({
          marketId: market.market_id,
          outcome: null,
          status: score.status
        });
        continue;
      }
      
      // Determine outcome
      const outcome = determineOutcome(score);
      if (!outcome) {
        results.pending++;
        continue;
      }
      
      // Resolve the market
      const success = await resolveMarket(market.market_id, outcome);
      
      if (success) {
        results.resolved++;
        if (outcome === 'DRAW') {
          results.draws++;
          console.log(`DRAW detected for ${market.market_id}: ${score.homeScore}-${score.awayScore}. All bets will be refunded.`);
        } else if (outcome === 'YES') {
          results.homeWins++;
        } else {
          results.awayWins++;
        }
        results.details.push({
          marketId: market.market_id,
          outcome,
          status: 'resolved'
        });
      } else {
        results.failed++;
        results.details.push({
          marketId: market.market_id,
          outcome,
          status: 'resolution_failed'
        });
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('Resolve sports markets job completed:', {
      resolved: results.resolved,
      draws: results.draws,
      homeWins: results.homeWins,
      awayWins: results.awayWins,
      pending: results.pending,
      failed: results.failed
    });
    
    return new Response(JSON.stringify({
      success: true,
      ...results,
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