/**
 * Curated XMRBazaar Listings for 0xNull Marketplace
 * 
 * These are referral listings - clicking "Buy" opens XMRBazaar.
 * Scraped from search results and manually vetted.
 * 
 * Prices in USD with XMR equivalent. XMR rate: ~$165
 */

// Real XMRBazaar listing images
import noxmrImg from '@/assets/xmrbazaar/noxmr.jpg';
import getMoneroImg from '@/assets/xmrbazaar/get-monero.jpg';
import fiatPaymentsImg from '@/assets/xmrbazaar/fiat-payments.jpg';
import matrixServerImg from '@/assets/xmrbazaar/matrix-server.jpg';
import designServicesImg from '@/assets/xmrbazaar/design-services.jpg';
import pixelFoldImg from '@/assets/xmrbazaar/pixel-fold.jpg';
import fpgaImg from '@/assets/xmrbazaar/fpga.jpg';
import aeronnectEsimImg from '@/assets/xmrbazaar/aeronnect-esim.jpg';
const luckyCatStickerImg = '/images/products/lucky-cat-sticker.jpg';
import moneroPatchImg from '@/assets/xmrbazaar/monero-patch.jpg';
const longboardImg = '/images/products/longboard.jpg';
import vpsComboImg from '@/assets/xmrbazaar/vps-combo.jpg';
import hodlersDenImg from '@/assets/xmrbazaar/hodlersden-domain.jpg';

// Generated images for remaining listings
import moneroWatchImg from '@/assets/xmrbazaar/monero-watch.jpg';
import pixel8aImg from '@/assets/xmrbazaar/pixel-8a.jpg';
import pixel6aImg from '@/assets/xmrbazaar/pixel-6a.jpg';
import privacyNodeImg from '@/assets/xmrbazaar/privacy-node-setup.jpg';
import frenchCheeseImg from '@/assets/xmrbazaar/french-cheese.jpg';
import autoMechanicImg from '@/assets/xmrbazaar/auto-mechanic.jpg';

// Placeholders for remaining
import xmrProgramming from '@/assets/xmr-programming.jpg';

export interface XMRBazaarListing {
  id: string;
  title: string;
  description: string;
  priceUsd: number;
  priceXmr: number;
  category: string;
  subcategory?: string;
  seller: {
    name: string;
    rating: number;
    reviews: number;
  };
  images: string[];
  xmrbazaarUrl: string;
  hasEscrow: boolean;
  location?: string;
  isReferral: true;
}

