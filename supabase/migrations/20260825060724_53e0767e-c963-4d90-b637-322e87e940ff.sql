CREATE TABLE public.ramp_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  session_id text,
  side text,
  country_code text,
  asset text,
  fiat text,
  payment_method text,
  amount numeric,
  decision text,
  direct_allowed boolean,
  hodlhodl_allowed boolean,
  quote_ok boolean,
  reason text,
  provider text,
  error_message text,
  target_url text
);

CREATE INDEX ramp_events_created_at_idx ON public.ramp_events (created_at DESC);
CREATE INDEX ramp_events_event_type_idx ON public.ramp_events (event_type);

GRANT ALL ON public.ramp_events TO service_role;
GRANT SELECT ON public.ramp_events TO authenticated;

ALTER TABLE public.ramp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read ramp events"
ON public.ramp_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));