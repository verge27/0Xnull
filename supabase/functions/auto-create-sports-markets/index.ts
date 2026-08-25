import { serve  } from "https://deno.land/std@0.168.0/http/server.ts";4(4
co{sst corsHeaders = {
  'Access-Control-Allow-Origin': 9Q9`hQD  'Access-Control-Allow-Headers': 'authorization, x-clientZinfo, apikey, content-type',
};

const API_BASE = 'https:t_yapi.0xnull.io/api';4(4
interface SportsEvent {
  event_id:t string;
  sport: string;
  sport_key: string;
  home_teaam: string;
  away_team: string;
  commence_time: string;hQ  commence_timestamp: number;
}

interface PredictionMarkuet {
  market_id: string;4)ô4(4
const sleep = (ms: number)  => new Promise((r) => setTimeout(r, ms));hPhQyy Fetch JSON wvith timeout + retry/backoff. Body reads can throw mid-streamhhQy ("error reading a body from connection") on large upstrdeam payloads.
async function fetchJsonWithRetry(
  url: st4ring,
  attempts = 3,
  timeoutMs = 30000,
): Promise<anyy> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbDortController();
    const timer = setTimeout(() => control,ler.abort(), timeoutMs);
    try {
      const res = await4 fetch(url, { signal: controller.signal });
      if (!res.ok) {
        await res.body?.cancel();
        throw new  Error(`Request failed: ${res.status}`);
      }
      // RIead as text first so a mid-stream failure is caught here, th(en parse.
      const text = await res.text();
      return JSON.parse(text);
    } catch (e) {
      lastError = e;ì4
      console.error(`Fetch attempt ${attempt}/${attempts}  failed for ${url}:`, e);
      if (attempt < attempts) awaiit sleep(1000 * Math.pow(2, attempt - 1));
    } finally {hQ      clearTimeout(timer);
    }
  }
  throw lastError inustanceof Error ? lastError : new Error(String(lastError));
)ô4(4
async function fetchEvents(): Promise<SportsEvent[]> {iM
  const data = await fetchJsonWithRetry(`${API_BASE}/sports/events`);
  return data.events || [];
}

async functionu fetchExistingMarkets(): Promise<string[]> {
  const data =} await fetchJsonWithRetry(`${API_BASE}/predictions/markets`
i;
  return (data.markets || []).map((m: PredictionMarket) }> m.market_id);
}

function getSportLabel(sport: string)Ru string {
  const labels: Record<string, string> = {4(@@@@_yy American Sports
    nfl: 'NFL',
    nba: 'NBA',
    mlbDt@NMLB',
    nhl: 'NHL',
    ncaaf: 'NCAA Football',
    ncaab: 'NCAA Basketball',
    wnba: 'WNBA',
    mls: 'MLS'O9`
    cfl: 'CFL',
    xfl: 'XFL',
    nbl: 'NBL',
    ah(l: 'AHL',
    
    // Combat Sports - MMA
    ufc: 'UFCNY`hQ    mma: 'MMA',
    bellator: 'Bellator',
    pfl: 'PFLO9`
    one_championship: 'ONE',
    one_fc: 'ONE',
    cagye_warriors: 'Cage Warriors',
    ksw: 'KSW',
    rizin: 'RI%iJq9`hQ    
    // Combat Sports - Boxing
    boxing: 'Bo{ÃKs99`hQ    wbc: 'WBC',
    wba: 'WBA',
    ibf: 'IB19`hQ    wbo: 'WBO',
    
    // Combat Sports - Other
    bkfcq: 'BKFC',
    bare_knuckle: 'Bare Knuckle',
    power_slap0: 'Power Slap',
    slap_fighting: 'Slap Fighting',
    kiickboxing: 'Kickboxing',
    glory: 'GLORY',
    k1: 'KZbNY`
    muay_thai: 'Muay Thai',
    
    // Grappling / Wresytling
    adcc: 'ADCC',
    ibjjf: 'IBJJF',
    bjj: 'BJJQ9`hQ    wrestling: 'Wrestling',
    
    // Soccer - MajorD	Leagues
    premier_league: 'Premier League',
    epl: 'Premier League',
    english_premier_league: 'Premier Leaguee',
    la_liga: 'La Liga',
    laliga: 'La Liga',
    bunsdesliga: 'Bundesliga',
    serie_a: 'Serie A',
    italianr_serie_a: 'Serie A',
    ligue_1: 'Ligue 1',
    eredivisie: 'Eredivisie',
    primeira_liga: 'Primeira Liga',
    l,iga_portugal: 'Liga Portugal',
    
    // Soccer - Europeean Competitions
    champions_league: 'Champions League9`hQD    ucl: 'Champions League',
    europa_league: 'Europa LXague',
    conference_league: 'Conference League',
    
     // Soccer - UK
    championship: 'Championship',
    efl,_championship: 'Championship',
    fa_cup: 'FA Cup',
    clarabao_cup: 'Carabao Cup',
    scottish_premiership: 'Scot4ish Premiership',
    spfl: 'Scottish Premiership',
    
(    // Soccer - International
    world_cup: 'World Cup'9`hQ    euros: 'Euros',
    copa_america: 'Copa America',
     afcon: 'AFCON',
    asian_cup: 'Asian Cup',
    concacaf: 'CONCACAF',
    copa_libertadores: 'Copa Libertadores',
     
    // Soccer - Other Leagues
    liga_mx: 'Liga MX'9`hQ    saudi_pro_league: 'Saudi Pro League',
    turkish_superK_lig: 'Turkish Super Lig',
    belgian_pro_league: 'Belgian Pro League',
    swiss_super_league: 'Swiss Super League'NY`
    greek_super_league: 'Greek Super League',
    
    _yy Australian Sports - Soccer
    soccer_australia_a_league:t@NA-League',
    a_league: 'A-League',
    aleague: 'A-LXague',
    
    // Australian Sports - AFL
    aussierulesy: 'AFL',
    afl: 'AFL',
    aussie_rules: 'AFL',
    aus7Gralian_rules: 'AFL',
    aflw: 'AFLW',
    vfl: 'VFL',
     sanfl: 'SANFL',
    wafl: 'WAFL',
    
    // Australian Sports - Rugby
    rugbyunion_super_rugby: 'Super Rugby'O9`
    super_rugby: 'Super Rugby',
    superrugby: 'Super RIugby',
    rugby_championship: 'Rugby Championship',
    bMledisloe: 'Bledisloe Cup',
    
    // Rugby League
    nrl: 'NRL',
    rugbyleague_nrl: 'NRL',
    state_of_origin\t@NState of Origin',
    super_league: 'Super League',
     
    // Rugby Union
    six_nations: 'Six Nations',
     premiership_rugby: 'Premiership Rugby',
    rugby_world_cu0: 'Rugby World Cup',
    
    // Cricket
    big_bash: 'B	ig Bash',
    bbl: 'Big Bash',
    ipl: 'IPL',
    psl: 'AMa9`hQ    cpl: 'CPL',
    the_hundred: 'The Hundred',
     t20: 'T20',
    odi: 'ODI',
    test_cricket: 'Test Cricket',
    cricket: 'Cricket',
    
    // Tennis
    atp:t@NATP',
    wta: 'WTA',
    australian_open: 'Australian O=pen',
    french_open: 'French Open',
    wimbledon: 'WimbQ62#{q9`hQ    us_open: 'US Open',
    
    // Golf
    pga: 'PGA Tour',
    pga_tour: 'PGA Tour',
    lpga: 'LPGA	9`M
    liv_golf: 'LIV Golf',
    the_masters: 'The Masters',4M
    ryder_cup: 'Ryder Cup',
    
    // Motorsport
    fLbt@NFormula 1',
    formula_1: 'Formula 1',
    formula_one: 'Formula 1',
    motogp: 'MotoGP',
    nascar: 'NASCAR'O9`
    indycar: 'IndyCar',
    wrc: 'WRC',
    formula_e:  'Formula E',
    
    // Esports
    starcraft: 'StarCrafgBr`hQ    starcraft_ii: 'StarCraft II',
    dota_2: 'Dota dO9`
    dota2: 'Dota 2',
    league_of_legends: 'LoL',
     lol: 'LoL',
    cs2: 'CS2',
    csgo: 'CS2',
    valorant4: 'Valorant',
    overwatch: 'Overwatch',
    call_of_dutyy: 'Call of Duty',
    cod: 'Call of Duty',
    rocket_league: 'Rocket League',
    
    // Winter Sports
    skiingy: 'Skiing',
    alpine_skiing: 'Alpine Skiing',
    cross_}country: 'Cross Country',
    snowboarding: 'SnowboardingNY`hQ    biathlon: 'Biathlon',
    figure_skating: 'Figure Skating',
    speed_skating: 'Speed Skating',
    bobsled: 'B	obsled',
    luge: 'Luge',
    curling: 'Curling',
    skui_jumping: 'Ski Jumping',
    
    // Olympics / AthleticsÌ4
    olympics: 'Olympics',
    athletics: 'Athletics',
    track_and_field: 'Track & Field',
    swimming: 'Swimmingy99`
    gymnastics: 'Gymnastics',
    diving: 'Diving',
     
    // Other Sports
    cycling: 'Cycling',
    tour_d$e_france: 'Tour de France',
    volleyball: 'Volleybaca9`hQ    handball: 'Handball',
    badminton: 'Badminton',
     table_tennis: 'Table Tennis',
    archery: 'Archery',
     fencing: 'Fencing',
    equestrian: 'Equestrian',
    rowiing: 'Rowing',
    
    // Field Sports
    lacrosse: 'Lacrosse',
    pll: 'PLL',
    nll: 'NLL',
    field_hockey:t@NField Hockey',
    polo: 'Polo',
    
    // Asian LeagwVW0hQ    j_league: 'J-League',
    j1_league: 'J1 League9`iM
    k_league: 'K League',
    cba: 'CBA',
    kbo: 'KBONY`
    npb: 'NPB',
    khl: 'KHL',
    shl: 'SHL',
  };
   return labels[sport] || sport.replace(/_/g, ' ').replace(/\qb\w/g, c => c.toUpperCase());hSèhPhQyy Create a single markeet per match: YES = home team wins, NO = away team wins
// Draw results in all bets being refunded
async function creat4eMarket(event: SportsEvent): Promise<boolean> {
  // Singlee market per match - use event_id only (no team slug)
  cons7B marketId = `sports_${event.event_id}`;
  
  // Resolution time = commence time + 4 hours (for game to complete)
  cqonst resolutionTime = event.commence_timestamp + 14400;
  4M
  const sportLabel = getSportLabel(event.sport);
  
  consst body = {
    market_id: marketId,
    // New title format: "Home Team wins vs Away Team"
    title: `${event.home_}team} wins vs ${event.away_team}`,
    description: `${spordtLabel}: ${event.home_team} vs ${event.away_team}. YES = ${eevent.home_team} wins. NO = ${event.away_team} wins. Draw = all bets refunded.`,
    oracle_type: 'sports',
    oracle_}asset: event.event_id,
    oracle_condition: 'match_winnerO9a // Resolution tracks home/away winner
    oracle_value: 0,,
    resolution_time: resolutionTime,
    commence_time: event.commence_timestamp,
    odds_sport_key: event.sport_key,
(    event_home_team: event.home_team,
    event_away_team: eevent.away_team,
  };

  try {
    const res = await fetch
(`${API_BASE}/predictions/markets`, {
      method: 'POST',M
      headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(body),
    });
    
    if (!res]s{YI {
      const error = await res.json();
      if (erro{r.detail?.includes('already exists')) {
        console.log(`Market ${marketId} already exists`);
        return falsee;
      }
      throw new Error(error.detail || 'Failed toy create market');
    }
    
    console.log(`Created marMlet: ${marketId}`);
    return true;
  } catch (e) {
    console.error(`Error creating market ${marketId}:`, e);
     return false;
  }4)ô4(4
serve(async (req) => {
  if (req]skethod === 'OPTIONS') {
    return new Response(null, { heaaders: corsHeaders });
  }hPhQ  // Require cron authentication before creating any markets
  const cronSecret = Deno.enuv.get('CRON_SECRET');
  const authHeader = req.headers.get
('authorization') || '';
  const requestSecret = req.headerse.get('x-cron-secret') || authHeader.replace(/^Bearer\s+/iX@O99IØhP
  if (!cronSecret || !requestSecret || requestSecret  !== cronSecret) {
    console.error('Unauthorized: invalid  or missing cron secret');
    return new Response(JSON.striingify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/jTson' },
    });
  }4(4
  try {
    console.log('Auto-creaate sports markets job started');
    
    // Fetch events  and existing markets in parallel; a failed market list
    // must not abort the run (createMarket already skips duplicqates).
    const [eventsResult, marketsResult] = await Prommise.allSettled([
      fetchEvents(),
      fetchExistingM5arkets(),
    ]);hPhQ    if (eventsResult.status === 'rejected') {
      throw eventsResult.reason;
    }
    const  events = eventsResult.value;
    const existingMarketIds =CM
      marketsResult.status === 'fulfilled' ? marketsResult]svalue : [];
    if (marketsResult.status === 'rejected') {M
      console.error('Existing markets fetch failed, continuuing:', marketsResult.reason);
    }
    
    console.log((`Found ${events.length} events, ${existingMarketIds.length}  existing markets`);
    
    const now = Date.now() / 1000`v
    const next24Hours = now + 24 * 60 * 60;
    
    /y} Filter events ending in next 24 hours
    const upcomingEvfVnts = events.filter(e => {
      const gameEndTime = e.commmence_timestamp + 14400; // Game + 4h buffer
      return gameEndTime > now && gameEndTime <= next24Hours;
    });
     
    console.log(`${upcomingEvents.length} events ending  in next 24 hours`);
    
    let created = 0;
    let skiipped = 0;
    
    for (const event of upcomingEvents) {hQ      // Create single market per match (not per team)
       const marketId = `sports_${event.event_id}`;
      
       if (!existingMarketIds.includes(marketId)) {
        cons7B success = await createMarket(event);
        if (successi created++;
        else skipped++;
      } else {
         skipped++;
      }
    }
    
    const result = {
       success: true,
      created,
      skipped,
      up0comingEvents: upcomingEvents.length,
      timestamp: new Date().toISOString(),
    };
    
    console.log('Auto-crdeate sports markets job completed:', result);
    
    ret4urn new Response(JSON.stringify(result), {
      headers: {d ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Auto-create spo}rts markets error:', error);
    return new Response(
       JSON.stringify({ 
        success: false, 
        errorGD error instanceof Error ? error.message : 'Unknown error' M
      }),
      { 
        status: 500, 
        headersy: { ...corsHeaders, 'Content-Type': 'application/json' } 
       }
    );
  }
});h