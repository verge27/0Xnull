import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

const defaultMeta = {
  title: '0xNull - Anonymous Crypto Predictions & Marketplace',
  description: 'Privacy-first prediction markets for sports, esports, and crypto. Anonymous marketplace for goods and services. Pay with Monero and other cryptocurrencies.',
  image: 'https://0xnull.io/og-image.png',
  type: 'website',
};

const pageMeta: Record<string, SEOProps> = {
  '/': defaultMeta,
  '/predict': {
    title: 'Anonymous Crypto Prediction Markets | No-KYC Betting Hub – 0xNull',
    description: 'Explore anonymous crypto prediction markets on 0xNull. No KYC, no accounts, Monero payments, and private predictions across sports, esports, and crypto.',
  },
  '/sports-predictions': {
    title: 'Anonymous Sports Predictions | No-KYC Crypto Betting – 0xNull',
    description: 'Place anonymous sports predictions on 0xNull. No KYC, no accounts, private Monero betting on football, basketball, tennis, and more.',
  },
  '/esports-predictions': {
    title: 'Anonymous Esports Predictions | No-KYC Crypto Betting – 0xNull',
    description: 'Bet on esports anonymously with 0xNull. No KYC, no accounts, private Monero predictions on CS2, Dota 2, LoL, and more.',
  },
  '/predictions': {
    title: 'Anonymous Crypto Price Predictions | No-KYC Bitcoin Betting – 0xNull',
    description: 'Make anonymous crypto price predictions on 0xNull. No KYC, no accounts, private Monero betting on Bitcoin, Ethereum, and more.',
  },
  '/swaps': {
    title: 'Anonymous Crypto Swaps No KYC | Private Crypto Exchange – 0xNull',
    description: 'Use anonymous crypto swaps on 0xNull with no KYC or accounts. Swap cryptocurrencies privately with Monero support on a privacy-first platform.',
  },
  '/browse': {
    title: 'Anonymous Crypto Marketplace | No-KYC Prediction Markets – 0xNull',
    description: 'Explore 0xNull Marketplace, an anonymous crypto marketplace with no-KYC prediction markets, digital services, and Monero payments—built for privacy-first users.',
  },
  '/ai': {
    title: 'AI Services - 0xNull',
    description: 'Privacy-first AI services. Voice cloning, text-to-speech, and more with cryptocurrency payments.',
  },
  '/infra': {
    title: 'Infrastructure - 0xNull',
    description: 'Privacy infrastructure services. VPS, eSIM, swaps, and more with anonymous crypto payments.',
  },
  '/vps': {
    title: 'Anonymous VPS Hosting with Cryptocurrency | No-KYC VPS – 0xNull',
    description: 'Get anonymous VPS hosting with cryptocurrency on 0xNull. No KYC, no accounts, Monero payments, and privacy-first virtual servers.',
  },
  '/phone': {
    title: 'Anonymous Phone Numbers No KYC | Buy Private eSIMs with Crypto – 0xNull',
    description: 'Buy anonymous phone numbers and eSIMs with no KYC on 0xNull. Instant activation, global coverage, and crypto payments including Monero and Lightning.',
  },
  '/cashout': {
    title: 'Cash Out Crypto - 0xNull',
    description: 'Cash out your cryptocurrency anonymously. Convert XMR to fiat with privacy.',
  },
  '/safety': {
    title: 'Harm Reduction - 0xNull',
    description: 'Safety and harm reduction resources. Stay safe while using privacy tools and cryptocurrencies.',
  },
  '/terms': {
    title: 'Terms of Service - 0xNull',
    description: 'Terms of service for 0xNull prediction markets and marketplace.',
  },
  '/privacy': {
    title: 'Privacy Policy - 0xNull',
    description: 'Privacy policy for 0xNull. We take your privacy seriously.',
  },
  '/how-betting-works': {
    title: 'How Parimutuel Betting Works - 0xNull',
    description: 'Learn how parimutuel betting works on 0xNull. Understand pool-based odds, payouts, and the 0.4% fee structure.',
  },
  '/support': {
    title: 'Support - 0xNull',
    description: 'Get help with 0xNull prediction markets and marketplace. Contact us through SimpleX for private support.',
  },
  '/voice': {
    title: 'AI Voice Cloning - 0xNull',
    description: 'Clone any voice with AI. High-quality text-to-speech synthesis with anonymous crypto payments.',
  },
  '/kokoro': {
    title: 'Kokoro AI Companion - 0xNull',
    description: 'AI companion for conversation and connection. No logs, no judgment, pay with crypto.',
  },
  '/combat': {
    title: 'MMA & Boxing Predictions - 0xNull',
    description: 'Anonymous MMA and boxing betting. Predict UFC, boxing, and combat sports outcomes with Monero.',
  },
  '/cricket': {
    title: 'Anonymous Cricket Prediction Markets | No-KYC Cricket Predictions – 0xNull',
    description: 'Access anonymous cricket prediction markets on 0xNull. Make no-KYC cricket predictions using Monero and other cryptocurrencies on a privacy-first platform.',
  },
  '/flash': {
    title: 'Flash Markets | 5-Minute Crypto Prediction Markets (No KYC) – 0xNull',
    description: 'Join Flash Markets on 0xNull—5-minute crypto prediction markets with Bull vs Bear outcomes. No KYC, no accounts, Monero-only, winners split the pool.',
  },
  '/starcraft': {
    title: 'StarCraft Predictions - 0xNull',
    description: 'Anonymous StarCraft 2 betting. Predict GSL, ESL, and pro SC2 match outcomes with crypto.',
  },
  '/slap': {
    title: 'Slap Fighting Predictions - 0xNull',
    description: 'Anonymous slap fighting betting. Predict Power Slap and slap fighting match outcomes.',
  },
  '/get-started': {
    title: 'How to Use Anonymous Crypto Prediction Markets | Get Started – 0xNull',
    description: 'Learn how to use anonymous crypto prediction markets on 0xNull. No KYC, no accounts, Monero payments, and full privacy from the start.',
  },
  '/tor': {
    title: 'Tor Access Guide - 0xNull',
    description: 'Access 0xNull via Tor for maximum privacy. Step-by-step guide to anonymous browsing.',
  },
  '/grapheneos': {
    title: 'GrapheneOS Phones - 0xNull',
    description: 'Privacy-focused GrapheneOS phones. Maximum mobile security with crypto payments.',
  },
  '/api-docs': {
    title: 'API Documentation - 0xNull',
    description: 'Developer documentation for 0xNull APIs. Build on top of our prediction markets.',
  },
  '/philosophy': {
    title: 'Philosophy - 0xNull',
    description: 'Our philosophy on privacy, freedom, and decentralization. Why we built 0xNull.',
  },
  '/fiat-onramp': {
    title: 'Buy Crypto with Fiat - 0xNull',
    description: 'Buy cryptocurrency with credit card or bank transfer. Get BTC, ETH, and more without KYC.',
  },
  '/fiat-offramp': {
    title: 'Sell Crypto to Fiat - 0xNull',
    description: 'Convert cryptocurrency to fiat currency. Cash out ETH, USDT, USDC to your bank account.',
  },
  '/verify': {
    title: 'Verify & Security - 0xNull',
    description: 'Verify 0xNull authenticity. PGP keys, Tor address, and warrant canary for security.',
  },
  '/vpn-resources': {
    title: 'Privacy VPN Resources - 0xNull',
    description: 'Curated list of privacy-focused VPNs that accept crypto and require no KYC.',
  },
  '/wishlist': {
    title: 'My Wishlist - 0xNull',
    description: 'Your saved marketplace items. Track products you want to purchase later.',
  },
  '/messages': {
    title: 'Messages - 0xNull',
    description: 'Encrypted messages with buyers and sellers. Private communication for marketplace orders.',
  },
  '/orders': {
    title: 'My Orders - 0xNull',
    description: 'Track your marketplace orders. View order history and status updates.',
  },
  '/sell': {
    title: 'Sell on 0xNull - 0xNull',
    description: 'Start selling on 0xNull marketplace. List products and services, accept crypto payments.',
  },
  '/settings': {
    title: 'Settings - 0xNull',
    description: 'Manage your 0xNull account settings, profile, and preferences.',
  },
  '/my-slips': {
    title: 'My Bet Slips - 0xNull',
    description: 'View and track your betting slips. Check multibet status and potential payouts.',
  },
  '/payouts': {
    title: 'Payouts - 0xNull',
    description: 'View and manage your prediction market payouts. Track winning bets and withdrawals.',
  },
  '/auth': {
    title: 'Login - 0xNull',
    description: 'Sign in to 0xNull. Access your marketplace and prediction market accounts.',
  },
  '/creators': {
    title: '0xNull Creators | Anonymous Adult Content Platform (No KYC, Monero)',
    description: '0xNull Creators is a privacy-first adult content platform with no KYC, no accounts, and Monero-only payments. Create and support content anonymously.',
  },
  '/creator/register': {
    title: 'Become a Creator - 0xNull Creators',
    description: 'Join 0xNull Creators. Create content, earn Monero, maintain your privacy.',
  },
  '/creator/login': {
    title: 'Creator Login - 0xNull Creators',
    description: 'Sign in to your 0xNull creator account with your private key.',
  },
  '/creator/dashboard': {
    title: 'Creator Dashboard - 0xNull Creators',
    description: 'Manage your content, view earnings, and connect with subscribers.',
  },
};

