import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
};

const SITE_URL = 'https://0xnull.io';

// Static pages with their metadata
const staticPages = [
  { path: '/', priority: '1.0', changefreq: 'daily', lastmod: '2025-01-02' },
  { path: '/predict', priority: '0.9', changefreq: 'daily', lastmod: '2025-01-02' },
  { path: '/sports-predictions', priority: '0.8', changefreq: 'daily', lastmod: '2025-01-02' },
  { path: '/esports-predictions', priority: '0.8', changefreq: 'daily', lastmod: '2025-01-02' },
  { path: '/predictions', priority: '0.8', changefreq: 'daily', lastmod: '2025-01-02' },
  { path: '/cricket-predictions', priority: '0.7', changefreq: 'daily', lastmod: '2025-01-02' },
  { path: '/starcraft', priority: '0.7', changefreq: 'daily', lastmod: '2025-01-02' },
  { path: '/predictions/sports/combat', priority: '0.7', changefreq: 'daily', lastmod: '2025-01-02' },
  { path: '/how-betting-works', priority: '0.6', changefreq: 'monthly', lastmod: '2024-12-15' },
  { path: '/infra', priority: '0.8', changefreq: 'weekly', lastmod: '2024-12-20' },
  { path: '/swaps', priority: '0.8', changefreq: 'daily', lastmod: '2025-01-02' },
  { path: '/cashout', priority: '0.7', changefreq: 'weekly', lastmod: '2024-12-20' },
  { path: '/buy', priority: '0.7', changefreq: 'weekly', lastmod: '2024-12-20' },
  { path: '/vps', priority: '0.7', changefreq: 'weekly', lastmod: '2024-12-15' },
  { path: '/phone', priority: '0.7', changefreq: 'weekly', lastmod: '2024-12-15' },
  { path: '/ai', priority: '0.8', changefreq: 'weekly', lastmod: '2024-12-20' },
  { path: '/voice', priority: '0.7', changefreq: 'weekly', lastmod: '2024-12-15' },
  { path: '/kokoro', priority: '0.6', changefreq: 'weekly', lastmod: '2024-12-15' },
  { path: '/browse', priority: '0.7', changefreq: 'daily', lastmod: '2025-01-02' },
  { path: '/get-started', priority: '0.7', changefreq: 'monthly', lastmod: '2024-12-15' },
  { path: '/safety', priority: '0.6', changefreq: 'monthly', lastmod: '2024-12-01' },
  { path: '/vpn-resources', priority: '0.6', changefreq: 'monthly', lastmod: '2024-12-01' },
  { path: '/grapheneos', priority: '0.6', changefreq: 'monthly', lastmod: '2024-12-01' },
  { path: '/tor-guide', priority: '0.6', changefreq: 'monthly', lastmod: '2024-12-01' },
  { path: '/philosophy', priority: '0.5', changefreq: 'yearly', lastmod: '2024-11-01' },
  { path: '/support', priority: '0.6', changefreq: 'monthly', lastmod: '2024-12-15' },
  { path: '/verify', priority: '0.5', changefreq: 'monthly', lastmod: '2026-01-09' },
  { path: '/terms', priority: '0.4', changefreq: 'yearly', lastmod: '2024-11-01' },
  { path: '/privacy', priority: '0.4', changefreq: 'yearly', lastmod: '2024-11-01' },
  { path: '/api-docs', priority: '0.5', changefreq: 'monthly', lastmod: '2024-12-15' },
  { path: '/influencer', priority: '0.5', changefreq: 'monthly', lastmod: '2024-12-15' },
  { path: '/blog', priority: '0.8', changefreq: 'daily', lastmod: '2026-01-21' },
  { path: '/lending', priority: '0.8', changefreq: 'weekly', lastmod: '2026-02-22' },
  { path: '/lending/privacy', priority: '0.5', changefreq: 'monthly', lastmod: '2026-02-22' },
  { path: '/governance-predictions', priority: '0.7', changefreq: 'daily', lastmod: '2026-02-22' },
  { path: '/creators', priority: '0.7', changefreq: 'weekly', lastmod: '2026-01-14' },
  { path: '/flash', priority: '0.8', changefreq: 'daily', lastmod: '2026-01-14' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating dynamic sitemap...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active listings
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, updated_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (listingsError) {
      console.error('Error fetching listings:', listingsError);
    }

    // Fetch published blog posts
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(500);

    if (blogError) {
      console.error('Error fetching blog posts:', blogError);
    }

    // Build XML sitemap
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    for (const page of staticPages) {
      xml += '  <url>\n';
      xml += `    <loc>${SITE_URL}${page.path}</loc>\n`;
      xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    // Add dynamic blog post pages
    if (blogPosts && blogPosts.length > 0) {
      console.log(`Adding ${blogPosts.length} blog posts to sitemap`);
      for (const post of blogPosts) {
        const lastmod = post.updated_at 
          ? new Date(post.updated_at).toISOString().split('T')[0]
          : post.published_at 
            ? new Date(post.published_at).toISOString().split('T')[0]
            : '2026-01-21';
        xml += '  <url>\n';
        xml += `    <loc>${SITE_URL}/blog/${post.slug}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += '  </url>\n';
      }
    }

    // Add dynamic listing pages
    if (listings && listings.length > 0) {
      console.log(`Adding ${listings.length} listings to sitemap`);
      for (const listing of listings) {
        const lastmod = listing.updated_at 
          ? new Date(listing.updated_at).toISOString().split('T')[0]
          : '2025-01-02';
        xml += '  <url>\n';
        xml += `    <loc>${SITE_URL}/listing/${listing.id}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        xml += '  </url>\n';
      }
    }

    xml += '</urlset>';

    console.log('Sitemap generated successfully');

    return new Response(xml, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
});
