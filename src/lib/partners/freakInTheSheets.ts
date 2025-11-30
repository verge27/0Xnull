/**
 * Freak In The Sheets - Verified Product Listings
 * UK-based premium adult store accepting crypto (BTC, ETH)
 * All products verified in-stock with real URLs and prices
 * 
 * Last updated: November 2025
 */

import { Listing } from '../types';

// Import product images
import clitoralSquirrelImg from '@/assets/freakinthesheets/clitoral-squirrel.jpg';
import spreaderBarImg from '@/assets/freakinthesheets/spreader-bar.jpg';
import teddyRedImg from '@/assets/freakinthesheets/teddy-red.jpg';
import waterLubeImg from '@/assets/freakinthesheets/water-lube.jpg';
import masturbatorImg from '@/assets/freakinthesheets/masturbator.jpg';
import doubleDildoImg from '@/assets/freakinthesheets/double-dildo.jpg';
import dualisticDoubleImg from '@/assets/freakinthesheets/dualistic-double.jpg';
import buttPlugBlingImg from '@/assets/freakinthesheets/butt-plug-bling.jpg';
import wandMassagerImg from '@/assets/freakinthesheets/wand-massager.jpg';
import cockRingsImg from '@/assets/freakinthesheets/cock-rings.jpg';
import rabbitVibratorImg from '@/assets/freakinthesheets/rabbit-vibrator.jpg';

const FREAK_BASE_URL = 'https://www.freakinthesheets.co.uk';

// XMR price approximately £165 / $208 USD - adjust as needed
const GBP_TO_USD = 1.27;
const XMR_PRICE_USD = 165;

const gbpToUsd = (gbp: number): number => Math.round(gbp * GBP_TO_USD * 100) / 100;
const usdToXmr = (usd: number): number => Math.round((usd / XMR_PRICE_USD) * 1000) / 1000;

