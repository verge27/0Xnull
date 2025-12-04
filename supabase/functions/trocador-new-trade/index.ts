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
    const body = await req.json();
    const { ticker_from, network_from, ticker_to, network_to, amount_from, address, provider, id } = body;

    if (!ticker_from || !network_from || !ticker_to || !network_to || !amount_from || !address || !provider || !id) {
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
      address,
      provider,
      id,
    });

    if (body.refund_address) params.append('refund_address', body.refund_address);
    if (body.address_memo) params.append('address_memo', body.address_memo);

    console.log('Creating trade on Trocador:', params.toString());

    const response = await fetch(`${API_BASE}/new_trade?${params}`, {
      headers: { "API-Key": TROCADOR_API_KEY! },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Trocador API error:', response.status, errorText);
      throw new Error(`Trocador API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Trade response:', JSON.stringify(data).substring(0, 200));
    
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
