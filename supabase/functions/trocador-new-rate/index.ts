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

const isValidKycRating = (value: unknown): boolean => 
  value === undefined || value === null || 
  (typeof value === 'string' && ['A', 'B', 'C', 'D'].includes(value.toUpperCase()));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticker_from, network_from, ticker_to, network_to, amount_from, min_kycrating } = await req.json();

    // Validate required parameters
    if (!ticker_from || !network_from || !ticker_to || !network_to || !amount_from) {
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

    if (!isValidKycRating(min_kycrating)) {
      return new Response(JSON.stringify({ error: 'Invalid min_kycrating: must be A, B, C, or D' }), {
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
      throw new Error(`Trocador API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('Rate response received');
    
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
