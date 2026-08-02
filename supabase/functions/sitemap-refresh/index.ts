import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SITE_URL = 'https://0xnull.io';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const GATEWAY = 'https://connector-gateway.lovable.dev/google_search_console';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const result: Record<string, unknown> = { sitemap: SITEMAP_URL };

  try {
    // 1. Regenerate the dynamic sitemap so its cached output reflects the newest posts.
    const projectUrl = Deno.env.get('SUPABASE_URL');
    if (projectUrl) {
      try {
        const res = await fetch(`${projectUrl}/functions/v1/sitemap`, {
          headers: { apikey: Deno.env.get('SUPABASE_ANON_KEY') ?? '' },
        });
        const xml = await res.text();
        result.dynamic_status = res.status;
        result.dynamic_url_count = (xml.match(/<url>/g) ?? []).length;
      } catch (e) {
        console.error('Dynamic sitemap regeneration failed:', e);
        result.dynamic_error = e instanceof Error ? e.message : String(e);
      }
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
    const sitesRes = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers });
    if (!sitesRes.ok) {
      const body = await sitesRes.text();
      console.error(`Listing Search Console properties failed [${sitesRes.status}]: ${body}`);
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
    const submitRes = await fetch(
      `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`,
      { method: 'PUT', headers },
    );

    if (!submitRes.ok) {
      const body = await submitRes.text();
      console.error(`Sitemap submission failed [${submitRes.status}]: ${body}`);
      return new Response(
        JSON.stringify({ ...result, error: 'Sitemap submission failed', status: submitRes.status, details: body }),
        { status: submitRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`Sitemap resubmitted to Search Console for ${siteUrl}`);
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
