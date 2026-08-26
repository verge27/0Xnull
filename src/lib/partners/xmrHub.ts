import type { Listing } from '../types';

const XMR_HUB_SHOP_URL = 'https://xmrhub.org/shop.html';
const LISTED_AT = '2026-08-26T00:00:00.000Z';

type XmrHubProduct = {
  id: string;
  title: string;
  priceUsd: number;
  category: string;
  subcategory: string;
  section: 'stickers' | 'shirts' | 'hats' | 'posters';
  image: string;
};

const products: XmrHubProduct[] = [
  { id: 'xmrhub-001', title: 'Monero To The Moon', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/Monerothemoonsticker.jpg' },
  { id: 'xmrhub-002', title: 'Monero Accepted Here', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/moneroacceptedhere.jpg' },
  { id: 'xmrhub-003', title: 'Privacy World Wide', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/Privacyworldwide.jpg' },
  { id: 'xmrhub-004', title: 'Buy XMR', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/buyXMRasanIMSGsticker.jpg' },
  { id: 'xmrhub-005', title: "If You're Reading This, Buy Monero", priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/ifyourerreadingthisbuyXMRsticker.jpg' },
  { id: 'xmrhub-006', title: 'Monero Maximalist', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/XMRMaxisticker.jpg' },
  { id: 'xmrhub-007', title: 'Evolution Of Money', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/Moneyevolsticker.jpg' },
  { id: 'xmrhub-008', title: 'Monero Hodl', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/hodlsticker.jpg' },
  { id: 'xmrhub-009', title: 'Fiat vs Monero Cycle', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/imported/fiat-vs-monero-cycle.jpg' },
  { id: 'xmrhub-010', title: 'HODL Me Monero Coin', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/imported/hodl-me-monero-coin.jpg' },
  { id: 'xmrhub-011', title: 'Inflation Is Not Transitory', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/imported/inflation-is-not-transitory.jpg' },
  { id: 'xmrhub-012', title: 'It Costs 0 To Study Monero', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/imported/it-costs-0-to-study-monero.jpg' },
  { id: 'xmrhub-013', title: 'Monero - Dont give up your privacy', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/imported/monero-dont-give-up-your-privacy.jpg' },
  { id: 'xmrhub-014', title: 'Monero Benefits Diagram', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/imported/monero-benefits-diagram.jpg' },
  { id: 'xmrhub-015', title: 'Monero Coin', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/imported/monero-coin.jpg' },
  { id: 'xmrhub-016', title: 'Monero Flowchart', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/imported/monero-flowchart.jpg' },
  { id: 'xmrhub-017', title: 'Monero Is The Future', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/imported/monero-is-the-future.jpg' },
  { id: 'xmrhub-018', title: 'Monero Standard vs Fiat System', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/imported/monero-standard-vs-fiat-system.jpg' },
  { id: 'xmrhub-019', title: 'Never Share Your Mnemonic Seed', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/imported/never-share-your-mnemonic-seed.jpg' },
  { id: 'xmrhub-020', title: 'The Enemy Is Listening Monero', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/imported/the-enemy-is-listening-monero.jpg' },
  { id: 'xmrhub-021', title: 'Trust No One Monero', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/imported/trust-no-one-monero.jpg' },
  { id: 'xmrhub-022', title: 'Vote for Better Money', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/imported/vote-for-better-money.jpg' },
  { id: 'xmrhub-023', title: 'Warning Inflation Is Stealing Your Savings', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/imported/warning-inflation-is-stealing-your-savings.jpg' },
  { id: 'xmrhub-024', title: 'XMR Balloon vs Banking System', priceUsd: 5, category: 'accessories', subcategory: 'stickers', section: 'stickers', image: 'https://xmrhub.org/assets/shop/imported/xmr-balloon-vs-banking-system.jpg' },
  { id: 'xmrhub-025', title: 'Liquidate Wall Street', priceUsd: 30, category: 'accessories', subcategory: 'hats-caps', section: 'hats', image: 'https://xmrhub.org/assets/shop/shopexpansioneins/hats/LiquidateWallstreet.jpg' },
  { id: 'xmrhub-026', title: 'Make Orwell Fiction Again', priceUsd: 30, category: 'accessories', subcategory: 'hats-caps', section: 'hats', image: 'https://xmrhub.org/assets/shop/shopexpansioneins/hats/MakeOrwellFictionAgain.jpg' },
  { id: 'xmrhub-027', title: 'He Invested In Monero', priceUsd: 29.99, category: 'art-collectibles', subcategory: 'prints', section: 'posters', image: 'https://xmrhub.org/assets/shop/shopexpansioneins/HeInvestedInMoneroPoster.jpg' },
  { id: 'xmrhub-028', title: 'End The Fed', priceUsd: 35, category: 'clothing', subcategory: 'mens-clothing', section: 'shirts', image: 'https://xmrhub.org/assets/shop/shopexpansioneins/shirts/EndTheFed.jpg' },
  { id: 'xmrhub-029', title: 'End Usury', priceUsd: 35, category: 'clothing', subcategory: 'mens-clothing', section: 'shirts', image: 'https://xmrhub.org/assets/shop/shopexpansioneins/shirts/EndUsury.jpg' },
  { id: 'xmrhub-030', title: 'Free Speech Bullhorn', priceUsd: 35, category: 'clothing', subcategory: 'mens-clothing', section: 'shirts', image: 'https://xmrhub.org/assets/shop/shopexpansioneins/shirts/FreeSpeechBullhorn.jpg' },
  { id: 'xmrhub-031', title: 'Anti New World Order', priceUsd: 35, category: 'clothing', subcategory: 'mens-clothing', section: 'shirts', image: 'https://xmrhub.org/assets/shop/shopexpansioneins/shirts/AntiNewWorldOrder.jpg' },
  { id: 'xmrhub-032', title: 'Sick Of PSYOPS', priceUsd: 35, category: 'clothing', subcategory: 'mens-clothing', section: 'shirts', image: 'https://xmrhub.org/assets/shop/shopexpansioneins/shirts/SickofPsyops.jpg' },
  { id: 'xmrhub-033', title: 'Brain On Propaganda', priceUsd: 35, category: 'clothing', subcategory: 'mens-clothing', section: 'shirts', image: 'https://xmrhub.org/assets/shop/shopexpansioneins/shirts/BrainOnPropaganda.jpg' },
];

export const xmrHubListings: Listing[] = products.map((product) => ({
  id: product.id,
  sellerId: 'xmr-hub',
  title: product.title,
  description: `External XMR Hub listing for ${product.title}. Checkout, shipping, fulfilment and support are handled by XMR Hub.`,
  priceUsd: product.priceUsd,
  category: product.category,
  subcategory: product.subcategory,
  images: [product.image],
  stock: 99,
  shippingPriceUsd: 0,
  status: 'active',
  condition: 'new',
  createdAt: LISTED_AT,
  fulfillment: 'referral',
  referralUrl: `${XMR_HUB_SHOP_URL}#${product.section}`,
  supplierSku: product.id,
  supplier: 'XMR Hub',
  discreteShipping: true,
  shipsTo: ['Worldwide'],
}));

export const xmrHubSeller = {
  id: 'xmr-hub',
  displayName: 'XMR Hub',
  bio: 'External Monero merchandise supplier. Purchases, shipping details and support stay on XMR Hub.',
  partnerUrl: XMR_HUB_SHOP_URL,
  acceptsCrypto: ['XMR'],
  isVerified: false,
};