// Breadcrumb configuration for pages
const breadcrumbConfig: Record<string, Array<{ name: string; url: string }>> = {
  '/': [{ name: 'Home', url: 'https://0xnull.io/' }],
  '/sports-predictions': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Predictions', url: 'https://0xnull.io/predict' },
    { name: 'Sports', url: 'https://0xnull.io/sports-predictions' },
  ],
  '/esports-predictions': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Predictions', url: 'https://0xnull.io/predict' },
    { name: 'Esports', url: 'https://0xnull.io/esports-predictions' },
  ],
  '/predictions': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Predictions', url: 'https://0xnull.io/predict' },
    { name: 'Crypto', url: 'https://0xnull.io/predictions' },
  ],
  '/predict': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Predictions Hub', url: 'https://0xnull.io/predict' },
  ],
  '/swaps': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Infrastructure', url: 'https://0xnull.io/infra' },
    { name: 'Swaps', url: 'https://0xnull.io/swaps' },
  ],
  '/browse': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Marketplace', url: 'https://0xnull.io/browse' },
  ],
  '/ai': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'AI Hub', url: 'https://0xnull.io/ai' },
  ],
  '/infra': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Infrastructure', url: 'https://0xnull.io/infra' },
  ],
  '/vps': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Infrastructure', url: 'https://0xnull.io/infra' },
    { name: 'VPS', url: 'https://0xnull.io/vps' },
  ],
  '/phone': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Infrastructure', url: 'https://0xnull.io/infra' },
    { name: 'eSIM', url: 'https://0xnull.io/phone' },
  ],
  '/cashout': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Infrastructure', url: 'https://0xnull.io/infra' },
    { name: 'Cash Out', url: 'https://0xnull.io/cashout' },
  ],
  '/safety': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Safety', url: 'https://0xnull.io/safety' },
  ],
  '/support': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Support', url: 'https://0xnull.io/support' },
  ],
  '/how-betting-works': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Predictions', url: 'https://0xnull.io/predict' },
    { name: 'How Betting Works', url: 'https://0xnull.io/how-betting-works' },
  ],
  '/terms': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Terms of Service', url: 'https://0xnull.io/terms' },
  ],
  '/privacy': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Privacy Policy', url: 'https://0xnull.io/privacy' },
  ],
  '/voice': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'AI Hub', url: 'https://0xnull.io/ai' },
    { name: 'Voice Cloning', url: 'https://0xnull.io/voice' },
  ],
  '/combat': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Predictions', url: 'https://0xnull.io/predict' },
    { name: 'Combat Sports', url: 'https://0xnull.io/combat' },
  ],
  '/cricket': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Predictions', url: 'https://0xnull.io/predict' },
    { name: 'Cricket', url: 'https://0xnull.io/cricket' },
  ],
  '/starcraft': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Predictions', url: 'https://0xnull.io/predict' },
    { name: 'StarCraft', url: 'https://0xnull.io/starcraft' },
  ],
  '/get-started': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Get Started', url: 'https://0xnull.io/get-started' },
  ],
  '/tor': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Tor Guide', url: 'https://0xnull.io/tor' },
  ],
  '/grapheneos': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Infrastructure', url: 'https://0xnull.io/infra' },
    { name: 'GrapheneOS', url: 'https://0xnull.io/grapheneos' },
  ],
  '/philosophy': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Philosophy', url: 'https://0xnull.io/philosophy' },
  ],
  '/fiat-onramp': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Infrastructure', url: 'https://0xnull.io/infra' },
    { name: 'Buy Crypto', url: 'https://0xnull.io/fiat-onramp' },
  ],
  '/fiat-offramp': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Infrastructure', url: 'https://0xnull.io/infra' },
    { name: 'Sell Crypto', url: 'https://0xnull.io/fiat-offramp' },
  ],
  '/verify': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Verify', url: 'https://0xnull.io/verify' },
  ],
  '/vpn-resources': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Infrastructure', url: 'https://0xnull.io/infra' },
    { name: 'VPN Resources', url: 'https://0xnull.io/vpn-resources' },
  ],
  '/kokoro': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'AI Hub', url: 'https://0xnull.io/ai' },
    { name: 'Kokoro', url: 'https://0xnull.io/kokoro' },
  ],
  '/slap': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Predictions', url: 'https://0xnull.io/predict' },
    { name: 'Slap Fighting', url: 'https://0xnull.io/slap' },
  ],
  '/wishlist': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Wishlist', url: 'https://0xnull.io/wishlist' },
  ],
  '/messages': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Messages', url: 'https://0xnull.io/messages' },
  ],
  '/orders': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Orders', url: 'https://0xnull.io/orders' },
  ],
  '/sell': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Sell', url: 'https://0xnull.io/sell' },
  ],
  '/settings': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Settings', url: 'https://0xnull.io/settings' },
  ],
  '/my-slips': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Predictions', url: 'https://0xnull.io/predict' },
    { name: 'My Slips', url: 'https://0xnull.io/my-slips' },
  ],
  '/payouts': [
    { name: 'Home', url: 'https://0xnull.io/' },
    { name: 'Payouts', url: 'https://0xnull.io/payouts' },
  ],
};

