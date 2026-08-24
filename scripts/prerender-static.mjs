#!/usr/bin/env node
/**
 * Prerenders real HTML documents for hand-picked static routes into
 * dist/<route>/index.html after `vite build`.
 *
 * Why: the app is a client-rendered SPA, so social crawlers that don't execute
 * JavaScript (X/Twitter, Slack, LinkedIn, Discord, Facebook) only ever see the
 * generic head from index.html. These files put the per-route canonical,
 * description, Open Graph, Twitter Card and JSON-LD directly in the raw HTML.
 *
 * Blog posts are handled separately by scripts/prerender-blog.mjs.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';

const SITE_URL = 'https://0xnull.io';
const DIST = resolve('dist');

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/* ------------------------------------------------------------------ *
 * Routes
 * ------------------------------------------------------------------ */

const ROUTES = [
  {
    path: '/phone',
    title: 'Anonymous Phone Numbers & eSIMs | No KYC | 0xNull',
    description:
      'Disposable and rental phone numbers plus data eSIMs for 200+ countries. No KYC, no accounts, pay with Monero, Lightning, card or Apple Pay.',
    ogTitle: 'Anonymous Phone Numbers & eSIMs — no KYC',
    ogDescription:
      'Disposable numbers, 3, 6 or 9 month rentals and global data eSIMs from nadanada (formerly LNVPN). No identity checks, no accounts.',
    image: '/images/backgrounds/esim-background.webp',
    headline: 'Anonymous Phone & eSIM',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Anonymous Phone Numbers & eSIMs',
        serviceType: 'Anonymous telecoms',
        description:
          'Disposable and rental phone numbers plus global data eSIMs with no KYC and no accounts, paid with crypto, card or Apple Pay.',
        areaServed: 'Worldwide',
        provider: { '@type': 'Organization', name: '0xNull', url: `${SITE_URL}/` },
        url: `${SITE_URL}/phone`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Phone & eSIM', item: `${SITE_URL}/phone` },
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Head helpers
 * ------------------------------------------------------------------ */

function stripSharedHeadTags(html) {
  return html
    .replace(/\s*<title>[\s\S]*?<\/title>/gi, '')
    .replace(/\s*<meta\s+[^>]*name=["']description["'][^>]*>/gi, '')
    .replace(/\s*<link\s+[^>]*rel=["']canonical["'][^>]*>/gi, '')
    .replace(/\s*<meta\s+[^>]*property=["']og:[^"']*["'][^>]*>/gi, '')
    .replace(/\s*<meta\s+[^>]*name=["']twitter:[^"']*["'][^>]*>/gi, '');
}

function buildHead(route) {
  const url = `${SITE_URL}${route.path}`;
  const image = `${SITE_URL}${route.image}`;
  const ogTitle = route.ogTitle || route.title;
  const ogDescription = route.ogDescription || route.description;

  const jsonLd = (data) =>
    `    <script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

  return [
    `    <title>${escapeHtml(route.title)}</title>`,
    `    <meta name="description" content="${escapeHtml(route.description)}" />`,
    `    <link rel="canonical" href="${url}" />`,
    `    <meta property="og:type" content="website" />`,
    `    <meta property="og:site_name" content="0xNull" />`,
    `    <meta property="og:title" content="${escapeHtml(ogTitle)}" />`,
    `    <meta property="og:description" content="${escapeHtml(ogDescription)}" />`,
    `    <meta property="og:url" content="${url}" />`,
    `    <meta property="og:image" content="${escapeHtml(image)}" />`,
    `    <meta property="og:image:width" content="1200" />`,
    `    <meta property="og:image:height" content="630" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(ogDescription)}" />`,
    `    <meta name="twitter:image" content="${escapeHtml(image)}" />`,
    ...(route.jsonLd || []).map(jsonLd),
  ].join('\n');
}

function buildNoscriptBody(route) {
  const url = `${SITE_URL}${route.path}`;
  return [
    '    <noscript>',
    '      <article>',
    `        <h1>${escapeHtml(route.headline || route.title)}</h1>`,
    `        <p>${escapeHtml(route.description)}</p>`,
    `        <p><a href="${url}">Open ${escapeHtml(route.headline || route.title)} on 0xNull</a></p>`,
    '      </article>',
    '    </noscript>',
  ].join('\n');
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

function main() {
  const shellPath = join(DIST, 'index.html');
  if (!existsSync(shellPath)) {
    console.warn('[prerender-static] dist/index.html not found — run after `vite build`');
    return;
  }

  const stripped = stripSharedHeadTags(readFileSync(shellPath, 'utf8'));

  let written = 0;
  for (const route of ROUTES) {
    const slug = route.path.replace(/^\//, '');
    let html = stripped.replace(/(\s*)<\/head>/i, `\n${buildHead(route)}\n  </head>`);
    html = html.replace(/(<div id="root"><\/div>)/i, `$1\n${buildNoscriptBody(route)}`);

    const dir = join(DIST, slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html);
    // Sibling .html copy: some static hosts resolve extensionless URLs via
    // `<path>.html` before trying `<path>/index.html`.
    mkdirSync(dirname(join(DIST, `${slug}.html`)), { recursive: true });
    writeFileSync(join(DIST, `${slug}.html`), html);
    written++;
  }

  console.log(`[prerender-static] Wrote ${written} prerendered static route(s)`);
}

try {
  main();
} catch (error) {
  console.warn(`[prerender-static] Skipped: ${error.message} — build keeps SPA-only output`);
}
