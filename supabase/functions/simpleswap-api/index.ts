import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SIMPLESWAP_API_KEY = Deno.env.get('SIMPLESWAP_API_KEY');
const BASE_URL = 'https://api.simpleswap.io';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helpers
const isValidTicker = (value: unknown): value is string => 
  typeof value === 'string' && value.length >= 1 && value.length <= 20 && /^[a-zA-Z0-9]+$/.test(value);

const isValidNetwork = (value: unknown): value is string => 
  value === undefined || value === null ||
  (typeof value === 'string' && value.length >= 1 && value.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(value));

const isValidAmount = (value: unknown): boolean => {
  if (typeof value === 'number') return value > 0 && value < 100000000;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0 && num < 100000000;
  }
  return false;
};

const isValidAddress = (value: unknown): value is string => 
  typeof value === 'string' && value.length >= 10 && value.length <= 256;

const isValidExchangeId = (value: unknown): value is string =>
  typeof value === 'string' && value.length >= 1 && value.length <= 100 && /^[a-zA-Z0-9_-]+$/.test(value);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    
    // Validate action
    const validActions = ['get_all_currencies', 'get_pairs', 'get_min_amount', 'get_estimated', 'create_exchange', 'get_exchange'];
    if (!action || typeof action !== 'string' || !validActions.includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid or missing action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`SimpleSwap API action: ${action}`);

    let url: string;
    let options: RequestInit = { 
      method: 'GET',
      headers: {
        'x-api-key': SIMPLESWAP_API_KEY!,
      },
    };

    switch (action) {
      case 'get_all_currencies':
        // V3 API - get all currencies (no params needed)
        url = `${BASE_URL}/v3/currencies`;
        break;

      case 'get_pairs':
        // Validate symbol
        if (!isValidTicker(params.symbol)) {
          return new Response(JSON.stringify({ error: 'Invalid symbol format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!isValidNetwork(params.network)) {
          return new Response(JSON.stringify({ error: 'Invalid network format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        url = `${BASE_URL}/v3/pairs/${params.symbol}/${params.network || 'mainnet'}`;
        break;

      case 'get_min_amount':
        // Validate currency_from and currency_to
        if (!isValidTicker(params.currency_from)) {
          return new Response(JSON.stringify({ error: 'Invalid currency_from format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!isValidTicker(params.currency_to)) {
          return new Response(JSON.stringify({ error: 'Invalid currency_to format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!isValidNetwork(params.network_from)) {
          return new Response(JSON.stringify({ error: 'Invalid network_from format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!isValidNetwork(params.network_to)) {
          return new Response(JSON.stringify({ error: 'Invalid network_to format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const rangeParams = new URLSearchParams();
        rangeParams.set('tickerFrom', params.currency_from);
        if (params.network_from) rangeParams.set('networkFrom', params.network_from);
        rangeParams.set('tickerTo', params.currency_to);
        if (params.network_to) rangeParams.set('networkTo', params.network_to);
        url = `${BASE_URL}/v3/ranges?${rangeParams}`;
        break;

      case 'get_estimated':
        // Validate all required params
        if (!isValidTicker(params.currency_from)) {
          return new Response(JSON.stringify({ error: 'Invalid currency_from format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!isValidTicker(params.currency_to)) {
          return new Response(JSON.stringify({ error: 'Invalid currency_to format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!isValidNetwork(params.network_from)) {
          return new Response(JSON.stringify({ error: 'Invalid network_from format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!isValidNetwork(params.network_to)) {
          return new Response(JSON.stringify({ error: 'Invalid network_to format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!isValidAmount(params.amount)) {
          return new Response(JSON.stringify({ error: 'Invalid amount: must be a positive number less than 100,000,000' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const estParams = new URLSearchParams();
        estParams.set('tickerFrom', params.currency_from);
        if (params.network_from) estParams.set('networkFrom', params.network_from);
        estParams.set('tickerTo', params.currency_to);
        if (params.network_to) estParams.set('networkTo', params.network_to);
        estParams.set('amount', params.amount.toString());
        estParams.set('fixed', 'false');
        url = `${BASE_URL}/v3/estimates?${estParams}`;
        break;

      case 'create_exchange':
        // Validate all required params for exchange creation
        if (!isValidTicker(params.currency_from)) {
          return new Response(JSON.stringify({ error: 'Invalid currency_from format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!isValidTicker(params.currency_to)) {
          return new Response(JSON.stringify({ error: 'Invalid currency_to format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!isValidNetwork(params.network_from)) {
          return new Response(JSON.stringify({ error: 'Invalid network_from format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!isValidNetwork(params.network_to)) {
          return new Response(JSON.stringify({ error: 'Invalid network_to format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!isValidAmount(params.amount)) {
          return new Response(JSON.stringify({ error: 'Invalid amount: must be a positive number less than 100,000,000' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!isValidAddress(params.address_to)) {
          return new Response(JSON.stringify({ error: 'Invalid address_to: must be 10-256 characters' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (params.user_refund_address && !isValidAddress(params.user_refund_address)) {
          return new Response(JSON.stringify({ error: 'Invalid user_refund_address: must be 10-256 characters' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        url = `${BASE_URL}/v3/exchanges`;
        const exchangeBody: Record<string, unknown> = {
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
        // Validate exchange ID
        if (!isValidExchangeId(params.id)) {
          return new Response(JSON.stringify({ error: 'Invalid exchange ID format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
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
      console.log('Non-JSON response received');
      
      // For ranges/estimates, SimpleSwap might return just a number
      if (!isNaN(parseFloat(text))) {
        return new Response(JSON.stringify(text), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'Invalid response from API' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const data = await response.json();

    if (!response.ok) {
      console.error('SimpleSwap API error:', response.status);
      return new Response(JSON.stringify({ error: data.message || data.error || 'API error' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`SimpleSwap response for ${action} received`);
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
