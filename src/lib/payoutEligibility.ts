// Shared eligibility data for the SimpleSwap -> Guardarian fiat payout route.
// Candidate markets only. Final eligibility is decided at Guardarian checkout.

export interface PayoutRegion {
  region: string;
  countries: string[];
}

export const ELIGIBLE_REGIONS: PayoutRegion[] = [
  {
    region: 'Europe outside the EU',
    countries: ['Switzerland', 'Norway', 'Iceland', 'Liechtenstein', 'Bosnia and Herzegovina', 'Moldova', 'Montenegro', 'Ukraine (non-occupied)'],
  },
  {
    region: 'Latin America',
    countries: ['Argentina', 'Brazil', 'Chile', 'Costa Rica', 'Dominican Republic', 'Ecuador', 'El Salvador', 'Guatemala', 'Honduras', 'Mexico', 'Paraguay', 'Peru', 'Uruguay'],
  },
  {
    region: 'Asia-Pacific',
    countries: ['Australia', 'Hong Kong', 'Indonesia', 'New Zealand', 'Philippines', 'Thailand', 'Vietnam'],
  },
  {
    region: 'Central Asia and Caucasus',
    countries: ['Armenia', 'Azerbaijan', 'Kazakhstan', 'Uzbekistan'],
  },
  {
    region: 'Middle East',
    countries: ['United Arab Emirates', 'Turkey', 'Jordan', 'Kuwait', 'Oman'],
  },
  {
    region: 'Africa',
    countries: ['South Africa', 'Nigeria', 'Ghana', 'Senegal', 'Tanzania', 'Uganda', 'Zambia', 'Rwanda', 'Benin'],
  },
];

export interface ExcludedMarket {
  market: string;
  countries: string[];
  reason: string;
}

export const EXCLUDED_MARKETS: ExcludedMarket[] = [
  { market: 'United Kingdom', countries: ['United Kingdom'], reason: 'Blocked by SimpleSwap and Guardarian' },
  { market: 'United States', countries: ['United States'], reason: 'Blocked by SimpleSwap' },
  {
    market: 'European Union',
    countries: ['Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'],
    reason: 'SimpleSwap currently excludes every EU member state',
  },
  { market: 'Canada', countries: ['Canada'], reason: 'Blocked by Guardarian' },
  { market: 'Japan', countries: ['Japan'], reason: 'Blocked by SimpleSwap' },
  { market: 'India', countries: ['India'], reason: 'Blocked by Guardarian' },
  { market: 'Singapore, Malaysia and South Korea', countries: ['Singapore', 'Malaysia', 'South Korea'], reason: 'Blocked by Guardarian' },
  { market: 'China', countries: ['China'], reason: 'Blocked by SimpleSwap and Guardarian' },
  { market: 'Israel, Qatar and Saudi Arabia', countries: ['Israel', 'Qatar', 'Saudi Arabia'], reason: 'Blocked by Guardarian' },
  { market: 'Kenya', countries: ['Kenya'], reason: 'Blocked by Guardarian' },
  { market: 'Colombia', countries: ['Colombia'], reason: 'Blocked by SimpleSwap' },
];

export type EligibilityStatus = 'eligible' | 'excluded' | 'unknown';

export interface EligibilityResult {
  status: EligibilityStatus;
  country: string;
  detail: string;
}

const normalise = (value: string) => value.trim().toLowerCase();

export const checkCountryEligibility = (country: string): EligibilityResult | null => {
  if (!country.trim()) return null;
  const target = normalise(country);

  for (const entry of EXCLUDED_MARKETS) {
    if (entry.countries.some(c => normalise(c) === target)) {
      return { status: 'excluded', country, detail: entry.reason };
    }
  }

  for (const region of ELIGIBLE_REGIONS) {
    const match = region.countries.find(c => normalise(c).startsWith(target) || normalise(c) === target);
    if (match) {
      return {
        status: 'eligible',
        country: match,
        detail: `${region.region} — usually supported, subject to the payout method offered at checkout`,
      };
    }
  }

  return {
    status: 'unknown',
    country,
    detail: 'Not on either list. Guardarian may still refuse the payout at checkout, so treat this as unconfirmed',
  };
};

export const ALL_KNOWN_COUNTRIES: string[] = Array.from(
  new Set([
    ...ELIGIBLE_REGIONS.flatMap(r => r.countries),
    ...EXCLUDED_MARKETS.flatMap(m => m.countries),
  ]),
).sort((a, b) => a.localeCompare(b));

export const PAYOUT_CAVEATS = [
  'There is no country-eligibility endpoint. A quote can pass every API check and still be refused at Guardarian checkout.',
  'Restricted country lists are worded as "including but not limited to", so absence from a list is not a guarantee of service.',
  'Guardarian checkout requires identity verification and collects device and network data.',
  'The payout method available to you is decided during checkout, not when the exchange is created.',
];

// Maps raw provider errors onto plain-language guidance for the user.
export const describePayoutFailure = (raw: string): { title: string; description: string } => {
  const message = raw.toLowerCase();

  if (/country|jurisdiction|region|restricted|not available in|prohibit/.test(message)) {
    return {
      title: 'Payout not available in your country',
      description: 'Guardarian, the payout provider behind SimpleSwap, does not serve your jurisdiction for this route. Check the eligibility list below before trying again.',
    };
  }
  if (/kyc|verification|identity|document|aml|compliance/.test(message)) {
    return {
      title: 'Identity verification failed or was declined',
      description: 'Guardarian runs KYC on its hosted checkout. The transaction was stopped there, so no crypto was taken. Your funds stay where they are.',
    };
  }
  if (/card|bank|payout method|iban|payment method/.test(message)) {
    return {
      title: 'No payout method available',
      description: 'Guardarian could not offer a card or bank payout for this amount and currency. Try a different fiat currency or amount.',
    };
  }
  if (/limit|minimum|maximum|amount/.test(message)) {
    return {
      title: 'Amount outside the accepted range',
      description: 'The provider rejected this amount. Adjust it to sit inside the shown minimum and maximum then retry.',
    };
  }
  if (/pair|currency|network|route/.test(message)) {
    return {
      title: 'Route unavailable right now',
      description: 'This crypto-to-fiat pair is temporarily unsupported. Pick another asset or fiat currency.',
    };
  }
  if (/rate limit|too many/.test(message)) {
    return {
      title: 'Too many attempts',
      description: 'Wait a minute then try again.',
    };
  }

  return {
    title: 'Cash out could not be started',
    description: 'SimpleSwap or Guardarian rejected the request. Nothing has been sent, so your crypto is untouched. Check the eligibility list below then retry.',
  };
};
