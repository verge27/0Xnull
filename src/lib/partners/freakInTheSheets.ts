/**
 * Freak In The Sheets - Referral Listings
 * UK-based premium adult store accepting crypto (BTC, ETH)
 */

import { Listing } from '../types';
import rabbitVibratorImg from '@/assets/freakinthesheets/rabbit-vibrator.jpg';
import wandMassagerImg from '@/assets/freakinthesheets/wand-massager.jpg';
import bondageKitImg from '@/assets/freakinthesheets/bondage-kit.jpg';
import laceBodysuitImg from '@/assets/freakinthesheets/lace-bodysuit.jpg';
import vibratingRingImg from '@/assets/freakinthesheets/vibrating-ring.jpg';
import waterLubeImg from '@/assets/freakinthesheets/water-lube.jpg';

const FREAK_BASE_URL = 'https://freakinthesheets.co.uk';

const getProductUrl = (slug: string, affiliateId?: string) => {
  const baseUrl = `${FREAK_BASE_URL}/product/${slug}`;
  return affiliateId ? `${baseUrl}?ref=${affiliateId}` : baseUrl;
};

export const freakInTheSheetsListings: Partial<Listing>[] = [
  {
    id: 'fits-vibe-001',
    title: 'Luxury Rabbit Vibrator - Dual Stimulation',
    description: 'Premium silicone rabbit vibrator with 10 vibration modes. Waterproof, USB rechargeable. Whisper quiet motor. Ships discreetly from UK.',
    priceUsd: 79.99,
    priceXmr: 0.48,
    category: 'adult-intimacy',
    images: [rabbitVibratorImg],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: 0,
    fulfillment: 'referral',
    referralUrl: getProductUrl('luxury-rabbit-vibrator'),
    ageRestricted: true,
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU'],
    sellerId: 'freak-in-the-sheets',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fits-vibe-002',
    title: 'Wand Massager - Mains Powered',
    description: 'Powerful mains-powered wand massager. Variable speed control. The classic for a reason. UK plug included.',
    priceUsd: 49.99,
    priceXmr: 0.30,
    category: 'adult-intimacy',
    images: [wandMassagerImg],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: 0,
    fulfillment: 'referral',
    referralUrl: getProductUrl('wand-massager'),
    ageRestricted: true,
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU'],
    sellerId: 'freak-in-the-sheets',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fits-bond-001',
    title: 'Bondage Starter Kit - 7 Piece',
    description: 'Complete bondage starter set: blindfold, wrist cuffs, ankle cuffs, collar, leash, paddle, feather tickler. Faux leather, adjustable.',
    priceUsd: 59.99,
    priceXmr: 0.36,
    category: 'adult-intimacy',
    images: [bondageKitImg],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: 0,
    fulfillment: 'referral',
    referralUrl: getProductUrl('bondage-starter-kit'),
    ageRestricted: true,
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU'],
    sellerId: 'freak-in-the-sheets',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fits-ling-001',
    title: 'Lace Bodysuit - Black',
    description: 'Elegant black lace bodysuit. Adjustable straps, snap closure. Available in S/M/L/XL. Flattering cut.',
    priceUsd: 34.99,
    priceXmr: 0.21,
    category: 'adult-intimacy',
    images: [laceBodysuitImg],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: 0,
    fulfillment: 'referral',
    referralUrl: getProductUrl('lace-bodysuit-black'),
    ageRestricted: true,
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU'],
    sellerId: 'freak-in-the-sheets',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fits-coup-001',
    title: 'Couples Vibrating Ring',
    description: 'Stretchy silicone vibrating ring for couples. 10 vibration modes, USB rechargeable. Enhances pleasure for both partners.',
    priceUsd: 24.99,
    priceXmr: 0.15,
    category: 'adult-intimacy',
    images: [vibratingRingImg],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: 0,
    fulfillment: 'referral',
    referralUrl: getProductUrl('couples-vibrating-ring'),
    ageRestricted: true,
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU'],
    sellerId: 'freak-in-the-sheets',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fits-well-001',
    title: 'Water-Based Lubricant - 250ml',
    description: 'Premium water-based lubricant. Toy-safe, condom-compatible, easy cleanup. Unscented, long-lasting formula.',
    priceUsd: 12.99,
    priceXmr: 0.08,
    category: 'adult-intimacy',
    images: [waterLubeImg],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: 0,
    fulfillment: 'referral',
    referralUrl: getProductUrl('water-based-lube'),
    ageRestricted: true,
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU'],
    sellerId: 'freak-in-the-sheets',
    createdAt: new Date().toISOString(),
  },
];

export const freakInTheSheetsSeller = {
  id: 'freak-in-the-sheets',
  displayName: 'Freak In The Sheets',
  bio: 'UK-based premium store. High quality products. Accepts BTC, ETH. Discreet shipping.',
  location: 'United Kingdom',
  partnerUrl: FREAK_BASE_URL,
  acceptsCrypto: ['BTC', 'ETH'],
};