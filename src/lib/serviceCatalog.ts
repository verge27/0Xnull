import {
  Mic,
  MessageCircle,
  Brain,
  ShoppingBag,
  BarChart3,
  RefreshCw,
  TrendingUp,
  Shield,
  Server,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';

export type ServiceGroup = 'ai' | 'market' | 'predictions' | 'infra';

export type ServiceStatus = 'live' | 'beta' | 'planned';

export interface CatalogService {
  /** Service name as shown in the catalog */
  name: string;
  /** One line: what it actually does */
  what: string;
  /** Unit price, stated in the unit the meter charges in */
  price: string;
  /** Optional clarification of what the price is per */
  priceNote?: string;
  status: ServiceStatus;
  group: ServiceGroup;
  href: string;
  external?: boolean;
  icon: LucideIcon;
  /** True when the service is metered against the 0xn_ token balance */
  tokenMetered: boolean;
}

export const SERVICE_GROUPS: Record<ServiceGroup, { label: string; blurb: string }> = {
  ai: {
    label: 'AI',
    blurb: 'Models, voices and companions with no account attached to the prompt.',
  },
  market: {
    label: 'Market',
    blurb: 'Goods and services between strangers, settled in Monero.',
  },
  predictions: {
    label: 'Predictions',
    blurb: 'Binary markets on public outcomes. Pooled stakes, published resolution.',
  },
  infra: {
    label: 'Infrastructure',
    blurb: 'The plumbing: funding, swapping, hosting and connectivity.',
  },
};

export const SERVICE_CATALOG: CatalogService[] = [
  // ---- AI ----
  {
    name: 'Voice Cloning',
    what: 'Clone a voice from a sample, then generate speech from text.',
    price: '$0.15',
    priceNote: 'per generation',
    status: 'live',
    group: 'ai',
    href: '/voice',
    icon: Mic,
    tokenMetered: true,
  },
  {
    name: 'Kokoro Companion',
    what: 'Conversational AI companion with generated voice replies. No transcript retention.',
    price: '$0.02',
    priceNote: 'per message',
    status: 'beta',
    group: 'ai',
    href: '/kokoro',
    icon: MessageCircle,
    tokenMetered: true,
  },
  {
    name: 'NanoGPT',
    what: '200+ models including frontier and uncensored open weights. No prompt logging.',
    price: 'From $8',
    priceNote: 'per month, or pay per prompt',
    status: 'live',
    group: 'ai',
    href: 'https://nano-gpt.com/r/NfWFCFJi',
    external: true,
    icon: Brain,
    tokenMetered: false,
  },

  // ---- Market ----
  {
    name: 'Marketplace',
    what: 'Buy and sell physical and digital goods. Shipping details are PGP-encrypted client-side.',
    price: 'Listing is free',
    priceNote: 'buyers pay the listed price in XMR',
    status: 'live',
    group: 'market',
    href: '/browse',
    icon: ShoppingBag,
    tokenMetered: false,
  },
  {
    name: 'Creators',
    what: 'Independent creators publishing behind their own session keys.',
    price: 'Set by the creator',
    status: 'live',
    group: 'market',
    href: '/creators',
    icon: MessageCircle,
    tokenMetered: false,
  },

  // ---- Predictions ----
  {
    name: 'Prediction Markets',
    what: 'Yes/no markets on sports, esports, combat, crypto and governance outcomes. One token, a fresh single-use address per market.',
    price: '0.4% rake',
    priceNote: 'on winnings only — nothing on losses or refunds',
    status: 'live',
    group: 'predictions',
    href: '/predict',
    icon: BarChart3,
    tokenMetered: false,
  },

  // ---- Infrastructure ----
  {
    name: 'Swaps',
    what: 'Swap 300+ assets into or out of XMR without registration.',
    price: 'Provider rate',
    priceNote: 'no 0xNull markup on the quote',
    status: 'live',
    group: 'infra',
    href: '/swaps',
    icon: RefreshCw,
    tokenMetered: false,
  },
  {
    name: 'Lending & Earn',
    what: 'Supply assets for yield or borrow against them. Optional shielded routing.',
    price: '0.05% spread',
    priceNote: 'on the supply rate — borrow rate is passed through raw',
    status: 'live',
    group: 'infra',
    href: '/lending',
    icon: TrendingUp,
    tokenMetered: false,
  },
  {
    name: '3DS Scanner',
    what: 'Check whether a checkout enforces 3D Secure before you commit a card to it.',
    price: 'Free',
    status: 'live',
    group: 'infra',
    href: '/3ds-scanner',
    icon: Shield,
    tokenMetered: false,
  },
  {
    name: 'Anonymous VPS',
    what: 'Servers rented without a name attached, paid in Monero.',
    price: 'Provider pricing',
    priceNote: 'see the comparison on the page',
    status: 'live',
    group: 'infra',
    href: '/vps',
    icon: Server,
    tokenMetered: false,
  },
  {
    name: 'Phone & eSIM',
    what: 'Numbers and data plans that do not ask who you are.',
    price: 'Provider pricing',
    status: 'live',
    group: 'infra',
    href: '/phone',
    icon: Smartphone,
    tokenMetered: false,
  },
];

export const servicesInGroup = (group: ServiceGroup) =>
  SERVICE_CATALOG.filter((s) => s.group === group);
