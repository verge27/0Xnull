import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface GuideDefinition {
  slug: string;
  /** Keyword-rich fallback heading, used until (or unless) the live post title loads. */
  fallbackTitle: string;
  /** Keyword-rich anchor text pointing at the post. */
  anchor: string;
  /** Fallback body copy with contextual internal links. */
  body: ReactNode;
  cta: string;
}

export const GUIDES: Record<'cs2' | 'vps', GuideDefinition> = {
  cs2: {
    slug: 'cs2-betting-guide-crypto',
    fallbackTitle: 'CS2 betting guide',
    anchor: 'how to bet on CS2 matches with crypto',
    body: (
      <>
        Bet types, reading odds, map pool analysis and the no-KYC platforms that cover Counter-Strike 2. Then take a
        position on our <Link to="/esports-predictions" className="text-primary hover:underline">esports prediction markets</Link>.
      </>
    ),
    cta: 'Read the CS2 betting guide',
  },
  vps: {
    slug: 'anonymous-vps-hosting-crypto-guide',
    fallbackTitle: 'Anonymous VPS hosting',
    anchor: 'anonymous VPS hosting paid in Monero',
    body: (
      <>
        Compare no-KYC providers by jurisdiction and price, then buy over Tor and harden the box. See also our{' '}
        <Link to="/vps" className="text-primary hover:underline">anonymous VPS plans</Link>.
      </>
    ),
    cta: 'Read the VPS hosting guide',
  },
};

interface LivePost {
  slug: string;
  title: string;
  excerpt: string | null;
}

interface RelatedGuidesProps {
  guides?: GuideDefinition[];
  heading?: string;
  intro?: string;
  headingId?: string;
  className?: string;
  compact?: boolean;
}

export function RelatedGuides({
  guides = [GUIDES.cs2, GUIDES.vps],
  heading = 'Related guides',
  intro,
  headingId = 'related-guides-heading',
  className = '',
  compact = false,
}: RelatedGuidesProps) {
  const [live, setLive] = useState<Record<string, LivePost>>({});

  useEffect(() => {
    let cancelled = false;
    const slugs = guides.map((g) => g.slug);

    (async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('slug, title, excerpt')
        .in('slug', slugs)
        .eq('status', 'published');

      if (cancelled || error || !data) return;
      setLive(Object.fromEntries(data.map((p) => [p.slug, p as LivePost])));
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guides.map((g) => g.slug).join(',')]);

  return (
    <section className={className} aria-labelledby={headingId}>
      <h2
        id={headingId}
        className={compact ? 'text-xl font-semibold mb-2' : 'text-3xl md:text-4xl font-bold text-center mb-4'}
      >
        {heading}
      </h2>
      {intro && (
        <p className={compact ? 'text-muted-foreground text-sm mb-4' : 'text-muted-foreground text-center mb-12 max-w-xl mx-auto'}>
          {intro}
        </p>
      )}
      <div className={`grid ${compact ? 'sm:grid-cols-2 gap-4' : 'md:grid-cols-2 gap-6 max-w-4xl mx-auto'}`}>
        {guides.map((guide) => {
          const post = live[guide.slug];
          const href = `/blog/${guide.slug}`;
          return (
            <article
              key={guide.slug}
              className={`h-full border border-border/50 bg-card/50 backdrop-blur rounded-lg ${compact ? 'p-4' : 'p-6'}`}
            >
              <h3 className={compact ? 'text-base font-semibold mb-2' : 'text-lg font-semibold mb-2'}>
                <Link to={href} className="hover:text-primary transition-colors">
                  {post?.title || guide.fallbackTitle}
                </Link>
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                <Link to={href} className="text-primary hover:underline">
                  {guide.anchor}
                </Link>{' '}
                — {post?.excerpt || guide.body}
              </p>
              <Link to={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                {guide.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
