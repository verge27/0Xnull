const SITE_URL = 'https://0xnull.io';

/** Site-wide fallback used when nothing better can be derived. */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

/**
 * Branded 1200x630 thumbnails shipped in /public so every post has a real
 * social preview even when no featured image was uploaded.
 */
const CATEGORY_FALLBACKS: Record<string, string> = {
  esports: `${SITE_URL}/images/blog/og-fallback-esports.jpg`,
  sports: `${SITE_URL}/images/blog/og-fallback-sports.jpg`,
  crypto: `${SITE_URL}/images/blog/og-fallback-crypto.jpg`,
  flash: `${SITE_URL}/images/blog/og-fallback-flash.jpg`,
};

/** Every branded fallback thumbnail that must exist in /public. */
export const OG_FALLBACK_IMAGES: Record<string, string> = {
  ...CATEGORY_FALLBACKS,
  default: DEFAULT_OG_IMAGE,
};

/** Turn a relative asset path into the absolute URL social crawlers require. */
export function absoluteImageUrl(src: string): string {
  const trimmed = src.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return `${SITE_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

/** Every image referenced in markdown content, either ![alt](src) or <img src="">. */
export function contentImages(content?: string | null): string[] {
  if (!content) return [];
  const found: string[] = [];
  for (const m of content.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) {
    if (m[1]) found.push(m[1]);
  }
  for (const m of content.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    if (m[1]) found.push(m[1]);
  }
  return [...new Set(found.map((src) => src.trim()).filter(Boolean))];
}

/** First image referenced in markdown content, either ![alt](src) or <img src="">. */
function firstContentImage(content?: string | null): string | undefined {
  return contentImages(content)[0];
}


export interface OgImageSource {
  featured_image?: string | null;
  content?: string | null;
  category?: string | null;
}

/**
 * Pick the best og:image for a post:
 * featured image -> first image inside the post body -> category thumbnail ->
 * site default. Always returns an absolute https URL.
 */
export function resolveBlogOgImage(post?: OgImageSource | null): string {
  return resolveBlogOgImageSource(post).url;
}

export type OgImageTier = 'featured' | 'content' | 'category' | 'default';

export interface ResolvedOgImage {
  url: string;
  /** Which step of the fallback chain produced the URL. */
  tier: OgImageTier;
  /** Human label for the editor UI. */
  label: string;
}

const TIER_LABELS: Record<OgImageTier, string> = {
  featured: 'Featured image',
  content: 'First in-body image',
  category: 'Category fallback thumbnail',
  default: 'Site default og-image.png',
};

/** Same resolution as resolveBlogOgImage, but reports which tier was used. */
export function resolveBlogOgImageSource(post?: OgImageSource | null): ResolvedOgImage {
  const pick = (tier: OgImageTier, src: string): ResolvedOgImage => ({
    tier,
    url: absoluteImageUrl(src),
    label: TIER_LABELS[tier],
  });

  const featured = post?.featured_image?.trim();
  if (featured) return pick('featured', featured);

  const body = firstContentImage(post?.content);
  if (body) return pick('content', body);

  const category = post?.category ? CATEGORY_FALLBACKS[post.category] : undefined;
  if (category) return pick('category', category);

  return pick('default', DEFAULT_OG_IMAGE);
}

