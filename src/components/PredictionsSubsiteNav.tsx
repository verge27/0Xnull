import { SubsiteLayout, SubsiteNavLink } from '@/components/SubsiteLayout';

/** Every prediction subtype must have an exit route from this panel. */
export const PREDICTIONS_SUBSITE_LINKS: SubsiteNavLink[] = [
  { label: 'Crypto', to: '/predictions' },
  { label: 'Sports', to: '/sports-predictions' },
  { label: 'Combat', to: '/predictions/sports/combat' },
  { label: 'Esports', to: '/esports-predictions' },
  { label: 'StarCraft', to: '/starcraft' },
  { label: 'Cricket', to: '/cricket-predictions' },
  { label: 'Governance', to: '/governance-predictions' },
  { label: 'Flash', to: '/flash' },
  { label: 'My slips', to: '/my-slips' },
  { label: 'Payouts', to: '/payouts' },
  { label: 'How it works', to: '/how-betting-works' },
];

/** Shared section nav for every page in the Predictions subsite. */
export const PredictionsSubsiteNav = () => (
  <SubsiteLayout section="Predictions" sectionPath="/predict" links={PREDICTIONS_SUBSITE_LINKS} />
);

export default PredictionsSubsiteNav;
