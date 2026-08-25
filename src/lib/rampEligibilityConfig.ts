// Versioned ramp eligibility configuration.
// SOURCE OF TRUTH: this file is served by the `ramp-eligibility` edge function
// (supabase/functions/ramp-eligibility/config.ts holds a byte-identical copy).
// The bundled copy is only used as an offline fallback when the function is
// unreachable. Update both copies together and bump CONFIG_VERSION.

export type RestrictionStatus = 'allowed' | 'blocked' | 'unknown';

export interface Restriction {
  status: RestrictionStatus;
  reason: string;
  source: string;
  lastReviewedAt: string;
}

export interface CountryEligibility {
  /** ISO 3166-1 alpha-2 */
  code: string;
  name: string;
  simpleswap: Restriction;
  fiatProvider: Restriction;
  hodlhodl: Restriction;
}

export interface RampEligibilityConfig {
  version: string;
  generatedAt: string;
  fiatProviderName: string;
  countries: CountryEligibility[];
  defaults: {
    simpleswap: Restriction;
    fiatProvider: Restriction;
    hodlhodl: Restriction;
  };
}

export const CONFIG_VERSION = '2026-08-25.1';

const REVIEWED = '2026-08-25';

const SRC_SS = 'SimpleSwap Terms of Service, restricted jurisdictions';
const SRC_GD = 'Guardarian Terms of Service, restricted jurisdictions';
const SRC_HH = 'Hodl Hodl Terms of Service and sanctions policy';

const ok = (source: string, reason = 'No published restriction for this country'): Restriction => ({
  status: 'allowed',
  reason,
  source,
  lastReviewedAt: REVIEWED,
});

const no = (source: string, reason: string): Restriction => ({
  status: 'blocked',
  reason,
  source,
  lastReviewedAt: REVIEWED,
});

const maybe = (source: string, reason = 'Not on the published allow or deny list, confirmed only at checkout'): Restriction => ({
  status: 'unknown',
  reason,
  source,
  lastReviewedAt: REVIEWED,
});

const HH_SANCTIONS = 'Sanctioned or embargoed jurisdiction, Hodl Hodl does not permit use';
const HH_US = 'Hodl Hodl does not serve the United States or its territories';

interface Row {
  code: string;
  name: string;
  ss?: Restriction;
  fp?: Restriction;
  hh?: Restriction;
}

const ssBlockedEU = no(SRC_SS, 'SimpleSwap excludes every EU member state');

const euMembers: [string, string][] = [
  ['AT', 'Austria'], ['BE', 'Belgium'], ['BG', 'Bulgaria'], ['HR', 'Croatia'], ['CY', 'Cyprus'],
  ['CZ', 'Czech Republic'], ['DK', 'Denmark'], ['EE', 'Estonia'], ['FI', 'Finland'], ['FR', 'France'],
  ['DE', 'Germany'], ['GR', 'Greece'], ['HU', 'Hungary'], ['IE', 'Ireland'], ['IT', 'Italy'],
  ['LV', 'Latvia'], ['LT', 'Lithuania'], ['LU', 'Luxembourg'], ['MT', 'Malta'], ['NL', 'Netherlands'],
  ['PL', 'Poland'], ['PT', 'Portugal'], ['RO', 'Romania'], ['SK', 'Slovakia'], ['SI', 'Slovenia'],
  ['ES', 'Spain'], ['SE', 'Sweden'],
];

const eligibleDirect: [string, string][] = [
  ['CH', 'Switzerland'], ['NO', 'Norway'], ['IS', 'Iceland'], ['LI', 'Liechtenstein'],
  ['BA', 'Bosnia and Herzegovina'], ['MD', 'Moldova'], ['ME', 'Montenegro'], ['UA', 'Ukraine'],
  ['AR', 'Argentina'], ['BR', 'Brazil'], ['CL', 'Chile'], ['CR', 'Costa Rica'], ['DO', 'Dominican Republic'],
  ['EC', 'Ecuador'], ['SV', 'El Salvador'], ['GT', 'Guatemala'], ['HN', 'Honduras'], ['MX', 'Mexico'],
  ['PY', 'Paraguay'], ['PE', 'Peru'], ['UY', 'Uruguay'],
  ['AU', 'Australia'], ['HK', 'Hong Kong'], ['ID', 'Indonesia'], ['NZ', 'New Zealand'],
  ['PH', 'Philippines'], ['TH', 'Thailand'], ['VN', 'Vietnam'],
  ['AM', 'Armenia'], ['AZ', 'Azerbaijan'], ['KZ', 'Kazakhstan'], ['UZ', 'Uzbekistan'],
  ['AE', 'United Arab Emirates'], ['TR', 'Turkey'], ['JO', 'Jordan'], ['KW', 'Kuwait'], ['OM', 'Oman'],
  ['ZA', 'South Africa'], ['NG', 'Nigeria'], ['GH', 'Ghana'], ['SN', 'Senegal'], ['TZ', 'Tanzania'],
  ['UG', 'Uganda'], ['ZM', 'Zambia'], ['RW', 'Rwanda'], ['BJ', 'Benin'],
];

