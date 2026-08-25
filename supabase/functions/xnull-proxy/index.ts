import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-0xnull-token, x-txn-token, idempotency-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const API_BASE = 'https://api.0xnull.io';

// Only these upstream path prefixes may be reached through this proxy.
const ALLOWED_PATH_PREFIXES = [
  '/api/predictions',
  '/api/multibets',
  '/api/lending',
  '/api/token',
  '/api/sports',
  '/api/esports',
  '/api/cricket',
  '/api/slap',
  '/api/russian-mma',
  '/api/tapology',
  '/api/flash',
  '/api/swap',
  '/api/vouchers',
  '/api/voice',
  '/api/3ds',
];

const ALLOWED_METHODS = ['GET', 'POST', 'PUT'];

// The upstream API sometimes sends a Content-Length that far exceeds the bytes it
// actually writes, so Deno aborts with "error reading a body from connection".
// Read the stream manually and keep whatever arrived: if it parses as JSON it is complete.
// Salvage a JSON payload that was cut off mid-stream by trimming back to the last
// complete element and closing any brackets that were still open there.
function repairTruncatedJson(text: string): string | null {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let safeIndex = -1;
  let safeStack: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{' || ch === '[') { stack.push(ch === '{' ? '}' : ']'); continue; }
    if (ch === '}' || ch === ']') {
      stack.pop();
      if (stack.length > 0) {
        safeIndex = i + 1;
        safeStack = [...stack];
      }
    }
  }

  if (safeIndex <= 0) return null;
  const closing = [...safeStack].reverse().join('');
  const candidate = text.slice(0, safeIndex) + closing;
  try {
    JSON.parse(candidate);
    return candidate;
  } catch {
    return null;
  }
}

async function readBodyTolerant(res: Response): Promise<string> {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        total += value.byteLength;
      }
    }
  } catch (e) {
    truncated = true;
    console.warn(`[xnull-proxy] Upstream stream ended early after ${total} bytes: ${e instanceof Error ? e.message : String(e)}`);
  }
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    buf.set(c, offset);
    offset += c.byteLength;
  }
  const text = new TextDecoder().decode(buf);
  if (truncated) {
    try {
      JSON.parse(text);
    } catch {
      const repaired = repairTruncatedJson(text);
      if (repaired) {
        console.warn('[xnull-proxy] Recovered a truncated JSON payload from upstream');
        return repaired;
      }
      throw new Error('Upstream connection closed before a complete response was received');
    }
  }
  return text;
}

