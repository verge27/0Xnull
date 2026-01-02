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
};

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
    
    // Structured Data (JSON-LD)
    const structuredData = customStructuredData || pageStructuredData[location.pathname];
    updateStructuredData(structuredData);
    
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
