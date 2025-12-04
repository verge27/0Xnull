import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { ticker_from, network_from, ticker_to, network_to, amount_from, min_kycrating } = await req.json();

    if (!ticker_from || !network_from || !ticker_to || !network_to || !amount_from) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams({
      ticker_from,
      network_from,
      ticker_to,
      network_to,
      amount_from: amount_from.toString(),
    });

    if (min_kycrating) params.append('min_kycrating', min_kycrating);

    console.log('Fetching rate from Trocador:', params.toString());

    const response = await fetch(`${API_BASE}/new_rate?${params}`, {
      headers: { "API-Key": TROCADOR_API_KEY! },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Trocador API error:', response.status, errorText);
      throw new Error(`Trocador API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Rate response:', JSON.stringify(data).substring(0, 200));
    
    return new Response(JSON.stringify(data), {
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
