import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_KNOWLEDGE = `
You are a helpful assistant for 0xNull Marketplace, a privacy-focused Monero (XMR) marketplace platform.

PROJECT OVERVIEW:
0xNull Marketplace is a React/TypeScript web application that serves as a privacy-first marketplace. It features XMRBazaar referral listings, partner stores, crypto swaps, fiat on/off ramps, and resources for privacy enthusiasts.

COMPLETE SITE STRUCTURE:

MAIN PAGES:
- / (Home): Landing page with hero section, features, and how it works
- /browse: Main marketplace with all listings, filters, search, market insights, and community discussion
- /listing/:id: Individual listing detail pages with image gallery, price display, seller info
- /sell: Create new listing form for sellers
- /checkout: Purchase flow for buying items

USER PAGES:
- /auth: Authentication (login/signup)
- /orders: User's order history and tracking
- /order-tracking: Track specific order status
- /wishlist: Saved/favorited items
- /messages: Direct messaging between buyers and sellers
- /settings: User account settings (profile, XMR address, preferences)
- /seller/:id: Seller profile pages

CRYPTO & FINANCE:
- /swaps: Cryptocurrency swap interface powered by Trocador - swap between 200+ cryptocurrencies with no KYC
- /buy: Fiat on-ramp powered by Onramper - buy crypto with fiat currency (credit card, bank transfer)
- /sell-crypto: Fiat off-ramp - sell crypto for fiat

RESOURCES & GUIDES:
- /ai: Access to 480+ AI models including premium, uncensored, image, and video models via NanoGPT
- /vps: VPS and hosting recommendations for privacy
- /grapheneos: Guide to GrapheneOS privacy-focused mobile OS
- /vpn: VPN resources and recommendations
- /phone: Privacy phone recommendations
- /philosophy: Marketplace philosophy and values
- /harm-reduction: Harm reduction information
- /privacy: Privacy policy
- /terms: Terms of service

CATEGORIES AVAILABLE:
1. Services (crypto-exchange, proxy-shopping, programming, design, hosting, automotive)
2. Electronics (phones, hardware, telecom)
3. Digital Goods (domains, eSIMs)
4. Accessories (stickers, patches, watches)
5. Physical Goods (various items)
6. Food & Local (artisan foods, local services)
7. Sports & Outdoor
8. Adult (18+ products from partner stores)
9. Health & Wellness (peptides, supplements)

PARTNER STORES:
- XMRBazaar: Main Monero marketplace - real listings with XMRBazaar badge (green)
- Freak In The Sheets: Adult products store (age-verified)
- Peptides UK & UK Peptides: Research peptides and supplements

KEY FEATURES:
- Browse and search listings with real-time XMR exchange rates
- Filter by category, price range, condition, and seller rating
- Wishlist functionality to save favorite items
- Price display in both USD and XMR (live conversion)
- Seller ratings and reviews system
- Secure Monero payments via Trocador AnonPay
- Crypto swaps between 200+ coins (no KYC)
- Fiat on-ramp to buy crypto easily
- AI-moderated community comments
- Market insights with XMRBazaar data analysis

CRYPTO SWAP FEATURE (/swaps):
- Powered by Trocador exchange aggregator
- Swap between 200+ cryptocurrencies
- No KYC required
- Multiple provider quotes to find best rates
- Shows ETA, KYC rating, and insurance info

FIAT ON-RAMP (/buy):
- Powered by Onramper
- Buy crypto with credit card, bank transfer, Apple Pay, Google Pay
- Supports 100+ fiat currencies
- 30+ payment providers aggregated

AI PAGE (/ai):
- Access to NanoGPT platform
- 480+ AI models available
- Premium models (GPT-4, Claude, Gemini)
- Uncensored models (Dolphin, WizardLM)
- Image generation (Flux, SDXL, Midjourney)
- Video generation (Sora, Runway)
- Pay-per-prompt pricing
- Privacy-focused - no accounts required

NAVIGATION HELP:
- To browse all listings: Click "Browse" in navbar or go to /browse
- To swap crypto: Click "Swaps" in navbar or go to /swaps
- To buy crypto with fiat: Go to /buy
- To use AI models: Go to /ai
- To search: Use the search bar on Browse page
- To filter: Use sidebar filters on Browse page
- To view a listing: Click on any listing card
- To buy: Click listing, then use "Buy Now" button
- To sell: Click "Sell" in navbar

Always be helpful, concise, and guide users to the right pages or features. If users ask about crypto, direct them to /swaps for swapping or /buy for purchasing. For privacy questions, mention the VPN, GrapheneOS, and philosophy pages.
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