// FAQ schemas for specific pages
const faqSchemas: Record<string, StructuredData> = {
  '/how-betting-works': {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does parimutuel betting work on 0xNull?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '0xNull uses a parimutuel pool system where all bets go into a shared pool. Odds are determined by the ratio of money on each side, and winners split the total pool proportionally to their stake. The house takes only a 0.4% fee on winnings.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the fee structure on 0xNull?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '0xNull charges a flat 0.4% fee on winnings only. There is no fee on losses, refunds, or no-contest outcomes. This is significantly lower than traditional bookmakers.',
        },
      },
      {
        '@type': 'Question',
        name: 'What happens if a market has bets on only one side?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'If a market closes with bets on only one side (unopposed), all bettors receive a full refund with zero fees. This ensures fair play when there is no opposing position.',
        },
      },
      {
        '@type': 'Question',
        name: 'What happens if an event is cancelled or ends in a draw?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'For cancelled events, no-contest outcomes, or draws where applicable, all bettors on both sides receive a full refund with zero fees. Your entire stake is returned.',
        },
      },
      {
        '@type': 'Question',
        name: 'How are odds calculated in parimutuel betting?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Odds are calculated by dividing the total pool by the amount bet on each side. For example, if $500 total is bet with $200 on YES and $300 on NO, YES odds are 2.5x ($500/$200) and NO odds are 1.67x ($500/$300).',
        },
      },
    ],
  },
  '/support': {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I contact 0xNull support?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can contact 0xNull support through our SimpleX group chat. Scan the QR code on our support page to join. We do not offer email support to maintain privacy by default.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is 0xNull support private?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, we use SimpleX for support which provides end-to-end encrypted, private messaging. No email or personal information is required.',
        },
      },
      {
        '@type': 'Question',
        name: 'What information should I have ready before contacting support?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'For order issues, have your order ID ready. For betting issues, have your bet details available. Never share your private keys or recovery phrases with anyone, including support.',
        },
      },
    ],
  },
  '/swaps': {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do anonymous crypto swaps work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our crypto swap service allows you to exchange cryptocurrencies without KYC or registration. Simply select your coins, enter the amount, and provide a receiving address. The swap is processed through decentralized partners.',
        },
      },
      {
        '@type': 'Question',
        name: 'What cryptocurrencies can I swap?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We support a wide range of cryptocurrencies including BTC, ETH, XMR, LTC, DOGE, and many more. Check the swap interface for the full list of available pairs.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are there any fees for swapping?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Swap fees are included in the exchange rate shown. There are no hidden fees. The rate you see is the rate you get, subject to market fluctuations during processing.',
        },
      },
    ],
  },
};

