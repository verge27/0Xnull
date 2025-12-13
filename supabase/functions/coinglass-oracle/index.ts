import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COINGLASS_API_KEY = Deno.env.get('COINGLASS_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface CoinglassResponse {
  code: string;
  msg: string;
  data: {
    symbol: string;
    price: number;
    priceChange24h: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    openInterest: number;
  }[];
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
      // Fetch current price from Coinglass
      const response = await fetch(
        `https://open-api.coinglass.com/public/v2/index/price?symbol=${symbol}`,
        {
          headers: {
            'coinglassSecret': COINGLASS_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Coinglass API error:', errorText);
        throw new Error(`Coinglass API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Coinglass price response:', JSON.stringify(data));

      return new Response(JSON.stringify({
        symbol,
        price: data.data?.price || data.data,
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
      const priceResponse = await fetch(
        `https://open-api.coinglass.com/public/v2/index/price?symbol=${symbol}`,
        {
          headers: {
            'coinglassSecret': COINGLASS_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!priceResponse.ok) {
        throw new Error('Failed to fetch price from Coinglass');
      }

      const priceData = await priceResponse.json();
      const currentPrice = priceData.data?.price || priceData.data;
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
      const response = await fetch(
        `https://open-api.coinglass.com/public/v2/funding?symbol=${symbol}`,
        {
          headers: {
            'coinglassSecret': COINGLASS_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Coinglass API error: ${response.status}`);
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'open-interest') {
      // Fetch open interest
      const response = await fetch(
        `https://open-api.coinglass.com/public/v2/open_interest?symbol=${symbol}`,
        {
          headers: {
            'coinglassSecret': COINGLASS_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Coinglass API error: ${response.status}`);
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