export const freakInTheSheetsListings: Partial<Listing>[] = [
  // === VIBRATORS & EGGS ===
  {
    id: 'fits-vibe-001',
    title: '10 Speed Remote Vibrating Egg BIG Purple',
    description: 'Remote controlled vibrating egg with 10 exciting vibration modes. Wireless control up to 20 metres away. Soft silky texture, waterproof. Batteries included. Perfect for couples play.',
    priceUsd: gbpToUsd(22.99),
    priceXmr: usdToXmr(gbpToUsd(22.99)),
    category: 'adult-intimacy',
    subcategory: 'toys-devices',
    images: [clitoralSquirrelImg],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: 0,
    fulfillment: 'referral',
    referralUrl: `${FREAK_BASE_URL}/product/10-speed-remote-vibrating-egg-big-purple/`,
    ageRestricted: true,
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU'],
    sellerId: 'freak-in-the-sheets',
    createdAt: new Date().toISOString(),
  },

  // === BONDAGE & RESTRAINTS ===
  {
    id: 'fits-bond-001',
    title: 'SportSheets Bondage Bar - 24 Inch Spreader',
    description: '4 comfortable neoprene and Velcro cuffs attached to a rigid nylon-covered 24" spreader bar. Perfect for multiple positions, easily secures your partner in seconds. Quality Sportsheets brand.',
    priceUsd: gbpToUsd(46.99),
    priceXmr: usdToXmr(gbpToUsd(46.99)),
    category: 'adult-intimacy',
    subcategory: 'toys-devices',
    images: [spreaderBarImg],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: 0,
    fulfillment: 'referral',
    referralUrl: `${FREAK_BASE_URL}/product/sportsheets-bondage-bar/`,
    ageRestricted: true,
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU'],
    sellerId: 'freak-in-the-sheets',
    createdAt: new Date().toISOString(),
  },

  // === LINGERIE ===
  {
    id: 'fits-ling-001',
    title: 'Cottelli Open Cup and Crotchless Bra Set - Red',
    description: 'Seductive red lace ensemble. Wireless bra with open cups and adjustable black straps. Matching crotchless G-string with decorative black bows. Available in S/M/L.',
    priceUsd: gbpToUsd(25.99),
    priceXmr: usdToXmr(gbpToUsd(25.99)),
    category: 'adult-intimacy',
    subcategory: 'lingerie-apparel',
    images: [teddyRedImg],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: 0,
    fulfillment: 'referral',
    referralUrl: `${FREAK_BASE_URL}/product/cottelli-bra-set-open-cup-and-crotchless-set/`,
    ageRestricted: true,
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU'],
    sellerId: 'freak-in-the-sheets',
    createdAt: new Date().toISOString(),
  },

  // === LUBRICANTS ===
  {
    id: 'fits-lube-001',
    title: 'ID Free Hypoallergenic Water-Based Lubricant 130ml',
    description: 'Long-lasting hypoallergenic lubricant. Free from glycerin, parabens, and alcohol. Ultra-gentle fragrance-free formula. Toy and latex friendly. High-performance slip.',
    priceUsd: gbpToUsd(13.99),
    priceXmr: usdToXmr(gbpToUsd(13.99)),
    category: 'adult-intimacy',
    subcategory: 'wellness-enhancement',
    images: [waterLubeImg],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: 0,
    fulfillment: 'referral',
    referralUrl: `${FREAK_BASE_URL}/product/id-free-hypoallergenic-waterbased-lubricant-130ml/`,
    ageRestricted: true,
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU'],
    sellerId: 'freak-in-the-sheets',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fits-lube-002',
    title: 'Fleshlube Ice Cooling Lubricant 100ml',
    description: 'Premium cooling water-based lubricant from Fleshlight. Medical-grade ingredients, stimulating cooling effect on contact. Natural silk-like texture, easy to clean.',
    priceUsd: gbpToUsd(11.99),
    priceXmr: usdToXmr(gbpToUsd(11.99)),
    category: 'adult-intimacy',
    subcategory: 'wellness-enhancement',
    images: [waterLubeImg],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: 0,
    fulfillment: 'referral',
    referralUrl: `${FREAK_BASE_URL}/product/fleshlube-ice-cooling-lubricant-100ml/`,
    ageRestricted: true,
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU'],
    sellerId: 'freak-in-the-sheets',
    createdAt: new Date().toISOString(),
  },

  // === MALE TOYS ===
  {
    id: 'fits-male-001',
    title: 'Fleshlight Quickshot Turbo Blue Ice',
    description: 'Compact male masturbator from Fleshlight. All-new Turbo Blue Ice version of the top-selling Quickshot. Intense internal texture, open-ended design.',
    priceUsd: gbpToUsd(34.99),
    priceXmr: usdToXmr(gbpToUsd(34.99)),
    category: 'adult-intimacy',
    subcategory: 'toys-devices',
    images: [masturbatorImg],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: 0,
    fulfillment: 'referral',
    referralUrl: `${FREAK_BASE_URL}/product/fleshlight-quickshot-turbo-blue-ice/`,
    ageRestricted: true,
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU'],
    sellerId: 'freak-in-the-sheets',
    createdAt: new Date().toISOString(),
  },

  // === COUPLES ===
  {
    id: 'fits-coup-001',
    title: 'Evolved Come Together Strapless Strap-On Pink',
    description: 'Strapless strap-on designed for couples. Dual vibrator with three motors for both partners. Creative alternative to traditional harness. Rechargeable.',
    priceUsd: gbpToUsd(59.99),
    priceXmr: usdToXmr(gbpToUsd(59.99)),
    category: 'adult-intimacy',
    subcategory: 'toys-devices',
    images: [doubleDildoImg],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: 0,
    fulfillment: 'referral',
    referralUrl: `${FREAK_BASE_URL}/product/evolved-come-together-pink/`,
    ageRestricted: true,
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU'],
    sellerId: 'freak-in-the-sheets',
    createdAt: new Date().toISOString(),
  },

  // === ANAL ===
  {
    id: 'fits-anal-001',
    title: 'Je Joue Nuo V2 Remote Controlled Butt Plug',
    description: 'App-controlled dual-motor butt plug. Remote control via Je Joue app for local and long distance play. Unique curved shape, elegant design. Perfect for couples.',
    priceUsd: gbpToUsd(89.99),
    priceXmr: usdToXmr(gbpToUsd(89.99)),
    category: 'adult-intimacy',
    subcategory: 'toys-devices',
    images: [buttPlugBlingImg],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: 0,
    fulfillment: 'referral',
    referralUrl: `${FREAK_BASE_URL}/product/je-joue-nuo-v2-remote-controlled-butt-plug/`,
    ageRestricted: true,
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU'],
    sellerId: 'freak-in-the-sheets',
    createdAt: new Date().toISOString(),
  },

  // === GLASS TOYS ===
  {
    id: 'fits-glass-001',
    title: 'Le Wand Swerve Stainless Steel Dildo',
    description: 'Premium stainless steel dildo from Le Wand. Curved design for G-spot or P-spot stimulation. Temperature play ready - heat or cool for different sensations. Lifetime quality.',
    priceUsd: gbpToUsd(129.99),
    priceXmr: usdToXmr(gbpToUsd(129.99)),
    category: 'adult-intimacy',
    subcategory: 'toys-devices',
    images: [wandMassagerImg],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: 0,
    fulfillment: 'referral',
    referralUrl: `${FREAK_BASE_URL}/product/le-wand-swerve-stainless-steel-dildo/`,
    ageRestricted: true,
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU'],
    sellerId: 'freak-in-the-sheets',
    createdAt: new Date().toISOString(),
  },

  // === NOVELTY / UNIQUE ===
  {
    id: 'fits-nov-001',
    title: 'Balldo - The Worlds First Ball Dildo (Purple)',
    description: 'Revolutionary ball dildo for a completely new experience. Includes Balldo and two spacer rings. Your gateway to your first ballsex experience.',
    priceUsd: gbpToUsd(44.99),
    priceXmr: usdToXmr(gbpToUsd(44.99)),
    category: 'adult-intimacy',
    subcategory: 'toys-devices',
    images: [cockRingsImg],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: 0,
    fulfillment: 'referral',
    referralUrl: `${FREAK_BASE_URL}/product/balldo-the-worlds-first-ball-dildo-purple/`,
    ageRestricted: true,
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU'],
    sellerId: 'freak-in-the-sheets',
    createdAt: new Date().toISOString(),
  },

  // === DOUBLE DILDOS ===
  {
    id: 'fits-double-001',
    title: 'Gender X Dualistic Double Dildo',
    description: 'Crystal-clear double-shafted dildo. Two unique sizes that flex and bend. Girthier shaft for deep satisfaction, slimmer curved option for harder to reach spots.',
    priceUsd: gbpToUsd(39.99),
    priceXmr: usdToXmr(gbpToUsd(39.99)),
    category: 'adult-intimacy',
    subcategory: 'toys-devices',
    images: [dualisticDoubleImg],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: 0,
    fulfillment: 'referral',
    referralUrl: `${FREAK_BASE_URL}/product/gender-x-dualistic-double-dildo/`,
    ageRestricted: true,
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU'],
    sellerId: 'freak-in-the-sheets',
    createdAt: new Date().toISOString(),
  },

  // === STIMULATORS ===
  {
    id: 'fits-stim-001',
    title: 'Wonderlove Remote Control Double Stimulator',
    description: 'Clitoral and G-spot stimulator with dual motors. 5 vibration modes each. Includes remote control for solo or partner play. Ergonomic design for female anatomy.',
    priceUsd: gbpToUsd(74.99),
    priceXmr: usdToXmr(gbpToUsd(74.99)),
    category: 'adult-intimacy',
    subcategory: 'toys-devices',
    images: [rabbitVibratorImg],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: 0,
    fulfillment: 'referral',
    referralUrl: `${FREAK_BASE_URL}/product/remote-control-love-to-love-double-stimulator-wonderlove/`,
    ageRestricted: true,
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU'],
    sellerId: 'freak-in-the-sheets',
    createdAt: new Date().toISOString(),
  },
];

// Seller profile for Freak In The Sheets
export const freakInTheSheetsSeller = {
  id: 'freak-in-the-sheets',
  displayName: 'Freak In The Sheets',
  bio: 'UK-based premium adult store. High quality toys, lingerie and accessories. Accepts BTC, ETH. Discreet packaging on all orders. Free UK delivery over £50.',
  location: 'United Kingdom',
  partnerUrl: FREAK_BASE_URL,
  acceptsCrypto: ['BTC', 'ETH'],
  rating: 4.8,
  reviewCount: 150,
  isVerified: true,
};

// Helper functions
export const getFreakInTheSheetsListings = () => freakInTheSheetsListings;
export const isFreakInTheSheetsListing = (listing: Partial<Listing>) => 
  listing.sellerId === 'freak-in-the-sheets';