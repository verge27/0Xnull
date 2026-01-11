import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Common crawler user agents
const CRAWLER_PATTERNS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'Slackbot',
  'TelegramBot',
  'Discordbot',
  'Pinterest',
  'Googlebot',
  'bingbot',
  'Applebot',
];

const isCrawler = (userAgent: string): boolean => {
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some(pattern => ua.includes(pattern.toLowerCase()));
};

const CREATOR_API_BASE = 'https://xnull.io';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const creatorId = url.searchParams.get('id');
    const userAgent = req.headers.get('user-agent') || '';

    console.log(`[creator-og] Request for creator: ${creatorId}, UA: ${userAgent.substring(0, 50)}`);

    if (!creatorId) {
      return new Response(JSON.stringify({ error: 'Missing creator ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if request is from a crawler
    const crawlerDetected = isCrawler(userAgent);
    console.log(`[creator-og] Crawler detected: ${crawlerDetected}`);

    if (!crawlerDetected) {
      // For regular users, return a redirect to the SPA
      return new Response(JSON.stringify({ redirect: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch creator profile from external API
    const profileRes = await fetch(`${CREATOR_API_BASE}/api/creators/${creatorId}`);
    
    if (!profileRes.ok) {
      console.error(`[creator-og] Failed to fetch creator: ${profileRes.status}`);
      return new Response(generateFallbackHtml(creatorId), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const profile = await profileRes.json();
    console.log(`[creator-og] Fetched profile: ${profile.display_name}`);

    const html = generateOgHtml(profile, creatorId);

    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    });

  } catch (error) {
    console.error('[creator-og] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

interface CreatorProfile {
  id: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  content_count?: number;
  subscriber_count?: number;
}

function generateOgHtml(profile: CreatorProfile, creatorId: string): string {
  const displayName = profile.display_name || 'Creator';
  const title = `${displayName} - 0xNull Creators`;
  const description = profile.bio 
    || `Check out ${displayName} on 0xNull Creators. ${profile.content_count || 0} posts, ${profile.subscriber_count || 0} subscribers.`;
  const url = `https://0xnull.io/creator/${creatorId}`;
  const image = profile.avatar_url 
    ? `https://xnull.io${profile.avatar_url.startsWith('/') ? '' : '/'}${profile.avatar_url}`
    : 'https://0xnull.io/og-image.png';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${escapeHtml(title)}</title>
  <meta name="title" content="${escapeHtml(title)}">
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="0xNull Creators">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${image}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${url}">
  <meta property="twitter:title" content="${escapeHtml(title)}">
  <meta property="twitter:description" content="${escapeHtml(description)}">
  <meta property="twitter:image" content="${image}">
  
  <!-- Redirect non-crawlers to the SPA -->
  <meta http-equiv="refresh" content="0; url=${url}">
  <link rel="canonical" href="${url}">
</head>
<body>
  <p>Redirecting to <a href="${url}">${escapeHtml(displayName)}'s profile</a>...</p>
</body>
</html>`;
}

function generateFallbackHtml(creatorId: string): string {
  const title = 'Creator - 0xNull Creators';
  const description = 'Discover creators on 0xNull. A privacy-first creator platform with Monero payments.';
  const url = `https://0xnull.io/creator/${creatorId}`;
  const image = 'https://0xnull.io/og-image.png';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <title>${title}</title>
  <meta name="description" content="${description}">
  
  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="0xNull Creators">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${url}">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="${image}">
  
  <meta http-equiv="refresh" content="0; url=${url}">
  <link rel="canonical" href="${url}">
</head>
<body>
  <p>Redirecting to <a href="${url}">creator profile</a>...</p>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
