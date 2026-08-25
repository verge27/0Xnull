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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Fetch JSON with timeout + retry/backoff. Body reads can throw mid-stream
// ("error reading a body from connection") on large upstream payloads.
async function fetchJsonWithRetry(
  url: string,
  attempts = 3,
  timeoutMs = 30000,
): Promise<any> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        await res.body?.cancel();
        throw new Error(`Request failed: ${res.status}`);
      }
      // Read as text first so a mid-stream failure is caught here, then parse.
      const text = await res.text();
      return JSON.parse(text);
    } catch (e) {
      lastError = e;
      console.error(`Fetch attempt ${attempt}/${attempts} failed for ${url}:`, e);
      if (attempt < attempts) await sleep(1000 * Math.pow(2, attempt - 1));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function fetchEvents(): Promise<SportsEvent[]> {
  const data = await fetchJsonWithRetry(`${API_BASE}/sports/events`);
  return data.events || [];
}

async function fetchExistingMarkets(): Promise<string[]> {
  const data = await fetchJsonWithRetry(`${API_BASE}/predictions/markets`);
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
    wnba: 'WNBA',
    mls: 'MLS',
    cfl: 'CFL',
    xfl: 'XFL',
    nbl: 'NBL',
    ahl: 'AHL',
    
    // Combat Sports - MMA
    ufc: 'UFC',
    mma: 'MMA',
    bellator: 'Bellator',
    pfl: 'PFL',
    one_championship: 'ONE',
    one_fc: 'ONE',
    cage_warriors: 'Cage Warriors',
    ksw: 'KSW',
    rizin: 'RIZIN',
    
    // Combat Sports - Boxing
    boxing: 'Boxing',
    wbc: 'WBC',
    wba: 'WBA',
    ibf: 'IBF',
    wbo: 'WBO',
    
    // Combat Sports - Other
    bkfc: 'BKFC',
    bare_knuckle: 'Bare Knuckle',
    power_slap: 'Power Slap',
    slap_fighting: 'Slap Fighting',
    kickboxing: 'Kickboxing',
    glory: 'GLORY',
    k1: 'K-1',
    muay_thai: 'Muay Thai',
    
    // Grappling / Wrestling
    adcc: 'ADCC',
    ibjjf: 'IBJJF',
    bjj: 'BJJ',
    wrestling: 'Wrestling',
    
    // Soccer - Major Leagues
    premier_league: 'Premier League',
    epl: 'Premier League',
    english_premier_league: 'Premier League',
    la_liga: 'La Liga',
    laliga: 'La Liga',
    bundesliga: 'Bundesliga',
    serie_a: 'Serie A',
    italian_serie_a: 'Serie A',
    ligue_1: 'Ligue 1',
    eredivisie: 'Eredivisie',
    primeira_liga: 'Primeira Liga',
    liga_portugal: 'Liga Portugal',
    
    // Soccer - European Competitions
    champions_league: 'Champions League',
    ucl: 'Champions League',
    europa_league: 'Europa League',
    conference_league: 'Conference League',
    
    // Soccer - UK
    championship: 'Championship',
    efl_championship: 'Championship',
    fa_cup: 'FA Cup',
    carabao_cup: 'Carabao Cup',
    scottish_premiership: 'Scottish Premiership',
    spfl: 'Scottish Premiership',
    
    // Soccer - International
    world_cup: 'World Cup',
    euros: 'Euros',
    copa_america: 'Copa America',
    afcon: 'AFCON',
    asian_cup: 'Asian Cup',
    concacaf: 'CONCACAF',
    copa_libertadores: 'Copa Libertadores',
    
    // Soccer - Other Leagues
    liga_mx: 'Liga MX',
    saudi_pro_league: 'Saudi Pro League',
    turkish_super_lig: 'Turkish Super Lig',
    belgian_pro_league: 'Belgian Pro League',
    swiss_super_league: 'Swiss Super League',
    greek_super_league: 'Greek Super League',
    
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
    vfl: 'VFL',
    sanfl: 'SANFL',
    wafl: 'WAFL',
    
    // Australian Sports - Rugby
    rugbyunion_super_rugby: 'Super Rugby',
    super_rugby: 'Super Rugby',
    superrugby: 'Super Rugby',
    rugby_championship: 'Rugby Championship',
    bledisloe: 'Bledisloe Cup',
    
    // Rugby League
    nrl: 'NRL',
    rugbyleague_nrl: 'NRL',
    state_of_origin: 'State of Origin',
    super_league: 'Super League',
    
    // Rugby Union
    six_nations: 'Six Nations',
    premiership_rugby: 'Premiership Rugby',
    rugby_world_cup: 'Rugby World Cup',
    
    // Cricket
    big_bash: 'Big Bash',
    bbl: 'Big Bash',
    ipl: 'IPL',
    psl: 'PSL',
    cpl: 'CPL',
    the_hundred: 'The Hundred',
    t20: 'T20',
    odi: 'ODI',
    test_cricket: 'Test Cricket',
    cricket: 'Cricket',
    
    // Tennis
    atp: 'ATP',
    wta: 'WTA',
    australian_open: 'Australian Open',
    french_open: 'French Open',
    wimbledon: 'Wimbledon',
    us_open: 'US Open',
    
    // Golf
    pga: 'PGA Tour',
    pga_tour: 'PGA Tour',
    lpga: 'LPGA',
    liv_golf: 'LIV Golf',
    the_masters: 'The Masters',
    ryder_cup: 'Ryder Cup',
    
    // Motorsport
    f1: 'Formula 1',
    formula_1: 'Formula 1',
    formula_one: 'Formula 1',
    motogp: 'MotoGP',
    nascar: 'NASCAR',
    indycar: 'IndyCar',
    wrc: 'WRC',
    formula_e: 'Formula E',
    
    // Esports
    starcraft: 'StarCraft',
    starcraft_ii: 'StarCraft II',
    dota_2: 'Dota 2',
    dota2: 'Dota 2',
    league_of_legends: 'LoL',
    lol: 'LoL',
    cs2: 'CS2',
    csgo: 'CS2',
    valorant: 'Valorant',
    overwatch: 'Overwatch',
    call_of_duty: 'Call of Duty',
    cod: 'Call of Duty',
    rocket_league: 'Rocket League',
    
    // Winter Sports
    skiing: 'Skiing',
    alpine_skiing: 'Alpine Skiing',
    cross_country: 'Cross Country',
    snowboarding: 'Snowboarding',
    biathlon: 'Biathlon',
    figure_skating: 'Figure Skating',
    speed_skating: 'Speed Skating',
    bobsled: 'Bobsled',
    luge: 'Luge',
    curling: 'Curling',
    ski_jumping: 'Ski Jumping',
    
    // Olympics / Athletics
    olympics: 'Olympics',
    athletics: 'Athletics',
    track_and_field: 'Track & Field',
    swimming: 'Swimming',
    gymnastics: 'Gymnastics',
    diving: 'Diving',
    
    // Other Sports
    cycling: 'Cycling',
    tour_de_france: 'Tour de France',
    volleyball: 'Volleyball',
    handball: 'Handball',
    badminton: 'Badminton',
    table_tennis: 'Table Tennis',
    archery: 'Archery',
    fencing: 'Fencing',
    equestrian: 'Equestrian',
    rowing: 'Rowing',
    
    // Field Sports
    lacrosse: 'Lacrosse',
    pll: 'PLL',
    nll: 'NLL',
    field_hockey: 'Field Hockey',
    polo: 'Polo',
    
    // Asian Leagues
    j_league: 'J-League',
    j1_league: 'J1 League',
    k_league: 'K League',
    cba: 'CBA',
    kbo: 'KBO',
    npb: 'NPB',
    khl: 'KHL',
    shl: 'SHL',
  };
  return labels[sport] || sport.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Create a single market per match: YES = home team wins, NO = away team wins
// Draw results in all bets being refunded
async function createMarket(event: SportsEvent): Promise<boolean> {
  // Single market per match - use event_id only (no team slug)
  const marketId = `sports_${event.event_id}`;
  
  // Resolution time = commence time + 4 hours (for game to complete)
  const resolutionTime = event.commence_timestamp + 14400;
  
  const sportLabel = getSportLabel(event.sport);
  
  const body = {
    market_id: marketId,
    // New title format: "Home Team wins vs Away Team"
    title: `${event.home_team} wins vs ${event.away_team}`,
    description: `${sportLabel}: ${event.home_team} vs ${event.away_team}. YES = ${event.home_team} wins. NO = ${event.away_team} wins. Draw = all bets refunded.`,
    oracle_type: 'sports',
    oracle_asset: event.event_id,
    oracle_condition: 'match_winner', // Resolution tracks home/away winner
    oracle_value: 0,
    resolution_time: resolutionTime,
    commence_time: event.commence_timestamp,
    odds_sport_key: event.sport_key,
    event_home_team: event.home_team,
    event_away_team: event.away_team,
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

  // Require cron authentication before creating any markets
  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('authorization') || '';
  const requestSecret = req.headers.get('x-cron-secret') || authHeader.replace(/^Bearer\s+/i, '');

  if (!cronSecret || !requestSecret || requestSecret !== cronSecret) {
    console.error('Unauthorized: invalid or missing cron secret');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Auto-create sports markets job started');
    
    // Fetch events and existing markets in parallel; a failed market list
    // must not abort the run (createMarket already skips duplicates).
    const [eventsResult, marketsResult] = await Promise.allSettled([
      fetchEvents(),
      fetchExistingMarkets(),
    ]);

    if (eventsResult.status === 'rejected') {
      throw eventsResult.reason;
    }
    const events = eventsResult.value;
    const existingMarketIds =
      marketsResult.status === 'fulfilled' ? marketsResult.value : [];
    if (marketsResult.status === 'rejected') {
      console.error('Existing markets fetch failed, continuing:', marketsResult.reason);
    }
    
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
      // Create single market per match (not per team)
      const marketId = `sports_${event.event_id}`;
      
      if (!existingMarketIds.includes(marketId)) {
        const success = await createMarket(event);
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
