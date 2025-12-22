import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const API_BASE = 'https://api.0xnull.io';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetPath = url.searchParams.get('path');

    if (!targetPath) {
      return new Response(JSON.stringify({ error: 'Missing path parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pool endpoints can run in "soft" mode (soft_pool=1) to avoid upstream 5xx/504s bubbling to the client.
    // When soft_pool=1, always returns HTTP 200 with { exists: boolean, pool?: object, status?: number }
    if (
      req.method === 'GET' &&
      targetPath.startsWith('/api/predictions/pool/') &&
      url.searchParams.get('soft_pool') === '1'
    ) {
      const targetUrl = new URL(`${API_BASE}${targetPath}`);
      url.searchParams.forEach((value, key) => {
        if (key !== 'path' && key !== 'soft_pool') targetUrl.searchParams.set(key, value);
      });

      console.log(`Pool check (soft mode) -> ${targetUrl.toString()}`);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const upstreamRes = await fetch(targetUrl.toString(), { method: 'GET', signal: controller.signal });
        clearTimeout(timeoutId);

        if (!upstreamRes.ok) {
          console.log(`Pool check failed: ${upstreamRes.status}`);
          return new Response(JSON.stringify({ exists: false, status: upstreamRes.status }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const text = await upstreamRes.text();
        try {
          const pool = JSON.parse(text);
          return new Response(JSON.stringify({ exists: true, pool }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch {
          console.log('Pool check: unexpected response format');
          return new Response(JSON.stringify({ exists: false, status: upstreamRes.status }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (e) {
        console.log(`Pool check error: ${e instanceof Error ? e.message : 'unknown'}`);
        return new Response(JSON.stringify({ exists: false, status: 0, error: 'timeout' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Build target URL with query params (excluding 'path' and 'soft_pool')
    const targetUrl = new URL(`${API_BASE}${targetPath}`);
    url.searchParams.forEach((value, key) => {
      if (key !== 'path' && key !== 'soft_pool') {
        targetUrl.searchParams.set(key, value);
      }
    });

    const fetchOptions: RequestInit = { method: req.method };

    if (req.method === 'POST' || req.method === 'PUT') {
      const contentType = req.headers.get('content-type') || '';

      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();

        const entries: string[] = [];
        formData.forEach((value, key) => {
          if (value instanceof File) {
            entries.push(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
          } else {
            entries.push(`${key}: ${String(value).substring(0, 100)}`);
          }
        });
        console.log(`FormData entries: ${entries.join(', ')}`);

        fetchOptions.body = formData;
      } else {
        fetchOptions.headers = { 'Content-Type': 'application/json' };
        try {
          const body = await req.text();
          if (body) fetchOptions.body = body;
        } catch {
          // no body
        }
      }
    } else {
      fetchOptions.headers = { 'Content-Type': 'application/json' };
    }

    console.log(`Proxying ${req.method} to: ${targetUrl.toString()}`);

    // Use longer timeout for wallet/bet creation operations (can be slow)
    const isBetRequest = targetPath.includes('/api/predictions/bet');
    const isMultibetRequest = targetPath.includes('/api/multibets');
    const isWalletRequest = targetPath.includes('/api/token');
    const isSlowRequest = isBetRequest || isMultibetRequest || isWalletRequest;
    const timeoutMs = isSlowRequest ? 90000 : 30000; // 90s for slow requests, 30s for others
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    let response: Response;
    try {
      response = await fetch(targetUrl.toString(), { ...fetchOptions, signal: controller.signal });
    } catch (e) {
      clearTimeout(timeoutId);
      if (e instanceof Error && e.name === 'AbortError') {
        console.error(`Request timeout after ${timeoutMs}ms for ${targetPath}`);
        let errorMessage = 'Request timed out. Please try again.';
        if (isBetRequest) {
          errorMessage = 'Bet placement is taking longer than expected. The backend may be creating your wallet. Please try again in a moment.';
        } else if (isMultibetRequest) {
          errorMessage = 'Multibet creation is taking longer than expected. Please try again in a moment.';
        }
        return new Response(JSON.stringify({ 
          error: errorMessage,
          timeout: true 
        }), {
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw e;
    }
    clearTimeout(timeoutId);
    
    const responseText = await response.text();

    console.log(`Response status: ${response.status}, body preview: ${responseText.substring(0, 200)}`);

    // Ensure we always return valid JSON
    let responseData: string;
    let finalStatus = response.status;

    // Check if response looks like HTML error page (502, 503, etc from nginx/upstream)
    const isHtmlError = responseText.trim().startsWith('<') || responseText.includes('<!DOCTYPE') || responseText.includes('<html');

    if (isHtmlError) {
      // Convert HTML error pages to clean JSON
      console.error(`Upstream returned HTML error for ${targetPath}: ${response.status}`);
      responseData = JSON.stringify({
        error: 'The prediction service is temporarily unavailable. Please try again in a moment.',
        status: response.status,
        upstream: true,
        retry: true,
      });
      finalStatus = response.status >= 500 ? 503 : response.status;
    } else {
      try {
        const parsed = JSON.parse(responseText);
        
        // Handle "already exists" as a soft success (200) to prevent frontend errors
        if (response.status === 400 && parsed?.detail?.includes('already exists')) {
          console.log('Market already exists - returning soft success');
          responseData = JSON.stringify({ already_exists: true, detail: parsed.detail });
          finalStatus = 200;
        } else if (response.status === 400 && parsed?.detail === 'Betting has closed for this market') {
          // Betting closed - return structured error
          responseData = JSON.stringify({ 
            error: 'Betting has closed for this market',
            betting_closed: true,
            status: 400 
          });
          finalStatus = 400;
        } else {
          responseData = responseText;
        }
      } catch {
        if (!response.ok) {
          responseData = JSON.stringify({
            error: responseText || 'Upstream request failed',
            status: response.status,
            upstream: true,
          });
          if (response.status >= 500) {
            finalStatus = 502;
            console.error(`Upstream server error for ${targetPath}: ${response.status} - ${responseText}`);
          }
        } else {
          responseData = JSON.stringify({ data: responseText });
        }
      }
    }

    return new Response(responseData, {
      status: finalStatus,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Proxy error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
