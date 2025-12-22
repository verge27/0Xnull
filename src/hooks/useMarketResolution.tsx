import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/services/api';

interface PoolStatus {
  market_id: string;
  exists: boolean;
  yes_pool_xmr: number;
  no_pool_xmr: number;
  last_checked: number;
}

interface RateLimitStats {
  remaining: number;
  limit: number;
  reset_at: number;
  should_backoff: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PROXY_BASE = `${SUPABASE_URL}/functions/v1/xnull-proxy`;

// Poll interval: 60 seconds (as recommended)
const POLL_INTERVAL_MS = 60000;

export function useMarketResolution() {
  const [poolStatuses, setPoolStatuses] = useState<Record<string, PoolStatus>>({});
  const [rateLimitStats, setRateLimitStats] = useState<RateLimitStats | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const marketIdsRef = useRef<string[]>([]);

  // Check rate limit status from /api/esports/stats
  const checkRateLimit = useCallback(async (): Promise<RateLimitStats | null> => {
    try {
      const proxyUrl = new URL(PROXY_BASE);
      proxyUrl.searchParams.set('path', '/api/esports/stats');
      
      const res = await fetch(proxyUrl.toString(), {
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!res.ok) return null;
      
      const data = await res.json();
      
      // Parse rate limit info from response
      const stats: RateLimitStats = {
        remaining: data.rate_limit?.remaining ?? 100,
        limit: data.rate_limit?.limit ?? 100,
        reset_at: data.rate_limit?.reset_at ?? Date.now() + 60000,
        should_backoff: (data.rate_limit?.remaining ?? 100) < 10,
      };
      
      setRateLimitStats(stats);
      return stats;
    } catch (error) {
      console.log('Rate limit check failed:', error);
      return null;
    }
  }, []);

  // Check pool status for a single market (pool data only, not resolution)
  const checkPoolStatus = useCallback(async (marketId: string): Promise<PoolStatus | null> => {
    try {
      const result = await api.checkPool(marketId);
      
      if (!result?.exists) {
        return null;
      }
      
      const status: PoolStatus = {
        market_id: marketId,
        exists: true,
        yes_pool_xmr: result.yes_pool_xmr ?? 0,
        no_pool_xmr: result.no_pool_xmr ?? 0,
        last_checked: Date.now(),
      };
      
      return status;
    } catch (error) {
      console.log(`Pool check failed for ${marketId}:`, error);
      return null;
    }
  }, []);

  // Check multiple pools with rate limit awareness
  const checkPools = useCallback(async (marketIds: string[]) => {
    if (marketIds.length === 0) return;
    
    // First check rate limit
    const rateLimit = await checkRateLimit();
    
    if (rateLimit?.should_backoff) {
      console.log('Rate limit low, backing off pool checks');
      return;
    }
    
    // Limit concurrent requests
    const concurrency = 4;
    const results: PoolStatus[] = [];
    
    for (let i = 0; i < marketIds.length; i += concurrency) {
      const batch = marketIds.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(id => checkPoolStatus(id))
      );
      results.push(...batchResults.filter((r): r is PoolStatus => r !== null));
    }
    
    // Update state
    setPoolStatuses(prev => {
      const updated = { ...prev };
      for (const status of results) {
        updated[status.market_id] = status;
      }
      return updated;
    });
    
    return results;
  }, [checkPoolStatus, checkRateLimit]);

  // Start polling for resolution status
  const startPolling = useCallback((marketIds: string[]) => {
    marketIdsRef.current = marketIds;
    
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    if (marketIds.length === 0) {
      setIsPolling(false);
      return;
    }
    
    setIsPolling(true);
    
    // Initial check
    checkPools(marketIds);
    
    // Poll at recommended interval (60 seconds)
    pollingRef.current = setInterval(() => {
      // Check rate limit before polling
      if (rateLimitStats?.should_backoff) {
        console.log('Rate limit backoff active, skipping poll');
        return;
      }
      checkPools(marketIdsRef.current);
    }, POLL_INTERVAL_MS);
  }, [checkPools, rateLimitStats]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Get pool status for a market
  const getPoolStatus = useCallback((marketId: string) => {
    return poolStatuses[marketId] ?? null;
  }, [poolStatuses]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  return {
    poolStatuses,
    rateLimitStats,
    isPolling,
    checkRateLimit,
    checkPoolStatus,
    checkPools,
    startPolling,
    stopPolling,
    getPoolStatus,
  };
}
