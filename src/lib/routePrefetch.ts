/**
 * Route prefetching registry for lazy-loaded pages
 * Maps routes to their dynamic import functions for prefetching on hover/viewport
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

// Normalize a path for lookup
function normalizePath(path: string): string {
  return path.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
}

/**
 * Prefetch a route's JavaScript chunk
 * @param path - The route path to prefetch
 */
export function prefetchRoute(path: string): void {
  const normalizedPath = normalizePath(path);
  
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

// Shared IntersectionObserver for viewport-based prefetching
let prefetchObserver: IntersectionObserver | null = null;
const observedElements = new WeakMap<Element, string>();

/**
 * Get or create the shared IntersectionObserver for prefetching
 */
function getPrefetchObserver(): IntersectionObserver {
  if (!prefetchObserver) {
    prefetchObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const path = observedElements.get(entry.target);
            if (path) {
              prefetchRoute(path);
              // Unobserve after prefetching
              prefetchObserver?.unobserve(entry.target);
              observedElements.delete(entry.target);
            }
          }
        });
      },
      {
        // Start prefetching when element is within 200px of viewport
        rootMargin: '200px',
        threshold: 0,
      }
    );
  }
  return prefetchObserver;
}

/**
 * Observe an element for viewport-based prefetching
 * @param element - The DOM element (usually a link) to observe
 * @param path - The route path to prefetch when visible
 */
export function observeForPrefetch(element: Element, path: string): void {
  if (!isInternalRoute(path)) return;
  
  const normalizedPath = normalizePath(path);
  
  // Skip if already prefetched
  if (prefetchedRoutes.has(normalizedPath)) return;
  
  // Skip if no matching route
  if (!routeImports[normalizedPath]) return;
  
  observedElements.set(element, normalizedPath);
  getPrefetchObserver().observe(element);
}

/**
 * Stop observing an element for prefetching
 * @param element - The DOM element to unobserve
 */
export function unobserveForPrefetch(element: Element): void {
  if (prefetchObserver && observedElements.has(element)) {
    prefetchObserver.unobserve(element);
    observedElements.delete(element);
  }
}
