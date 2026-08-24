import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const JSON_HEADERS = {
  ...corsHeaders,
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=120, s-maxage=300',
};

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;
const PAY_TYPES = ['hourly', 'fixed', 'unknown'];
const SORTS = ['newest', 'pay_desc', 'pay_asc'];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), { status, headers: JSON_HEADERS });
}

function bad(message: string) {
  return json({ error: 'invalid_request', message }, 400);
}

function intParam(raw: string | null, fallback: number, min: number, max: number) {
  if (raw === null || raw === '') return { value: fallback };
  if (!/^\d+$/.test(raw)) return { error: true };
  const n = Number(raw);
  if (n < min || n > max) return { error: true };
  return { value: n };
}

interface JobRow {
  id: string;
  source_id: string;
  title: string;
  body: string;
  url: string;
  pay_xmr: number | null;
  pay_type: string;
  tags: string[];
  posted_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  sources?: { name: string; url: string } | null;
}


serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (req.method !== 'GET') {
    return json({ error: 'method_not_allowed', message: 'Use GET.' }, 405);
  }

  const url = new URL(req.url);
  // Path after the function name, e.g. /jobs-api/sources -> "sources"
  const segments = url.pathname.split('/').filter(Boolean);
  const fnIndex = segments.indexOf('jobs-api');
  const route = (fnIndex >= 0 ? segments.slice(fnIndex + 1) : segments).join('/');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  try {
    if (route === '' || route === 'jobs') {
      const params = url.searchParams;

      const q = (params.get('q') ?? '').trim().slice(0, 120);
      const tag = (params.get('tag') ?? '').trim().toLowerCase().slice(0, 40);
      const source = (params.get('source') ?? '').trim().slice(0, 60);
      const payType = (params.get('pay_type') ?? '').trim().toLowerCase();
      const sort = (params.get('sort') ?? 'newest').trim().toLowerCase();
      const since = (params.get('since') ?? '').trim();

      if (payType && !PAY_TYPES.includes(payType)) {
        return bad(`pay_type must be one of ${PAY_TYPES.join(', ')}.`);
      }
      if (!SORTS.includes(sort)) {
        return bad(`sort must be one of ${SORTS.join(', ')}.`);
      }
      if (tag && !/^[a-z0-9+#.-]+$/.test(tag)) {
        return bad('tag may only contain letters, numbers and - + # characters.');
      }
      if (source && !/^[a-z0-9-]+$/.test(source)) {
        return bad('source must be a source id such as monero-jobs.');
      }
      let sinceIso: string | null = null;
      if (since) {
        const parsed = new Date(since);
        if (Number.isNaN(parsed.getTime())) return bad('since must be an ISO 8601 timestamp.');
        sinceIso = parsed.toISOString();
      }

      const limitParam = intParam(params.get('limit'), DEFAULT_LIMIT, 1, MAX_LIMIT);
      if ('error' in limitParam) return bad(`limit must be an integer between 1 and ${MAX_LIMIT}.`);
      const offsetParam = intParam(params.get('offset'), 0, 0, 10_000);
      if ('error' in offsetParam) return bad('offset must be an integer between 0 and 10000.');
      const limit = limitParam.value!;
      const offset = offsetParam.value!;

      let query = supabase
        .from('jobs')
        .select(
          'id, source_id, title, body, url, pay_xmr, pay_type, tags, posted_at, first_seen_at, last_seen_at, sources(name, url)',
          { count: 'exact' },
        )
        .eq('hidden', false);


      if (q) {
        const escaped = q.replace(/[%,()]/g, ' ').trim();
        if (escaped) query = query.or(`title.ilike.%${escaped}%,body.ilike.%${escaped}%`);
      }
      if (tag) query = query.contains('tags', [tag]);
      if (source) query = query.eq('source_id', source);
      if (payType) query = query.eq('pay_type', payType);
      if (sinceIso) query = query.gte('last_seen_at', sinceIso);

      if (sort === 'pay_desc') {
        query = query.order('pay_xmr', { ascending: false, nullsFirst: false });
      } else if (sort === 'pay_asc') {
        query = query.order('pay_xmr', { ascending: true, nullsFirst: false });
      }
      query = query
        .order('posted_at', { ascending: false, nullsFirst: false })
        .order('first_seen_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      const jobs = (data as JobRow[] ?? []).map((j) => ({
        id: j.id,
        source: j.source_id,
        source_name: j.sources?.name ?? null,
        source_url: j.sources?.url ?? null,
        title: j.title,

        description: j.body,
        url: j.url,
        pay_xmr: j.pay_xmr,
        pay_type: j.pay_type,
        tags: j.tags ?? [],
        posted_at: j.posted_at,
        first_seen_at: j.first_seen_at,
        last_seen_at: j.last_seen_at,
      }));

      return json({
        count: jobs.length,
        total: count ?? jobs.length,
        limit,
        offset,
        has_more: (count ?? 0) > offset + jobs.length,
        generated_at: new Date().toISOString(),
        disclaimer: 'Listings are aggregated from third-party boards and are not vetted by 0xNull. No escrow, no dispute mediation.',
        jobs,
      });
    }

    if (route === 'sources') {
      const { data, error } = await supabase
        .from('sources')
        .select('id, name, url, kind, escrow, enabled, last_ok_at')
        .order('name');
      if (error) throw error;

      return json({
        count: data?.length ?? 0,
        generated_at: new Date().toISOString(),
        sources: (data ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          url: s.url,
          kind: s.kind,
          escrow: s.escrow,
          status: s.enabled ? 'active' : 'unavailable',
          last_fetched_at: s.last_ok_at,
        })),
      });
    }

    if (route === 'stats') {
      const [{ count: total }, { count: withPay }, latest] = await Promise.all([
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('hidden', false),
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('hidden', false).not('pay_xmr', 'is', null),
        supabase.from('jobs').select('last_seen_at').eq('hidden', false).order('last_seen_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      return json({
        total_listings: total ?? 0,
        listings_with_stated_pay: withPay ?? 0,
        last_aggregated_at: latest.data?.last_seen_at ?? null,
        generated_at: new Date().toISOString(),
      });
    }

    return json({
      error: 'not_found',
      message: 'Unknown route.',
      routes: ['GET /jobs-api', 'GET /jobs-api/sources', 'GET /jobs-api/stats'],
    }, 404);
  } catch (err) {
    console.error('[jobs-api] error', err);
    return json({ error: 'upstream_error', message: 'Could not read the jobs index. Try again shortly.' }, 503);
  }
});
