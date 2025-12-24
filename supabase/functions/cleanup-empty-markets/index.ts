import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const XNULL_API_BASE = 'https://xnull.io';

interface PredictionMarket {
  market_id: string;
  question: string;
  resolution_time: number;
  yes_pool_xmr: number;
  no_pool_xmr: number;
  resolved: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[cleanup-empty-markets] Starting cleanup...');

    // Fetch all markets from 0xNull API
    const marketsResponse = await fetch(`${XNULL_API_BASE}/api/predictions/markets`);
    if (!marketsResponse.ok) {
      throw new Error(`Failed to fetch markets: ${marketsResponse.status}`);
    }

    const marketsData = await marketsResponse.json();
    const markets: PredictionMarket[] = marketsData.markets || [];
    console.log(`[cleanup-empty-markets] Found ${markets.length} total markets`);

    const now = Date.now() / 1000;
    const deleted: string[] = [];
    const errors: string[] = [];

    // Find closed markets with 0 pools
    for (const market of markets) {
      // Skip resolved markets (they're already handled)
      if (market.resolved === 1) continue;

      // Skip markets that haven't closed yet
      if (market.resolution_time > now) continue;

      // Check if pool is empty
      const totalPool = market.yes_pool_xmr + market.no_pool_xmr;
      if (totalPool > 0) continue;

      // This market is closed with 0 pool - delete it
      console.log(`[cleanup-empty-markets] Deleting empty market: ${market.market_id}`);
      
      try {
        const deleteResponse = await fetch(`${XNULL_API_BASE}/api/predictions/markets/${market.market_id}`, {
          method: 'DELETE',
        });

        if (deleteResponse.ok) {
          deleted.push(market.market_id);
          console.log(`[cleanup-empty-markets] Successfully deleted: ${market.market_id}`);
        } else {
          const errorText = await deleteResponse.text();
          errors.push(`${market.market_id}: ${deleteResponse.status} - ${errorText}`);
          console.error(`[cleanup-empty-markets] Failed to delete ${market.market_id}: ${deleteResponse.status}`);
        }
      } catch (deleteError) {
        const errorMessage = deleteError instanceof Error ? deleteError.message : 'Unknown error';
        errors.push(`${market.market_id}: ${errorMessage}`);
        console.error(`[cleanup-empty-markets] Error deleting ${market.market_id}:`, deleteError);
      }
    }

    const result = {
      success: true,
      deleted_count: deleted.length,
      deleted_markets: deleted,
      error_count: errors.length,
      errors: errors,
      timestamp: new Date().toISOString(),
    };

    console.log(`[cleanup-empty-markets] Cleanup complete. Deleted: ${deleted.length}, Errors: ${errors.length}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[cleanup-empty-markets] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
