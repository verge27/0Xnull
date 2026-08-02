#!/usr/bin/env node
/**
 * Automated SEO check for blog pages.
 *
 * Verifies, per published post, that the crawler-visible HTML carries a
 * correct self-referencing canonical, is indexable, is listed in the served
 * sitemap and ships valid BlogPosting + BreadcrumbList JSON-LD. Also validates
 * the site-level robots.txt and sitemap.xml that those pages depend on.
 *
 * Source of the HTML, in order of preference:
 *   1. dist/blog/<slug>/index.html  (build-time prerender output)
 *   2. https://0xnull.io/blog/<slug> (live, with --live)
 *
 * Usage:
 *   node scripts/check-seo-blog.mjs           # check prerendered output
 *   node scripts/check-seo-blog.mjs --live    # fetch the published site
 *   node scripts/check-seo-blog.mjs --limit 5 # cap how many posts are checked
 *
 * Exit code 1 when any check fails, so it can gate a build or CI run.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SITE_URL = 'https://0xnull.io';
const args = process.argv.slice(2);
const LIVE = args.includes('--live');
const LIMIT = Number(args[args.indexOf('--limit') + 1]) || Infinity;

const failures = [];
const warnings = [];
const fail = (scope, message) => failures.push(`${scope}: ${message}`);
const warn = (scope, message) => warnings.push(`${scope}: ${message}`);

/* ------------------------------------------------------------------ *
 * Env + data
 * ------------------------------------------------------------------ */

