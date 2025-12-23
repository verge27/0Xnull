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
  oracle_asset: string | null;
  resolution_time: number;
  resolved: number;
  yes_pool_xmr: number;
  no_pool_xmr: number;
}

interface EsportsEvent {
  event_id: string;
  game: string;
  game_name: string;
  tournament: string;
  team_a: string;
  team_b: string;
  status: string;
  winner: string | null;
  begin_at: number | null;
}

interface SportsScore {
  event_id: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  status: string;
  winner: string | null;
}

async function fetchOverdueMarkets(): Promise<PredictionMarket[]> {
  const res = await fetch(`${API_BASE}/predictions/markets`);
  if (!res.ok) {
    throw new Error(`Failed to fetch markets: ${res.status}`);
  }
  const data = await res.json();
  const now = Math.floor(Date.now() / 1000);
  
  // Get unresolved markets that are past their resolution time
  const markets = (data.markets || []) as PredictionMarket[];
  return markets.filter(m => 
    m.resolved === 0 && 
    m.resolution_time < now &&
    (m.oracle_type === 'esports' || m.oracle_type === 'sports')
  );
}

async function fetchEsportsResults(): Promise<Map<string, EsportsEvent>> {
  const results = new Map<string, EsportsEvent>();
  
  try {
    // Fetch live events (may include recently completed)
    const liveRes = await fetch(`${API_BASE}/esports/live`);
    if (liveRes.ok) {
      const liveData = await liveRes.json();
      const events = liveData.events || [];
      for (const event of events) {
        if (event.event_id) {
          results.set(event.event_id, event);
        }
      }
    }
    
    // Fetch recent matches (completed games)
    const matchesRes = await fetch(`${API_BASE}/esports/matches?status=finished`);
    if (matchesRes.ok) {
      const matchesData = await matchesRes.json();
      const events = matchesData.events || matchesData.matches || [];
      for (const event of events) {
        if (event.event_id) {
          results.set(event.event_id, event);
        }
      }
    }
    
    // Try fetching by different game categories
    const games = ['csgo', 'dota2', 'lol', 'valorant', 'sc2', 'rl'];
    for (const game of games) {
      try {
        const gameRes = await fetch(`${API_BASE}/esports/matches?game=${game}&status=finished`);
        if (gameRes.ok) {
          const gameData = await gameRes.json();
          const events = gameData.events || gameData.matches || [];
          for (const event of events) {
            if (event.event_id) {
              results.set(event.event_id, event);
            }
          }
        }
      } catch (e) {
        console.log(`Failed to fetch ${game} results:`, e);
      }
    }
  } catch (e) {
    console.error('Failed to fetch esports results:', e);
  }
  
  return results;
}

async function fetchSportsScores(): Promise<Map<string, SportsScore>> {
  const scores = new Map<string, SportsScore>();
  
  try {
    // Fetch recent scores (completed games from last 3 days)
    const res = await fetch(`${API_BASE}/sports/scores?days_from=3`);
    if (res.ok) {
      const data = await res.json();
      const scoreList = data.scores || data.events || [];
      for (const score of scoreList) {
        if (score.event_id) {
          scores.set(score.event_id, score);
        }
      }
    }
  } catch (e) {
    console.error('Failed to fetch sports scores:', e);
  }
  
  return scores;
}

function extractEventIdFromMarketId(marketId: string): string | null {
  // Market IDs follow patterns like:
  // esports_{event_id}_{team_slug}
  // sports_{event_id}_{team_slug}
  const parts = marketId.split('_');
  if (parts.length >= 2) {
    // Event ID is the second part (after esports_ or sports_)
    return parts[1];
  }
  return null;
}

function extractTeamFromMarketId(marketId: string): string | null {
  // Extract team name from market_id (the part after event_id)
  const parts = marketId.split('_');
  if (parts.length >= 3) {
    // Join all parts after the event_id (in case team name has underscores)
    return parts.slice(2).join('_');
  }
  return null;
}

function normalizeTeamName(name: string): string {
  return name.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .trim();
}

