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
        // For file uploads: read the form data and reconstruct it for the upstream
        // We need to pass the raw body with the correct content-type header (including boundary)
        body = await req.arrayBuffer();
        // Forward the FULL content-type header which includes the boundary
        upstreamHeaders['Content-Type'] = contentType;
        console.log(`[creator-proxy] Forwarding multipart upload, size: ${(body as ArrayBuffer).byteLength} bytes`);
      } else if (contentType?.includes('application/json')) {
        body = await req.text();
        upstreamHeaders['Content-Type'] = 'application/json';
      }
    }

    // Make request to upstream API with timeout - longer timeout for file uploads
    const isUpload = contentType?.includes('multipart/form-data');
    const timeoutMs = isUpload ? 120000 : 30000; // 2 minutes for uploads
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: upstreamHeaders,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`[creator-proxy] Response status: ${response.status}`);

      // Get response body
      const responseText = await response.text();

      // Try to parse as JSON
      let responseBody: unknown;
      try {
        responseBody = JSON.parse(responseText);
        
        // Log content data for debugging titles/thumbnails
        if (path.includes('/my/content') || path.includes('/content')) {
          console.log('[creator-proxy] Content response sample:', JSON.stringify(responseBody).slice(0, 2000));
        }
      } catch {
        responseBody = { message: responseText };
      }

      // Log error details for debugging
      if (!response.ok) {
        console.error(`[creator-proxy] Upstream error: ${response.status}`, responseBody);
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
          JSON.stringify({ error: 'Request timeout - file may be too large' }),
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
