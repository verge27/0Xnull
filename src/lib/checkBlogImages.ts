import {
  absoluteImageUrl,
  contentImages,
  OG_FALLBACK_IMAGES,
  resolveBlogOgImageSource,
  type OgImageSource,
  type OgImageTier,
} from './blogOgImage';

const SITE_URL = 'https://0xnull.io';
const DEFAULT_TIMEOUT_MS = 8000;

export type ImageStatus = 'ok' | 'local-only' | 'unreachable' | 'invalid';

export interface ImageCheck {
  /** Absolute URL a crawler would fetch. */
  url: string;
  /** The raw value as written in the post (or the fallback constant). */
  source: string;
  status: ImageStatus;
  /** Natural dimensions when the image loaded. */
  width?: number;
  height?: number;
  message?: string;
}

/**
 * Load an image in the background to test reachability.
 * Uses an <img> element rather than fetch() so cross-origin hosts without CORS
 * headers still report correctly — a crawler doesn't need CORS either.
 */
function probeImage(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<{ ok: boolean; width?: number; height?: number }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      resolve({ ok: false });
      return;
    }

    const img = new Image();
    let settled = false;

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      resolve({ ok, width: img.naturalWidth || undefined, height: img.naturalHeight || undefined });
    };

    const timer = setTimeout(() => finish(false), timeoutMs);

    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    // Cache-bust nothing: we want to know what a crawler hitting the CDN sees.
    img.src = url;
  });
}

/** Same-origin path for a URL that lives on the production site. */
function localEquivalent(url: string): string | null {
  if (typeof window === 'undefined') return null;
  if (!url.startsWith(SITE_URL)) return null;
  const path = url.slice(SITE_URL.length) || '/';
  return `${window.location.origin}${path}`;
}

/** Check a single image URL, distinguishing "not deployed yet" from "broken". */
export async function checkImageUrl(source: string, timeoutMs?: number): Promise<ImageCheck> {
  const raw = source.trim();

  if (!raw) {
    return { url: '', source, status: 'invalid', message: 'Empty image path' };
  }

  let url: string;
  try {
    url = absoluteImageUrl(raw);
    // Throws for values that can never resolve to a fetchable URL.
    new URL(url);
  } catch {
    return { url: raw, source: raw, status: 'invalid', message: 'Not a valid URL' };
  }

  if (!/^https:\/\//i.test(url)) {
    return { url, source: raw, status: 'invalid', message: 'Crawlers require an https URL' };
  }

  const primary = await probeImage(url, timeoutMs);
  if (primary.ok) {
    return { url, source: raw, status: 'ok', width: primary.width, height: primary.height };
  }

  // The asset may exist in this build but not be published yet.
  const local = localEquivalent(url);
  if (local) {
    const localHit = await probeImage(local, timeoutMs);
    if (localHit.ok) {
      return {
        url,
        source: raw,
        status: 'local-only',
        width: localHit.width,
        height: localHit.height,
        message: 'Present in this build but not live yet — publish the site so crawlers can fetch it',
      };
    }
  }

  return { url, source: raw, status: 'unreachable', message: 'Did not load (404, blocked host or timeout)' };
}

export interface OgImageReport {
  og: ImageCheck & { tier: OgImageTier; tierLabel: string };
  /** Every image referenced inside the post body. */
  body: ImageCheck[];
  /** Branded fallbacks that must exist for the chain to be safe. */
  fallbacks: ImageCheck[];
  problems: ImageCheck[];
  warnings: ImageCheck[];
  hasProblems: boolean;
}

/**
 * Resolve the og:image for a post and verify that it, every in-body image and
 * the branded fallbacks are actually reachable.
 */
export async function checkPostImages(
  post: OgImageSource,
  options: { timeoutMs?: number; includeFallbacks?: boolean } = {},
): Promise<OgImageReport> {
  const { timeoutMs, includeFallbacks = true } = options;
  const resolved = resolveBlogOgImageSource(post);

  const fallbackTargets = includeFallbacks
    ? [OG_FALLBACK_IMAGES.default, post.category ? OG_FALLBACK_IMAGES[post.category] : undefined].filter(
        (value): value is string => Boolean(value),
      )
    : [];

  const [ogCheck, bodyChecks, fallbackChecks] = await Promise.all([
    checkImageUrl(resolved.url, timeoutMs),
    Promise.all(contentImages(post.content).map((src) => checkImageUrl(src, timeoutMs))),
    Promise.all([...new Set(fallbackTargets)].map((src) => checkImageUrl(src, timeoutMs))),
  ]);

  const og = { ...ogCheck, tier: resolved.tier, tierLabel: resolved.label };
  const all = [og, ...bodyChecks, ...fallbackChecks];

  return {
    og,
    body: bodyChecks,
    fallbacks: fallbackChecks,
    problems: all.filter((c) => c.status === 'unreachable' || c.status === 'invalid'),
    warnings: all.filter((c) => c.status === 'local-only'),
    hasProblems: all.some((c) => c.status === 'unreachable' || c.status === 'invalid'),
  };
}