const rows: Row[] = [
  // Direct route candidates
  ...eligibleDirect.map(([code, name]) => ({ code, name })),

  // EU: direct route blocked by SimpleSwap, Hodl Hodl permitted
  ...euMembers.map(([code, name]) => ({ code, name, ss: ssBlockedEU })),

  // Direct route blocked elsewhere
  { code: 'GB', name: 'United Kingdom', ss: no(SRC_SS, 'SimpleSwap excludes the United Kingdom'), fp: no(SRC_GD, 'Guardarian excludes the United Kingdom') },
  { code: 'CA', name: 'Canada', fp: no(SRC_GD, 'Guardarian excludes Canada') },
  { code: 'JP', name: 'Japan', ss: no(SRC_SS, 'SimpleSwap excludes Japan') },
  { code: 'IN', name: 'India', fp: no(SRC_GD, 'Guardarian excludes India') },
  { code: 'SG', name: 'Singapore', fp: no(SRC_GD, 'Guardarian excludes Singapore') },
  { code: 'MY', name: 'Malaysia', fp: no(SRC_GD, 'Guardarian excludes Malaysia') },
  { code: 'KR', name: 'South Korea', fp: no(SRC_GD, 'Guardarian excludes South Korea') },
  { code: 'IL', name: 'Israel', fp: no(SRC_GD, 'Guardarian excludes Israel') },
  { code: 'QA', name: 'Qatar', fp: no(SRC_GD, 'Guardarian excludes Qatar') },
  { code: 'SA', name: 'Saudi Arabia', fp: no(SRC_GD, 'Guardarian excludes Saudi Arabia') },
  { code: 'KE', name: 'Kenya', fp: no(SRC_GD, 'Guardarian excludes Kenya') },
  { code: 'CO', name: 'Colombia', ss: no(SRC_SS, 'SimpleSwap excludes Colombia') },
  { code: 'CN', name: 'China', ss: no(SRC_SS, 'SimpleSwap excludes China'), fp: no(SRC_GD, 'Guardarian excludes China') },

  // Blocked for both routes
  {
    code: 'US',
    name: 'United States',
    ss: no(SRC_SS, 'SimpleSwap excludes the United States'),
    fp: no(SRC_GD, 'Not reachable, the exchange leg is blocked'),
    hh: no(SRC_HH, HH_US),
  },
  { code: 'PR', name: 'Puerto Rico (US territory)', ss: no(SRC_SS, 'United States territory'), fp: no(SRC_GD, 'United States territory'), hh: no(SRC_HH, HH_US) },
  { code: 'GU', name: 'Guam (US territory)', ss: no(SRC_SS, 'United States territory'), fp: no(SRC_GD, 'United States territory'), hh: no(SRC_HH, HH_US) },
  { code: 'VI', name: 'US Virgin Islands', ss: no(SRC_SS, 'United States territory'), fp: no(SRC_GD, 'United States territory'), hh: no(SRC_HH, HH_US) },
  { code: 'AS', name: 'American Samoa', ss: no(SRC_SS, 'United States territory'), fp: no(SRC_GD, 'United States territory'), hh: no(SRC_HH, HH_US) },
  { code: 'MP', name: 'Northern Mariana Islands', ss: no(SRC_SS, 'United States territory'), fp: no(SRC_GD, 'United States territory'), hh: no(SRC_HH, HH_US) },
  { code: 'RU', name: 'Russia', ss: no(SRC_SS, 'Sanctions exposure'), fp: no(SRC_GD, 'Sanctions exposure'), hh: no(SRC_HH, HH_SANCTIONS) },
  { code: 'BY', name: 'Belarus', ss: no(SRC_SS, 'Sanctions exposure'), fp: no(SRC_GD, 'Sanctions exposure'), hh: no(SRC_HH, HH_SANCTIONS) },
  { code: 'CU', name: 'Cuba', ss: no(SRC_SS, 'Embargoed jurisdiction'), fp: no(SRC_GD, 'Embargoed jurisdiction'), hh: no(SRC_HH, HH_SANCTIONS) },
  { code: 'KP', name: 'North Korea', ss: no(SRC_SS, 'Embargoed jurisdiction'), fp: no(SRC_GD, 'Embargoed jurisdiction'), hh: no(SRC_HH, HH_SANCTIONS) },
  { code: 'IR', name: 'Iran', ss: no(SRC_SS, 'Embargoed jurisdiction'), fp: no(SRC_GD, 'Embargoed jurisdiction'), hh: no(SRC_HH, HH_SANCTIONS) },
  { code: 'IQ', name: 'Iraq', ss: no(SRC_SS, 'Sanctions exposure'), fp: no(SRC_GD, 'Sanctions exposure'), hh: no(SRC_HH, HH_SANCTIONS) },
  { code: 'SY', name: 'Syria', ss: no(SRC_SS, 'Embargoed jurisdiction'), fp: no(SRC_GD, 'Embargoed jurisdiction'), hh: no(SRC_HH, HH_SANCTIONS) },
  { code: 'SD', name: 'Sudan', ss: no(SRC_SS, 'Embargoed jurisdiction'), fp: no(SRC_GD, 'Embargoed jurisdiction'), hh: no(SRC_HH, HH_SANCTIONS) },
  { code: 'SO', name: 'Somalia', ss: no(SRC_SS, 'Embargoed jurisdiction'), fp: no(SRC_GD, 'Embargoed jurisdiction'), hh: no(SRC_HH, HH_SANCTIONS) },
];

export const RAMP_ELIGIBILITY_CONFIG: RampEligibilityConfig = {
  version: CONFIG_VERSION,
  generatedAt: REVIEWED,
  fiatProviderName: 'Guardarian',
  defaults: {
    simpleswap: maybe(SRC_SS),
    fiatProvider: maybe(SRC_GD),
    hodlhodl: ok(SRC_HH, 'Not on the Hodl Hodl restricted list, subject to its terms and local law'),
  },
  countries: rows
    .map((r) => ({
      code: r.code,
      name: r.name,
      simpleswap: r.ss ?? ok(SRC_SS),
      fiatProvider: r.fp ?? ok(SRC_GD, 'Candidate payout market, confirmed only at checkout'),
      hodlhodl: r.hh ?? ok(SRC_HH, 'Not on the Hodl Hodl restricted list, subject to its terms and local law'),
    }))
    .sort((a, b) => a.name.localeCompare(b.name)),
};
