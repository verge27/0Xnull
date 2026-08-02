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

/** Turn a relative asset path into the absolute URL social crawlers require. */
export function absoluteImageUrl(src: string): string {
  const trimmed = src.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return `${SITE_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

/** First image referenced in markdown content, either ![alt](src) or <img src="">. */
function firstContentImage(content?: string | null): string | undefined {
  if (!content) return undefined;
  const markdown = content.match(/!\[[^\]]*\]\(([^)\s]+)/);
  if (markdown?.[1]) return markdown[1];
  const html = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return html?.[1];
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
  if (!post) return DEFAULT_OG_IMAGE;

  const candidate =
    (post.featured_image && post.featured_image.trim()) ||
    firstContentImage(post.content) ||
    (post.category ? CATEGORY_FALLBACKS[post.category] : undefined);

  return candidate ? absoluteImageUrl(candidate) : DEFAULT_OG_IMAGE;
}
