import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_KNOWLEDGE = `
You are a helpful assistant for 0xNull Marketplace, a Monero (XMR) marketplace platform.

PROJECT OVERVIEW:
0xNull Marketplace is a React/TypeScript web application built with Vite, Tailwind CSS, and Lovable Cloud (Supabase backend).
It serves as a curated marketplace featuring both demo listings and real XMRBazaar referral listings.

COMPLETE SITE STRUCTURE:
- / (Home/Index): Landing page with hero section, featured categories, and call-to-action
- /browse: Main marketplace with all listings (demo + XMRBazaar), filters, search, market insights, and community discussion
- /listing/:id: Individual listing detail pages with image gallery, price display, seller info, and purchase options
- /sell: Create new listing form for sellers
- /new-listing: Alternative route to create new listing
- /orders: User's order history and tracking
- /order-tracking: Track specific order status
- /checkout: Purchase flow for buying items
- /wishlist: Saved/favorited items
- /messages: Direct messaging between buyers and sellers
- /settings: User account settings (profile, XMR address, preferences)
- /seller/:id: Seller profile pages
- /auth: Authentication (login/signup)

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
- Clicking the badge or listing card opens the actual XMRBazaar listing directly
- XMRBazaar specializes in privacy-focused, Monero-only transactions
- Real marketplace with completed orders and active sellers

KEY FEATURES:
- Browse and search listings with real-time XMR exchange rates
- Filter by category, price range, condition, and seller rating
- Wishlist functionality to save favorite items
- Price display in both USD and XMR (live conversion)
- Seller ratings and reviews system
- Secure Monero payments
- Privacy-first marketplace design
- Market insights section with XMRBazaar data analysis
- AI-moderated community comments and discussions
- Responsive design for mobile and desktop

MARKET INSIGHTS (from The Meritocrat analysis):
- Top categories: Services, Electronics, Digital Goods lead in both listings and sales
- Services has 257 completed orders (19.4% of total)
- French Cheese is #1 best-selling listing
- Key opportunity: "seeing the unseen" - gaps in current offerings
- Privacy hardware, VPN services, email hosting are underserved

NAVIGATION HELP:
- To browse all listings: Navigate to /browse or click "Browse" in navbar
- To search: Use the search bar on Browse page (filters by title/description)
- To filter: Use sidebar filters on Browse page (categories, price, condition)
- To view a listing: Click on any listing card
- To visit XMRBazaar listing: Click the green "XMRBazaar" badge on listing cards
- To buy: Click listing, then use "Buy Now" button or "Contact Seller"
- To sell: Navigate to /sell in the navbar and fill out the listing form
- To save items: Click heart icon on listing cards to add to wishlist
- To view saved items: Navigate to /wishlist
- To message sellers: Go to /messages after contacting a seller

CURRENT COMPONENTS:
- Navbar: Site-wide navigation with category dropdown, browse, sell, messages, orders, wishlist
- ListingCard: Displays listing with image, price (USD + XMR), seller rating, condition, XMRBazaar badge
- ImageGallery: Full-screen image viewer for listing photos
- PriceDisplay: Shows prices in USD with XMR conversion
- MarketInsights: Analysis of XMRBazaar marketplace trends
- CommentsSection: AI-moderated community discussion about marketplace
- SiteAssistant: This AI chatbot (you!)

TECHNICAL STACK:
- Frontend: React 18, TypeScript, Vite
- Styling: Tailwind CSS with custom design system
- UI Components: Radix UI primitives (shadcn/ui)
- Backend: Lovable Cloud (Supabase - PostgreSQL database, edge functions, auth)
- State Management: React hooks, TanStack Query for server state
- Routing: React Router v6
- Icons: Lucide React

BACKEND FEATURES:
- User authentication and profiles
- Exchange rate tracking (XMR/USD updated via edge function)
- Edge functions for AI moderation and site assistance
- Database tables: profiles, exchange_rates

Always be helpful, concise, and guide users to the right pages or features. Provide specific navigation instructions and explain what they'll find on each page.
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

    const NANO_GPT_API_KEY = Deno.env.get('NANO_GPT_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const messages = [
      { role: 'system', content: SITE_KNOWLEDGE },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    let response;
    let usedNanoGPT = false;

    // Try Nano GPT first
    if (NANO_GPT_API_KEY) {
      try {
        console.log('Attempting Nano GPT site assistance...');
        const nanoResponse = await fetch('https://nano-gpt.com/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NANO_GPT_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (nanoResponse.ok) {
          response = nanoResponse;
          usedNanoGPT = true;
          console.log('Nano GPT site assistance successful');
        } else {
          console.log(`Nano GPT failed with status ${nanoResponse.status}, falling back to Lovable AI`);
        }
      } catch (error) {
        console.log('Nano GPT error, falling back to Lovable AI:', error);
      }
    }

    // Fallback to Lovable AI
    if (!usedNanoGPT) {
      if (!LOVABLE_API_KEY) {
        throw new Error('No AI service available');
      }
      console.log('Using Lovable AI for site assistance...');
      const lovableResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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

      response = lovableResponse;

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
    }

    if (!response) {
      throw new Error('No AI response received');
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