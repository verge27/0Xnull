import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const partner = url.searchParams.get('partner');

    if (!partner) {
      return new Response(JSON.stringify({ error: 'Missing partner parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const targetUrl = `https://0xnull.io/api/marketing/partners/${encodeURIComponent(partner)}/earnings`;
    
    console.log(`Fetching partner earnings for: ${partner}`);
    console.log(`Target URL: ${targetUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    console.log(`Response status: ${response.status}, body preview: ${responseText.substring(0, 200)}`);

    // Check if response is HTML (error page)
    if (responseText.trim().startsWith('<') || responseText.includes('<!DOCTYPE')) {
      console.error('Received HTML instead of JSON - API endpoint may not exist');
      return new Response(JSON.stringify({ 
        error: 'Partner earnings API not available',
        status: response.status 
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch {
      console.error('Failed to parse response as JSON:', responseText.substring(0, 500));
      return new Response(JSON.stringify({ 
        error: 'Invalid response from partner API',
        raw: responseText.substring(0, 200)
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Partner earnings proxy error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'Request timed out' }), {
        status: 504,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Proxy error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
