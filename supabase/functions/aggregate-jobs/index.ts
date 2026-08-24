import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

interface RawJob {
  externalId: string;
  title: string;
  body: string;
  url: string;
  postedAt?: string;
  payText?: string;
}

interface Adapter {
  sourceId: string;
  fetch(): Promise<RawJob[]>;
}

const TAGS = [
  'python', 'typescript', 'javascript', 'react', 'rust', 'go', 'php', 'node', 'sql',
  'devops', 'linux', 'sysadmin', 'design', 'ui', 'ux', 'writing', 'copywriting',
  'translation', 'seo', 'marketing', 'video', 'audio', 'research', 'data', 'ml',
  'security', 'pentest', 'tor', 'monero', 'bitcoin', 'telegram', 'bot', 'scraping',
  'support', 'moderation', 'sales',
];

// ---------- helpers ----------

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-GB,en;q=0.9' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCodePoint(parseInt(h, 16)));
}

function tidy(s: string): string {
  return s.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parsePay(text: string): { pay_xmr: number | null; pay_type: 'hourly' | 'fixed' | 'unknown' } {
  const lower = text.toLowerCase();
  const patterns = [/([0-9]+(?:\.[0-9]+)?)\s*xmr/g, /xmr\s*([0-9]+(?:\.[0-9]+)?)/g];
  let best: { amount: number; index: number; length: number } | null = null;
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(lower)) !== null) {
      const amount = Number(m[1]);
      if (!Number.isFinite(amount)) continue;
      if (!best || amount > best.amount) best = { amount, index: m.index, length: m[0].length };
    }
  }
  if (!best) return { pay_xmr: null, pay_type: 'unknown' };

  const windowStart = Math.max(0, best.index - 15);
  const windowEnd = Math.min(lower.length, best.index + best.length + 15);
  const context = lower.slice(windowStart, windowEnd);
  const hourly = /\/h\b|\/hr\b|per hour|hourly/.test(context);
  return { pay_xmr: best.amount, pay_type: hourly ? 'hourly' : 'fixed' };
}

function extractTags(text: string): string[] {
  const lower = ` ${text.toLowerCase()} `;
  return TAGS.filter((tag) => new RegExp(`[^a-z0-9]${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^a-z0-9]`).test(lower));
}

// ---------- adapters ----------

const tgAdapter: Adapter = {
  sourceId: 'tg-monerojobs',
  async fetch() {
    const jobs: RawJob[] = [];
    const seen = new Set<string>();
    let before: string | null = null;

    for (let page = 0; page < 2; page++) {
      const url = before
        ? `https://t.me/s/MoneroJobs?before=${encodeURIComponent(before)}`
        : 'https://t.me/s/MoneroJobs';
      const html = await getText(url);
      const blocks = html.split(/<div class="tgme_widget_message[ "]/).slice(1);
      if (blocks.length === 0) {
        if (page === 0) throw new Error('no messages in Telegram web preview');
        break;
      }

      let lowestId: number | null = null;
      for (const block of blocks) {
        const post = block.match(/data-post="MoneroJobs\/(\d+)"/);
        if (!post) continue;
        const n = post[1];
        if (seen.has(n)) continue;
        seen.add(n);
        const num = Number(n);
        if (lowestId === null || num < lowestId) lowestId = num;

        const textMatch = block.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
        const body = tidy(decodeEntities(textMatch ? textMatch[1] : ''));
        if (!body) continue;
        const title = body.split('\n')[0].slice(0, 120).trim() || `Post ${n}`;
        const dateMatch = block.match(/<time[^>]+datetime="([^"]+)"/);

        jobs.push({
          externalId: n,
          title,
          body,
          url: `https://t.me/MoneroJobs/${n}`,
          postedAt: dateMatch ? dateMatch[1] : undefined,
        });
      }

      if (lowestId === null) break;
      before = String(lowestId);
    }

    return jobs;
  },
};

// monero.jobs is a single-page app. Its bundle reads a public `jobs_public`
// PostgREST view, so we call that JSON endpoint directly. No headless browser.
const MONERO_JOBS_REST = 'https://fdtprmnbxoerrwpjzdoi.supabase.co/rest/v1/jobs_public';