// Structured data for different page types
const pageStructuredData: Record<string, StructuredData | StructuredData[]> = {
  '/': [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: '0xNull',
      url: 'https://0xnull.io',
      description: 'Privacy-first prediction markets and anonymous crypto marketplace',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://0xnull.io/browse?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: '0xNull',
      url: 'https://0xnull.io',
      logo: 'https://0xnull.io/favicon.jpg',
      sameAs: [],
    },
  ],
  '/sports-predictions': {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Sports Predictions',
    description: 'Anonymous sports betting with Monero. Predict outcomes for football, basketball, MMA, and more.',
    url: 'https://0xnull.io/sports-predictions',
    isPartOf: {
      '@type': 'WebSite',
      name: '0xNull',
      url: 'https://0xnull.io',
    },
    about: {
      '@type': 'Thing',
      name: 'Sports Betting',
      description: 'Privacy-focused sports prediction markets',
    },
  },
  '/esports-predictions': {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Esports Predictions',
    description: 'Anonymous esports betting. Predict outcomes for CS2, Dota 2, League of Legends, and more.',
    url: 'https://0xnull.io/esports-predictions',
    isPartOf: {
      '@type': 'WebSite',
      name: '0xNull',
      url: 'https://0xnull.io',
    },
    about: {
      '@type': 'Thing',
      name: 'Esports Betting',
      description: 'Privacy-focused esports prediction markets',
    },
  },
  '/predictions': {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Crypto Predictions',
    description: 'Predict cryptocurrency prices anonymously. BTC, ETH, XMR price predictions with privacy.',
    url: 'https://0xnull.io/predictions',
    isPartOf: {
      '@type': 'WebSite',
      name: '0xNull',
      url: 'https://0xnull.io',
    },
  },
  '/swaps': {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: 'Crypto Swaps - 0xNull',
    description: 'Swap cryptocurrencies anonymously. No KYC, no registration required.',
    url: 'https://0xnull.io/swaps',
    areaServed: 'Worldwide',
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: 'https://0xnull.io/swaps',
    },
  },
  '/browse': {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Marketplace',
    description: 'Anonymous crypto marketplace. Buy and sell goods and services with Monero.',
    url: 'https://0xnull.io/browse',
    isPartOf: {
      '@type': 'WebSite',
      name: '0xNull',
      url: 'https://0xnull.io',
    },
  },
  '/ai': {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'AI Services',
    description: 'Privacy-first AI services including voice cloning and text-to-speech.',
    url: 'https://0xnull.io/ai',
    isPartOf: {
      '@type': 'WebSite',
      name: '0xNull',
      url: 'https://0xnull.io',
    },
  },
  '/vps': {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Anonymous VPS Hosting',
    description: 'Anonymous VPS hosting with cryptocurrency payments. No KYC required.',
    url: 'https://0xnull.io/vps',
    brand: {
      '@type': 'Brand',
      name: '0xNull',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'XMR',
      availability: 'https://schema.org/InStock',
    },
  },
  '/phone': {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Anonymous eSIM',
    description: 'Anonymous eSIM and phone services with crypto payments.',
    url: 'https://0xnull.io/phone',
    brand: {
      '@type': 'Brand',
      name: '0xNull',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'XMR',
      availability: 'https://schema.org/InStock',
    },
  },
  '/safety': {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Harm Reduction',
    description: 'Safety and harm reduction resources for privacy tools and cryptocurrencies.',
    url: 'https://0xnull.io/safety',
    isPartOf: {
      '@type': 'WebSite',
      name: '0xNull',
      url: 'https://0xnull.io',
    },
  },
  '/terms': {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms of Service',
    description: 'Terms of service for 0xNull prediction markets and marketplace.',
    url: 'https://0xnull.io/terms',
  },
  '/privacy': {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy',
    description: 'Privacy policy for 0xNull.',
    url: 'https://0xnull.io/privacy',
  },
  '/how-betting-works': {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How Parimutuel Betting Works',
    description: 'Learn how parimutuel betting works on 0xNull prediction markets.',
    url: 'https://0xnull.io/how-betting-works',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Market Creation',
        text: 'A market is created with a question like "Will Team A win?" Two pools exist: YES pool and NO pool, both starting at 0.',
      },
      {
        '@type': 'HowToStep',
        name: 'Betting Phase',
        text: 'Users bet XMR on YES or NO. The pools grow as bets come in, and implied odds update in real-time based on pool ratios.',
      },
      {
        '@type': 'HowToStep',
        name: 'Resolution',
        text: 'An oracle checks the result. The winning side splits the entire pool, minus a 0.4% fee.',
      },
    ],
  },
  '/support': {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Support',
    description: 'Get help with 0xNull prediction markets and marketplace.',
    url: 'https://0xnull.io/support',
    mainEntity: {
      '@type': 'Organization',
      name: '0xNull',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        availableLanguage: 'English',
      },
    },
  },
  '/voice': {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AI Voice Cloning',
    description: 'Clone any voice with AI. High-quality text-to-speech synthesis.',
    url: 'https://0xnull.io/voice',
    applicationCategory: 'MultimediaApplication',
    offers: {
      '@type': 'Offer',
      price: '0.15',
      priceCurrency: 'USD',
    },
  },
  '/combat': {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'MMA & Boxing Predictions',
    description: 'Anonymous MMA and boxing betting with Monero.',
    url: 'https://0xnull.io/combat',
    isPartOf: {
      '@type': 'WebSite',
      name: '0xNull',
      url: 'https://0xnull.io',
    },
  },
  '/grapheneos': {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'GrapheneOS Phones',
    description: 'Privacy-focused GrapheneOS phones with crypto payments.',
    url: 'https://0xnull.io/grapheneos',
    brand: {
      '@type': 'Brand',
      name: 'GrapheneOS',
    },
  },
  '/fiat-onramp': {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: 'Buy Crypto with Fiat',
    description: 'Purchase cryptocurrency with credit card or bank transfer.',
    url: 'https://0xnull.io/fiat-onramp',
    areaServed: 'Worldwide',
  },
  '/fiat-offramp': {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: 'Sell Crypto to Fiat',
    description: 'Convert cryptocurrency to fiat currency.',
    url: 'https://0xnull.io/fiat-offramp',
    areaServed: 'Worldwide',
  },
  '/verify': {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Verify & Security',
    description: 'Verify 0xNull authenticity and security practices.',
    url: 'https://0xnull.io/verify',
  },
  '/vpn-resources': {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy VPN Resources',
    description: 'Curated list of privacy-focused VPN services.',
    url: 'https://0xnull.io/vpn-resources',
  },
  '/kokoro': {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Kokoro AI Companion',
    description: 'Private AI companion for conversation.',
    url: 'https://0xnull.io/kokoro',
    applicationCategory: 'LifestyleApplication',
  },
  '/slap': {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Slap Fighting Predictions',
    description: 'Anonymous slap fighting betting with Monero.',
    url: 'https://0xnull.io/slap',
  },
  '/predict': {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Predictions Hub',
    description: 'All prediction markets in one place.',
    url: 'https://0xnull.io/predict',
  },
};

