import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';

const SITE_URL = 'https://0xnull.io';
const ROBOTS_URL = `${SITE_URL}/robots.txt`;
const EXPECTED_SITEMAP = `${SITE_URL}/sitemap.xml`;
const ALERT_TO = 'admin@0xnull.io';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function sha256(input: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function parseSitemapDirectives(txt: string): string[] {
  return [...txt.matchAll(/^\s*sitemap\s*:\s*(\S+)\s*$/gim)].map((m) => m[1]);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Cron calls authenticate with the shared secret; the admin dashboard uses the user session.
    const cronSecret = Deno.env.get('SEO_RECHECK_CRON_SECRET');
    const provided = req.headers.get('x-cron-secret');
    const isCron = !!cronSecret && provided === cronSecret;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (!isCron) {
      const authHeader = req.headers.get('Authorization') ?? '';
      const token = authHeader.replace('Bearer ', '');
      const { data: userData } = await supabase.auth.getUser(token);
      const userId = userData?.user?.id;
      if (!userId) return json({ error: 'Unauthorized' }, 401);
      const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
      if (!isAdmin) return json({ error: 'Forbidden' }, 403);
    }

    const cb = Date.now();
    const issues: string[] = [];

    // 1. Fetch robots.txt
    let robotsStatus = 0;
    let robotsBody = '';
    try {
      const res = await fetch(`${ROBOTS_URL}?cb=${cb}`, { headers: { 'Cache-Control': 'no-cache' } });
      robotsStatus = res.status;
      robotsBody = res.ok ? await res.text() : '';
      if (!res.ok) issues.push(`robots.txt returned HTTP ${res.status}`);
    } catch (e) {
      issues.push(`robots.txt fetch failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    // 2. Validate the Sitemap directive
    const directives = parseSitemapDirectives(robotsBody);
    const sitemapDirective = directives[0] ?? null;
    if (directives.length === 0) {
      issues.push('No Sitemap: directive found in robots.txt');
    } else if (!directives.includes(EXPECTED_SITEMAP)) {
      issues.push(`Sitemap directive points at ${directives.join(', ')} instead of ${EXPECTED_SITEMAP}`);
    }

    // 3. Verify the site itself is not blocked wholesale
    if (/^\s*disallow\s*:\s*\/\s*$/im.test(robotsBody)) {
      issues.push('robots.txt contains a site-wide "Disallow: /" rule');
    }

    // 4. Confirm the referenced sitemap is reachable and parses
    let sitemapStatus = 0;
    let sitemapUrlCount = 0;
    if (sitemapDirective) {
      try {
        const res = await fetch(`${sitemapDirective}?cb=${cb}`, { headers: { 'Cache-Control': 'no-cache' } });
        sitemapStatus = res.status;
        if (!res.ok) {
          issues.push(`Sitemap ${sitemapDirective} unreachable (HTTP ${res.status})`);
        } else {
          const xml = await res.text();
          sitemapUrlCount = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].length;
          if (sitemapUrlCount === 0) issues.push('Sitemap is reachable but contains no <loc> entries');
        }
      } catch (e) {
        issues.push(`Sitemap fetch failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    const contentHash = await sha256(robotsBody);
    const isHealthy = issues.length === 0;

    // 5. Compare against the previous snapshot to detect changes
    const { data: previous } = await supabase
      .from('robots_txt_checks')
      .select('content_hash, is_healthy, checked_at')
      .order('checked_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const changed = !!previous && previous.content_hash !== contentHash;
    const becameUnhealthy = !isHealthy && (!previous || previous.is_healthy);
    const recovered = isHealthy && !!previous && !previous.is_healthy;

    const { data: inserted, error: insertError } = await supabase
      .from('robots_txt_checks')
      .insert({
        robots_url: ROBOTS_URL,
        http_status: robotsStatus,
        content_hash: contentHash,
        content: robotsBody.slice(0, 20000),
        sitemap_directive: sitemapDirective,
        sitemap_http_status: sitemapStatus || null,
        sitemap_url_count: sitemapUrlCount,
        is_healthy: isHealthy,
        changed_from_previous: changed,
        issues,
      })
      .select()
      .single();

    if (insertError) console.error('robots-monitor insert failed:', insertError.message);

    // 6. Alert on regressions, recoveries or content changes
    let alertSent = false;
    const shouldAlert = becameUnhealthy || recovered || changed;
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (shouldAlert && resendKey) {
      const subject = becameUnhealthy
        ? '🚨 robots.txt problem detected on 0xnull.io'
        : recovered
          ? '✅ robots.txt is healthy again'
          : '⚠️ robots.txt content changed on 0xnull.io';
      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: '0xNull SEO <onboarding@resend.dev>',
          to: [ALERT_TO],
          subject,
          html: `
            <h2>${subject}</h2>
            <p><strong>URL:</strong> ${ROBOTS_URL} (HTTP ${robotsStatus})</p>
            <p><strong>Sitemap directive:</strong> ${sitemapDirective ?? 'MISSING'}${
              sitemapStatus ? ` (HTTP ${sitemapStatus}, ${sitemapUrlCount} URLs)` : ''
            }</p>
            <p><strong>Content changed:</strong> ${changed ? 'yes' : 'no'}</p>
            <p><strong>Issues:</strong></p>
            <ul>${issues.length ? issues.map((i) => `<li>${i}</li>`).join('') : '<li>None</li>'}</ul>
            <pre style="background:#f4f4f4;padding:12px;white-space:pre-wrap">${robotsBody.slice(0, 4000)}</pre>
          `,
        });
        alertSent = true;
      } catch (e) {
        console.error('robots-monitor alert email failed:', e instanceof Error ? e.message : String(e));
      }
    }

    if (!isHealthy) console.warn(`robots.txt unhealthy: ${issues.join(' | ')}`);

    return json({
      ...(inserted ?? {}),
      checked_at: inserted?.checked_at ?? new Date().toISOString(),
      issues,
      is_healthy: isHealthy,
      changed_from_previous: changed,
      alert_sent: alertSent,
    });
  } catch (error) {
    console.error('robots-monitor error:', error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