function determineWinner(market: PredictionMarket, esportsResults: Map<string, EsportsEvent>, sportsScores: Map<string, SportsScore>): 'YES' | 'NO' | null {
  const eventId = extractEventIdFromMarketId(market.market_id);
  const marketTeam = extractTeamFromMarketId(market.market_id);
  
  if (!eventId || !marketTeam) {
    console.log(`Could not parse market_id: ${market.market_id}`);
    return null;
  }
  
  const normalizedMarketTeam = normalizeTeamName(marketTeam);
  
  if (market.oracle_type === 'esports') {
    const event = esportsResults.get(eventId);
    if (!event) {
      console.log(`No esports result found for event: ${eventId}`);
      return null;
    }
    
    // Check if the event has a winner
    if (!event.winner) {
      // Check status
      if (event.status === 'finished' || event.status === 'completed') {
        console.log(`Event ${eventId} finished but no winner field`);
      } else {
        console.log(`Event ${eventId} not yet finished (status: ${event.status})`);
        return null;
      }
    }
    
    // Compare winner to market team
    const normalizedWinner = normalizeTeamName(event.winner || '');
    const normalizedTeamA = normalizeTeamName(event.team_a || '');
    const normalizedTeamB = normalizeTeamName(event.team_b || '');
    
    console.log(`Esports match: ${event.team_a} vs ${event.team_b}, winner: ${event.winner}, market team: ${marketTeam}`);
    
    // Check if market team won
    if (normalizedMarketTeam === normalizedWinner || 
        normalizedMarketTeam.includes(normalizedWinner) ||
        normalizedWinner.includes(normalizedMarketTeam)) {
      return 'YES';
    }
    
    // Check if the market team is one of the teams
    if (normalizedMarketTeam === normalizedTeamA || 
        normalizedMarketTeam.includes(normalizedTeamA) ||
        normalizedTeamA.includes(normalizedMarketTeam) ||
        normalizedMarketTeam === normalizedTeamB ||
        normalizedMarketTeam.includes(normalizedTeamB) ||
        normalizedTeamB.includes(normalizedMarketTeam)) {
      // Market team was one of the teams but didn't win
      return 'NO';
    }
    
    console.log(`Could not match market team ${marketTeam} to event teams`);
    return null;
  }
  
  if (market.oracle_type === 'sports') {
    const score = sportsScores.get(eventId);
    if (!score) {
      console.log(`No sports score found for event: ${eventId}`);
      return null;
    }
    
    // Check if game is finished
    if (score.status !== 'finished' && score.status !== 'final' && score.status !== 'completed') {
      console.log(`Sports event ${eventId} not yet finished (status: ${score.status})`);
      return null;
    }
    
    console.log(`Sports match: ${score.away_team} @ ${score.home_team}, score: ${score.away_score}-${score.home_score}, market team: ${marketTeam}`);
    
    // Determine winner from scores
    const normalizedHome = normalizeTeamName(score.home_team || '');
    const normalizedAway = normalizeTeamName(score.away_team || '');
    
    let winner: string | null = null;
    if (score.winner) {
      winner = normalizeTeamName(score.winner);
    } else if (score.home_score > score.away_score) {
      winner = normalizedHome;
    } else if (score.away_score > score.home_score) {
      winner = normalizedAway;
    } else {
      // Tie - resolve as NO for "will X win?" markets
      console.log(`Sports event ${eventId} ended in a tie`);
      return 'NO';
    }
    
    // Check if market team won
    if (normalizedMarketTeam === winner ||
        normalizedMarketTeam.includes(winner) ||
        winner.includes(normalizedMarketTeam)) {
      return 'YES';
    }
    
    // Check if market team was in the game
    if (normalizedMarketTeam === normalizedHome ||
        normalizedMarketTeam.includes(normalizedHome) ||
        normalizedHome.includes(normalizedMarketTeam) ||
        normalizedMarketTeam === normalizedAway ||
        normalizedMarketTeam.includes(normalizedAway) ||
        normalizedAway.includes(normalizedMarketTeam)) {
      return 'NO';
    }
    
    console.log(`Could not match market team ${marketTeam} to sports teams`);
    return null;
  }
  
  return null;
}

async function resolveMarket(marketId: string, outcome: 'YES' | 'NO'): Promise<boolean> {
  try {
    console.log(`Resolving market ${marketId} as ${outcome}`);
    
    const res = await fetch(`${API_BASE}/predictions/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        market_id: marketId,
        outcome: outcome,
      }),
    });
    
    if (!res.ok) {
      const error = await res.text();
      console.error(`Failed to resolve market ${marketId}: ${res.status} - ${error}`);
      return false;
    }
    
    console.log(`Successfully resolved market ${marketId} as ${outcome}`);
    return true;
  } catch (e) {
    console.error(`Error resolving market ${marketId}:`, e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Auto-resolve markets job started');
    
    // Fetch overdue markets and results in parallel
    const [overdueMarkets, esportsResults, sportsScores] = await Promise.all([
      fetchOverdueMarkets(),
      fetchEsportsResults(),
      fetchSportsScores(),
    ]);
    
    console.log(`Found ${overdueMarkets.length} overdue markets`);
    console.log(`Found ${esportsResults.size} esports results, ${sportsScores.size} sports scores`);
    
    // Separate by type for logging
    const esportsMarkets = overdueMarkets.filter(m => m.oracle_type === 'esports');
    const sportsMarkets = overdueMarkets.filter(m => m.oracle_type === 'sports');
    
    console.log(`Esports markets to check: ${esportsMarkets.length}`);
    console.log(`Sports markets to check: ${sportsMarkets.length}`);
    
    let resolved = 0;
    let failed = 0;
    let noResult = 0;
    const resolvedMarkets: string[] = [];
    
    for (const market of overdueMarkets) {
      // Skip markets with no bets (no one to pay out)
      if (market.yes_pool_xmr === 0 && market.no_pool_xmr === 0) {
        console.log(`Skipping ${market.market_id} - no bets placed`);
        continue;
      }
      
      const outcome = determineWinner(market, esportsResults, sportsScores);
      
      if (outcome === null) {
        console.log(`No result found for ${market.market_id}`);
        noResult++;
        continue;
      }
      
      const success = await resolveMarket(market.market_id, outcome);
      if (success) {
        resolved++;
        resolvedMarkets.push(`${market.market_id} -> ${outcome}`);
      } else {
        failed++;
      }
    }
    
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      overdue_markets: overdueMarkets.length,
      esports_markets: esportsMarkets.length,
      sports_markets: sportsMarkets.length,
      esports_results_available: esportsResults.size,
      sports_scores_available: sportsScores.size,
      resolved,
      failed,
      no_result_found: noResult,
      resolved_markets: resolvedMarkets,
    };
    
    console.log('Auto-resolve job completed:', result);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Auto-resolve markets error:', error);
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
