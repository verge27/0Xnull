/**
 * UK-Peptides - Research Peptide Listings
 * UK-based research peptide vendor accepting Bitcoin
 * Established 2012 | 99.8% purity | Europe's largest peptide stockist
 * 
 * DISCLAIMER: All products sold for research purposes only.
 * Not for human consumption.
 */

import { Listing } from '../types';

// Import product images
import bpc157Img from '@/assets/peptides/ukp-bpc157-5mg.webp';
import tb500Img from '@/assets/peptides/ukp-tb500-5mg.webp';
import cjc1295Img from '@/assets/peptides/ukp-cjc1295-2mg.webp';

const UK_PEPTIDES_BASE_URL = 'https://www.uk-peptides.com';

// GBP to USD conversion rate
const GBP_TO_USD = 1.27;
const gbpToUsd = (gbp: number): number => Math.round(gbp * GBP_TO_USD * 100) / 100;

export const ukPeptidesPartnerListings: Partial<Listing>[] = [
  // === RECOVERY PEPTIDES (TOP SELLERS) ===
  {
    id: 'ukp-rec-001',
    title: 'BPC-157 5mg - Premium Research Peptide',
    description: 'Body Protection Compound for tissue repair research. 99.8% purity with third-party verification. Industrial-grade freezer storage. Next-day UK delivery. BPC157, offered at 5mg, is a unique, specialised research peptide developed for advanced scientific exploration.',
    priceUsd: gbpToUsd(16.95),
    category: 'health-wellness',
    subcategory: 'peptides-research',
    images: [bpc157Img],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: gbpToUsd(4.95),
    fulfillment: 'referral',
    referralUrl: `${UK_PEPTIDES_BASE_URL}/bpc-157-5mg`,
    ageRestricted: false,
    disclaimer: 'This product is sold for research purposes only. Not for human consumption. Consult appropriate regulatory authorities in your jurisdiction.',
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU', 'US', 'CA', 'AU'],
    coaAvailable: true,
    sellerId: 'uk-peptides',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ukp-rec-002',
    title: 'Thymosin Beta 4 5mg TB500 - Research Grade',
    description: 'TB-500 5mg - High-Quality Research Peptide. Thymosin Beta-4 for advanced recovery studies. 99.8% purity, batch tested. Popular for tissue regeneration and injury recovery research.',
    priceUsd: gbpToUsd(33.00),
    category: 'health-wellness',
    subcategory: 'peptides-research',
    images: [tb500Img],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: gbpToUsd(4.95),
    fulfillment: 'referral',
    referralUrl: `${UK_PEPTIDES_BASE_URL}/tb500-peptide-5mg`,
    ageRestricted: false,
    disclaimer: 'This product is sold for research purposes only. Not for human consumption.',
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU', 'US', 'CA', 'AU'],
    coaAvailable: true,
    sellerId: 'uk-peptides',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ukp-rec-003',
    title: 'Thymosin Beta 4 2mg (TB500) - Research Peptide',
    description: 'TB-500, offered at 2mg, is a high-quality specialised research peptide developed for advanced scientific. Same premium 99.8% purity. Perfect for initial studies or dose-response experiments.',
    priceUsd: gbpToUsd(16.95),
    category: 'health-wellness',
    subcategory: 'peptides-research',
    images: [tb500Img],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: gbpToUsd(4.95),
    fulfillment: 'referral',
    referralUrl: `${UK_PEPTIDES_BASE_URL}/thymosin-beta-4-2mg-tb500`,
    ageRestricted: false,
    disclaimer: 'This product is sold for research purposes only. Not for human consumption.',
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU', 'US', 'CA', 'AU'],
    coaAvailable: true,
    sellerId: 'uk-peptides',
    createdAt: new Date().toISOString(),
  },

  // === GROWTH HORMONE PEPTIDES ===
  {
    id: 'ukp-gh-001',
    title: 'CJC-1295 MOD GRF 1-29 without DAC 2mg',
    description: 'CJC 1295 without DAC 2mg, also known as Modified GRF (1-29), is a synthetic analogue of Growth Hormone Releasing Hormone. Premium synthesis without Drug Affinity Complex. 99.8% purity verified.',
    priceUsd: gbpToUsd(12.95),
    category: 'health-wellness',
    subcategory: 'peptides-research',
    images: [cjc1295Img],
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: gbpToUsd(4.95),
    fulfillment: 'referral',
    referralUrl: `${UK_PEPTIDES_BASE_URL}/cjc-1295-Mod-GRF`,
    ageRestricted: false,
    disclaimer: 'This product is sold for research purposes only. Not for human consumption.',
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU', 'US', 'CA', 'AU'],
    coaAvailable: true,
    sellerId: 'uk-peptides',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ukp-gh-003',
    title: 'Ipamorelin 2mg - Selective GH Secretagogue',
    description: 'Ipamorelin, offered at 2mg, is a high-quality specialised research peptide developed for advanced scientific. Growth hormone secretagogue for research. Mild and selective peptide with extensive literature.',
    priceUsd: gbpToUsd(9.95),
    category: 'health-wellness',
    subcategory: 'peptides-research',
    images: [cjc1295Img], // Similar peptide image
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: gbpToUsd(4.95),
    fulfillment: 'referral',
    referralUrl: `${UK_PEPTIDES_BASE_URL}/ipamorelin-2000mcg`,
    ageRestricted: false,
    disclaimer: 'This product is sold for research purposes only. Not for human consumption.',
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU', 'US', 'CA', 'AU'],
    coaAvailable: true,
    sellerId: 'uk-peptides',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ukp-gh-004',
    title: 'GHRP-6 5mg - Growth Hormone Research',
    description: 'GHRP-6 (Growth Hormone-Releasing Peptide-6), offered at 5mg, is a high-quality specialised research peptide. Well-documented research compound. Premium synthesis.',
    priceUsd: gbpToUsd(9.95),
    category: 'health-wellness',
    subcategory: 'peptides-research',
    images: [cjc1295Img], // Similar peptide image
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: gbpToUsd(4.95),
    fulfillment: 'referral',
    referralUrl: `${UK_PEPTIDES_BASE_URL}/ghrp-6-5mg`,
    ageRestricted: false,
    disclaimer: 'This product is sold for research purposes only. Not for human consumption.',
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU', 'US', 'CA', 'AU'],
    coaAvailable: true,
    sellerId: 'uk-peptides',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ukp-gh-005',
    title: 'GHRP-2 5mg - Growth Hormone Research',
    description: 'GHRP-2 (Growth Hormone-Releasing Peptide-2), offered at 5mg, is a high-quality specialised research peptide. More potent than GHRP-6. Laboratory grade purity.',
    priceUsd: gbpToUsd(9.95),
    category: 'health-wellness',
    subcategory: 'peptides-research',
    images: [cjc1295Img], // Similar peptide image
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: gbpToUsd(4.95),
    fulfillment: 'referral',
    referralUrl: `${UK_PEPTIDES_BASE_URL}/ghrp-2-5mg`,
    ageRestricted: false,
    disclaimer: 'This product is sold for research purposes only. Not for human consumption.',
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU', 'US', 'CA', 'AU'],
    coaAvailable: true,
    sellerId: 'uk-peptides',
    createdAt: new Date().toISOString(),
  },

  // === RESEARCH SUPPLIES ===
  {
    id: 'ukp-sup-001',
    title: '10ml Bacteriostatic Mixing Water - Sterile',
    description: '10ml Bacteriostatic Water: Sterile, non-pyrogenic solution formulated for use in research laboratories. Contains 0.9% (9mg/mL) benzyl alcohol as a bacteriostatic preservative. Pharmaceutical grade.',
    priceUsd: gbpToUsd(5.95),
    category: 'health-wellness',
    subcategory: 'peptides-research',
    images: [bpc157Img], // Generic peptide image
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: gbpToUsd(2.95),
    fulfillment: 'referral',
    referralUrl: `${UK_PEPTIDES_BASE_URL}/10ml-bacteriostatic-water`,
    ageRestricted: false,
    disclaimer: 'For research use only.',
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU', 'US', 'CA', 'AU'],
    sellerId: 'uk-peptides',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ukp-sup-002',
    title: '10ml Acetic Acid 0.6% - Research Grade',
    description: 'For use with Long Chain Peptides etc. Improved Solubility for Reconstitution. Liquid acetic acid is a hydrophilic solution. Dilute acetic acid solution for specialized peptide reconstitution. Pharmaceutical grade.',
    priceUsd: gbpToUsd(6.00),
    category: 'health-wellness',
    subcategory: 'peptides-research',
    images: [bpc157Img], // Generic peptide image
    condition: 'new',
    status: 'active',
    stock: 99,
    shippingPriceUsd: gbpToUsd(2.95),
    fulfillment: 'referral',
    referralUrl: `${UK_PEPTIDES_BASE_URL}/all-uk-peptides-products/10ml-acetic-acid-0-6`,
    ageRestricted: false,
    disclaimer: 'For research use only.',
    discreteShipping: true,
    shipsFrom: 'UK',
    shipsTo: ['UK', 'EU', 'US', 'CA', 'AU'],
    sellerId: 'uk-peptides',
    createdAt: new Date().toISOString(),
  },
];

// Seller profile
export const ukPeptidesSeller = {
  id: 'uk-peptides',
  displayName: 'UK-Peptides',
  bio: "Europe's largest peptide stockist since 2012. 99.8% purity guaranteed. Industrial-grade freezer storage. Next-day UK delivery. BLACK FRIDAY 20% OFF with code BLACKF20. Accepts Bitcoin, bank transfer, and card. All products for research purposes only.",
  location: 'United Kingdom',
  partnerUrl: UK_PEPTIDES_BASE_URL,
  acceptsCrypto: ['BTC'],
  rating: 4.9,
  reviewCount: 500,
  isVerified: true,
  established: '2012',
};

export const getUKPeptidesListings = () => ukPeptidesPartnerListings;
export const isUKPeptidesListing = (listing: Partial<Listing>) => 
  listing.sellerId === 'uk-peptides';