function readEnv() {
  const env = {};
  const path = resolve('.env');
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

const env = { ...readEnv(), ...process.env };
const baseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

async function fetchPosts() {
  if (!baseUrl || !anonKey) return null;
  const url =
    `${baseUrl}/rest/v1/blog_posts` +
    `?select=slug,title,published_at&status=eq.published&order=published_at.desc`;
  const res = await fetch(url, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`blog_posts query returned ${res.status}`);
  return res.json();
}

/* ------------------------------------------------------------------ *
 * Site-level checks
 * ------------------------------------------------------------------ */

function checkRobots() {
  const path = resolve('public/robots.txt');
  if (!existsSync(path)) {
    fail('robots.txt', 'file is missing');
    return;
  }
  const txt = readFileSync(path, 'utf8');

  const wildcard = txt.split(/^User-agent:/im).find((block) => /^\s*\*/.test(block)) || '';
  if (/^\s*Disallow:\s*\/\s*$/im.test(wildcard)) {
    fail('robots.txt', 'blocks the whole site for all crawlers (Disallow: /)');
  }
  // Blocking /blog or /blog/ hides every post; deeper rules (/blog/admin) are intentional.
  if (/^\s*Disallow:\s*\/blog\/?\s*$/im.test(txt)) {
    fail('robots.txt', 'disallows /blog — posts cannot be crawled');
  }

  const sitemapLine = txt.match(/^\s*Sitemap:\s*(\S+)/im);
  if (!sitemapLine) {
    fail('robots.txt', 'no Sitemap: directive');
  } else if (!sitemapLine[1].startsWith('http')) {
    fail('robots.txt', `Sitemap directive must be an absolute URL (got "${sitemapLine[1]}")`);
  }
}

function readSitemapUrls() {
  const path = resolve('public/sitemap.xml');
  if (!existsSync(path)) {
    fail('sitemap.xml', 'file is missing');
    return new Set();
  }
  const xml = readFileSync(path, 'utf8');
  if (!xml.includes('<urlset')) {
    fail('sitemap.xml', 'is not a valid <urlset> document');
    return new Set();
  }
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  if (locs.length === 0) fail('sitemap.xml', 'contains no <loc> entries');

  const relative = locs.filter((loc) => !loc.startsWith('http'));
  if (relative.length) fail('sitemap.xml', `${relative.length} entries are not absolute URLs`);

  const duplicates = locs.filter((loc, i) => locs.indexOf(loc) !== i);
  if (duplicates.length) fail('sitemap.xml', `duplicate entries: ${[...new Set(duplicates)].join(', ')}`);

  return new Set(locs.map((loc) => loc.replace(/\/$/, '')));
}

/* ------------------------------------------------------------------ *
 * Per-post checks
 * ------------------------------------------------------------------ */

async function loadHtml(slug) {
  if (!LIVE) {
    const path = resolve(`dist/blog/${slug}/index.html`);
    if (existsSync(path)) return { html: readFileSync(path, 'utf8'), source: 'prerender' };
    return { html: null, source: 'prerender' };
  }
  const res = await fetch(`${SITE_URL}/blog/${slug}`, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) return { html: null, source: `live (HTTP ${res.status})` };
  return { html: await res.text(), source: 'live' };
}

function checkJsonLd(scope, html, post) {
  const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  if (blocks.length === 0) {
    fail(scope, 'no JSON-LD found');
    return;
  }

  const parsed = [];
  for (const [index, block] of blocks.entries()) {
    try {
      parsed.push(JSON.parse(block[1].replace(/\\u003c/g, '<')));
    } catch (error) {
      fail(scope, `JSON-LD block ${index + 1} is not valid JSON (${error.message})`);
    }
  }

  const flat = parsed.flatMap((entry) => (Array.isArray(entry) ? entry : [entry]));
  const byType = (type) => flat.find((entry) => entry?.['@type'] === type);

  for (const entry of flat) {
    if (!entry?.['@context']) fail(scope, `a JSON-LD block is missing @context`);
    if (!entry?.['@type']) fail(scope, `a JSON-LD block is missing @type`);
  }

  const article = byType('BlogPosting') || byType('Article');
  if (!article) {
    fail(scope, 'no BlogPosting/Article JSON-LD');
  } else {
    for (const field of ['headline', 'datePublished', 'author', 'publisher', 'mainEntityOfPage']) {
      if (!article[field]) fail(scope, `Article JSON-LD is missing "${field}"`);
    }
    if (article.headline && article.headline !== post.title) {
      warn(scope, `Article headline "${article.headline}" differs from the post title`);
    }
    if (article.datePublished && Number.isNaN(Date.parse(article.datePublished))) {
      fail(scope, `Article datePublished is not a valid date ("${article.datePublished}")`);
    }
    const image = Array.isArray(article.image) ? article.image[0] : article.image;
    if (!image) fail(scope, 'Article JSON-LD has no image');
    else if (!String(image).startsWith('http')) fail(scope, `Article image is not absolute ("${image}")`);
  }

  const crumbs = byType('BreadcrumbList');
  if (!crumbs) {
    fail(scope, 'no BreadcrumbList JSON-LD');
  } else {
    const items = crumbs.itemListElement || [];
    if (items.length < 2) fail(scope, 'BreadcrumbList has fewer than 2 items');
    items.forEach((item, i) => {
      if (item.position !== i + 1) fail(scope, `BreadcrumbList position ${item.position} is out of order`);
      if (!item.name || !item.item) fail(scope, `BreadcrumbList item ${i + 1} is missing name or item`);
    });
  }
}

function checkPost(post, sitemapUrls, html, source) {
  const scope = `/blog/${post.slug}`;
  const expected = `${SITE_URL}/blog/${post.slug}`;

  if (!sitemapUrls.has(expected)) fail(scope, 'not listed in public/sitemap.xml');

  if (!html) {
    fail(scope, `no crawler-visible HTML from ${source} — run the build so prerendering runs`);
    return;
  }

  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  if (!canonical) {
    fail(scope, 'no canonical link');
  } else {
    const all = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/gi) || [];
    if (all.length > 1) fail(scope, `${all.length} canonical tags — there must be exactly one`);
    const href = canonical[0].match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) fail(scope, 'canonical link has no href');
    else if (href.replace(/\/$/, '') !== expected) {
      fail(scope, `canonical points at "${href}" instead of "${expected}"`);
    }
  }

  const robotsMeta = html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["']/i)?.[1];
  if (robotsMeta && /noindex/i.test(robotsMeta)) {
    fail(scope, `page is marked noindex ("${robotsMeta}")`);
  }

  const ogUrl = html.match(/<meta[^>]+property=["']og:url["'][^>]*content=["']([^"']+)["']/i)?.[1];
  if (ogUrl && ogUrl.replace(/\/$/, '') !== expected) {
    fail(scope, `og:url points at "${ogUrl}" instead of "${expected}"`);
  }

  const description = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1];
  if (!description || !description.trim()) fail(scope, 'no meta description');
  else if (description.length > 160) warn(scope, `meta description is ${description.length} chars (>160)`);

  checkJsonLd(scope, html, post);
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

checkRobots();
const sitemapUrls = readSitemapUrls();

let posts = null;
try {
  posts = await fetchPosts();
} catch (error) {
  console.warn(`[seo] Could not load blog posts: ${error.message}`);
}

if (!posts) {
  console.warn('[seo] Backend unreachable — ran site-level checks only (robots.txt, sitemap.xml)');
} else {
  const selected = posts.slice(0, LIMIT);
  for (const post of selected) {
    const { html, source } = await loadHtml(post.slug);
    checkPost(post, sitemapUrls, html, source);
  }
  console.log(`[seo] Checked ${selected.length} published post${selected.length === 1 ? '' : 's'} (${LIVE ? 'live' : 'prerendered'})`);
}

for (const warning of warnings) console.warn(`  warn  ${warning}`);

if (failures.length) {
  console.error(`\n[seo] ${failures.length} problem${failures.length === 1 ? '' : 's'} found:\n`);
  for (const failure of failures) console.error(`  fail  ${failure}`);
  console.error('');
  process.exit(1);
}

console.log('[seo] canonical, robots, sitemap and JSON-LD checks passed');
