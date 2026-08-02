import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE_URL = 'https://0xnull.io';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const GATEWAY = 'https://connector-gateway.lovable.dev/google_search_console';

// URLs re-inspected after every deploy.
const TRACKED_URLS = [
  `${SITE_URL}/blog/anonymous-vps-hosting-crypto-guide`,
  `${SITE_URL}/blog/cs2-betting-guide-crypto`,
];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function sha256(input: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Fingerprint of the currently deployed frontend: hashed asset filenames + served sitemap URLs. */
async function readDeployFingerprint() {
  const cb = Date.now();
  const [htmlRes, sitemapRes] = await Promise.all([
    fetch(`${SITE_URL}/?cb=${cb}`, { headers: { 'Cache-Control': 'no-cache' } }),
    fetch(`${SITEMAP_URL}?cb=${cb}`, { headers: { 'Cache-Control': 'no-cache' } }),
  ]);

  const html = htmlRes.ok ? await htmlRes.text() : '';
  const sitemapXml = sitemapRes.ok ? await sitemapRes.text() : '';

  const assets = [...html.matchAll(/\/assets\/[A-Za-z0-9._-]+\.(?:js|css)/g)].map((m) => m[0]).sort();
  const servedUrls = [...sitemapXml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]).sort();

  return {
    fingerprint: await sha256(`${assets.join('|')}::${servedUrls.join('|')}`),
    asset_count: assets.length,
    served_sitemap_count: servedUrls.length,
  };
}

function gscHeaders() {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  const connectionApiKey = Deno.env.get('GOOGLE_SEARCH_CONSOLE_API_KEY');
  if (!lovableApiKey || !connectionApiKey) return null;
  return {
    Authorization: `Bearer ${lovableApiKey}`,
    'X-Connection-Api-Key': connectionApiKey,
  } as Record<string, string>;
}

/** Resolve the single verified Search Console property covering this site. */
async function resolveProperty(headers: Record<string, string>) {
  const res = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Could not list Search Console properties [${res.status}]: ${body.slice(0, 400)}`);
  }
  const { siteEntry = [] } = (await res.json()) as { siteEntry?: { siteUrl: string; permissionLevel?: string }[] };
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
    throw new Error(`Expected exactly one verified property, found ${matches.length}`);
  }
  return matches[0].siteUrl;
}

async function inspectUrl(headers: Record<string, string>, property: string, url: string) {
  const res = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: property }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`URL inspection failed for ${url} [${res.status}]: ${body}`);
    return { error: `[${res.status}] ${body.slice(0, 400)}` };
  }
  const data = await res.json();
  return { result: data?.inspectionResult?.indexStatusResult ?? {} };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  try {
    // --- Auth: cron secret (scheduled runs) or an admin JWT (manual runs) ---
    const cronSecret = Deno.env.get('CRON_SECRET');
    const providedSecret = req.headers.get('x-cron-secret');
    let isCron = false;
    if (cronSecret && providedSecret && providedSecret === cronSecret) {
      isCron = true;
    } else {
      const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
      const { data: userData } = await admin.auth.getUser(token);
      const user = userData?.user;
      if (!user) return json({ error: 'Not authenticated' }, 401);
      const { data: isAdmin, error: roleError } = await admin.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });
      if (roleError || !isAdmin) return json({ error: 'Admin access required' }, 403);
    }

    let force = false;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        force = body?.force === true;
      } catch {
        // no body is fine
      }
    }

    // --- Detect whether a new deploy is live ---
    const current = await readDeployFingerprint();
    const { data: previous } = await admin
      .from('seo_deploy_checks')
      .select('deploy_fingerprint, checked_at')
      .order('checked_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const isNewDeploy = previous?.deploy_fingerprint !== current.fingerprint;
    if (!isNewDeploy && !force) {
      return json({
        status: 'skipped',
        reason: 'no_new_deploy',
        deploy_fingerprint: current.fingerprint,
        last_checked_at: previous?.checked_at ?? null,
        ...current,
      });
    }

    const headers = gscHeaders();
    if (!headers) {
      return json({ error: 'Search Console credentials are not configured' }, 500);
    }
    const property = await resolveProperty(headers);

    // --- 1. Resubmit the sitemap so Google refetches the new URL set ---
    const sitemapPath = `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(property)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`;
    const submitRes = await fetch(sitemapPath, { method: 'PUT', headers });
    const sitemapSubmitted = submitRes.ok;
    if (!submitRes.ok) {
      console.error(`Sitemap resubmission failed [${submitRes.status}]: ${await submitRes.text()}`);
    }

    // --- 2. Read back the sitemap's Search Console status ---
    let sitemapStatus: Record<string, unknown> | null = null;
    const statusRes = await fetch(sitemapPath, { headers });
    if (statusRes.ok) {
      const s = await statusRes.json();
      sitemapStatus = {
        last_submitted: s?.lastSubmitted ?? null,
        last_downloaded: s?.lastDownloaded ?? null,
        is_pending: s?.isPending ?? null,
        warnings: s?.warnings ?? null,
        errors: s?.errors ?? null,
        submitted_urls: s?.contents?.[0]?.submitted ?? null,
        indexed_urls: s?.contents?.[0]?.indexed ?? null,
      };
    } else {
      console.error(`Sitemap status read failed [${statusRes.status}]: ${await statusRes.text()}`);
    }

    // --- 3. Re-inspect the tracked guide URLs ---
    const rows = [];
    const summary: Record<string, string | null> = {};
    for (const url of TRACKED_URLS) {
      const { result, error } = await inspectUrl(headers, property, url);
      summary[url] = error ? `error: ${error}` : (result?.verdict ?? null);
      rows.push({
        url,
        verdict: result?.verdict ?? null,
        coverage_state: result?.coverageState ?? null,
        robots_txt_state: result?.robotsTxtState ?? null,
        indexing_state: result?.indexingState ?? null,
        page_fetch_state: result?.pageFetchState ?? null,
        google_canonical: result?.googleCanonical ?? null,
        user_canonical: result?.userCanonical ?? null,
        last_crawl_time: result?.lastCrawlTime ?? null,
        error_message: error ?? null,
      });
    }
    const { error: insertError } = await admin.from('seo_index_snapshots').insert(rows);
    if (insertError) throw insertError;

    const { error: checkError } = await admin.from('seo_deploy_checks').insert({
      deploy_fingerprint: current.fingerprint,
      asset_count: current.asset_count,
      served_sitemap_count: current.served_sitemap_count,
      triggered_by: isCron ? 'cron' : 'admin',
      forced: force,
      sitemap_submitted: sitemapSubmitted,
      sitemap_status: sitemapStatus,
      inspection_summary: summary,
    });
    if (checkError) throw checkError;

    console.log(
      `Post-deploy recheck done: fingerprint=${current.fingerprint.slice(0, 12)} sitemap_submitted=${sitemapSubmitted}`,
    );

    return json({
      status: 'checked',
      new_deploy: isNewDeploy,
      forced: force,
      property,
      deploy_fingerprint: current.fingerprint,
      ...current,
      sitemap_submitted: sitemapSubmitted,
      sitemap_status: sitemapStatus,
      inspections: rows,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('seo-deploy-recheck failed:', message);
    return json({ error: message }, 500);
  }
});
