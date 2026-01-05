import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { prefetchRoute, isInternalRoute, observeForPrefetch, unobserveForPrefetch } from "@/lib/routePrefetch";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  /** Disable prefetching for this link */
  noPrefetch?: boolean;
  /** Prefetch when link enters viewport instead of on hover */
  prefetchOnViewport?: boolean;
}

/**
 * NavLink component with route prefetching on hover/focus or viewport visibility
 * Prefetches the target route's JavaScript chunk for faster navigation
 */
const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, noPrefetch = false, prefetchOnViewport = false, onMouseEnter, onFocus, ...props }, ref) => {
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
      <RouterNavLink
        ref={elementRef}
        to={to}
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
