import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TROCADOR_API_KEY = Deno.env.get('TROCADOR_API_KEY');
const API_BASE = "https://api.trocador.app";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching coins from Trocador API...');

    const response = await fetch(`${API_BASE}/coins`, {
      headers: { "API-Key": TROCADOR_API_KEY! },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Trocador API error:', response.status, errorText);
      throw new Error(`Trocador API returned ${response.status}: ${errorText}`);
    }

    const coins = await response.json();
    console.log(`Fetched ${coins.length} coins from Trocador`);

    // Transform and upsert coins
    const coinRecords = coins.map((coin: any) => ({
      ticker: coin.ticker,
      name: coin.name,
      network: coin.network,
      memo: coin.memo || false,
      image: coin.image || null,
      minimum: parseFloat(coin.minimum) || 0,
      maximum: parseFloat(coin.maximum) || 1000000,
    }));

    // Upsert in batches
    const batchSize = 100;
    let upsertedCount = 0;

    for (let i = 0; i < coinRecords.length; i += batchSize) {
      const batch = coinRecords.slice(i, i + batchSize);
      const { error } = await supabase
        .from('coins')
        .upsert(batch, { onConflict: 'ticker,network' });

      if (error) {
        console.error('Upsert error:', error);
        throw error;
      }
      upsertedCount += batch.length;
    }

    console.log(`Successfully upserted ${upsertedCount} coins`);

    return new Response(JSON.stringify({ 
      success: true, 
      count: upsertedCount,
      message: `Synced ${upsertedCount} coins from Trocador` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
