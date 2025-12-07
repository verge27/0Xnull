import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const tradeId = url.searchParams.get('trade_id');

    if (!tradeId) {
      return new Response(
        JSON.stringify({ error: 'Missing trade_id parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('TROCADOR_API_KEY');
    if (!apiKey) {
      console.error('TROCADOR_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch trade status from Trocador
    const trocadorUrl = `https://trocador.app/api/trade?api_key=${apiKey}&id=${tradeId}`;
    console.log(`Fetching trade status for: ${tradeId}`);

    const response = await fetch(trocadorUrl);
    const statusCode = response.status;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Trocador API error: ${statusCode} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch trade status', details: errorText }),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`Trade ${tradeId} raw response:`, JSON.stringify(data));
    
    // Trocador API returns an array with the trade object
    const tradeData = Array.isArray(data) ? data[0] : (data.trade || data);
    const status = tradeData?.status || tradeData?.trade_status;
    console.log(`Trade ${tradeId} status: ${status}`);

    // Update swap_history in database if status changed
    if (status) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: updateError } = await supabase
        .from('swap_history')
        .update({ status: status })
        .eq('trade_id', tradeId);

      if (updateError) {
        console.error('Failed to update swap_history:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        trade_id: tradeData.trade_id || tradeId,
        status: status,
        amount_from: tradeData.amount_from,
        amount_to: tradeData.amount_to,
        ticker_from: tradeData.ticker_from,
        ticker_to: tradeData.ticker_to,
        tx_hash_to: tradeData.tx_hash_to || null,
        tx_hash_from: tradeData.tx_hash_from || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching trade status:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