// Article schemas for blog-style content pages
const articleSchemas: Record<string, StructuredData> = {
  '/how-betting-works': {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'How Parimutuel Betting Works on 0xNull',
    description: 'A comprehensive guide to understanding parimutuel betting mechanics, pool-based odds, and the 0.4% fee structure.',
    url: 'https://0xnull.io/how-betting-works',
    datePublished: '2024-01-01',
    dateModified: '2025-01-02',
    author: {
      '@type': 'Organization',
      name: '0xNull',
      url: 'https://0xnull.io',
    },
    publisher: {
      '@type': 'Organization',
      name: '0xNull',
      logo: {
        '@type': 'ImageObject',
        url: 'https://0xnull.io/favicon.jpg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': 'https://0xnull.io/how-betting-works',
    },
  },
  '/philosophy': {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'The Philosophy Behind 0xNull',
    description: 'Our philosophy on privacy, freedom, and decentralization. Why we built 0xNull.',
    url: 'https://0xnull.io/philosophy',
    datePublished: '2024-01-01',
    dateModified: '2025-01-02',
    author: {
      '@type': 'Organization',
      name: '0xNull',
      url: 'https://0xnull.io',
    },
    publisher: {
      '@type': 'Organization',
      name: '0xNull',
      logo: {
        '@type': 'ImageObject',
        url: 'https://0xnull.io/favicon.jpg',
      },
    },
  },
  '/safety': {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Harm Reduction and Safety Guide',
    description: 'Safety and harm reduction resources for privacy tools and cryptocurrencies.',
    url: 'https://0xnull.io/safety',
    datePublished: '2024-01-01',
    dateModified: '2025-01-02',
    author: {
      '@type': 'Organization',
      name: '0xNull',
      url: 'https://0xnull.io',
    },
    publisher: {
      '@type': 'Organization',
      name: '0xNull',
      logo: {
        '@type': 'ImageObject',
        url: 'https://0xnull.io/favicon.jpg',
      },
    },
  },
  '/tor': {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'How to Access 0xNull via Tor',
    description: 'Step-by-step guide to accessing 0xNull through the Tor network for maximum privacy.',
    url: 'https://0xnull.io/tor',
    datePublished: '2024-01-01',
    dateModified: '2025-01-02',
    author: {
      '@type': 'Organization',
      name: '0xNull',
      url: 'https://0xnull.io',
    },
    publisher: {
      '@type': 'Organization',
      name: '0xNull',
      logo: {
        '@type': 'ImageObject',
        url: 'https://0xnull.io/favicon.jpg',
      },
    },
    proficiencyLevel: 'Beginner',
  },
  '/get-started': {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'Getting Started with 0xNull',
    description: 'Quick start guide for new users of 0xNull prediction markets and marketplace.',
    url: 'https://0xnull.io/get-started',
    datePublished: '2024-01-01',
    dateModified: '2025-01-02',
    author: {
      '@type': 'Organization',
      name: '0xNull',
      url: 'https://0xnull.io',
    },
    publisher: {
      '@type': 'Organization',
      name: '0xNull',
      logo: {
        '@type': 'ImageObject',
        url: 'https://0xnull.io/favicon.jpg',
      },
    },
    proficiencyLevel: 'Beginner',
  },
  '/grapheneos': {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'GrapheneOS: The Privacy-First Mobile OS',
    description: 'Why GrapheneOS is the best choice for mobile privacy and how to get started.',
    url: 'https://0xnull.io/grapheneos',
    datePublished: '2024-01-01',
    dateModified: '2025-01-02',
    author: {
      '@type': 'Organization',
      name: '0xNull',
      url: 'https://0xnull.io',
    },
    publisher: {
      '@type': 'Organization',
      name: '0xNull',
      logo: {
        '@type': 'ImageObject',
        url: 'https://0xnull.io/favicon.jpg',
      },
    },
    proficiencyLevel: 'Beginner',
  },
  '/vpn-resources': {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Privacy-First VPN Resources',
    description: 'A curated list of VPN services that respect your privacy.',
    url: 'https://0xnull.io/vpn-resources',
    datePublished: '2024-01-01',
    dateModified: '2025-01-02',
    author: {
      '@type': 'Organization',
      name: '0xNull',
      url: 'https://0xnull.io',
    },
    publisher: {
      '@type': 'Organization',
      name: '0xNull',
      logo: {
        '@type': 'ImageObject',
        url: 'https://0xnull.io/favicon.jpg',
      },
    },
  },
};

// Generate breadcrumb structured data
function generateBreadcrumbSchema(pathname: string): StructuredData | null {
  const breadcrumbs = breadcrumbConfig[pathname];
  if (!breadcrumbs || breadcrumbs.length <= 1) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function useSEO(customMeta?: SEOProps, customStructuredData?: StructuredData | StructuredData[]) {
  const location = useLocation();
  
  useEffect(() => {
    const meta = {
      ...defaultMeta,
      ...pageMeta[location.pathname],
      ...customMeta,
    };
    
    const url = `https://0xnull.io${location.pathname}`;
    
    // Update document title
    document.title = meta.title || defaultMeta.title;
    
    // Update meta tags
    updateMetaTag('description', meta.description || defaultMeta.description);
    
    // Open Graph
    updateMetaTag('og:title', meta.title || defaultMeta.title, 'property');
    updateMetaTag('og:description', meta.description || defaultMeta.description, 'property');
    updateMetaTag('og:image', meta.image || defaultMeta.image, 'property');
    updateMetaTag('og:url', url, 'property');
    updateMetaTag('og:type', meta.type || defaultMeta.type, 'property');
    
    // Twitter
    updateMetaTag('twitter:title', meta.title || defaultMeta.title);
    updateMetaTag('twitter:description', meta.description || defaultMeta.description);
    updateMetaTag('twitter:image', meta.image || defaultMeta.image);
    updateMetaTag('twitter:url', url);
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
    
    // Collect all structured data
    const allStructuredData: StructuredData[] = [];
    
    // Add page-specific structured data
    if (customStructuredData) {
      if (Array.isArray(customStructuredData)) {
        allStructuredData.push(...customStructuredData);
      } else {
        allStructuredData.push(customStructuredData);
      }
    } else {
      const pageData = pageStructuredData[location.pathname];
      if (pageData) {
        if (Array.isArray(pageData)) {
          allStructuredData.push(...pageData);
        } else {
          allStructuredData.push(pageData);
        }
      }
    }
    
    // Add breadcrumb schema
    const breadcrumbSchema = generateBreadcrumbSchema(location.pathname);
    if (breadcrumbSchema) {
      allStructuredData.push(breadcrumbSchema);
    }
    
    // Add FAQ schema if available
    const faqSchema = faqSchemas[location.pathname];
    if (faqSchema) {
      allStructuredData.push(faqSchema);
    }
    
    // Add Article schema if available
    const articleSchema = articleSchemas[location.pathname];
    if (articleSchema) {
      allStructuredData.push(articleSchema);
    }
    
    updateStructuredData(allStructuredData.length > 0 ? allStructuredData : undefined);
    
  }, [location.pathname, customMeta, customStructuredData]);
}

function updateMetaTag(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let element = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, name);
    document.head.appendChild(element);
  }
  element.content = content;
}

