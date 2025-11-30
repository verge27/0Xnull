import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useExchangeRate = () => {
  const [xmrUsdRate, setXmrUsdRate] = useState<number>(150); // Default fallback
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRate = async () => {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('currency_pair', 'XMR/USD')
        .maybeSingle();

      if (!error && data) {
        setXmrUsdRate(Number(data.rate));
      }
      setLoading(false);
    };

    fetchRate();

    // Subscribe to rate changes
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
            setXmrUsdRate(Number(payload.new.rate));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const usdToXmr = (usdAmount: number): number => {
    return usdAmount / xmrUsdRate;
  };

  const xmrToUsd = (xmrAmount: number): number => {
    return xmrAmount * xmrUsdRate;
  };

  return { xmrUsdRate, loading, usdToXmr, xmrToUsd };
};
