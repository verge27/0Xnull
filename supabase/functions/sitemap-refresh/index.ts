import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SITE_URL = 'https://0xnull.io';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const GATEWAY = 'https://connector-gateway.lovable.dev/google_search_console';

// Throttle: at most one Search Console resubmission every 5 minutes.
const THROTTLE_MS = 5 * 60 * 1000;
let lastRun = 0;

// Retry policy: exponential backoff with jitter for transient failures.
const MAX_ATTEMPTS = 4; // 1 initial try + 3 retries
const BASE_DELAY_MS = 500; // 500ms -> 1s -> 2s (+ jitter)
const MAX_DELAY_MS = 8000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function backoffDelay(attempt: number) {
  const exponential = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS);
  // Full jitter avoids synchronized retries when several publishes fire at once.
  return Math.round(exponential / 2 + Math.random() * (exponential / 2));
}

/** Transient: network failures, rate limits and server-side errors. */
function isRetryableStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

type FetchAttempt = { response: Response; attempts: number };

/**
 * fetch() with exponential backoff. Retries on network errors and retryable
 * HTTP statuses. Returns the final response (even if not ok) or throws the
 * last network error after exhausting attempts.
 */
async function fetchWithRetry(
  label: string,
  input: string,
  init: RequestInit = {},
  timeoutMs = 15000,
): Promise<FetchAttempt> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(timer);

      if (!isRetryableStatus(response.status) || attempt === MAX_ATTEMPTS) {
        if (attempt > 1) console.log(`${label}: succeeded on attempt ${attempt} (status ${response.status})`);
        return { response, attempts: attempt };
      }

      const body = await response.text().catch(() => '');
      const delay = backoffDelay(attempt);
      console.warn(
        `${label}: retryable status ${response.status} on attempt ${attempt}/${MAX_ATTEMPTS}, retrying in ${delay}ms. Body: ${body.slice(0, 300)}`,
      );
      await sleep(delay);
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt === MAX_ATTEMPTS) break;
      const delay = backoffDelay(attempt);
      console.warn(
        `${label}: network error on attempt ${attempt}/${MAX_ATTEMPTS} (${error instanceof Error ? error.message : String(error)}), retrying in ${delay}ms`,
      );
      await sleep(delay);
    }
  }

  throw new Error(
    `${label} failed after ${MAX_ATTEMPTS} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const now = Date.now();
  if (now - lastRun < THROTTLE_MS) {
    return new Response(
      JSON.stringify({ sitemap: SITEMAP_URL, search_console: 'throttled', retry_in_ms: THROTTLE_MS - (now - lastRun) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
  lastRun = now;

  const result: Record<string, unknown> = { sitemap: SITEMAP_URL };

  try {
    // 1. Regenerate the dynamic sitemap so its cached output reflects the newest posts.
    const projectUrl = Deno.env.get('SUPABASE_URL');
    let dynamicCount = 0;
    if (projectUrl) {
      try {
        const { response: res, attempts } = await fetchWithRetry(
          'dynamic sitemap regeneration',
          `${projectUrl}/functions/v1/sitemap`,
          { headers: { apikey: Deno.env.get('SUPABASE_ANON_KEY') ?? '' } },
        );
        const xml = await res.text();
        dynamicCount = (xml.match(/<url>/g) ?? []).length;
        result.dynamic_status = res.status;
        result.dynamic_url_count = dynamicCount;
        result.dynamic_attempts = attempts;
      } catch (e) {
        console.error('Dynamic sitemap regeneration failed:', e);
        result.dynamic_error = e instanceof Error ? e.message : String(e);
      }
    }

    // 1b. Compare against the deployed static file so we can flag a stale deploy.
    try {
      const { response: liveRes, attempts } = await fetchWithRetry(
        'live sitemap check',
        `${SITEMAP_URL}?cb=${now}`,
        { headers: { 'Cache-Control': 'no-cache' } },
      );
      const liveXml = await liveRes.text();
      const liveCount = (liveXml.match(/<url>/g) ?? []).length;
      result.live_url_count = liveCount;
      result.live_attempts = attempts;
      result.static_stale = dynamicCount > 0 && liveCount !== dynamicCount;
    } catch (e) {
      console.error('Live sitemap check failed:', e);
      result.live_error = e instanceof Error ? e.message : String(e);
    }

    // 2. Tell Search Console to refetch the sitemap.
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const gscKey = Deno.env.get('GOOGLE_SEARCH_CONSOLE_API_KEY');

    if (!lovableApiKey || !gscKey) {
      console.warn('Search Console credentials missing; skipped resubmission');
      result.search_console = 'skipped_missing_credentials';
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const headers = {
      Authorization: `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': gscKey,
    };

    // Resolve the verified property covering the site.
    const { response: sitesRes, attempts: siteAttempts } = await fetchWithRetry(
      'Search Console property listing',
      `${GATEWAY}/webmasters/v3/sites`,
      { headers },
    );
    result.sites_attempts = siteAttempts;

    if (!sitesRes.ok) {
      const body = await sitesRes.text();
      console.error(`Listing Search Console properties failed [${sitesRes.status}] after ${siteAttempts} attempts: ${body}`);
      return new Response(
        JSON.stringify({ ...result, error: 'Could not list Search Console properties', status: sitesRes.status, details: body }),
        { status: sitesRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { siteEntry = [] } = (await sitesRes.json()) as {
      siteEntry?: { siteUrl: string; permissionLevel?: string }[];
    };
    const host = new URL(SITE_URL).hostname.toLowerCase();
    const matches = siteEntry.filter((entry) => {
      if (entry.permissionLevel === 'siteUnverifiedUser') return false;
      if (entry.siteUrl.startsWith('sc-domain:')) {
        const domain = entry.siteUrl.slice('sc-domain:'.length).toLowerCase();
        return host === domain || host.endsWith(`.${domain}`);
      }
      try {
        return `${SITE_URL}/`.startsWith(new URL(entry.siteUrl).href);
      } catch {
        return false;
      }
    });

    if (matches.length !== 1) {
      console.warn(`Expected exactly one verified property, found ${matches.length}`);
      result.search_console = matches.length === 0 ? 'no_verified_property' : 'multiple_properties';
      result.candidates = matches.map((m) => m.siteUrl);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const siteUrl = matches[0].siteUrl;
    const { response: submitRes, attempts: submitAttempts } = await fetchWithRetry(
      'Search Console sitemap submission',
      `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`,
      { method: 'PUT', headers },
    );
    result.submit_attempts = submitAttempts;

    if (!submitRes.ok) {
      const body = await submitRes.text();
      console.error(`Sitemap submission failed [${submitRes.status}] after ${submitAttempts} attempts: ${body}`);
      return new Response(
        JSON.stringify({ ...result, error: 'Sitemap submission failed', status: submitRes.status, details: body }),
        { status: submitRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`Sitemap resubmitted to Search Console for ${siteUrl} (attempts: ${submitAttempts})`);
    result.search_console = 'submitted';
    result.property = siteUrl;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('sitemap-refresh error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