export const xmrbazaarListings: XMRBazaarListing[] = [
  // === DIGITAL GOODS & SERVICES ===
  {
    id: "xmr-dYiT",
    title: "NOXMR - Buy XMR with 0% Fee, Privately",
    description: "Purchase Monero with Amazon, eBay, Aliexpress orders. I purchase things for you and you pay in XMR. 2+ years on XMRBazaar, 201 reviews. No KYC, fully private exchanges.",
    priceUsd: 0, // Variable
    priceXmr: 0,
    category: "services",
    subcategory: "crypto-exchange",
    seller: { name: "cypherpink", rating: 5.0, reviews: 201 },
    images: [noxmrImg],
    xmrbazaarUrl: "https://xmrbazaar.com/listing/dYiT/",
    hasEscrow: true,
    isReferral: true,
  },
  {
    id: "xmr-m5fM",
    title: "Buy/Sell/Trade XMR for USD - NO KYC",
    description: "Trading personal Monero for USD. Methods: Chime (fastest), domestic wire, ACH, cash deposit at Walgreens, cash by mail. 15% rate for most methods. Amazon/Walmart gift cards at 20%.",
    priceUsd: 0,
    priceXmr: 0,
    category: "services",
    subcategory: "crypto-exchange",
    seller: { name: "CaptainCanaryLLC", rating: 5.0, reviews: 47 },
    images: [getMoneroImg],
    xmrbazaarUrl: "https://xmrbazaar.com/listing/m5fM/",
    hasEscrow: true,
    isReferral: true,
  },
  {
    id: "xmr-Yviu",
    title: "FIAT Payments Proxy - Card & PayPal",
    description: "I'll make card or PayPal payments for you. 9% fee for orders over $100, or $5 + 9% for smaller orders. Bills, subscriptions, online purchases. SEPA available on request.",
    priceUsd: 5,
    priceXmr: 0.03,
    category: "services",
    subcategory: "proxy-shopping",
    seller: { name: "denis", rating: 4.9, reviews: 89 },
    images: [fiatPaymentsImg],
    xmrbazaarUrl: "https://xmrbazaar.com/listing/Yviu/",
    hasEscrow: true,
    isReferral: true,
  },
  {
    id: "xmr-uFwh",
    title: "Accept Monero Payments on Your Website",
    description: "Professional Monero payment integration for WooCommerce or custom sites. Full end-to-end testing, clear documentation, privacy-first setup. Custom quotes for complex integrations.",
    priceUsd: 82.50,
    priceXmr: 0.5,
    category: "services",
    subcategory: "programming",
    seller: { name: "AilliaLink", rating: 5.0, reviews: 12 },
    images: [xmrProgramming], // Listing no longer exists
    xmrbazaarUrl: "https://xmrbazaar.com/listing/uFwh/",
    hasEscrow: true,
    isReferral: true,
  },
  {
    id: "xmr-fvQY",
    title: "Matrix Server Setup with Admin Panel",
    description: "I will set up a Matrix homeserver on your server and configure it to your preferences. Includes admin panel for managing users and rooms. Full privacy-focused setup.",
    priceUsd: 16.50,
    priceXmr: 0.1,
    category: "services",
    subcategory: "programming",
    seller: { name: "denis", rating: 4.9, reviews: 89 },
    images: [matrixServerImg],
    xmrbazaarUrl: "https://xmrbazaar.com/listing/fvQY/",
    hasEscrow: true,
    isReferral: true,
  },
  {
    id: "xmr-9i9T",
    title: "Design & Art Services",
    description: "Professional design services accepting XMR. Logos, branding, illustrations, and custom artwork. Contact via Matrix or Telegram for quotes.",
    priceUsd: 50,
    priceXmr: 0.30,
    category: "services",
    subcategory: "design",
    seller: { name: "MX Graphics", rating: 5.0, reviews: 1 },
    images: [designServicesImg],
    xmrbazaarUrl: "https://xmrbazaar.com/listing/9i9T/",
    hasEscrow: false,
    isReferral: true,
  },

  // === ELECTRONICS & PRIVACY HARDWARE ===
  {
    id: "xmr-Pk5b",
    title: "DeGoogled Pixel 8a with GrapheneOS - 128GB",
    description: "Brand-new Pixel 8a flashed with GrapheneOS. Network-unlocked, ready to use. Privacy-first mobile phone. Ships from Ireland.",
    priceUsd: 445,
    priceXmr: 1.642,
    category: "electronics",
    subcategory: "phones",
    seller: { name: "wadejbeckett", rating: 5.0, reviews: 8 },
    images: [pixel8aImg],
    xmrbazaarUrl: "https://xmrbazaar.com/listing/Pk5b/",
    hasEscrow: true,
    location: "Ireland",
    isReferral: true,
  },
  {
    id: "xmr-LKP8",
    title: "Pixel Fold - GrapheneOS or Stock",
    description: "Like new Pixel Fold. Black, unlocked for any carrier, 256GB. Your choice of stock Android or GrapheneOS. Privacy-focused smartphone.",
    priceUsd: 528,
    priceXmr: 1.7,
    category: "electronics",
    subcategory: "phones",
    seller: { name: "SimplifiedPrivacy", rating: 4.9, reviews: 34 },
    images: [pixelFoldImg],
    xmrbazaarUrl: "https://xmrbazaar.com/listing/LKP8/",
    hasEscrow: true,
    isReferral: true,
  },
  {
    id: "xmr-dpkQ",
    title: "GrapheneOS Pixel 6a + 1 Hour Consultation",
    description: "Like new Pixel 6a (6GB RAM, 128GB storage) with GrapheneOS pre-installed. Includes 1 hour consultation on privacy setup and best practices.",
    priceUsd: 295,
    priceXmr: 1.79,
    category: "electronics",
    subcategory: "phones",
    seller: { name: "SimplifiedPrivacy", rating: 4.9, reviews: 34 },
    images: [pixel6aImg],
    xmrbazaarUrl: "https://xmrbazaar.com/listing/dpkQ/",
    hasEscrow: true,
    isReferral: true,
  },
  {
    id: "xmr-ukAJ",
    title: "OneChipBook-12-A FPGA Development Platform",
    description: "FPGA development board. Package includes main unit and USB Type-C cable. Perfect for hardware hackers and privacy tool development.",
    priceUsd: 193,
    priceXmr: 0.6222,
    category: "electronics",
    subcategory: "hardware",
    seller: { name: "OneChipStore", rating: 5.0, reviews: 3 },
    images: [fpgaImg],
    xmrbazaarUrl: "https://xmrbazaar.com/listing/ukAJ/",
    hasEscrow: true,
    isReferral: true,
  },
  {
    id: "xmr-VC6S",
    title: "Aeronnect - Instant No-KYC Global eSIMs",
    description: "Instant mobile data with global eSIM plans. No physical SIM, no roaming charges. Seamless connectivity in 190+ countries. Complete privacy.",
    priceUsd: 15,
    priceXmr: 0.09,
    category: "digital-goods",
    subcategory: "telecom",
    seller: { name: "Aeronnect", rating: 4.8, reviews: 23 },
    images: [aeronnectEsimImg],
    xmrbazaarUrl: "https://xmrbazaar.com/listing/VC6S/",
    hasEscrow: true,
    isReferral: true,
  },

  // === PHYSICAL GOODS ===
  {
    id: "xmr-x7e7",
    title: "Lucky Cat Monero Sticker x2",
    description: "Original designed sticker. ~1.5 inches height, printed on matte sticker paper (not laminated). Includes 2 stickers. Shipping included.",
    priceUsd: 5,
    priceXmr: 0.03,
    category: "accessories",
    subcategory: "stickers",
    seller: { name: "MoneroMerch", rating: 5.0, reviews: 7 },
    images: [luckyCatStickerImg],
    xmrbazaarUrl: "https://xmrbazaar.com/listing/x7e7/",
    hasEscrow: true,
    isReferral: true,
  },
  {
    id: "xmr-rYrH",
    title: "Monero XMR Embroidered Patch - Velcro",
    description: "High-quality embroidered Monero patch with velcro backing. 8cm diameter. Perfect for bags, jackets, or gear.",
    priceUsd: 12,
    priceXmr: 0.07,
    category: "accessories",
    subcategory: "patches",
    seller: { name: "XMRPatches", rating: 5.0, reviews: 4 },
    images: [moneroPatchImg],
    xmrbazaarUrl: "https://xmrbazaar.com/listing/rYrH/",
    hasEscrow: true,
    isReferral: true,
  },
  {
    id: "xmr-watch",
    title: "Monero-Themed Watch - Exclusive Design",
    description: "Exclusive Monero-themed watch design. Worldwide shipping available. Perfect for XMR enthusiasts.",
    priceUsd: 199,
    priceXmr: 0.748,
    category: "accessories",
    subcategory: "watches",
    seller: { name: "XMRWatch", rating: 4.5, reviews: 2 },
    images: [moneroWatchImg],
    xmrbazaarUrl: "https://xmrbazaar.com/",
    hasEscrow: true,
    isReferral: true,
  },
  {
    id: "xmr-ZHBZ",
    title: "Longboard (Used) - Good Condition",
    description: "Used longboard in good condition. Some scratches and dents but runs very smoothly. See pictures for size. Contact via SimpleX.",
    priceUsd: 80,
    priceXmr: 0.48,
    category: "sports",
    subcategory: "outdoor",
    seller: { name: "darrolnor", rating: 5.0, reviews: 4 },
    images: [longboardImg],
    xmrbazaarUrl: "https://xmrbazaar.com/listing/ZHBZ/",
    hasEscrow: false,
    location: "Germany",
    isReferral: true,
  },

  // === HOSTING & INFRASTRUCTURE ===
  {
    id: "xmr-3YYU",
    title: "VPS Combo: Email, Docs & Chat Server",
    description: "Privacy-focused VPS setup with email (no spam flags), chat server (XMPP or SimpleX), and Cryptpad (encrypted Google Docs alternative). Setup with your domain, then root access handed to you.",
    priceUsd: 150,
    priceXmr: 0.91,
    category: "services",
    subcategory: "hosting",
    seller: { name: "SimplifiedPrivacy", rating: 4.9, reviews: 34 },
    images: [vpsComboImg],
    xmrbazaarUrl: "https://xmrbazaar.com/listing/3YYU/",
    hasEscrow: true,
    isReferral: true,
  },
  {
    id: "xmr-nodesetup",
    title: "Full Privacy Node & Server Setup",
    description: "Complete privacy infrastructure: Bitcoin node, Monero node, VPN, XMPP, Tor, Matrix. Full setup and configuration on your hardware or VPS.",
    priceUsd: 500,
    priceXmr: 3.03,
    category: "services",
    subcategory: "hosting",
    seller: { name: "PrivacySetup", rating: 4.8, reviews: 15 },
    images: [privacyNodeImg],
    xmrbazaarUrl: "https://xmrbazaar.com/",
    hasEscrow: true,
    isReferral: true,
  },

  // === DOMAINS & DIGITAL ASSETS ===
  {
    id: "xmr-277r",
    title: "HodlersDen.com Domain Name",
    description: "Premium domain for crypto community. Ideas: HODLer forum, educational platform, merchandise store. Perfect for Monero/Bitcoin projects.",
    priceUsd: 500,
    priceXmr: 3.03,
    category: "digital-goods",
    subcategory: "domains",
    seller: { name: "DomainSeller", rating: 5.0, reviews: 2 },
    images: [hodlersDenImg],
    xmrbazaarUrl: "https://xmrbazaar.com/listing/277r/",
    hasEscrow: true,
    isReferral: true,
  },

  // === FOOD & LOCAL ===
  {
    id: "xmr-cheese",
    title: "French Alps Goat Cheese - FREE Sample",
    description: "The 'seismic' little goat cheese from the French Alps. Free sample available. Experience artisan cheese with XMR.",
    priceUsd: 0,
    priceXmr: 0,
    category: "food",
    subcategory: "artisan",
    seller: { name: "Neobees", rating: 4.5, reviews: 6 },
    images: [frenchCheeseImg],
    xmrbazaarUrl: "https://xmrbazaar.com/",
    hasEscrow: false,
    location: "France",
    isReferral: true,
  },
  {
    id: "xmr-mechanic",
    title: "Mechnero - Auto Mechanic (New Orleans Area)",
    description: "Auto mechanic services accepting Monero. Located in Metairie, LA. Full service vehicle maintenance and repair.",
    priceUsd: 0,
    priceXmr: 0,
    category: "services",
    subcategory: "automotive",
    seller: { name: "MECHNERO504", rating: 4.0, reviews: 1 },
    images: [autoMechanicImg],
    xmrbazaarUrl: "https://xmrbazaar.com/",
    hasEscrow: false,
    location: "Metairie, LA, USA",
    isReferral: true,
  },
];

// Helper to get listings by category
export function getXMRBazaarByCategory(category: string): XMRBazaarListing[] {
  return xmrbazaarListings.filter(l => l.category === category);
}

// Helper to search listings
export function searchXMRBazaar(query: string): XMRBazaarListing[] {
  const q = query.toLowerCase();
  return xmrbazaarListings.filter(l => 
    l.title.toLowerCase().includes(q) || 
    l.description.toLowerCase().includes(q) ||
    l.seller.name.toLowerCase().includes(q)
  );
}

// Categories available from XMRBazaar
export const xmrbazaarCategories = [
  { slug: "services", name: "Services", count: 8 },
  { slug: "electronics", name: "Electronics & Hardware", count: 5 },
  { slug: "digital-goods", name: "Digital Goods", count: 2 },
  { slug: "accessories", name: "Accessories & Merch", count: 3 },
  { slug: "food", name: "Food & Local", count: 2 },
  { slug: "sports", name: "Sports & Outdoor", count: 1 },
];
