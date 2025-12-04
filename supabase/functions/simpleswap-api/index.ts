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
    let options: RequestInit = { 
      method: 'GET',
      headers: {
        'x-api-key': SIMPLESWAP_API_KEY!,
      },
    };

    switch (action) {
      case 'get_all_currencies':
        // V3 API - get all currencies
        url = `${BASE_URL}/v3/currencies`;
        break;

      case 'get_pairs':
        // V3 API - get pairs for a currency
        url = `${BASE_URL}/v3/pairs/${params.symbol}/${params.network || 'mainnet'}`;
        break;

      case 'get_min_amount':
        // V3 API - get ranges (min/max) - uses tickerFrom/tickerTo
        const rangeParams = new URLSearchParams();
        rangeParams.set('tickerFrom', params.currency_from);
        if (params.network_from) rangeParams.set('networkFrom', params.network_from);
        rangeParams.set('tickerTo', params.currency_to);
        if (params.network_to) rangeParams.set('networkTo', params.network_to);
        url = `${BASE_URL}/v3/ranges?${rangeParams}`;
        break;

      case 'get_estimated':
        // V3 API - get estimate - uses tickerFrom/tickerTo
        const estParams = new URLSearchParams();
        estParams.set('tickerFrom', params.currency_from);
        if (params.network_from) estParams.set('networkFrom', params.network_from);
        estParams.set('tickerTo', params.currency_to);
        if (params.network_to) estParams.set('networkTo', params.network_to);
        estParams.set('amount', params.amount);
        estParams.set('fixed', 'false');
        url = `${BASE_URL}/v3/estimates?${estParams}`;
        break;

      case 'create_exchange':
        // V3 API - create exchange
        url = `${BASE_URL}/v3/exchanges`;
        const exchangeBody: Record<string, any> = {
          tickerFrom: params.currency_from,
          tickerTo: params.currency_to,
          amount: params.amount,
          addressTo: params.address_to,
          userRefundAddress: params.user_refund_address,
          fixed: false,
        };
        if (params.network_from) exchangeBody.networkFrom = params.network_from;
        if (params.network_to) exchangeBody.networkTo = params.network_to;
        
        options = {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-api-key': SIMPLESWAP_API_KEY!,
          },
          body: JSON.stringify(exchangeBody),
        };
        break;

      case 'get_exchange':
        // V3 API - get exchange status
        url = `${BASE_URL}/v3/exchanges/${params.id}`;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Fetching: ${url}`);
    const response = await fetch(url, options);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      console.log('Non-JSON response:', text);
      
      // For ranges/estimates, SimpleSwap might return just a number
      if (!isNaN(parseFloat(text))) {
        return new Response(JSON.stringify(text), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'Invalid response', details: text }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const data = await response.json();

    if (!response.ok) {
      console.error('SimpleSwap API error:', data);
      return new Response(JSON.stringify({ error: data.message || data.error || 'API error', details: data }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`SimpleSwap response for ${action}:`, typeof data === 'object' ? JSON.stringify(data).slice(0, 200) : data);
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
