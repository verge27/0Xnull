import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const fetchExchangeRate = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('currency_pair', 'XMR/USD')
    .maybeSingle();

  if (error || !data) {
    return 150; // Default fallback
  }
  return Number(data.rate);
};

export const useExchangeRate = () => {
  const queryClient = useQueryClient();

  const { data: xmrUsdRate = 150, isLoading: loading } = useQuery({
    queryKey: ['exchange_rate', 'XMR/USD'],
    queryFn: fetchExchangeRate,
    staleTime: 60000, // Cache for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Subscribe to realtime rate changes
  useEffect(() => {
    const channel = supabase
      .channel('exchange_rates_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'exchange_rates',
          filter: 'currency_pair=eq.XMR/USD'
        },
        (payload) => {
          if (payload.new && 'rate' in payload.new) {
            queryClient.setQueryData(['exchange_rate', 'XMR/USD'], Number(payload.new.rate));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  const usdToXmr = (usdAmount: number): number => {
    return usdAmount / xmrUsdRate;
  };

  const xmrToUsd = (xmrAmount: number): number => {
    return xmrAmount * xmrUsdRate;
  };

  return { xmrUsdRate, loading, usdToXmr, xmrToUsd };
};
