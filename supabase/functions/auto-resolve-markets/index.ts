import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE = 'https://api.0xnull.io';

interface PredictionMarket {
  market_id: string;
  title: string;
  description: string;
  oracle_type: string;
  oracle_asset: string;
  oracle_condition: string;
  resolution_time: number;
  resolved: number;
  betting_open: boolean;
}

interface EsportsResult {
  id: string;
  game: string;
  team_a: string;
  team_b: string;
  winner: string;
  score_a: number;
  score_b: number;
}

interface SportsResult {
  event_id: string;
  winner: string;
  home_score: number;
  away_score: number;
  status: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Optional: verify cron secret for security
  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('Authorization');
  
  // Allow both cron calls and manual admin calls
  const isCronCall = authHeader?.includes(cronSecret || '');
  const isAnonCall = authHeader?.includes(Deno.env.get('SUPABASE_ANON_KEY') || '');
  
  if (!isCronCall && !isAnonCall) {
    console.log('Unauthorized call attempt');
  }

  const results: {
    checked: number;
    resolved: number;
    failed: number;
    details: { market_id: string; status: string; outcome?: string; error?: string }[];
  } = {
    checked: 0,
    resolved: 0,
    failed: 0,
    details: [],
  };

  try {
    console.log('Starting auto-resolve process...');

    // 1. Fetch all unresolved markets
    const marketsRes = await fetch(`${API_BASE}/api/predictions/markets`);
    if (!marketsRes.ok) {
      throw new Error(`Failed to fetch markets: ${marketsRes.status}`);
    }
    const { markets } = await marketsRes.json() as { markets: PredictionMarket[] };

    const now = Math.floor(Date.now() / 1000);
    
    // 2. Filter to overdue markets (resolution_time passed, not resolved)
    const overdueMarkets = markets.filter(m => 
      m.resolved === 0 && 
      m.resolution_time < now &&
      (m.oracle_type === 'esports' || m.oracle_type === 'sports')
    );

    console.log(`Found ${overdueMarkets.length} overdue markets to check`);

    // 3. Check each market for results
    for (const market of overdueMarkets) {
      results.checked++;
      
      try {
        let outcome: 'YES' | 'NO' | null = null;
        let resultData: any = null;

        if (market.oracle_type === 'esports') {
          // Extract game from market_id pattern: esports_{eventId}_{teamSlug}
          const parts = market.market_id.split('_');
          const eventId = parts[1];
          
          // Try to determine game from description
          let game = 'csgo'; // default
          const desc = market.description?.toLowerCase() || '';
          if (desc.includes('dota')) game = 'dota2';
          else if (desc.includes('league') || desc.includes('lol')) game = 'lol';
          else if (desc.includes('valorant')) game = 'valorant';
          else if (desc.includes('cs2') || desc.includes('counter-strike') || desc.includes('csgo')) game = 'csgo';
          else if (desc.includes('starcraft')) game = 'starcraft-2';

          console.log(`Checking esports result for ${eventId} (${game})`);
          
          const resultRes = await fetch(`${API_BASE}/api/esports/result/${eventId}?game=${game}`);
          
          if (resultRes.ok) {
            resultData = await resultRes.json() as EsportsResult;
            console.log(`Got result: winner is ${resultData.winner}`);
            
            // Check if the oracle_condition (team name) matches the winner
            const conditionLower = market.oracle_condition.toLowerCase().replace(/[^a-z0-9]/g, '');
            const winnerLower = resultData.winner.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            outcome = winnerLower.includes(conditionLower) || conditionLower.includes(winnerLower) ? 'YES' : 'NO';
            console.log(`Market ${market.market_id}: condition="${market.oracle_condition}", winner="${resultData.winner}", outcome=${outcome}`);
          } else {
            console.log(`No result yet for esports event ${eventId}: ${resultRes.status}`);
            results.details.push({ market_id: market.market_id, status: 'no_result_yet' });
            continue;
          }
        } else if (market.oracle_type === 'sports') {
          // Sports markets use a similar pattern
          const eventId = market.oracle_asset;
          
          console.log(`Checking sports result for ${eventId}`);
          
          const resultRes = await fetch(`${API_BASE}/api/sports/result/${eventId}`);
          
          if (resultRes.ok) {
            resultData = await resultRes.json() as SportsResult;
            console.log(`Got sports result: winner is ${resultData.winner}`);
            
            const conditionLower = market.oracle_condition.toLowerCase().replace(/[^a-z0-9]/g, '');
            const winnerLower = resultData.winner.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            outcome = winnerLower.includes(conditionLower) || conditionLower.includes(winnerLower) ? 'YES' : 'NO';
          } else {
            console.log(`No result yet for sports event ${eventId}: ${resultRes.status}`);
            results.details.push({ market_id: market.market_id, status: 'no_result_yet' });
            continue;
          }
        }

        // 4. If we have an outcome, resolve the market
        if (outcome) {
          console.log(`Resolving market ${market.market_id} as ${outcome}`);
          
          const resolveRes = await fetch(`${API_BASE}/api/predictions/markets/${market.market_id}/resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ outcome }),
          });
          
          if (resolveRes.ok) {
            results.resolved++;
            results.details.push({ market_id: market.market_id, status: 'resolved', outcome });
            console.log(`✅ Successfully resolved ${market.market_id} as ${outcome}`);
          } else {
            const errorText = await resolveRes.text();
            results.failed++;
            results.details.push({ market_id: market.market_id, status: 'resolve_failed', error: errorText });
            console.error(`❌ Failed to resolve ${market.market_id}: ${errorText}`);
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        results.failed++;
        results.details.push({ market_id: market.market_id, status: 'error', error: errorMsg });
        console.error(`Error processing market ${market.market_id}:`, errorMsg);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    }

    console.log(`Auto-resolve complete: checked=${results.checked}, resolved=${results.resolved}, failed=${results.failed}`);

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Auto-resolve error:', message);
    
    return new Response(JSON.stringify({
      success: false,
      error: message,
      ...results,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
