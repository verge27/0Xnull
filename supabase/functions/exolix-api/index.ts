import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXOLIX_API_URL = 'https://exolix.com/api/v2';
const EXOLIX_API_KEY = Deno.env.get('EXOLIX_API_KEY');

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    console.log(`Exolix API action: ${action}`, params);

    let endpoint = '';
    let method = 'GET';
    let body = null;

    switch (action) {
      case 'currencies': {
        // Fetch all currencies with pagination (max 100 per page)
        const allCurrencies: unknown[] = [];
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
          const currencyHeaders: HeadersInit = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          };
          if (EXOLIX_API_KEY) {
            currencyHeaders['Authorization'] = EXOLIX_API_KEY;
          }
          
          const pageResponse = await fetch(
            `${EXOLIX_API_URL}/currencies?withNetworks=true&size=100&page=${page}`,
            { headers: currencyHeaders }
          );
          
          if (!pageResponse.ok) {
            console.error(`Failed to fetch currencies page ${page}`);
            break;
          }
          
          const pageData = await pageResponse.json();
          const items = pageData.data || [];
          allCurrencies.push(...items);
          
          // Check if we've fetched all items
          if (items.length < 100 || allCurrencies.length >= pageData.count) {
            hasMore = false;
          } else {
            page++;
          }
        }
        
        console.log(`Fetched ${allCurrencies.length} currencies from Exolix`);
        return new Response(
          JSON.stringify({ data: allCurrencies, count: allCurrencies.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'networks':
        endpoint = `/currencies/${params.code}/networks`;
        break;

      case 'rate':
        const rateParams = new URLSearchParams({
          coinFrom: params.coinFrom,
          coinTo: params.coinTo,
          amount: params.amount,
          rateType: params.rateType || 'float',
        });
        if (params.networkFrom) rateParams.append('networkFrom', params.networkFrom);
        if (params.networkTo) rateParams.append('networkTo', params.networkTo);
        endpoint = `/rate?${rateParams.toString()}`;
        break;

      case 'create_transaction':
        endpoint = '/transactions';
        method = 'POST';
        body = JSON.stringify({
          coinFrom: params.coinFrom,
          networkFrom: params.networkFrom,
          coinTo: params.coinTo,
          networkTo: params.networkTo,
          amount: parseFloat(params.amount),
          withdrawalAddress: params.withdrawalAddress,
          withdrawalExtraId: params.withdrawalExtraId || '',
          refundAddress: params.refundAddress || '',
          refundExtraId: params.refundExtraId || '',
          rateType: params.rateType || 'float',
        });
        break;

      case 'transaction_status':
        endpoint = `/transactions/${params.id}`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // Add authorization for authenticated endpoints
    if (EXOLIX_API_KEY) {
      headers['Authorization'] = EXOLIX_API_KEY;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (body) {
      fetchOptions.body = body;
    }

    console.log(`Fetching: ${EXOLIX_API_URL}${endpoint}`);
    const response = await fetch(`${EXOLIX_API_URL}${endpoint}`, fetchOptions);
    
    const responseText = await response.text();
    console.log(`Exolix response status: ${response.status}`);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse Exolix response:', responseText);
      return new Response(
        JSON.stringify({ error: 'Invalid response from Exolix', details: responseText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      console.error('Exolix API error:', data);
      return new Response(
        JSON.stringify({ error: data.message || 'Exolix API error', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Exolix edge function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
