import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXOLIX_API_URL = 'https://exolix.com/api/v2';
const EXOLIX_API_KEY = Deno.env.get('EXOLIX_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching currencies from Exolix API...');

    // Fetch all currencies with pagination
    const allCurrencies: unknown[] = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      if (EXOLIX_API_KEY) {
        headers['Authorization'] = EXOLIX_API_KEY;
      }
      
      const response = await fetch(
        `${EXOLIX_API_URL}/currencies?withNetworks=true&size=100&page=${page}`,
        { headers }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Exolix API error page ${page}:`, response.status, errorText);
        break;
      }
      
      const pageData = await response.json();
      const items = pageData.data || [];
      allCurrencies.push(...items);
      
      console.log(`Fetched page ${page}: ${items.length} currencies`);
      
      // Check if we've fetched all items
      if (items.length < 100 || allCurrencies.length >= pageData.count) {
        hasMore = false;
      } else {
        page++;
      }
    }

    console.log(`Total currencies fetched from Exolix: ${allCurrencies.length}`);

    // Transform and flatten currencies with networks
    const coinRecords: { ticker: string; name: string; network: string; memo: boolean; image: string | null }[] = [];
    
    for (const currency of allCurrencies as Array<{ code: string; name: string; icon?: string; networks?: Array<{ network: string; memoNeeded?: boolean }> }>) {
      const networks = currency.networks || [{ network: currency.code, memoNeeded: false }];
      
      for (const net of networks) {
        coinRecords.push({
          ticker: currency.code.toLowerCase(),
          name: currency.name,
          network: net.network,
          memo: net.memoNeeded || false,
          image: currency.icon || null,
        });
      }
    }

    console.log(`Total coin records to upsert: ${coinRecords.length}`);

    // Upsert in batches
    const batchSize = 100;
    let upsertedCount = 0;

    for (let i = 0; i < coinRecords.length; i += batchSize) {
      const batch = coinRecords.slice(i, i + batchSize);
      const { error } = await supabase
        .from('exolix_coins')
        .upsert(batch, { onConflict: 'ticker,network' });

      if (error) {
        console.error('Upsert error:', error);
        throw error;
      }
      upsertedCount += batch.length;
    }

    console.log(`Successfully upserted ${upsertedCount} Exolix coins`);

    // Log the API call
    await supabase.from('api_call_logs').insert({
      function_name: 'sync-exolix-coins',
      endpoint: '/currencies',
      method: 'GET',
      status_code: 200,
      response_time_ms: Date.now() - startTime,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      count: upsertedCount,
      message: `Synced ${upsertedCount} coins from Exolix` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error syncing Exolix coins:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
