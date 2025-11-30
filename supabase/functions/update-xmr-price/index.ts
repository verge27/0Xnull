import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching XMR/USD price from CoinGecko...');

    // Fetch current XMR price from CoinGecko API
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=monero&vs_currencies=usd'
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const xmrPrice = data.monero?.usd;

    if (!xmrPrice) {
      throw new Error('Failed to get XMR price from response');
    }

    console.log(`Fetched XMR price: $${xmrPrice}`);

    // Update exchange rate in database using service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error } = await supabaseAdmin
      .from('exchange_rates')
      .update({
        rate: xmrPrice,
        updated_at: new Date().toISOString()
      })
      .eq('currency_pair', 'XMR/USD');

    if (error) {
      console.error('Error updating exchange rate:', error);
      throw error;
    }

    console.log('Successfully updated XMR/USD exchange rate');

    return new Response(
      JSON.stringify({ 
        success: true, 
        rate: xmrPrice,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-xmr-price function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