function updateStructuredData(data: StructuredData | StructuredData[] | undefined) {
  // Remove existing structured data scripts
  const existingScripts = document.querySelectorAll('script[type="application/ld+json"][data-seo="true"]');
  existingScripts.forEach(script => script.remove());
  
  if (!data) return;
  
  const dataArray = Array.isArray(data) ? data : [data];
  
  dataArray.forEach(item => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo', 'true');
    script.textContent = JSON.stringify(item);
    document.head.appendChild(script);
  });
}

// Generate Product schema for marketplace listings
export interface ProductSEOData {
  id: string;
  title: string;
  description: string;
  priceUsd: number;
  images: string[];
  category: string;
  condition: 'new' | 'used' | 'digital';
  stock: number;
  sellerName?: string;
  sellerRating?: number;
  sellerReviewCount?: number;
  shipsFrom?: string;
  shipsTo?: string[];
}

export function useProductSEO(listing: ProductSEOData | null) {
  useEffect(() => {
    if (!listing) return;

    const url = `https://0xnull.io/listing/${listing.id}`;
    const imageUrl = listing.images[0]?.startsWith('http') 
      ? listing.images[0] 
      : `https://0xnull.io${listing.images[0]}`;

    // Update document title
    document.title = `${listing.title} - 0xNull Marketplace`;

    // Update meta tags
    updateMetaTag('description', listing.description.slice(0, 160));

    // Open Graph
    updateMetaTag('og:title', `${listing.title} - 0xNull Marketplace`, 'property');
    updateMetaTag('og:description', listing.description.slice(0, 160), 'property');
    updateMetaTag('og:image', imageUrl, 'property');
    updateMetaTag('og:url', url, 'property');
    updateMetaTag('og:type', 'product', 'property');

    // Twitter
    updateMetaTag('twitter:title', `${listing.title} - 0xNull Marketplace`);
    updateMetaTag('twitter:description', listing.description.slice(0, 160));
    updateMetaTag('twitter:image', imageUrl);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // Calculate price valid until (1 year from now)
    const priceValidUntil = new Date();
    priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1);

    // Build shipping details if available
    const shippingDetails = listing.shipsFrom ? {
      '@type': 'OfferShippingDetails',
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: '0',
        currency: 'USD',
      },
      shippingDestination: {
        '@type': 'DefinedRegion',
        addressCountry: listing.shipsTo?.length ? listing.shipsTo : ['US', 'CA', 'GB', 'DE', 'AU'],
      },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: {
          '@type': 'QuantitativeValue',
          minValue: 1,
          maxValue: 3,
          unitCode: 'DAY',
        },
        transitTime: {
          '@type': 'QuantitativeValue',
          minValue: 3,
          maxValue: 14,
          unitCode: 'DAY',
        },
      },
    } : undefined;

    // Merchant return policy
    const hasMerchantReturnPolicy = {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'US',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 30,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn',
    };

    // Product structured data with all required fields
    const productSchema: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: listing.title,
      description: listing.description,
      image: listing.images.length > 0 
        ? listing.images.map(img => 
            img.startsWith('http') ? img : `https://0xnull.io${img}`
          )
        : ['https://0xnull.io/og-image.png'],
      url: url,
      sku: listing.id,
      mpn: listing.id,
      category: listing.category,
      brand: {
        '@type': 'Brand',
        name: listing.sellerName || '0xNull Marketplace',
      },
      // Add aggregate rating if seller has reviews
      ...(listing.sellerRating && listing.sellerReviewCount ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: listing.sellerRating.toFixed(1),
          reviewCount: listing.sellerReviewCount,
          bestRating: '5',
          worstRating: '1',
        },
      } : {}),
      offers: {
        '@type': 'Offer',
        url: url,
        price: listing.priceUsd.toFixed(2),
        priceCurrency: 'USD',
        priceValidUntil: priceValidUntil.toISOString().split('T')[0],
        availability: listing.stock > 0 
          ? 'https://schema.org/InStock' 
          : 'https://schema.org/OutOfStock',
        itemCondition: listing.condition === 'new' 
          ? 'https://schema.org/NewCondition'
          : listing.condition === 'used'
          ? 'https://schema.org/UsedCondition'
          : 'https://schema.org/NewCondition',
        seller: {
          '@type': 'Organization',
          name: listing.sellerName || '0xNull Marketplace',
        },
        hasMerchantReturnPolicy: hasMerchantReturnPolicy,
        ...(shippingDetails ? { shippingDetails: shippingDetails } : {}),
      },
    };

    // Breadcrumb for listing
    const breadcrumbSchema: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://0xnull.io/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Marketplace',
          item: 'https://0xnull.io/browse',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: listing.title,
          item: url,
        },
      ],
    };

    updateStructuredData([productSchema, breadcrumbSchema]);

  }, [listing]);
}

