#!/usr/bin/env node
/**
 * Regenerates public/rss.xml from the live blog-rss function so the published
 * static site always serves the newest posts to feed readers. Runs alongside
 * the sitemap generator before `vite dev` and `vite build`.
 *
 * Fails soft: if the backend is unreachable, the existing rss.xml is kept.
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
const outFile = resolve('public/rss.xml');

if (!baseUrl || !anonKey) {
  console.warn('[rss] Backend env vars missing — keeping existing public/rss.xml');
  process.exit(0);
}

try {
  const res = await fetch(`${baseUrl}/functions/v1/blog-rss`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) throw new Error(`blog-rss function returned ${res.status}`);

  const xml = await res.text();
  const count = (xml.match(/<item>/g) || []).length;

  if (!xml.includes('<rss') || count === 0) {
    throw new Error('blog-rss function returned no items');
  }

  writeFileSync(outFile, xml.endsWith('\n') ? xml : `${xml}\n`);
  console.log(`[rss] public/rss.xml regenerated (${count} items)`);
} catch (error) {
  console.warn(`[rss] Regeneration skipped: ${error.message} — keeping existing file`);
}
