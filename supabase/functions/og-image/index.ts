import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple SVG-based OG image generation
function generateSVG(params: {
  title: string;
  subtitle?: string;
  type: 'listing' | 'market' | 'seller' | 'page';
  price?: string;
  category?: string;
}): string {
  const { title, subtitle, type, price, category } = params;
  
  // Truncate title if too long
  const truncatedTitle = title.length > 60 ? title.slice(0, 57) + '...' : title;
  const truncatedSubtitle = subtitle && subtitle.length > 100 ? subtitle.slice(0, 97) + '...' : subtitle;
  
  // Color schemes based on type
  const colorSchemes = {
    listing: { bg: '#1a1a2e', accent: '#f97316', text: '#ffffff' },
    market: { bg: '#0f1419', accent: '#10b981', text: '#ffffff' },
    seller: { bg: '#1e1b4b', accent: '#8b5cf6', text: '#ffffff' },
    page: { bg: '#0a0a0a', accent: '#f97316', text: '#ffffff' },
  };
  
  const colors = colorSchemes[type] || colorSchemes.page;
  
  // Generate SVG
  return `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.bg};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${colors.accent};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.accent};stop-opacity:0.6" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg-gradient)"/>
  
  <!-- Grid pattern overlay -->
  <pattern id="grid" patternUnits="userSpaceOnUse" width="40" height="40">
    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${colors.accent}" stroke-width="0.5" opacity="0.1"/>
  </pattern>
  <rect width="1200" height="630" fill="url(#grid)"/>
  
  <!-- Accent bar -->
  <rect x="0" y="0" width="8" height="630" fill="url(#accent-gradient)"/>
  
  <!-- Logo area -->
  <text x="60" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="${colors.accent}">0xNull</text>
  
  <!-- Type badge -->
  <rect x="60" y="120" width="${type.length * 12 + 30}" height="36" rx="18" fill="${colors.accent}" opacity="0.2"/>
  <text x="75" y="145" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="${colors.accent}" text-transform="uppercase">${type.toUpperCase()}</text>
  
  <!-- Main title -->
  <text x="60" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="700" fill="${colors.text}">
    ${escapeXml(truncatedTitle)}
  </text>
  
  <!-- Subtitle -->
  ${truncatedSubtitle ? `
  <text x="60" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="${colors.text}" opacity="0.7">
    ${escapeXml(truncatedSubtitle)}
  </text>
  ` : ''}
  
  <!-- Price tag (if applicable) -->
  ${price ? `
  <rect x="60" y="400" width="${price.length * 20 + 40}" height="60" rx="12" fill="${colors.accent}"/>
  <text x="80" y="442" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="#000000">${escapeXml(price)}</text>
  ` : ''}
  
  <!-- Category badge (if applicable) -->
  ${category ? `
  <rect x="${price ? 60 + price.length * 20 + 60 : 60}" y="400" width="${category.length * 12 + 30}" height="60" rx="12" fill="${colors.text}" opacity="0.1"/>
  <text x="${price ? 75 + price.length * 20 + 60 : 75}" y="442" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="${colors.text}" opacity="0.8">${escapeXml(category)}</text>
  ` : ''}
  
  <!-- Footer -->
  <text x="60" y="580" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="${colors.text}" opacity="0.5">Anonymous Predictions &amp; Marketplace • 0xnull.io</text>
  
  <!-- Decorative elements -->
  <circle cx="1100" cy="100" r="80" fill="${colors.accent}" opacity="0.1"/>
  <circle cx="1050" cy="530" r="120" fill="${colors.accent}" opacity="0.05"/>
</svg>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const title = url.searchParams.get('title') || '0xNull';
    const subtitle = url.searchParams.get('subtitle') || '';
    const type = (url.searchParams.get('type') as 'listing' | 'market' | 'seller' | 'page') || 'page';
    const price = url.searchParams.get('price') || '';
    const category = url.searchParams.get('category') || '';

    console.log(`Generating OG image: type=${type}, title=${title.slice(0, 30)}...`);

    const svg = generateSVG({ title, subtitle, type, price, category });

    return new Response(svg, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate image' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
