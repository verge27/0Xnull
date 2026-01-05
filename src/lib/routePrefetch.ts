/**
 * Route prefetching registry for lazy-loaded pages
 * Maps routes to their dynamic import functions for prefetching on hover
 */

type ImportFn = () => Promise<{ default: React.ComponentType }>;

// Registry of routes to their lazy import functions
const routeImports: Record<string, ImportFn> = {
  '/': () => import('@/pages/Index'),
  '/browse': () => import('@/pages/Browse'),
  '/marketplace': () => import('@/pages/Browse'),
  '/sell': () => import('@/pages/Sell'),
  '/sell/new': () => import('@/pages/NewListing'),
  '/orders': () => import('@/pages/Orders'),
  '/wishlist': () => import('@/pages/Wishlist'),
  '/messages': () => import('@/pages/Messages'),
  '/settings': () => import('@/pages/Settings'),
  '/auth': () => import('@/pages/Auth'),
  
  // Predictions
  '/predict': () => import('@/pages/PredictionsHub'),
  '/predictions': () => import('@/pages/CryptoPredictions'),
  '/sports-predictions': () => import('@/pages/SportsPredictions'),
  '/esports-predictions': () => import('@/pages/EsportsPredictions'),
  '/cricket-predictions': () => import('@/pages/CricketPredictions'),
  '/starcraft': () => import('@/pages/StarcraftPredictions'),
  '/predictions/sports/combat': () => import('@/pages/CombatSports'),
  '/predictions/sports/combat/mma': () => import('@/pages/CombatSports'),
  '/predictions/sports/combat/boxing': () => import('@/pages/CombatSports'),
  '/predictions/sports/combat/slap': () => import('@/pages/Slap'),
  '/how-betting-works': () => import('@/pages/HowBettingWorks'),
  '/my-slips': () => import('@/pages/MySlips'),
  '/payouts': () => import('@/pages/Payouts'),
  
  // AI
  '/ai': () => import('@/pages/AIHub'),
  '/voice': () => import('@/pages/Voice'),
  '/kokoro': () => import('@/pages/Kokoro'),
  
  // Infrastructure
  '/infra': () => import('@/pages/InfraHub'),
  '/swaps': () => import('@/pages/Swaps'),
  '/vps': () => import('@/pages/VPS'),
  '/phone': () => import('@/pages/Phone'),
  '/esim': () => import('@/pages/Phone'),
  
  // Other pages
  '/safety': () => import('@/pages/HarmReduction'),
  '/terms': () => import('@/pages/Terms'),
  '/privacy': () => import('@/pages/Privacy'),
  '/vpn-resources': () => import('@/pages/VpnResources'),
  '/philosophy': () => import('@/pages/Philosophy'),
  '/grapheneos': () => import('@/pages/GrapheneOS'),
  '/cashout': () => import('@/pages/FiatOfframp'),
  '/buy': () => import('@/pages/FiatOnramp'),
  '/verify': () => import('@/pages/Verify'),
  '/support': () => import('@/pages/Support'),
  '/tor-guide': () => import('@/pages/TorGuide'),
  '/get-started': () => import('@/pages/GetStarted'),
  '/api-docs': () => import('@/pages/ApiDocs'),
  '/influencer': () => import('@/pages/Influencer'),
};

// Track which routes have already been prefetched to avoid duplicate requests
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch a route's JavaScript chunk
 * @param path - The route path to prefetch
 */
export function prefetchRoute(path: string): void {
  // Normalize path (remove trailing slash, query params, hash)
  const normalizedPath = path.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
  
  // Skip if already prefetched
  if (prefetchedRoutes.has(normalizedPath)) {
    return;
  }
  
  // Find matching import function
  const importFn = routeImports[normalizedPath];
  
  if (importFn) {
    // Mark as prefetched immediately to prevent duplicate calls
    prefetchedRoutes.add(normalizedPath);
    
    // Use requestIdleCallback for non-blocking prefetch, with setTimeout fallback
    const prefetch = () => {
      importFn().catch(() => {
        // Remove from prefetched set if failed, so it can retry
        prefetchedRoutes.delete(normalizedPath);
      });
    };
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(prefetch, { timeout: 2000 });
    } else {
      setTimeout(prefetch, 100);
    }
  }
}

/**
 * Check if a path is an internal route (not external URL)
 */
export function isInternalRoute(path: string): boolean {
  if (!path) return false;
  // External URLs start with http://, https://, or //
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return false;
  }
  // Mailto, tel, etc.
  if (path.includes(':') && !path.startsWith('/')) {
    return false;
  }
  return true;
}
