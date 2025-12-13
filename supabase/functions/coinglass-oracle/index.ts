import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// CoinGecko ID mapping (ticker -> coingecko id)
const COINGECKO_IDS: Record<string, string> = {
  // Major
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'LTC': 'litecoin',
  // Privacy
  'XMR': 'monero',
  'DASH': 'dash',
  'ZEC': 'zcash',
  'ARRR': 'pirate-chain',
  // L1s
  'ADA': 'cardano',
  'AVAX': 'avalanche-2',
  'DOT': 'polkadot',
  'ATOM': 'cosmos',
  'NEAR': 'near',
  // Memes
  'DOGE': 'dogecoin',
  'SHIB': 'shiba-inu',
  'PEPE': 'pepe',
  'BONK': 'bonk',
  // DeFi
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'AAVE': 'aave',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'price';
    const symbol = url.searchParams.get('symbol') || 'BTC';
    const coinId = COINGECKO_IDS[symbol.toUpperCase()] || symbol.toLowerCase();

    if (action === 'price') {
      // Fetch current price from CoinGecko - free, no API key needed
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('CoinGecko API error:', errorText);
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('CoinGecko price response:', JSON.stringify(data));

      const coinData = data[coinId];
      if (!coinData) {
        throw new Error(`No data found for ${symbol}`);
      }

      return new Response(JSON.stringify({
        symbol,
        price: coinData.usd,
        priceChange24h: coinData.usd_24h_change,
        volume24h: coinData.usd_24h_vol,
        timestamp: Date.now(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'resolve-market') {
      // Auto-resolve a prediction market based on price
      const { marketId, targetPrice, comparison } = await req.json();
      
      if (!marketId || !targetPrice || !comparison) {
        throw new Error('Missing required fields: marketId, targetPrice, comparison');
      }

      // Fetch current price from CoinGecko
      const priceResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!priceResponse.ok) {
        throw new Error('Failed to fetch price from CoinGecko');
      }

      const priceData = await priceResponse.json();
      const currentPrice = priceData[coinId]?.usd;
      
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
        outcome = Math.abs(currentPrice - targetPrice) < 100 ? 'yes' : 'no';
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

    throw new Error(`Unknown action: ${action}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Price oracle error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
