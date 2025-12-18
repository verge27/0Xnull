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
    const softPoolCheck = url.searchParams.get('soft_pool') === '1';
    
    if (!targetPath) {
      return new Response(
        JSON.stringify({ error: 'Missing path parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Soft pool validation mode: never error, just report existence.
    // Prevents upstream 5xx/504s from surfacing as runtime errors in the web app.
    if (softPoolCheck && req.method === 'GET' && targetPath.startsWith('/api/predictions/pool/')) {
      const targetUrl = new URL(`${API_BASE}${targetPath}`);
      // (also forward other query params except 'path' + 'soft_pool')
      url.searchParams.forEach((value, key) => {
        if (key !== 'path' && key !== 'soft_pool') targetUrl.searchParams.set(key, value);
      });

      console.log(`Soft pool check -> ${targetUrl.toString()}`);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);
        const upstreamRes = await fetch(targetUrl.toString(), { method: 'GET', signal: controller.signal });
        clearTimeout(timeoutId);

        if (!upstreamRes.ok) {
          return new Response(JSON.stringify({ exists: false, status: upstreamRes.status }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // For valid pools, return pool info so the caller can reuse it.
        const text = await upstreamRes.text();
        try {
          const pool = JSON.parse(text);
          return new Response(JSON.stringify({ exists: true, pool }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch {
          // Unexpected response format
          return new Response(JSON.stringify({ exists: false, status: upstreamRes.status }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (e) {
        console.error('Soft pool check error:', e);
        return new Response(JSON.stringify({ exists: false, status: 0 }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Build target URL with query params (excluding 'path')
    const targetUrl = new URL(`${API_BASE}${targetPath}`);
    url.searchParams.forEach((value, key) => {
      if (key !== 'path') {
        targetUrl.searchParams.set(key, value);
      }
    });

    // Forward the request
    const fetchOptions: RequestInit = {
      method: req.method,
    };

    // Forward body for POST/PUT requests
    if (req.method === 'POST' || req.method === 'PUT') {
      const contentType = req.headers.get('content-type') || '';
      
      if (contentType.includes('multipart/form-data')) {
        // For file uploads, read the form data and re-create it for the target API
        const formData = await req.formData();
        
        // Log what we're sending
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
        // Don't set Content-Type - let fetch set the correct boundary
      } else {
        // For JSON, parse and forward
        fetchOptions.headers = { 'Content-Type': 'application/json' };
        try {
          const body = await req.text();
          if (body) {
            fetchOptions.body = body;
          }
        } catch {
          // No body
        }
      }
    } else {
      fetchOptions.headers = { 'Content-Type': 'application/json' };
    }

    console.log(`Proxying ${req.method} to: ${targetUrl.toString()}`);

    const response = await fetch(targetUrl.toString(), fetchOptions);
    const responseText = await response.text();
    
    console.log(`Response status: ${response.status}, body preview: ${responseText.substring(0, 200)}`);

    // Ensure we always return valid JSON
    let responseData: string;
    let finalStatus = response.status;
    
    try {
      // Check if it's already valid JSON
      JSON.parse(responseText);
      responseData = responseText;
    } catch {
      // If not JSON, wrap it in a JSON error response
      if (!response.ok) {
        responseData = JSON.stringify({ 
          error: responseText || 'Upstream request failed', 
          status: response.status,
          upstream: true 
        });
        // Return 502 for upstream 5xx errors to distinguish from our own errors
        if (response.status >= 500) {
          finalStatus = 502;
          console.error(`Upstream server error for ${targetPath}: ${response.status} - ${responseText}`);
        }
      } else {
        responseData = JSON.stringify({ data: responseText });
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
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Proxy error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
