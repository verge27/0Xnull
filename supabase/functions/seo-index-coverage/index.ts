import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE_URL = 'https://0xnull.io';
const PROPERTY = `${SITE_URL}/`;
const GATEWAY = 'https://connector-gateway.lovable.dev/google_search_console';

// The guides this dashboard tracks.
const TRACKED_URLS = [
  `${SITE_URL}/blog/anonymous-vps-hosting-crypto-guide`,
  `${SITE_URL}/blog/cs2-betting-guide-crypto`,
];

interface InspectionResult {
  verdict?: string;
  coverageState?: string;
  robotsTxtState?: string;
  indexingState?: string;
  pageFetchState?: string;
  googleCanonical?: string;
  userCanonical?: string;
  lastCrawlTime?: string;
}

async function inspectUrl(url: string): Promise<{ result?: InspectionResult; error?: string }> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  const connectionApiKey = Deno.env.get('GOOGLE_SEARCH_CONSOLE_API_KEY');
  if (!lovableApiKey || !connectionApiKey) {
    return { error: 'Search Console credentials are not configured' };
  }

  const res = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': connectionApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: PROPERTY }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`URL inspection failed for ${url} [${res.status}]: ${body}`);
    return { error: `[${res.status}] ${body.slice(0, 500)}` };
  }

  const data = await res.json();
  return { result: data?.inspectionResult?.indexStatusResult ?? {} };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    // --- Auth: caller must be a signed-in admin ---
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const { data: userData } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin, error: roleError } = await admin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });
    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Refresh: take a fresh snapshot of every tracked URL ---
    if (req.method === 'POST') {
      const rows = [];
      for (const url of TRACKED_URLS) {
        const { result, error } = await inspectUrl(url);
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
    }

    // --- History for the tracked URLs ---
    const { data: snapshots, error: readError } = await admin
      .from('seo_index_snapshots')
      .select('*')
      .in('url', TRACKED_URLS)
      .order('checked_at', { ascending: false })
      .limit(200);
    if (readError) throw readError;

    return new Response(JSON.stringify({ tracked: TRACKED_URLS, snapshots: snapshots ?? [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('seo-index-coverage failed:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
