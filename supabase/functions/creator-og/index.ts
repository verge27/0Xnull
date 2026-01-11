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

interface CreatorProfile {
  id: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  content_count?: number;
  subscriber_count?: number;
}

interface ContentItem {
  id: string;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  media_url?: string;
  media_type?: string;
  creator_id?: string;
  is_premium?: boolean;
  price?: number;
  created_at?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateCreatorOgHtml(profile: CreatorProfile, creatorId: string): string {
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

function generateCreatorFallbackHtml(creatorId: string): string {
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

function generateContentOgHtml(content: ContentItem, creatorName: string, creatorId: string | null): string {
  const title = content.title 
    ? `${content.title} by ${creatorName} - 0xNull Creators`
    : `Content by ${creatorName} - 0xNull Creators`;
  
  const description = content.description 
    || `${content.is_premium ? '🔒 Premium content' : 'Content'} by ${creatorName} on 0xNull Creators.${content.price ? ` $${content.price}` : ''}`;
  
  const url = creatorId 
    ? `https://0xnull.io/creator/${creatorId}/content/${content.id}`
    : `https://0xnull.io/content/${content.id}`;
  
  // Use thumbnail, or media URL for images, or fallback to OG image
  let image = 'https://0xnull.io/og-image.png';
  if (content.thumbnail_url) {
    image = `https://xnull.io${content.thumbnail_url.startsWith('/') ? '' : '/'}${content.thumbnail_url}`;
  } else if (content.media_url && content.media_type?.startsWith('image')) {
    image = `https://xnull.io${content.media_url.startsWith('/') ? '' : '/'}${content.media_url}`;
  }

  const ogType = content.media_type?.startsWith('video') ? 'video.other' : 'article';
  const twitterCard = content.media_type?.startsWith('video') ? 'player' : 'summary_large_image';

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
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="0xNull Creators">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${image}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="${twitterCard}">
  <meta property="twitter:url" content="${url}">
  <meta property="twitter:title" content="${escapeHtml(title)}">
  <meta property="twitter:description" content="${escapeHtml(description)}">
  <meta property="twitter:image" content="${image}">
  
  <!-- Redirect non-crawlers to the SPA -->
  <meta http-equiv="refresh" content="0; url=${url}">
  <link rel="canonical" href="${url}">
</head>
<body>
  <p>Redirecting to <a href="${url}">${escapeHtml(content.title || 'content')}</a>...</p>
</body>
</html>`;
}

function generateContentFallbackHtml(contentId: string, creatorId: string | null): string {
  const title = 'Content - 0xNull Creators';
  const description = 'View content on 0xNull Creators. A privacy-first creator platform with Monero payments.';
  const url = creatorId 
    ? `https://0xnull.io/creator/${creatorId}/content/${contentId}`
    : `https://0xnull.io/content/${contentId}`;
  const image = 'https://0xnull.io/og-image.png';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <title>${title}</title>
  <meta name="description" content="${description}">
  
  <meta property="og:type" content="article">
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
  <p>Redirecting to <a href="${url}">content</a>...</p>
</body>
</html>`;
}

async function handleCreatorOg(creatorId: string): Promise<Response> {
  try {
    const profileRes = await fetch(`${CREATOR_API_BASE}/api/creators/${creatorId}`);
    
    if (!profileRes.ok) {
      console.error(`[creator-og] Failed to fetch creator: ${profileRes.status}`);
      return new Response(generateCreatorFallbackHtml(creatorId), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const profile = await profileRes.json();
    console.log(`[creator-og] Fetched profile: ${profile.display_name}`);

    const html = generateCreatorOgHtml(profile, creatorId);
    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    console.error('[creator-og] Creator fetch error:', error);
    return new Response(generateCreatorFallbackHtml(creatorId), {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

async function handleContentOg(contentId: string, creatorId: string | null): Promise<Response> {
  try {
    const contentRes = await fetch(`${CREATOR_API_BASE}/api/content/${contentId}`);
    
    if (!contentRes.ok) {
      console.error(`[creator-og] Failed to fetch content: ${contentRes.status}`);
      return new Response(generateContentFallbackHtml(contentId, creatorId), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const content = await contentRes.json();
    console.log(`[creator-og] Fetched content: ${content.title || content.id}`);

    // Try to get creator info if we have creator_id from content
    let creatorName = 'Creator';
    const cId = creatorId || content.creator_id;
    if (cId) {
      try {
        const creatorRes = await fetch(`${CREATOR_API_BASE}/api/creators/${cId}`);
        if (creatorRes.ok) {
          const creator = await creatorRes.json();
          creatorName = creator.display_name || 'Creator';
        }
      } catch {
        // Ignore creator fetch errors
      }
    }

    const html = generateContentOgHtml(content, creatorName, cId);
    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    console.error('[creator-og] Content fetch error:', error);
    return new Response(generateContentFallbackHtml(contentId, creatorId), {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'creator'; // 'creator' or 'content'
    const creatorId = url.searchParams.get('id');
    const contentId = url.searchParams.get('contentId');
    const userAgent = req.headers.get('user-agent') || '';

    console.log(`[creator-og] Request type: ${type}, creator: ${creatorId}, content: ${contentId}, UA: ${userAgent.substring(0, 50)}`);

    // Check if request is from a crawler
    const crawlerDetected = isCrawler(userAgent);
    console.log(`[creator-og] Crawler detected: ${crawlerDetected}`);

    if (!crawlerDetected) {
      // For regular users, return a redirect indicator
      return new Response(JSON.stringify({ redirect: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle content OG tags
    if (type === 'content' && contentId) {
      return await handleContentOg(contentId, creatorId);
    }

    // Handle creator profile OG tags
    if (!creatorId) {
      return new Response(JSON.stringify({ error: 'Missing creator ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return await handleCreatorOg(creatorId);

  } catch (error) {
    console.error('[creator-og] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
