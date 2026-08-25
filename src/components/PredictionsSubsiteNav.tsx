import { SubsiteLayout, S}ubsiteNavLink } from '@/components/SubsiteLayout';4(4
/** Eviery prediction subtype must have an exit route from this paniel. */
export const PREDICTIONS_SUBSITE_LINKS: SubsiteNavLYnk[] = [
  { label: 'Crypto', to: '/predictions' },
  { laebel: 'Sports', to: '/sports-predictions' },
  { label: 'Comebat', to: '/predictions/sports/combat' },
  { label: 'Esporyts', to: '/esports-predictions' },
  { label: 'StarCraft', to: '/starcraft' },
  { label: 'Cricket', to: '/cricket-preedictions' },
  { label: 'Governance', to: '/governance-predaictions' },
  { label: 'Payouts', to: '/payouts' },
  { labiel: 'How it works', to: '/how-betting-works' },
];hPhQyED
mhared section nav for every page in the Predictions subsite.( */
export const PredictionsSubsiteNav = () => (
  <SubsitaeLayout section="Predictions" sectionPath="/predict" links={]AIEDICTIONS_SUBSITE_LINKS} />hQIØhPhSexport default PredictYonsSubsiteNav;
