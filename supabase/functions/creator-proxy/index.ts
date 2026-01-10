import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-creator-token',
};

const CREATOR_API_BASE = 'https://api.0xnull.io/api/creator';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '';
    
    if (!path) {
      return new Response(
        JSON.stringify({ error: 'Missing path parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetUrl = `${CREATOR_API_BASE}${path}`;
    console.log(`[creator-proxy] ${req.method} ${targetUrl}`);

    // Build headers for upstream request
    const upstreamHeaders: HeadersInit = {
      'Accept': 'application/json',
    };

    // Forward authorization header if present
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      upstreamHeaders['Authorization'] = authHeader;
    }

    // Forward creator token header if present
    const creatorToken = req.headers.get('x-creator-token');
    if (creatorToken) {
      upstreamHeaders['X-0xNull-Token'] = creatorToken;
    }

    // Handle different request types
    let body: BodyInit | null = null;
    const contentType = req.headers.get('content-type');

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (contentType?.includes('multipart/form-data')) {
        // For file uploads, forward the FormData
        body = await req.arrayBuffer();
        upstreamHeaders['Content-Type'] = contentType;
      } else if (contentType?.includes('application/json')) {
        body = await req.text();
        upstreamHeaders['Content-Type'] = 'application/json';
      }
    }

    // Make request to upstream API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: upstreamHeaders,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Get response body
      const responseText = await response.text();
      console.log(`[creator-proxy] Response status: ${response.status}`);

      // Try to parse as JSON
      let responseBody: unknown;
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = { message: responseText };
      }

      return new Response(
        JSON.stringify(responseBody),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[creator-proxy] Request timeout');
        return new Response(
          JSON.stringify({ error: 'Request timeout' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('[creator-proxy] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Proxy error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
