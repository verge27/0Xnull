import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE = 'https://api.0xnull.io/api';

interface SportsEvent {
  event_id: string;
  sport: string;
  sport_key: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  commence_timestamp: number;
}

interface PredictionMarket {
  market_id: string;
}

async function fetchEvents(): Promise<SportsEvent[]> {
  const res = await fetch(`${API_BASE}/sports/events`);
  if (!res.ok) {
    throw new Error(`Failed to fetch events: ${res.status}`);
  }
  const data = await res.json();
  return data.events || [];
}

async function fetchExistingMarkets(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/predictions/markets`);
  if (!res.ok) {
    throw new Error(`Failed to fetch markets: ${res.status}`);
  }
  const data = await res.json();
  return (data.markets || []).map((m: PredictionMarket) => m.market_id);
}

function getSportLabel(sport: string): string {
  const labels: Record<string, string> = {
    // American Sports
    nfl: 'NFL',
    nba: 'NBA',
    mlb: 'MLB',
    nhl: 'NHL',
    ncaaf: 'NCAA Football',
    ncaab: 'NCAA Basketball',
    mls: 'MLS',
    // Combat Sports
    ufc: 'UFC',
    mma: 'MMA',
    boxing: 'Boxing',
    // Soccer
    premier_league: 'Premier League',
    epl: 'Premier League',
    la_liga: 'La Liga',
    bundesliga: 'Bundesliga',
    serie_a: 'Serie A',
    ligue_1: 'Ligue 1',
    champions_league: 'Champions League',
    europa_league: 'Europa League',
    // Australian Sports - Soccer
    soccer_australia_a_league: 'A-League',
    a_league: 'A-League',
    aleague: 'A-League',
    // Australian Sports - AFL
    aussierules: 'AFL',
    afl: 'AFL',
    aussie_rules: 'AFL',
    australian_rules: 'AFL',
    aflw: 'AFLW',
    // Australian Sports - Rugby
    rugbyunion_super_rugby: 'Super Rugby',
    super_rugby: 'Super Rugby',
    superrugby: 'Super Rugby',
    rugby_championship: 'Rugby Championship',
    nrl: 'NRL',
    rugbyleague_nrl: 'NRL',
    state_of_origin: 'State of Origin',
    // Other Rugby
    six_nations: 'Six Nations',
    premiership_rugby: 'Premiership Rugby',
    // Cricket
    big_bash: 'Big Bash',
    bbl: 'Big Bash',
    ipl: 'IPL',
    cricket: 'Cricket',
  };
  return labels[sport] || sport.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function createMarket(
  event: SportsEvent,
  selectedTeam: string
): Promise<boolean> {
  const teamSlug = selectedTeam.toLowerCase().replace(/\s+/g, '_');
  const marketId = `sports_${event.event_id}_${teamSlug}`;
  
  // Resolution time = commence time + 4 hours (for game to complete)
  const resolutionTime = event.commence_timestamp + 14400;
  
  const sportLabel = getSportLabel(event.sport);
  
  const body = {
    market_id: marketId,
    title: `Will ${selectedTeam} win?`,
    description: `${sportLabel}: ${event.away_team} @ ${event.home_team}`,
    oracle_type: 'sports',
    oracle_asset: event.event_id,
    oracle_condition: 'winner',
    oracle_value: 0,
    resolution_time: resolutionTime,
  };

  try {
    const res = await fetch(`${API_BASE}/predictions/markets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const error = await res.json();
      if (error.detail?.includes('already exists')) {
        console.log(`Market ${marketId} already exists`);
        return false;
      }
      throw new Error(error.detail || 'Failed to create market');
    }
    
    console.log(`Created market: ${marketId}`);
    return true;
  } catch (e) {
    console.error(`Error creating market ${marketId}:`, e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Auto-create sports markets job started');
    
    // Fetch events and existing markets in parallel
    const [events, existingMarketIds] = await Promise.all([
      fetchEvents(),
      fetchExistingMarkets(),
    ]);
    
    console.log(`Found ${events.length} events, ${existingMarketIds.length} existing markets`);
    
    const now = Date.now() / 1000;
    const next24Hours = now + 24 * 60 * 60;
    
    // Filter events ending in next 24 hours
    const upcomingEvents = events.filter(e => {
      const gameEndTime = e.commence_timestamp + 14400; // Game + 4h buffer
      return gameEndTime > now && gameEndTime <= next24Hours;
    });
    
    console.log(`${upcomingEvents.length} events ending in next 24 hours`);
    
    let created = 0;
    let skipped = 0;
    
    for (const event of upcomingEvents) {
      // Create market for home team
      const homeSlug = event.home_team.toLowerCase().replace(/\s+/g, '_');
      const homeMarketId = `sports_${event.event_id}_${homeSlug}`;
      
      if (!existingMarketIds.includes(homeMarketId)) {
        const success = await createMarket(event, event.home_team);
        if (success) created++;
        else skipped++;
      } else {
        skipped++;
      }
      
      // Create market for away team
      const awaySlug = event.away_team.toLowerCase().replace(/\s+/g, '_');
      const awayMarketId = `sports_${event.event_id}_${awaySlug}`;
      
      if (!existingMarketIds.includes(awayMarketId)) {
        const success = await createMarket(event, event.away_team);
        if (success) created++;
        else skipped++;
      } else {
        skipped++;
      }
    }
    
    const result = {
      success: true,
      created,
      skipped,
      upcomingEvents: upcomingEvents.length,
      timestamp: new Date().toISOString(),
    };
    
    console.log('Auto-create sports markets job completed:', result);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Auto-create sports markets error:', error);
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
