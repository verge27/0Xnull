import { supabase } from '@/integrations/supabase/client';
import {
  RAMP_ELIGIBILITY_CONFIG,
  type CountryEligibility,
  type RampEligibilityConfig,
  type Restriction,
} from '@/lib/rampEligibilityConfig';

export type RampSide = 'buy' | 'sell';

export const HODL_HODL_URL = 'https://hodlhodl.com/';

export const HODL_HODL_SAFETY = [
  'Choose an offer that supports your actual payment method.',
  "Review the counterparty's reputation and completed trades.",
  'Keep the conversation and trade inside the platform.',
  "Follow the offer's payment instructions exactly.",
  "Payments should come from an account in the trader's own name.",
  'Sellers should never release Bitcoin until payment is confirmed in their own account.',
  'Availability depends on active offers, payment providers and local law.',
];

export const HODL_HODL_BITCOIN_ONLY =
  'Hodl Hodl supports Bitcoin only. Using this route may require converting your asset to or from Bitcoin separately, which can involve network fees, price movement and possible tax consequences.';

let cached: RampEligibilityConfig | null = null;

/** Loads the versioned server-side config, falling back to the bundled copy. */
export const loadRampConfig = async (): Promise<RampEligibilityConfig> => {
  if (cached) return cached;
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ramp-eligibility`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as RampEligibilityConfig;
    if (!Array.isArray(data?.countries) || data.countries.length === 0) throw new Error('empty config');
    cached = data;
  } catch {
    cached = RAMP_ELIGIBILITY_CONFIG;
  }
  return cached;
};

export const findCountry = (config: RampEligibilityConfig, code: string): CountryEligibility => {
  const match = config.countries.find((c) => c.code === code.toUpperCase());
  if (match) return match;
  return { code: code.toUpperCase(), name: code.toUpperCase(), ...config.defaults };
};

export type QuoteState = 'idle' | 'loading' | 'available' | 'unavailable';

export interface DirectRouteDecision {
  /** Country passes both SimpleSwap and the fiat provider */
  jurisdictionAllowed: boolean;
  blockers: { provider: string; restriction: Restriction }[];
}

export const evaluateDirectRoute = (country: CountryEligibility, fiatProviderName: string): DirectRouteDecision => {
  const blockers: { provider: string; restriction: Restriction }[] = [];
  if (country.simpleswap.status === 'blocked') blockers.push({ provider: 'SimpleSwap', restriction: country.simpleswap });
  if (country.fiatProvider.status === 'blocked') blockers.push({ provider: fiatProviderName, restriction: country.fiatProvider });
  return { jurisdictionAllowed: blockers.length === 0, blockers };
};

export const isHodlHodlAllowed = (country: CountryEligibility) => country.hodlhodl.status !== 'blocked';

export interface QuoteResult {
  ok: boolean;
  estimate?: string;
  error?: string;
}

/**
 * Live quote is the final check for the direct route. A jurisdiction can pass
 * every static check and still fail here, in which case we fall back.
 */
export const requestDirectQuote = async (
  side: RampSide,
  asset: string,
  fiat: string,
  amount: number,
): Promise<QuoteResult> => {
  try {
    const cryptoTicker = asset.toLowerCase();
    const cryptoNetwork = ASSET_NETWORKS[asset] ?? cryptoTicker;
    const fiatTicker = fiat.toLowerCase();
    const currencyFrom = side === 'sell' ? cryptoTicker : fiatTicker;
    const networkFrom = side === 'sell' ? cryptoNetwork : fiatTicker;
    const currencyTo = side === 'sell' ? fiatTicker : cryptoTicker;
    const networkTo = side === 'sell' ? fiatTicker : cryptoNetwork;
    const { data, error } = await supabase.functions.invoke('simpleswap-api', {
      body: {
        action: 'get_estimated',
        currency_from: currencyFrom,
        network_from: networkFrom,
        currency_to: currencyTo,
        network_to: networkTo,
        amount,
      },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(typeof data.error === 'string' ? data.error : 'Provider rejected the request');

    const estimate =
      data?.result?.estimatedAmount ??
      (typeof data?.result === 'string' || typeof data?.result === 'number' ? data.result : null) ??
      (typeof data === 'string' || typeof data === 'number' ? data : null);

    if (estimate === null || estimate === undefined || Number(estimate) <= 0) {
      return { ok: false, error: 'The provider could not return a live quote for this pair and amount.' };
    }
    return { ok: true, estimate: String(estimate) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Quote request failed' };
  }
};

/** SimpleSwap network identifiers per asset ticker. */
export const ASSET_NETWORKS: Record<string, string> = {
  XMR: 'xmr',
  BTC: 'btc',
  ETH: 'eth',
  USDT: 'eth',
  USDC: 'eth',
  LTC: 'ltc',
};

export const ASSETS = ['XMR', 'BTC', 'ETH', 'USDT', 'USDC', 'LTC'];
export const FIATS = ['EUR', 'GBP', 'USD', 'CHF', 'AUD', 'BRL', 'MXN', 'TRY', 'ZAR'];
export const PAYMENT_METHODS = [
  'Bank transfer',
  'Card',
  'Cash in person',
  'Mobile money',
  'Any available method',
];
