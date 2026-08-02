import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveBlogOgImageSource, contentImages } from '@/lib/blogOgImage';
import { checkImageUrl, checkPostImages } from '@/lib/checkBlogImages';

/** Fake <img> that succeeds only for URLs in `reachable`. */
function stubImageLoader(reachable: string[]) {
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = 1200;
    naturalHeight = 630;
    set src(value: string) {
      queueMicrotask(() => {
        if (reachable.includes(value)) this.onload?.();
        else this.onerror?.();
      });
    }
  }
  vi.stubGlobal('Image', FakeImage as unknown as typeof Image);
}

describe('og:image resolution', () => {
  it('reports the fallback tier that produced the URL', () => {
    expect(resolveBlogOgImageSource({ featured_image: '/a.jpg' }).tier).toBe('featured');
    expect(resolveBlogOgImageSource({ content: '![x](/b.jpg)' }).tier).toBe('content');
    expect(resolveBlogOgImageSource({ category: 'crypto' }).tier).toBe('category');
    expect(resolveBlogOgImageSource({}).tier).toBe('default');
  });

  it('collects markdown and html images without duplicates', () => {
    expect(contentImages('![a](/one.jpg) <img src="/two.jpg"> ![b](/one.jpg)')).toEqual(['/one.jpg', '/two.jpg']);
  });
});

describe('image reachability checks', () => {
  afterEach(() => vi.unstubAllGlobals());
  beforeEach(() => vi.stubGlobal('window', { location: { origin: 'http://localhost:8080' } }));

  it('marks a loading image ok', async () => {
    stubImageLoader(['https://0xnull.io/good.jpg']);
    expect((await checkImageUrl('/good.jpg')).status).toBe('ok');
  });

  it('marks a missing image unreachable', async () => {
    stubImageLoader([]);
    expect((await checkImageUrl('/gone.jpg')).status).toBe('unreachable');
  });

  it('distinguishes assets present locally but not yet published', async () => {
    stubImageLoader(['http://localhost:8080/new.jpg']);
    expect((await checkImageUrl('/new.jpg')).status).toBe('local-only');
  });

  it('rejects values that are not usable URLs', async () => {
    stubImageLoader([]);
    expect((await checkImageUrl('   ')).status).toBe('invalid');
  });

  it('flags a broken in-body image even when the og:image is fine', async () => {
    stubImageLoader(['https://0xnull.io/hero.jpg', 'https://0xnull.io/og-image.png', 'https://0xnull.io/images/blog/og-fallback-crypto.jpg']);
    const report = await checkPostImages({
      featured_image: '/hero.jpg',
      content: '![a](/hero.jpg)\n![b](/missing.jpg)',
      category: 'crypto',
    });

    expect(report.og.status).toBe('ok');
    expect(report.og.tier).toBe('featured');
    expect(report.hasProblems).toBe(true);
    expect(report.problems.map((p) => p.url)).toEqual(['https://0xnull.io/missing.jpg']);
  });
});