const moneroJobsAdapter: Adapter = {
  sourceId: 'monero-jobs',
  async fetch() {
    const key = Deno.env.get('MONERO_JOBS_ANON_KEY');
    if (!key) throw new Error('missing MONERO_JOBS_ANON_KEY');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    let rows: Record<string, unknown>[];
    try {
      const res = await fetch(
        `${MONERO_JOBS_REST}?select=id,slug,title,description,budget_min_xmr,budget_max_xmr,status,created_at&status=eq.open&order=created_at.desc&limit=100`,
        {
          headers: { apikey: key, Authorization: `Bearer ${key}`, 'User-Agent': UA },
          signal: controller.signal,
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status} from monero.jobs API`);
      rows = await res.json();
    } finally {
      clearTimeout(timer);
    }

    return rows.map((r) => {
      const min = r.budget_min_xmr != null ? Number(r.budget_min_xmr) : null;
      const max = r.budget_max_xmr != null ? Number(r.budget_max_xmr) : null;
      const payText = max != null ? `${max} XMR` : min != null ? `${min} XMR` : '';
      const slug = String(r.slug ?? r.id);
      return {
        externalId: String(r.id),
        title: tidy(String(r.title ?? '')).slice(0, 200) || 'Untitled listing',
        body: tidy(String(r.description ?? '')),
        url: `https://monero.jobs/jobs/${slug}`,
        postedAt: r.created_at ? String(r.created_at) : undefined,
        payText,
      } as RawJob;
    });
  },
};

const monerojobsComAdapter: Adapter = {
  sourceId: 'monerojobs-com',
  async fetch() {
    const html = await getText('https://monerojobs.com/');
    const jobs: RawJob[] = [];
    // Generic article/card extraction: an anchor with a heading inside a card block.
    const cards = html.match(/<(article|li|div)[^>]*class="[^"]*(job|listing|post|card)[^"]*"[\s\S]*?<\/\1>/gi) ?? [];
    for (const card of cards) {
      const link = card.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!link) continue;
      const href = link[1].startsWith('http') ? link[1] : new URL(link[1], 'https://monerojobs.com/').toString();
      const title = tidy(decodeEntities(link[2])).slice(0, 200);
      if (!title) continue;
      const body = tidy(decodeEntities(card.replace(link[0], ' ')));
      const dateMatch = card.match(/datetime="([^"]+)"/);
      jobs.push({ externalId: href, title, body, url: href, postedAt: dateMatch ? dateMatch[1] : undefined });
    }
    if (jobs.length === 0) throw new Error('no listings parsed from monerojobs.com homepage');
    return jobs;
  },
};

const freelanceForCoinsAdapter: Adapter = {
  sourceId: 'freelanceforcoins',
  async fetch() {
    const html = await getText('https://freelanceforcoins.com/freelancers-for/monero');
    const jobs: RawJob[] = [];
    const cards = html.match(/<(article|li|div)[^>]*class="[^"]*(freelancer|profile|card|user)[^"]*"[\s\S]*?<\/\1>/gi) ?? [];
    for (const card of cards) {
      const link = card.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!link) continue;
      const href = link[1].startsWith('http') ? link[1] : new URL(link[1], 'https://freelanceforcoins.com/').toString();
      const name = tidy(decodeEntities(link[2])).slice(0, 120);
      if (!name) continue;
      const body = tidy(decodeEntities(card.replace(link[0], ' ')));
      const rate = body.match(/[^\n]*\b(rate|hour|hr)\b[^\n]*/i);
      jobs.push({ externalId: href, title: name, body, url: href, payText: rate ? rate[0] : undefined });
    }
    if (jobs.length === 0) throw new Error('no freelancer profiles parsed');
    return jobs;
  },
};

function monericaAdapter(sourceId: string, pageUrl: string): Adapter {
  return {
    sourceId,
    async fetch() {
      const html = await getText(pageUrl);
      const main = html.match(/<main[\s\S]*?<\/main>/i);
      const scope = main ? main[0] : html;
      const items = scope.match(/<li>[\s\S]*?<\/li>/gi) ?? [];
      const jobs: RawJob[] = [];

      for (const item of items) {
        const anchors = [...item.matchAll(/<a([^>]*)>([\s\S]*?)<\/a>/gi)];
        if (anchors.length === 0) continue;
        const profile = anchors.find((a) => !/external-link/.test(a[1]));
        const external = anchors.find((a) => /external-link/.test(a[1]));
        if (!profile) continue;

        const name = tidy(decodeEntities(profile[2])).slice(0, 200);
        if (!name) continue;

        const hrefMatch = (external ?? profile)[1].match(/href="([^"]+)"/);
        if (!hrefMatch) continue;
        const url = hrefMatch[1];

        const text = tidy(decodeEntities(item));
        const dot = text.indexOf('·');
        const body = dot >= 0 ? text.slice(dot + 1).trim() : text;

        jobs.push({ externalId: await sha256(url), title: name, body, url });
      }

      if (jobs.length === 0) throw new Error(`no entries parsed from ${pageUrl}`);
      return jobs;
    },
  };
}

const ADAPTERS: Adapter[] = [
  tgAdapter,
  monerojobsComAdapter,
  moneroJobsAdapter,
  freelanceForCoinsAdapter,
  monericaAdapter('monerica-freelancers', 'https://monerica.com/freelancers'),
  monericaAdapter('monerica-jobs', 'https://monerica.com/jobs'),
];

// ---------- persistence ----------

