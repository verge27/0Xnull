# 0xNull.io

A privacy-first Monero (XMR) marketplace for trading physical goods, digital products, and services anonymously.

**Live Site:** [0xnull.io](https://0xnull.io)

## Overview

0xNull is a decentralized marketplace that prioritizes user privacy through cryptocurrency payments. The platform integrates with XMRBazaar for extended listings and uses Trocador AnonPay for secure, anonymous transactions.

### Key Features

- **Anonymous Trading** - Buy and sell with complete privacy using Monero (XMR)
- **Secure Payments** - Trocador AnonPay integration for cryptocurrency transactions
- **Live XMR Rates** - Real-time USD/XMR conversion via Supabase edge functions
- **XMRBazaar Integration** - Curated referral listings from the XMRBazaar marketplace
- **Partner Network** - Referral listings from vetted partner merchants
- **User Listings** - Sellers can create and manage their own listings (stored in Supabase)
- **AI Site Assistant** - Chatbot powered by NanoGPT for navigation help
- **AI Comment Moderation** - Automated moderation for community discussions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui (Radix primitives) |
| Backend | Supabase (PostgreSQL, Edge Functions, Auth) |
| State | TanStack Query, React hooks |
| Routing | React Router v6 |
| Payments | Trocador AnonPay (XMR) |
| Icons | Lucide React |

## Project Structure

```
src/
├── assets/              # Product images (XMRBazaar, partners)
├── components/          # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   ├── ListingCard.tsx  # Product card display
│   ├── Navbar.tsx       # Site navigation
│   ├── PriceDisplay.tsx # USD/XMR price conversion
│   └── SiteAssistant.tsx # AI chatbot
├── hooks/               # Custom React hooks
│   ├── useAuth.tsx      # Supabase authentication
│   ├── useExchangeRate.tsx # Live XMR rates
│   ├── useListings.tsx  # Database listings
│   └── useProfile.tsx   # User profiles
├── integrations/
│   └── supabase/        # Supabase client & types
├── lib/
│   ├── categories.ts    # Category hierarchy
│   ├── data.ts          # Demo listings & helpers
│   ├── partners/        # Partner listing configs
│   ├── types.ts         # TypeScript interfaces
│   └── xmrbazaar.ts     # XMRBazaar referral listings
├── pages/               # Route components
└── App.tsx              # Router & providers

supabase/
├── functions/           # Edge functions
│   ├── moderate-comment/   # AI content moderation
│   ├── site-assistant/     # AI chatbot
│   └── update-xmr-price/   # Exchange rate updates
└── migrations/          # Database schema
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing page with features & CTA |
| `/browse` | Marketplace with filters, search, categories |
| `/listing/:id` | Individual listing details |
| `/checkout/:orderId` | Payment flow with Trocador |
| `/order/:id` | Order tracking |
| `/sell` | Seller dashboard |
| `/sell/new` | Create new listing |
| `/orders` | User order history |
| `/wishlist` | Saved listings |
| `/messages` | Buyer/seller messaging |
| `/settings` | Account settings |
| `/seller/:id` | Seller profile |
| `/auth` | Login/signup |

## Categories

The marketplace supports 13 top-level categories with subcategories:

- Accessories (hats, scarves, sunglasses, etc.)
- Art & Collectibles
- Bags & Purses
- Bath & Beauty
- Clothing
- Electronics (phones, gadgets, accessories)
- Home & Living
- Jewelry
- Digital Goods (VPN, software, courses)
- Services (consulting, programming, design)
- Adult & Intimacy
- Health & Wellness (peptides, nootropics, supplements)
- Tools & Outdoors (knives, multi-tools, camping, hunting)

## Listing Sources

Listings come from four sources, displayed in this order:

1. **Database Listings** - User-created listings stored in Supabase
2. **XMRBazaar** - Curated referral links to XMRBazaar.com (green badge)
3. **Partner Listings** - Referral links to vetted partners
4. **Demo Listings** - Sample listings for demonstration (gray "Demo" badge)

## Database Schema

### Tables

**profiles**
- `id` (uuid, FK to auth.users)
- `display_name` (text)
- `xmr_address` (text, nullable)
- `created_at`, `updated_at` (timestamptz)

**listings**
- `id` (uuid)
- `seller_id` (uuid, FK to profiles)
- `title`, `description` (text)
- `price_usd`, `shipping_price_usd` (numeric)
- `category` (text)
- `images` (text[])
- `stock` (integer)
- `status` (active/sold_out/draft)
- `condition` (new/used/digital)
- `created_at` (timestamptz)

**exchange_rates**
- `currency_pair` (text, e.g., "XMR/USD")
- `rate` (numeric)
- `updated_at` (timestamptz)

## Edge Functions

### update-xmr-price
Fetches current XMR/USD rate from external APIs and updates `exchange_rates` table. Can be scheduled via cron.

### site-assistant
AI-powered chatbot with full site knowledge. Uses NanoGPT for responses. Provides navigation help and answers questions about the marketplace.

### moderate-comment
AI moderation for community comments. Filters spam, prohibited content, and maintains discussion quality.

## Environment Variables

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Edge function secrets (set in Supabase dashboard)
NANO_GPT_API_KEY=your-nanogpt-key
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Payment Flow

1. User clicks "Buy Now" on a listing
2. Order created with XMR amount calculated from live rate
3. Checkout page embeds Trocador AnonPay iframe
4. User pays with any supported crypto (auto-converts to XMR)
5. Payment confirmed → order status updated
6. Seller ships to buyer's provided address

## XMRBazaar Integration

The marketplace features curated listings from [XMRBazaar.com](https://xmrbazaar.com), a Monero-only marketplace. These listings:

- Display a green "XMRBazaar" badge
- Link directly to XMRBazaar for purchase
- Include seller ratings from the original platform
- Cover categories: services, electronics, digital goods, accessories

## Adding Partner Listings

Partner listings are referral links to vetted merchants. To add a partner:

1. Create a file in `src/lib/partners/` (e.g., `myPartner.ts`)
2. Export an array of listings with `referralUrl` pointing to the partner
3. Import and include in `Browse.tsx` listings array
4. Set `isPartner: true` and `partnerName` for proper display

## License

Proprietary - Margin Syndicate Limited

## Links

- [0xNull.io](https://0xnull.io)
- [XMRBazaar](https://xmrbazaar.com)
- [Trocador](https://trocador.app)
- [Monero](https://getmonero.org)
