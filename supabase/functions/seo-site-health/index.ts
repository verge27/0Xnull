import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE_URL = 'https://0xnull.io';
const GATEWAY = 'https://connector-gateway.lovable.dev/google_search_console';
const MAX_INSPECTIONS = 12;

const lovableApiKey = () => Deno.env.get('LOVABLE_API_KEY');
const connectionApiKey = () => Deno.env.get('GOOGLE_SEARCH_CONSOLE_API_KEY');

function gatewayHeaders() {
  const l = lovableApiKey();
  const c = connectionApiKey();
  if (!l || !c) throw new Error('Search Console credentials are not configured');
  return { Authorization: `Bearer ${l}`, 'X-Connection-Api-Key': c };
}

function coversTarget(siteUrl: string, target: URL) {
  if (siteUrl.startsWith('sc-domain:')) {
    const domain = siteUrl.slice('sc-domain:'.length).toLowerCase();
    const host = target.hostname.toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
  }
  try {
    return target.href.startsWith(new URL(siteUrl).href);
  } catch {
    return false;
  }
}

/** Resolve the verified Search Console property covering the site. */
async function resolveSiteUrl(selected?: string) {
  const res = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers: gatewayHeaders() });
  if (!res.ok) throw new Error(`Could not list properties [${res.status}]: ${await res.text()}`);
  const { siteEntry = [] } = (await res.json()) as {
    siteEntry?: { siteUrl: string; permissionLevel?: string }[];
  };
  const target = new URL(SITE_URL);
  const matches = siteEntry.filter(
    (e) => e.permissionLevel !== 'siteUnverifiedUser' && coversTarget(e.siteUrl, target),
  );
  if (selected) {
    const hit = matches.find((m) => m.siteUrl === selected);
    if (!hit) throw new Error('The selected Search Console property is not verified for this site');
    return { status: 'selected' as const, siteUrl: hit.siteUrl };
  }
  if (matches.length === 0) throw new Error('No verified Search Console property covers this site');
  if (matches.length === 1) return { status: 'selected' as const, siteUrl: matches[0].siteUrl };
  return { status: 'selection_required' as const, candidates: matches.map((m) => m.siteUrl) };
}

async function searchAnalytics(siteUrl: string, dimensions: string[], days: number, rowLimit: number) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const res = await fetch(
    `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { ...gatewayHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: iso(start), endDate: iso(end), dimensions, rowLimit }),
    },
  );
  if (!res.ok) throw new Error(`Search analytics failed [${res.status}]: ${await res.text()}`);
  const data = await res.json();
  return (data?.rows ?? []) as {
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
}

async function sitemapStatus(siteUrl: string) {
  const res = await fetch(
    `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`,
    { headers: gatewayHeaders() },
  );
  if (!res.ok) throw new Error(`Sitemap listing failed [${res.status}]: ${await res.text()}`);
  const data = await res.json();
  return (data?.sitemap ?? []).map((s: Record<string, unknown>) => ({
    path: s.path,
    lastSubmitted: s.lastSubmitted ?? null,
    lastDownloaded: s.lastDownloaded ?? null,
    isPending: Boolean(s.isPending),
    errors: Number(s.errors ?? 0),
    warnings: Number(s.warnings ?? 0),
    submitted: Number((s.contents as { submitted?: number }[] | undefined)?.[0]?.submitted ?? 0),
  }));
}

async function inspect(siteUrl: string, url: string) {
  const res = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
    method: 'POST',
    headers: { ...gatewayHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: url, siteUrl }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`URL inspection failed for ${url} [${res.status}]: ${body}`);
    return { url, error: `[${res.status}] ${body.slice(0, 300)}` };
  }
  const data = await res.json();
  const r = data?.inspectionResult?.indexStatusResult ?? {};
  return {
    url,
    verdict: r.verdict ?? null,
    coverage_state: r.coverageState ?? null,
    robots_txt_state: r.robotsTxtState ?? null,
    indexing_state: r.indexingState ?? null,
    page_fetch_state: r.pageFetchState ?? null,
    google_canonical: r.googleCanonical ?? null,
    user_canonical: r.userCanonical ?? null,
    last_crawl_time: r.lastCrawlTime ?? null,
    error_message: null as string | null,
  };
}

async function sitemapUrls(): Promise<string[]> {
  try {
    const res = await fetch(`${SITE_URL}/sitemap.xml?ts=${Date.now()}`);
    if (!res.ok) return [];
    const xml = await res.text();
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  } catch (e) {
    console.error('sitemap fetch failed:', e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const { data: userData } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (!user) return json({ error: 'Not authenticated' }, 401);

    const { data: isAdmin, error: roleError } = await admin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });
    if (roleError || !isAdmin) return json({ error: 'Admin access required' }, 403);

    let selectedSiteUrl: string | undefined;
    let deepScan = false;
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      selectedSiteUrl = typeof body?.selectedSiteUrl === 'string' ? body.selectedSiteUrl : undefined;
      deepScan = body?.deepScan === true;
    }

    const resolution = await resolveSiteUrl(selectedSiteUrl);
    if (resolution.status === 'selection_required') return json(resolution, 409);
    const property = resolution.siteUrl;

    const [pages, queries, dates, sitemaps] = await Promise.all([
      searchAnalytics(property, ['page'], 28, 25),
      searchAnalytics(property, ['query'], 28, 25),
      searchAnalytics(property, ['date'], 28, 28),
      sitemapStatus(property),
    ]);

    let inspections: Awaited<ReturnType<typeof inspect>>[] = [];
    if (deepScan) {
      const urls = (await sitemapUrls()).slice(0, MAX_INSPECTIONS);
      for (const url of urls) {
        inspections.push(await inspect(property, url));
      }
      const rows = inspections
        .filter((i) => !('error' in i && i.error))
        .map((i) => ({ ...i }));
      if (rows.length) {
        const { error } = await admin.from('seo_index_snapshots').insert(rows);
        if (error) console.error('snapshot insert failed:', error.message);
      }
    } else {
      const { data } = await admin
        .from('seo_index_snapshots')
        .select('*')
        .order('checked_at', { ascending: false })
        .limit(300);
      const seen = new Set<string>();
      inspections = ((data ?? []) as Record<string, unknown>[]).filter((s) => {
        const u = s.url as string;
        if (seen.has(u)) return false;
        seen.add(u);
        return true;
      }) as never;
    }

    const totals = pages.reduce(
      (acc, r) => {
        acc.clicks += r.clicks;
        acc.impressions += r.impressions;
        return acc;
      },
      { clicks: 0, impressions: 0 },
    );

    return json({
      property,
      totals: {
        ...totals,
        ctr: totals.impressions ? totals.clicks / totals.impressions : 0,
        avgPosition: pages.length
          ? pages.reduce((s, r) => s + r.position * r.impressions, 0) / (totals.impressions || 1)
          : 0,
      },
      pages,
      queries,
      dates,
      sitemaps,
      inspections,
      deepScan,
      checkedAt: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('seo-site-health failed:', message);
    return json({ error: message }, 500);
  }
});
