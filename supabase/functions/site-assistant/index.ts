import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_KNOWLEDGE = `
You are a helpful assistant for the Tari Market, a Monero (XMR) marketplace platform.

SITE STRUCTURE:
- / (Home): Landing page with hero section and featured categories
- /browse: Main marketplace with listings from XMRBazaar and demo items
- /listing/:id: Individual listing detail pages
- /sell: Page for sellers to create new listings
- /orders: User's order history
- /wishlist: Saved items
- /messages: Direct messaging between buyers and sellers
- /settings: User account settings

CATEGORIES AVAILABLE:
1. Services (crypto-exchange, proxy-shopping, programming, design, hosting, automotive)
2. Electronics (phones, hardware, telecom)
3. Digital Goods (domains, eSIMs)
4. Accessories (stickers, patches, watches)
5. Physical Goods (various items)
6. Food & Local (artisan foods, local services)
7. Sports & Outdoor

XMRBAZAAR INTEGRATION:
- Many listings are referral links to XMRBazaar.com
- These display an "XMRBazaar" badge in green
- Clicking these listings opens the actual XMRBazaar marketplace
- XMRBazaar specializes in privacy-focused, Monero-only transactions

FEATURES:
- Browse and search listings
- Filter by category, price range, condition
- Wishlist functionality
- Price display in both USD and XMR
- Seller ratings and reviews
- Secure Monero payments
- Privacy-first marketplace design
- Market insights and community discussions

NAVIGATION HELP:
- To browse all listings: Go to /browse
- To search: Use the search bar on Browse page
- To filter: Use sidebar filters on Browse page
- To view a listing: Click on any listing card
- To buy: Click listing, then use "Buy Now" or contact seller
- To sell: Navigate to /sell and create a listing

CURRENT PAGE FEATURES (Browse):
- Grid view of all listings
- Category filter sidebar
- Search functionality
- Price range slider
- Sort options (relevance, price, newest)
- Market insights section with XMRBazaar analysis
- Community comments and discussions

Always be helpful, concise, and guide users to the right pages or features.
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();
    
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const messages = [
      { role: 'system', content: SITE_KNOWLEDGE },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content;

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        conversationHistory: [...conversationHistory, 
          { role: 'user', content: message },
          { role: 'assistant', content: assistantMessage }
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Site assistant error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});