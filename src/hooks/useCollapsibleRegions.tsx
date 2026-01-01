import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'sports-expanded-regions';

interface CollapsibleRegionsState {
  expandedRegions: Set<string>;
  isRegionExpanded: (region: string) => boolean;
  toggleRegion: (region: string) => void;
  expandAll: (regions: string[]) => void;
  collapseAll: () => void;
  setInitialRegions: (regions: string[], defaultOpenCount?: number) => void;
}

export function useCollapsibleRegions(): CollapsibleRegionsState {
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      }
    } catch (e) {
      console.error('Failed to load expanded regions from localStorage:', e);
    }
    return new Set();
  });
  
  const [initialized, setInitialized] = useState(false);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (initialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...expandedRegions]));
      } catch (e) {
        console.error('Failed to save expanded regions to localStorage:', e);
      }
    }
  }, [expandedRegions, initialized]);

  const isRegionExpanded = useCallback((region: string) => {
    return expandedRegions.has(region);
  }, [expandedRegions]);

  const toggleRegion = useCallback((region: string) => {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(region)) {
        next.delete(region);
      } else {
        next.add(region);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback((regions: string[]) => {
    setExpandedRegions(new Set(regions));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedRegions(new Set());
  }, []);

  // Initialize with default open regions if no stored state exists
  const setInitialRegions = useCallback((regions: string[], defaultOpenCount = 3) => {
    if (!initialized) {
      setExpandedRegions(prev => {
        // If we already have stored preferences, use them
        if (prev.size > 0) {
          setInitialized(true);
          return prev;
        }
        // Otherwise, open the first N regions by default
        const defaultOpen = new Set(regions.slice(0, defaultOpenCount));
        setInitialized(true);
        return defaultOpen;
      });
    }
  }, [initialized]);

  return {
    expandedRegions,
    isRegionExpanded,
    toggleRegion,
    expandAll,
    collapseAll,
    setInitialRegions,
  };
}