type Blocklist = { pattern: string; is_regex: boolean }[];

function matchBlocklist(text: string, blocklist: Blocklist): string | null {
  for (const row of blocklist) {
    try {
      if (row.is_regex) {
        if (new RegExp(row.pattern, 'i').test(text)) return row.pattern;
      } else if (text.includes(row.pattern.toLowerCase())) {
        return row.pattern;
      }
    } catch (_e) {
      // Malformed regex in the blocklist must not break the run.
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const jobsSecret = Deno.env.get('JOBS_CRON_SECRET');
  const cronSecret = Deno.env.get('CRON_SECRET');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const authHeader = req.headers.get('authorization') ?? '';
  const presented = req.headers.get('x-cron-secret') ?? authHeader.replace(/^Bearer\s+/i, '');

  const accepted = [jobsSecret, cronSecret, serviceKey].filter((v): v is string => Boolean(v));
  const authorised = Boolean(presented) && accepted.includes(presented);
  if (!authorised) {
    console.error('[aggregate-jobs] unauthorised request');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey, {
    auth: { persistSession: false },
  });

  const only = new URL(req.url).searchParams.get('source');
  const adapters = only ? ADAPTERS.filter((a) => a.sourceId === only) : ADAPTERS;
  if (adapters.length === 0) {
    return new Response(JSON.stringify({ error: `unknown source: ${only}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: blocklistRows } = await supabase.from('blocklist').select('pattern, is_regex');
  const blocklist: Blocklist = (blocklistRows ?? []).map((r) => ({
    pattern: String(r.pattern).toLowerCase(),
    is_regex: Boolean(r.is_regex),
  }));

  const results: Record<string, unknown>[] = [];

  for (const adapter of adapters) {
    const startedAt = new Date().toISOString();
    let fetched = 0;
    let inserted = 0;
    let updated = 0;
    let blocked = 0;
    let error: string | null = null;

    try {
      const raw = await adapter.fetch();
      fetched = raw.length;

      for (const job of raw) {
        const id = await sha256(`${adapter.sourceId}:${job.externalId}`);
        const payInput = `${job.body}\n${job.payText ?? ''}`;
        const { pay_xmr, pay_type } = parsePay(payInput);
        const tags = extractTags(`${job.title} ${job.body}`);
        const dedupe_key = await sha256(`${normalise(job.title)}|${normalise(job.body).slice(0, 200)}`);

        const { data: existing } = await supabase
          .from('jobs')
          .select('id, first_seen_at')
          .eq('source_id', adapter.sourceId)
          .eq('external_id', job.externalId)
          .maybeSingle();

        const base = {
          title: job.title,
          body: job.body,
          url: job.url,
          pay_xmr,
          pay_type,
          tags,
          last_seen_at: new Date().toISOString(),
        };

        if (existing) {
          // Never overwrite first_seen_at, hidden or hidden_reason on existing rows.
          const { error: updateError } = await supabase.from('jobs').update(base).eq('id', existing.id);
          if (updateError) throw new Error(updateError.message);
          updated++;
          continue;
        }

        let hidden = false;
        let hidden_reason: string | null = null;

        const blockedPattern = matchBlocklist(`${job.title} ${job.body}`.toLowerCase(), blocklist);
        if (blockedPattern) {
          hidden = true;
          hidden_reason = `blocklist: ${blockedPattern}`;
        } else {
          const { data: dupe } = await supabase
            .from('jobs')
            .select('id, source_id, first_seen_at')
            .eq('dedupe_key', dedupe_key)
            .order('first_seen_at', { ascending: true })
            .limit(1)
            .maybeSingle();
          if (dupe && dupe.source_id !== adapter.sourceId) {
            hidden = true;
            hidden_reason = `duplicate of ${dupe.id}`;
          }
        }

        if (hidden) blocked++;

        const { error: insertError } = await supabase.from('jobs').insert({
          id,
          source_id: adapter.sourceId,
          external_id: job.externalId,
          posted_at: job.postedAt ?? null,
          dedupe_key,
          hidden,
          hidden_reason,
          ...base,
        });
        if (insertError) throw new Error(insertError.message);
        inserted++;
      }

      await supabase
        .from('sources')
        .update({ last_ok_at: new Date().toISOString(), last_error: null })
        .eq('id', adapter.sourceId);

      console.log(
        `${adapter.sourceId} ok fetched=${fetched} inserted=${inserted} updated=${updated} blocked=${blocked}`,
      );
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      console.error(`${adapter.sourceId} error ${error}`);
      await supabase.from('sources').update({ last_error: error }).eq('id', adapter.sourceId);
    }

    await supabase.from('fetch_runs').insert({
      source_id: adapter.sourceId,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      fetched,
      inserted,
      updated,
      blocked,
      error,
    });

    results.push({ source: adapter.sourceId, fetched, inserted, updated, blocked, error });
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
