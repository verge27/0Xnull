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
    title: 'Predictions Hub - 0xNull',
    description: 'Make anonymous predictions on sports, esports, crypto, and more. Win XMR with privacy-first prediction markets.',
  },
  '/sports-predictions': {
    title: 'Sports Predictions - 0xNull',
    description: 'Anonymous sports betting with Monero. Predict outcomes for football, basketball, MMA, and more.',
  },
  '/esports-predictions': {
    title: 'Esports Predictions - 0xNull',
    description: 'Anonymous esports betting. Predict outcomes for CS2, Dota 2, League of Legends, and more.',
  },
  '/predictions': {
    title: 'Crypto Predictions - 0xNull',
    description: 'Predict cryptocurrency prices anonymously. BTC, ETH, XMR price predictions with privacy.',
  },
  '/swaps': {
    title: 'Crypto Swaps - 0xNull',
    description: 'Swap cryptocurrencies anonymously. No KYC, no registration. Exchange BTC, ETH, XMR and more.',
  },
  '/browse': {
    title: 'Marketplace - 0xNull',
    description: 'Anonymous crypto marketplace. Buy and sell goods and services with Monero.',
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
    title: 'Anonymous VPS - 0xNull',
    description: 'Anonymous VPS hosting with cryptocurrency. No KYC, privacy-focused virtual private servers.',
  },
  '/phone': {
    title: 'Anonymous eSIM - 0xNull',
    description: 'Anonymous eSIM and phone services. Pay with crypto, no identity verification required.',
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

export default useSEO;
