import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SITE_URL = 'https://0xnull.io';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

function extractUrls(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const projectUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    if (!projectUrl) return json({ error: 'Backend URL unavailable' }, 500);

    const cacheBuster = Date.now();

    const [generatedRes, servedRes] = await Promise.allSettled([
      fetch(`${projectUrl}/functions/v1/sitemap`, { headers: { apikey: anonKey } }),
      fetch(`${SITEMAP_URL}?cb=${cacheBuster}`, { headers: { 'Cache-Control': 'no-cache' } }),
    ]);

    if (generatedRes.status === 'rejected' || !generatedRes.value.ok) {
      const detail =
        generatedRes.status === 'rejected'
          ? String(generatedRes.reason)
          : `status ${generatedRes.value.status}`;
      console.error(`Generated sitemap unavailable: ${detail}`);
      return json({ error: 'Could not fetch the generated sitemap', details: detail }, 502);
    }

    if (servedRes.status === 'rejected' || !servedRes.value.ok) {
      const detail =
        servedRes.status === 'rejected' ? String(servedRes.reason) : `status ${servedRes.value.status}`;
      console.error(`Served sitemap unavailable: ${detail}`);
      return json({ error: 'Could not fetch the served sitemap.xml', details: detail }, 502);
    }

    const generatedUrls = extractUrls(await generatedRes.value.text());
    const servedUrls = extractUrls(await servedRes.value.text());

    const servedSet = new Set(servedUrls);
    const generatedSet = new Set(generatedUrls);

    const missingFromServed = generatedUrls.filter((u) => !servedSet.has(u));
    const staleInServed = servedUrls.filter((u) => !generatedSet.has(u));
    const isStale = missingFromServed.length > 0 || staleInServed.length > 0;

    if (isStale) {
      console.warn(
        `Sitemap drift: generated=${generatedUrls.length} served=${servedUrls.length} missing=${missingFromServed.length} stale=${staleInServed.length}`,
      );
    }

    return json({
      checked_at: new Date().toISOString(),
      sitemap_url: SITEMAP_URL,
      generated_count: generatedUrls.length,
      served_count: servedUrls.length,
      is_stale: isStale,
      missing_from_served: missingFromServed.slice(0, 50),
      stale_in_served: staleInServed.slice(0, 50),
    });
  } catch (error) {
    console.error('sitemap-freshness error:', error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
