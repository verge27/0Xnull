/**
 * Analytics and error reporting for the fiat ramp route finder.
 *
 * Events contain no browser or session identifier. They are used to diagnose
 * routing and provider failures, are best effort, and never block the UI.
 */

export type RampEventType =
  | 'route_check'
  | 'route_decision'
  | 'quote_failure'
  | 'config_failure'
  | 'redirect'
  | 'redirect_failure';

export type RampDecision = 'direct' | 'hodlhodl' | 'none' | 'unknown';

export interface RampEvent {
  event_type: RampEventType;
  side?: string;
  country_code?: string;
  asset?: string;
  fiat?: string;
  payment_method?: string;
  amount?: number;
  decision?: RampDecision;
  direct_allowed?: boolean;
  hodlhodl_allowed?: boolean;
  quote_ok?: boolean;
  /** The exact eligibility reason shown to the user. */
  reason?: string;
  provider?: string;
  error_message?: string;
  target_url?: string;
}

export const logRampEvent = (event: RampEvent): void => {
  const payload = event;

  if (event.event_type.endsWith('failure')) {
    console.error('[ramp]', event.event_type, payload);
  } else {
    console.info('[ramp]', event.event_type, payload);
  }

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ramp-analytics`;
  const body = JSON.stringify(payload);

  try {
    void fetch(url, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body,
    }).catch((e) => console.warn('[ramp] analytics delivery failed', e));
  } catch (e) {
    console.warn('[ramp] analytics delivery failed', e);
  }
};

/** Flattens blocker restrictions into the single reason string a user sees. */
export const formatBlockerReasons = (
  blockers: { provider: string; restriction: { reason: string; source: string; lastReviewedAt: string } }[],
): string =>
  blockers
    .map((b) => `${b.provider}: ${b.restriction.reason} (source: ${b.restriction.source}, reviewed ${b.restriction.lastReviewedAt})`)
    .join(' | ');
