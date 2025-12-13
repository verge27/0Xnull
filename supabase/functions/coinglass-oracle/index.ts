import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COINGLASS_API_KEY = Deno.env.get('COINGLASS_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Helper to make Coinglass API requests
async function coinglassRequest(endpoint: string): Promise<Response> {
  const response = await fetch(`https://open-api-v3.coinglass.com/api${endpoint}`, {
    headers: {
      'CG-API-KEY': COINGLASS_API_KEY!,
      'Content-Type': 'application/json',
    },
  });
  return response;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'price';
    const symbol = url.searchParams.get('symbol') || 'BTC';

    if (!COINGLASS_API_KEY) {
      throw new Error('COINGLASS_API_KEY not configured');
    }

    if (action === 'price') {
      // Fetch current price from Coinglass spot markets endpoint
      const response = await coinglassRequest(`/spot/coins-markets?symbol=${symbol}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Coinglass API error:', errorText);
        throw new Error(`Coinglass API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Coinglass price response:', JSON.stringify(data));

      // Extract price from the response
      const coinData = data.data?.[0];
      const price = coinData?.current_price || coinData?.price;

      return new Response(JSON.stringify({
        symbol,
        price,
        priceChange24h: coinData?.price_change_24h,
        priceChangePercent24h: coinData?.price_change_percent_24h,
        volume24h: coinData?.volume_usd_24h,
        timestamp: Date.now(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'resolve-market') {
      // Auto-resolve a prediction market based on BTC price
      const { marketId, targetPrice, comparison } = await req.json();
      
      if (!marketId || !targetPrice || !comparison) {
        throw new Error('Missing required fields: marketId, targetPrice, comparison');
      }

      // Fetch current BTC price
      const priceResponse = await coinglassRequest(`/spot/coins-markets?symbol=${symbol}`);

      if (!priceResponse.ok) {
        throw new Error('Failed to fetch price from Coinglass');
      }

      const priceData = await priceResponse.json();
      const coinData = priceData.data?.[0];
      const currentPrice = coinData?.current_price || coinData?.price;
      
      if (!currentPrice) {
        throw new Error('Could not fetch current price');
      }

      console.log(`Current ${symbol} price: $${currentPrice}, Target: $${targetPrice}, Comparison: ${comparison}`);

      // Determine outcome based on comparison
      let outcome: 'yes' | 'no';
      if (comparison === 'above') {
        outcome = currentPrice > targetPrice ? 'yes' : 'no';
      } else if (comparison === 'below') {
        outcome = currentPrice < targetPrice ? 'yes' : 'no';
      } else if (comparison === 'equals') {
        outcome = Math.abs(currentPrice - targetPrice) < 100 ? 'yes' : 'no'; // Within $100
      } else {
        throw new Error('Invalid comparison type. Use: above, below, equals');
      }

      // Update market with resolution
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const { error: updateError } = await supabase
        .from('prediction_markets')
        .update({
          status: `resolved_${outcome}`,
          resolved_at: new Date().toISOString(),
          resolution_criteria: `Oracle resolved at $${currentPrice.toFixed(2)} (target: $${targetPrice}, ${comparison})`,
        })
        .eq('id', marketId);

      if (updateError) {
        console.error('Failed to update market:', updateError);
        throw new Error('Failed to resolve market');
      }

      console.log(`Market ${marketId} resolved as ${outcome} at price $${currentPrice}`);

      return new Response(JSON.stringify({
        success: true,
        marketId,
        outcome,
        currentPrice,
        targetPrice,
        comparison,
        timestamp: Date.now(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'funding-rates') {
      // Fetch funding rates
      const response = await coinglassRequest(`/futures/funding-rate?symbol=${symbol}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Coinglass API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'open-interest') {
      // Fetch open interest
      const response = await coinglassRequest(`/futures/open-interest?symbol=${symbol}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Coinglass API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Coinglass oracle error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
