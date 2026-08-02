#!/usr/bin/env node
/**
 * Prerenders a real HTML document for every published blog post into
 * dist/blog/<slug>/index.html after `vite build`.
 *
 * Why: the app is a client-rendered SPA, so social crawlers that don't execute
 * JavaScript (X/Twitter, Slack, LinkedIn, Discord) only ever see the generic
 * head from index.html. These prerendered files put the per-post canonical,
 * description, Open Graph, Twitter Card and Article JSON-LD directly in the
 * raw HTML. Static hosts serve a matching file before falling back to the SPA
 * shell, so humans still get the normal React app from the same bundle.
 *
 * Fails soft: if the backend is unreachable the build keeps its SPA-only
 * output rather than failing.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const SITE_URL = 'https://0xnull.io';
const DIST = resolve('dist');

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

/* ------------------------------------------------------------------ *
 * Head helpers
 * ------------------------------------------------------------------ */

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Mirrors src/lib/blogOgImage.ts — keep the fallback chain in sync. */
const CATEGORY_FALLBACKS = {
  esports: '/images/blog/og-fallback-esports.jpg',
  sports: '/images/blog/og-fallback-sports.jpg',
  crypto: '/images/blog/og-fallback-crypto.jpg',
  flash: '/images/blog/og-fallback-flash.jpg',
};
const DEFAULT_OG_IMAGE = '/og-image.png';