// Generate Event schema for prediction markets
export interface EventSEOData {
  id: string;
  question: string;
  description?: string;
  resolutionDate?: string;
  status: 'open' | 'closed' | 'resolved';
  totalPool?: number;
  eventType?: 'sports' | 'esports' | 'crypto' | 'other';
  teams?: { home?: string; away?: string };
}

// Generate ItemList schema for prediction market list pages
export interface EventListSEOData {
  events: Array<{
    id: string;
    question: string;
    description?: string;
    resolutionDate?: string;
    status: 'open' | 'closed' | 'resolved';
    totalPool?: number;
    eventType?: 'sports' | 'esports' | 'crypto' | 'other';
    teams?: { home?: string; away?: string };
  }>;
  pageTitle: string;
  pageDescription: string;
  pageUrl: string;
}

export function useEventListSEO(data: EventListSEOData | null) {
  useEffect(() => {
    if (!data || data.events.length === 0) return;

    // Build ItemList schema with events
    const itemListSchema: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: data.pageTitle,
      description: data.pageDescription,
      url: data.pageUrl,
      numberOfItems: data.events.length,
      itemListElement: data.events.slice(0, 20).map((event, index) => {
        const eventType = event.eventType === 'sports' || (event.teams?.home && event.teams?.away)
          ? 'SportsEvent'
          : 'Event';
        
        return {
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': eventType,
            name: event.question,
            description: event.description || `Predict: ${event.question}`,
            url: `${data.pageUrl}#market-${event.id}`,
            eventStatus: event.status === 'open'
              ? 'https://schema.org/EventScheduled'
              : event.status === 'resolved'
              ? 'https://schema.org/EventCancelled'
              : 'https://schema.org/EventPostponed',
            ...(event.resolutionDate && {
              startDate: event.resolutionDate,
            }),
            ...(event.teams?.home && event.teams?.away && {
              competitor: [
                { '@type': 'SportsTeam', name: event.teams.home },
                { '@type': 'SportsTeam', name: event.teams.away },
              ],
            }),
            organizer: {
              '@type': 'Organization',
              name: '0xNull',
              url: 'https://0xnull.io',
            },
          },
        };
      }),
    };

    updateStructuredData([itemListSchema]);

  }, [data]);
}

export function useEventSEO(event: EventSEOData | null, pageType?: string) {
  useEffect(() => {
    if (!event) return;

    const url = `https://0xnull.io/market/${event.id}`;
    const title = event.question.length > 60 
      ? `${event.question.slice(0, 57)}...` 
      : event.question;

    // Update document title
    document.title = `${title} - 0xNull Predictions`;

    // Update meta tags
    const description = event.description || `Predict: ${event.question}. Anonymous betting with Monero on 0xNull.`;
    updateMetaTag('description', description.slice(0, 160));

    // Open Graph
    updateMetaTag('og:title', `${title} - 0xNull Predictions`, 'property');
    updateMetaTag('og:description', description.slice(0, 160), 'property');
    updateMetaTag('og:url', url, 'property');
    updateMetaTag('og:type', 'website', 'property');

    // Twitter
    updateMetaTag('twitter:title', `${title} - 0xNull Predictions`);
    updateMetaTag('twitter:description', description.slice(0, 160));

    // Determine event type for schema
    let eventSchemaType = 'Event';
    if (event.eventType === 'sports') eventSchemaType = 'SportsEvent';
    if (event.teams?.home && event.teams?.away) eventSchemaType = 'SportsEvent';

    // Event structured data
    const eventSchema: StructuredData = {
      '@context': 'https://schema.org',
      '@type': eventSchemaType,
      name: event.question,
      description: description,
      url: url,
      eventStatus: event.status === 'open' 
        ? 'https://schema.org/EventScheduled'
        : event.status === 'resolved'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventPostponed',
      ...(event.resolutionDate && {
        startDate: event.resolutionDate,
        endDate: event.resolutionDate,
      }),
      location: {
        '@type': 'VirtualLocation',
        url: 'https://0xnull.io',
      },
      organizer: {
        '@type': 'Organization',
        name: '0xNull',
        url: 'https://0xnull.io',
      },
      ...(event.teams?.home && event.teams?.away && {
        competitor: [
          {
            '@type': 'SportsTeam',
            name: event.teams.home,
          },
          {
            '@type': 'SportsTeam',
            name: event.teams.away,
          },
        ],
      }),
    };

    // Breadcrumb for market
    const pageName = pageType || 'Predictions';
    const breadcrumbSchema: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://0xnull.io/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: pageName,
          item: 'https://0xnull.io/predict',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: title,
          item: url,
        },
      ],
    };

    updateStructuredData([eventSchema, breadcrumbSchema]);

  }, [event, pageType]);
}

