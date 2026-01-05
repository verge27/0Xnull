import { Link, LinkProps } from 'react-router-dom';
import { forwardRef, useCallback } from 'react';
import { prefetchRoute, isInternalRoute } from '@/lib/routePrefetch';

interface PrefetchLinkProps extends LinkProps {
  /** Disable prefetching for this link */
  noPrefetch?: boolean;
}

/**
 * A Link component that prefetches the target route on hover/focus
 * This preloads the JavaScript chunk before the user clicks, making navigation feel instant
 */
const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  ({ to, noPrefetch = false, onMouseEnter, onFocus, children, ...props }, ref) => {
    const path = typeof to === 'string' ? to : to.pathname || '';
    
    const handlePrefetch = useCallback(() => {
      if (!noPrefetch && isInternalRoute(path)) {
        prefetchRoute(path);
      }
    }, [path, noPrefetch]);
    
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
        ref={ref}
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