function absoluteUrl(src) {
  const trimmed = String(src || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return `${SITE_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

function firstContentImage(content) {
  if (!content) return undefined;
  return content.match(/!\[[^\]]*\]\(([^)\s]+)/)?.[1] || content.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
}

function resolveOgImage(post) {
  const candidate =
    (post.featured_image && post.featured_image.trim()) ||
    firstContentImage(post.content) ||
    CATEGORY_FALLBACKS[post.category];
  return absoluteUrl(candidate || DEFAULT_OG_IMAGE);
}

/** Plain-text summary used when a post has no excerpt or meta description. */
function summarise(content, limit = 155) {
  const text = String(content || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).replace(/\s+\S*$/, '')}…`;
}

/**
 * Remove the SPA shell's page-level tags so the prerendered page carries
 * exactly one title, description, canonical and one set of og:/twitter: tags.
 */
function stripSharedHeadTags(html) {
  return html
    .replace(/\s*<title>[\s\S]*?<\/title>/gi, '')
    .replace(/\s*<meta\s+[^>]*name=["']description["'][^>]*>/gi, '')
    .replace(/\s*<meta\s+[^>]*name=["']author["'][^>]*>/gi, '')
    .replace(/\s*<link\s+[^>]*rel=["']canonical["'][^>]*>/gi, '')
    .replace(/\s*<meta\s+[^>]*property=["']og:[^"']*["'][^>]*>/gi, '')
    .replace(/\s*<meta\s+[^>]*name=["']twitter:[^"']*["'][^>]*>/gi, '');
}

function buildHead(post) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const title = `${post.title} | 0xNull Blog`;
  const description = (post.meta_description || post.excerpt || summarise(post.content) || '').trim();
  const image = resolveOgImage(post);
  const published = post.published_at || post.created_at;
  const modified = post.updated_at || published;
  const author = post.author_name || '0xNull';
  const tags = Array.isArray(post.tags) ? post.tags : [];

  const article = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    image: [image],
    datePublished: published,
    dateModified: modified,
    author: { '@type': 'Person', name: author },
    publisher: {
      '@type': 'Organization',
      name: '0xNull',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon-512.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(post.category ? { articleSection: post.category } : {}),
    ...(tags.length ? { keywords: tags.join(', ') } : {}),
  };

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };

  const jsonLd = (data) =>
    `    <script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

  return [
    `    <title>${escapeHtml(title)}</title>`,
    `    <meta name="description" content="${escapeHtml(description)}" />`,
    `    <meta name="author" content="${escapeHtml(author)}" />`,
    `    <link rel="canonical" href="${url}" />`,
    `    <meta property="og:type" content="article" />`,
    `    <meta property="og:site_name" content="0xNull" />`,
    `    <meta property="og:title" content="${escapeHtml(post.title)}" />`,
    `    <meta property="og:description" content="${escapeHtml(description)}" />`,
    `    <meta property="og:url" content="${url}" />`,
    `    <meta property="og:image" content="${escapeHtml(image)}" />`,
    `    <meta property="og:image:width" content="1200" />`,
    `    <meta property="og:image:height" content="630" />`,
    `    <meta property="article:published_time" content="${escapeHtml(published || '')}" />`,
    `    <meta property="article:modified_time" content="${escapeHtml(modified || '')}" />`,
    `    <meta property="article:author" content="${escapeHtml(author)}" />`,
    ...(post.category ? [`    <meta property="article:section" content="${escapeHtml(post.category)}" />`] : []),
    ...tags.map((tag) => `    <meta property="article:tag" content="${escapeHtml(tag)}" />`),
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${escapeHtml(post.title)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `    <meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `    <meta name="twitter:label1" content="Written by" />`,
    `    <meta name="twitter:data1" content="${escapeHtml(author)}" />`,
    jsonLd(article),
    jsonLd(breadcrumbs),
  ].join('\n');
}

/**
 * Minimal readable content for crawlers that parse the body (and for users who
 * land before the bundle boots). React replaces #root on hydration.
 */
function buildNoscriptBody(post, description) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  return [
    '    <noscript>',
    '      <article>',
    `        <h1>${escapeHtml(post.title)}</h1>`,
    `        <p>${escapeHtml(description)}</p>`,
    `        <p><a href="${url}">Read ${escapeHtml(post.title)} on 0xNull</a></p>`,
    '      </article>',
    '    </noscript>',
  ].join('\n');
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

async function fetchPosts() {
  const fields = 'slug,title,excerpt,content,meta_description,featured_image,category,tags,author_name,published_at,created_at,updated_at';
  const res = await fetch(
    `${baseUrl}/rest/v1/blog_posts?select=${fields}&status=eq.published&order=published_at.desc`,
    {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!res.ok) throw new Error(`blog_posts query returned ${res.status}`);
  return res.json();
}

async function main() {
  if (!baseUrl || !anonKey) {
    console.warn('[prerender] Backend env vars missing — skipping blog prerender');
    return;
  }

  const shellPath = join(DIST, 'index.html');
  if (!existsSync(shellPath)) {
    console.warn('[prerender] dist/index.html not found — run after `vite build`');
    return;
  }

  const posts = await fetchPosts();
  if (!Array.isArray(posts) || posts.length === 0) {
    console.warn('[prerender] No published posts returned — skipping');
    return;
  }

  const shell = readFileSync(shellPath, 'utf8');
  const stripped = stripSharedHeadTags(shell);

  let written = 0;
  for (const post of posts) {
    if (!post.slug) continue;

    const description = (post.meta_description || post.excerpt || summarise(post.content) || '').trim();
    const head = buildHead(post);
    let html = stripped.replace(/(\s*)<\/head>/i, `\n${head}\n  </head>`);
    html = html.replace(/(<div id="root"><\/div>)/i, `$1\n${buildNoscriptBody(post, description)}`);

    const dir = join(DIST, 'blog', post.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html);
    // Sibling .html copy: some static hosts resolve extensionless URLs via
    // `<path>.html` before trying `<path>/index.html`. Writing both means the
    // prerendered page wins whichever try-files order the host uses.
    writeFileSync(join(DIST, 'blog', `${post.slug}.html`), html);
    written++;
  }

  console.log(`[prerender] Wrote ${written} prerendered blog pages to dist/blog/<slug>/index.html`);
}

try {
  await main();
} catch (error) {
  console.warn(`[prerender] Skipped: ${error.message} — build keeps SPA-only output`);
}