// Generate Seller/Organization schema with AggregateRating for reviews
export interface SellerSEOData {
  id: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  location?: string;
  totalSales?: number;
  joinedAt?: string;
  reputation: {
    score: number;
    reviewCount: number;
  };
  reviews?: Array<{
    rating: number;
    title?: string;
    content?: string;
    reviewerName?: string;
    createdAt: string;
  }>;
}

export function useSellerSEO(seller: SellerSEOData | null) {
  useEffect(() => {
    if (!seller) return;

    const url = `https://0xnull.io/seller/${seller.id}`;
    const title = `${seller.displayName} - 0xNull Marketplace Seller`;
    const description = seller.bio 
      ? seller.bio.slice(0, 160)
      : `${seller.displayName} is a verified seller on 0xNull Marketplace with ${seller.reputation.reviewCount} reviews and a ${seller.reputation.score}/5 rating.`;

    // Update document title
    document.title = title;

    // Update meta tags
    updateMetaTag('description', description);

    // Open Graph
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:url', url, 'property');
    updateMetaTag('og:type', 'profile', 'property');
    if (seller.avatar) {
      updateMetaTag('og:image', seller.avatar, 'property');
    }

    // Twitter
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    if (seller.avatar) {
      updateMetaTag('twitter:image', seller.avatar);
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // Build structured data array
    const structuredDataArray: StructuredData[] = [];

    // Organization/LocalBusiness schema with AggregateRating
    const sellerSchema: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: seller.displayName,
      url: url,
      description: description,
      ...(seller.avatar && { image: seller.avatar }),
      ...(seller.location && {
        address: {
          '@type': 'PostalAddress',
          addressLocality: seller.location,
        },
      }),
      ...(seller.reputation.reviewCount > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: seller.reputation.score.toFixed(1),
          bestRating: '5',
          worstRating: '1',
          ratingCount: seller.reputation.reviewCount,
          reviewCount: seller.reputation.reviewCount,
        },
      }),
    };
    structuredDataArray.push(sellerSchema);

    // Add individual Review schemas (up to 5 most recent)
    if (seller.reviews && seller.reviews.length > 0) {
      seller.reviews.slice(0, 5).forEach(review => {
        const reviewSchema: StructuredData = {
          '@context': 'https://schema.org',
          '@type': 'Review',
          itemReviewed: {
            '@type': 'Organization',
            name: seller.displayName,
            url: url,
          },
          reviewRating: {
            '@type': 'Rating',
            ratingValue: review.rating,
            bestRating: 5,
            worstRating: 1,
          },
          ...(review.title && { name: review.title }),
          ...(review.content && { reviewBody: review.content }),
          author: {
            '@type': 'Person',
            name: review.reviewerName || 'Anonymous',
          },
          datePublished: review.createdAt,
        };
        structuredDataArray.push(reviewSchema);
      });
    }

    // Breadcrumb for seller profile
    const breadcrumbSchema: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://0xnull.io/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Marketplace',
          item: 'https://0xnull.io/browse',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: seller.displayName,
          item: url,
        },
      ],
    };
    structuredDataArray.push(breadcrumbSchema);

    updateStructuredData(structuredDataArray);

  }, [seller]);
}

// Generate ItemList schema for marketplace product list pages
export interface ProductListSEOData {
  products: Array<{
    id: string;
    title: string;
    description: string;
    priceUsd: number;
    images: string[];
    category: string;
    condition: 'new' | 'used' | 'digital';
    stock: number;
    sellerName?: string;
  }>;
  pageTitle: string;
  pageDescription: string;
  pageUrl: string;
}

export function useProductListSEO(data: ProductListSEOData | null) {
  useEffect(() => {
    if (!data || data.products.length === 0) return;

    // Build ItemList schema with products
    const itemListSchema: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: data.pageTitle,
      description: data.pageDescription,
      url: data.pageUrl,
      numberOfItems: data.products.length,
      itemListElement: data.products.slice(0, 20).map((product, index) => {
        const imageUrl = product.images[0]?.startsWith('http') 
          ? product.images[0] 
          : `https://0xnull.io${product.images[0]}`;
        
        return {
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: product.title,
            description: product.description.slice(0, 200),
            url: `https://0xnull.io/listing/${product.id}`,
            image: imageUrl,
            category: product.category,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'USD',
              price: product.priceUsd.toFixed(2),
              availability: product.stock > 0 
                ? 'https://schema.org/InStock' 
                : 'https://schema.org/OutOfStock',
              itemCondition: product.condition === 'new' 
                ? 'https://schema.org/NewCondition'
                : product.condition === 'used'
                ? 'https://schema.org/UsedCondition'
                : 'https://schema.org/NewCondition',
            },
            ...(product.sellerName && {
              seller: {
                '@type': 'Organization',
                name: product.sellerName,
              },
            }),
          },
        };
      }),
    };

    // Breadcrumb for marketplace
    const breadcrumbSchema: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://0xnull.io/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Marketplace',
          item: data.pageUrl,
        },
      ],
    };

    updateStructuredData([itemListSchema, breadcrumbSchema]);

  }, [data]);
}

// Helper to generate dynamic OG image URL
export function generateOGImageUrl(params: {
  title: string;
  subtitle?: string;
  type: 'listing' | 'market' | 'seller' | 'page';
  price?: string;
  category?: string;
}): string {
  const baseUrl = 'https://qjkojiamexufuxsrupjq.supabase.co/functions/v1/og-image';
  const searchParams = new URLSearchParams();
  
  searchParams.set('title', params.title);
  if (params.subtitle) searchParams.set('subtitle', params.subtitle);
  searchParams.set('type', params.type);
  if (params.price) searchParams.set('price', params.price);
  if (params.category) searchParams.set('category', params.category);
  
  return `${baseUrl}?${searchParams.toString()}`;
}

export default useSEO;