const isAllowedPath = (path: string): boolean => {
  if (!path.startsWith('/api/')) return false;
  if (path.includes('..')) return false;
  return ALLOWED_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`)
  );
};

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

    if (!ALLOWED_METHODS.includes(req.method)) {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isAllowedPath(targetPath)) {
      console.warn(`Blocked disallowed proxy path: ${targetPath}`);
      return new Response(JSON.stringify({ error: 'Path not allowed' }), {
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

        const text = await readBodyTolerant(upstreamRes);
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

    // NOTE: /api/esports/result/ and /api/sports/result/ endpoints do NOT exist on the 0xNull backend.
    // Resolution happens server-side via cron (POST /api/predictions/resolve-due).
    // Frontend should poll /api/predictions/pool/{market_id} to check if a market is resolved.
    // Removed soft-mode handling for these non-existent endpoints.

    // Enrich payouts with pool info to detect unopposed bets
    if (req.method === 'GET' && targetPath === '/api/predictions/payouts') {
      console.log('Fetching payouts with pool enrichment...');
      
      try {
        const payoutsRes = await fetch(`${API_BASE}${targetPath}`, { method: 'GET' });
        if (!payoutsRes.ok) {
          const errorText = await payoutsRes.text();
          return new Response(JSON.stringify({ error: errorText }), {
            status: payoutsRes.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const payoutsData = await payoutsRes.json();
        const payouts = payoutsData.payouts || [];
        
        // Collect unique market IDs (skip multibets)
        const marketIds = [...new Set(
          payouts
            .filter((p: { market_id: string }) => p.market_id && p.market_id !== 'multibet')
            .map((p: { market_id: string }) => p.market_id)
        )] as string[];
        
        // Fetch pool info for each market (in parallel, with timeout)
        const poolCache: Record<string, { yes_pool_xmr: number; no_pool_xmr: number } | null> = {};
        
        await Promise.all(
          marketIds.map(async (marketId) => {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000);
              const poolRes = await fetch(`${API_BASE}/api/predictions/pool/${marketId}`, { 
                signal: controller.signal 
              });
              clearTimeout(timeoutId);
              
              if (poolRes.ok) {
                const pool = await poolRes.json();
                poolCache[marketId] = {
                  yes_pool_xmr: pool.yes_pool_xmr ?? 0,
                  no_pool_xmr: pool.no_pool_xmr ?? 0,
                };
              } else {
                poolCache[marketId] = null;
              }
            } catch {
              poolCache[marketId] = null;
            }
          })
        );
        
        // Enrich payouts with unopposed detection
        const enrichedPayouts = payouts.map((payout: { 
          market_id: string; 
          side: string; 
          stake_xmr: number;
          payout_xmr: number;
          payout_type?: string;
        }) => {
          const pool = poolCache[payout.market_id];
          
          if (pool) {
            const opposingPool = payout.side === 'YES' ? pool.no_pool_xmr : pool.yes_pool_xmr;
            const wasUnopposed = opposingPool === 0;
            
            // If it was unopposed AND payout equals stake, mark as refund
            // Also mark as refund if unopposed regardless (they should have been refunded)
            if (wasUnopposed) {
              return {
                ...payout,
                was_unopposed: true,
                yes_pool_xmr: pool.yes_pool_xmr,
                no_pool_xmr: pool.no_pool_xmr,
                // Override payout_type to refund if it was unopposed
                payout_type: 'refund_one_sided',
              };
            }
            
            return {
              ...payout,
              was_unopposed: false,
              yes_pool_xmr: pool.yes_pool_xmr,
              no_pool_xmr: pool.no_pool_xmr,
            };
          }
          
          return payout;
        });
        
        console.log(`Enriched ${enrichedPayouts.length} payouts with pool info`);
        
        return new Response(JSON.stringify({ 
          payouts: enrichedPayouts, 
          total: payoutsData.total || enrichedPayouts.length 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        console.error('Payouts enrichment error:', e);
        // Fall through to regular proxy on error
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

    // Forward X-0xNull-Token header for lending auth
    const oxnullToken = req.headers.get('x-0xnull-token');
    // Prediction v2 credentials stay in headers so they never enter URLs or logs.
    const txnToken = req.headers.get('x-txn-token');
    const idempotencyKey = req.headers.get('idempotency-key');

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
        const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (oxnullToken) reqHeaders['X-0xNull-Token'] = oxnullToken;
      if (txnToken) reqHeaders['X-TXN-Token'] = txnToken;
      if (idempotencyKey) reqHeaders['Idempotency-Key'] = idempotencyKey;
        if (txnToken) reqHeaders['X-TXN-Token'] = txnToken;
        if (idempotencyKey) reqHeaders['Idempotency-Key'] = idempotencyKey;
        fetchOptions.headers = reqHeaders;
        try {
          const body = await req.text();
          if (body) fetchOptions.body = body;
        } catch {
          // no body
        }
      }
    } else {
      const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (oxnullToken) reqHeaders['X-0xNull-Token'] = oxnullToken;
      fetchOptions.headers = reqHeaders;
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
    
    const serviceLabel = targetPath.startsWith('/api/lending') ? 'lending' : 'prediction';
    const unavailableResponse = (reason: string) => {
      console.error(`[xnull-proxy] Upstream unavailable for ${targetPath}: ${reason}`);
      return new Response(JSON.stringify({
        error: `The ${serviceLabel} service is temporarily unavailable. Please try again in a moment.`,
        status: 503,
        upstream: true,
        retry: true,
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    };

    // Transient upstream hiccups on idempotent reads: retry twice with a short backoff
    const upstreamAttempts = req.method === 'GET' ? 3 : 1;
    let response: Response;
    try {
      let lastErr: unknown = null;
      let ok = false;
      response = undefined as unknown as Response;
      for (let attempt = 1; attempt <= upstreamAttempts; attempt++) {
        try {
          response = await fetch(targetUrl.toString(), { ...fetchOptions, signal: controller.signal });
          if (response.status >= 500 && attempt < upstreamAttempts) {
            console.warn(`[xnull-proxy] Upstream ${response.status} on ${targetPath}, retry ${attempt}/${upstreamAttempts}`);
            await new Promise((r) => setTimeout(r, 400 * attempt));
            continue;
          }
          ok = true;
          break;
        } catch (err) {
          lastErr = err;
          if (err instanceof Error && err.name === 'AbortError') throw err;
          if (attempt >= upstreamAttempts) throw err;
          console.warn(`[xnull-proxy] Upstream fetch failed on ${targetPath}, retry ${attempt}/${upstreamAttempts}`);
          await new Promise((r) => setTimeout(r, 400 * attempt));
        }
      }
      if (!ok && !response) throw lastErr instanceof Error ? lastErr : new Error('Upstream fetch failed');
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
      // Transient upstream connection failures -> clean JSON envelope, not a 500
      return unavailableResponse(e instanceof Error ? e.message : String(e));
    }
    clearTimeout(timeoutId);

    let responseText: string;
    try {
      responseText = await readBodyTolerant(response);
    } catch (e) {
      // Upstream dropped the connection mid-body
      return unavailableResponse(e instanceof Error ? e.message : String(e));
    }

    console.log(`Response status: ${response.status}, body preview: ${responseText.substring(0, 200)}`);

    // Ensure we always return valid JSON
    let responseData: string;
    let finalStatus = response.status;

    // Check if response looks like HTML error page (502, 503, etc from nginx/upstream)
    const isHtmlError = responseText.trim().startsWith('<') || responseText.includes('<!DOCTYPE') || responseText.includes('<html');

    if (isHtmlError) {
      // Convert HTML error pages to clean JSON
      console.error(`Upstream returned HTML error for ${targetPath}: ${response.status}`);
      const serviceName = targetPath.startsWith('/api/lending') ? 'lending' : 'prediction';
      responseData = JSON.stringify({
        error: `The ${serviceName} service is temporarily unavailable. Please try again in a moment.`,
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
