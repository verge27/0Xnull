import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TROCADOR_API_KEY = Deno.env.get('TROCADOR_API_KEY');
const API_BASE = "https://api.trocador.app";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helpers
const isValidTicker = (value: unknown): value is string => 
  typeof value === 'string' && value.length >= 1 && value.length <= 20 && /^[a-zA-Z0-9]+$/.test(value);

const isValidNetwork = (value: unknown): value is string => 
  typeof value === 'string' && value.length >= 1 && value.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(value);

const isValidAmount = (value: unknown): boolean => {
  if (typeof value === 'number') return value > 0 && value < 100000000;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0 && num < 100000000;
  }
  return false;
};

const isValidAddress = (value: unknown): value is string => 
  typeof value === 'string' && value.length >= 10 && value.length <= 256 && /^[a-zA-Z0-9]+$/.test(value);

const isValidProviderId = (value: unknown): value is string =>
  typeof value === 'string' && value.length >= 1 && value.length <= 100 && /^[a-zA-Z0-9_-]+$/.test(value);

const isValidRefundAddress = (value: unknown): boolean =>
  value === undefined || value === null || value === '' || isValidAddress(value);

const isValidMemo = (value: unknown): boolean =>
  value === undefined || value === null || value === '' || 
  (typeof value === 'string' && value.length <= 256);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { ticker_from, network_from, ticker_to, network_to, amount_from, address, provider, id } = body;

    // Validate required parameters
    if (!ticker_from || !network_from || !ticker_to || !network_to || !amount_from || !address || !provider || !id) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate input formats
    if (!isValidTicker(ticker_from)) {
      return new Response(JSON.stringify({ error: 'Invalid ticker_from format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isValidTicker(ticker_to)) {
      return new Response(JSON.stringify({ error: 'Invalid ticker_to format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isValidNetwork(network_from)) {
      return new Response(JSON.stringify({ error: 'Invalid network_from format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isValidNetwork(network_to)) {
      return new Response(JSON.stringify({ error: 'Invalid network_to format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isValidAmount(amount_from)) {
      return new Response(JSON.stringify({ error: 'Invalid amount_from: must be a positive number less than 100,000,000' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isValidAddress(address)) {
      return new Response(JSON.stringify({ error: 'Invalid address format: must be 10-256 alphanumeric characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isValidProviderId(provider)) {
      return new Response(JSON.stringify({ error: 'Invalid provider format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isValidProviderId(id)) {
      return new Response(JSON.stringify({ error: 'Invalid id format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isValidRefundAddress(body.refund_address)) {
      return new Response(JSON.stringify({ error: 'Invalid refund_address format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isValidMemo(body.address_memo)) {
      return new Response(JSON.stringify({ error: 'Invalid address_memo: must be 256 characters or less' }), {
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

    console.log('Creating trade on Trocador');

    const response = await fetch(`${API_BASE}/new_trade?${params}`, {
      headers: { "API-Key": TROCADOR_API_KEY! },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Trocador API error:', response.status, errorText);
      throw new Error(`Trocador API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('Trade created successfully');
    
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
