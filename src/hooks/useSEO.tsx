import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
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

export function useSEO(customMeta?: SEOProps) {
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
    
  }, [location.pathname, customMeta]);
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

export default useSEO;
