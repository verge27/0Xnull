import { SubsiteLayout, SubsiteNavLink } from '@/components/SubsiteLayout';

export const RAMP_SUBSITE_LINKS: SubsiteNavLink[] = [
  { label: 'Route finder', to: '/ramp' },
  { label: 'Buy', to: '/buy' },
  { label: 'Fiat cash out', to: '/cashout' },
  { label: 'Swaps', to: '/swaps' },
];

/** Shared section nav for every page in the Fiat On/Off Ramp subsite. */
export const RampSubsiteNav = () => (
  <SubsiteLayout section="Fiat On/Off Ramp" sectionPath="/ramp" links={RAMP_SUBSITE_LINKS} />
);

export default RampSubsiteNav;
