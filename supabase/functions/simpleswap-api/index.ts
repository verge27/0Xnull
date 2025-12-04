import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SIMPLESWAP_API_KEY = Deno.env.get('SIMPLESWAP_API_KEY');
const BASE_URL = 'https://api.simpleswap.io';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    console.log(`SimpleSwap API action: ${action}`, params);

    let url: string;
    let options: RequestInit = { method: 'GET' };

    switch (action) {
      case 'get_all_currencies':
        url = `${BASE_URL}/get_all_currencies?api_key=${SIMPLESWAP_API_KEY}`;
        break;

      case 'get_pairs':
        url = `${BASE_URL}/get_pairs?api_key=${SIMPLESWAP_API_KEY}&fixed=false&symbol=${params.symbol}`;
        break;

      case 'get_min_amount':
        url = `${BASE_URL}/get_min_amount?api_key=${SIMPLESWAP_API_KEY}&currency_from=${params.currency_from}&currency_to=${params.currency_to}`;
        break;

      case 'get_estimated':
        url = `${BASE_URL}/get_estimated?api_key=${SIMPLESWAP_API_KEY}&fixed=false&currency_from=${params.currency_from}&currency_to=${params.currency_to}&amount=${params.amount}`;
        break;

      case 'create_exchange':
        url = `${BASE_URL}/create_exchange`;
        options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: SIMPLESWAP_API_KEY,
            currency_from: params.currency_from,
            currency_to: params.currency_to,
            amount: params.amount,
            address_to: params.address_to,
            user_refund_address: params.user_refund_address,
            fixed: false,
          }),
        };
        break;

      case 'get_exchange':
        url = `${BASE_URL}/get_exchange?api_key=${SIMPLESWAP_API_KEY}&id=${params.id}`;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Fetching: ${url.replace(SIMPLESWAP_API_KEY!, '***')}`);
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      console.error('SimpleSwap API error:', data);
      return new Response(JSON.stringify({ error: data.message || 'API error', details: data }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`SimpleSwap response for ${action}:`, typeof data === 'object' ? 'object' : data);
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in simpleswap-api:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
