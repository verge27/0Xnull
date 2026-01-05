import { Link, LinkProps } from 'react-router-dom';
import { forwardRef, useCallback, useEffect, useRef } from 'react';
import { prefetchRoute, isInternalRoute, observeForPrefetch, unobserveForPrefetch } from '@/lib/routePrefetch';

interface PrefetchLinkProps extends LinkProps {
  /** Disable prefetching for this link */
  noPrefetch?: boolean;
  /** Prefetch when link enters viewport instead of on hover */
  prefetchOnViewport?: boolean;
}

/**
 * A Link component that prefetches the target route on hover/focus or when visible in viewport
 * This preloads the JavaScript chunk before the user clicks, making navigation feel instant
 */
const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  ({ to, noPrefetch = false, prefetchOnViewport = false, onMouseEnter, onFocus, children, ...props }, ref) => {
    const path = typeof to === 'string' ? to : to.pathname || '';
    const internalRef = useRef<HTMLAnchorElement>(null);
    const elementRef = (ref as React.RefObject<HTMLAnchorElement>) || internalRef;
    
    // Viewport-based prefetching
    useEffect(() => {
      if (noPrefetch || !prefetchOnViewport || !isInternalRoute(path)) return;
      
      const element = elementRef.current;
      if (!element) return;
      
      observeForPrefetch(element, path);
      
      return () => {
        unobserveForPrefetch(element);
      };
    }, [path, noPrefetch, prefetchOnViewport, elementRef]);
    
    const handlePrefetch = useCallback(() => {
      if (!noPrefetch && !prefetchOnViewport && isInternalRoute(path)) {
        prefetchRoute(path);
      }
    }, [path, noPrefetch, prefetchOnViewport]);
    
    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        handlePrefetch();
        onMouseEnter?.(e);
      },
      [handlePrefetch, onMouseEnter]
    );
    
    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLAnchorElement>) => {
        handlePrefetch();
        onFocus?.(e);
      },
      [handlePrefetch, onFocus]
    );
    
    return (
      <Link
        ref={elementRef}
        to={to}
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

PrefetchLink.displayName = 'PrefetchLink';

export { PrefetchLink };
export type { PrefetchLinkProps };
