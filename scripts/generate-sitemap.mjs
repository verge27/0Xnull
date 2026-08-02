#!/usr/bin/env node
/**
 * Regenerates public/sitemap.xml from the live dynamic sitemap function
 * (static routes + published blog posts + active listings, with real lastmod
 * values). Runs automatically before `vite dev` and `vite build`, so every
 * publish ships the newest URL set to Google.
 *
 * Fails soft: if the backend is unreachable, the existing sitemap.xml is kept.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

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
const outFile = resolve('public/sitemap.xml');

if (!baseUrl || !anonKey) {
  console.warn('[sitemap] Backend env vars missing — keeping existing public/sitemap.xml');
  process.exit(0);
}

try {
  const res = await fetch(`${baseUrl}/functions/v1/sitemap`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) throw new Error(`sitemap function returned ${res.status}`);

  const xml = await res.text();
  const count = (xml.match(/<url>/g) || []).length;

  if (!xml.includes('<urlset') || count === 0) {
    throw new Error('sitemap function returned no URLs');
  }

  writeFileSync(outFile, xml.endsWith('\n') ? xml : `${xml}\n`);
  console.log(`[sitemap] public/sitemap.xml regenerated (${count} URLs)`);
} catch (error) {
  console.warn(`[sitemap] Regeneration skipped: ${error.message} — keeping existing file`);
}
