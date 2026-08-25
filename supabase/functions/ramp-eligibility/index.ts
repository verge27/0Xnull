import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { RAMP_ELIGIBILITY_CONFIG } from './config.ts';

Deno.serve((req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = (url.searchParams.get('country') ?? '').trim().toUpperCase();

  if (code) {
    if (!/^[A-Z]{2}$/.test(code)) {
      return new Response(JSON.stringify({ error: 'country must be an ISO 3166-1 alpha-2 code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const match = RAMP_ELIGIBILITY_CONFIG.countries.find((c) => c.code === code);
    const body = match ?? {
      code,
      name: code,
      ...RAMP_ELIGIBILITY_CONFIG.defaults,
    };
    return new Response(
      JSON.stringify({ version: RAMP_ELIGIBILITY_CONFIG.version, fiatProviderName: RAMP_ELIGIBILITY_CONFIG.fiatProviderName, country: body }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' } },
    );
  }

  return new Response(JSON.stringify(RAMP_ELIGIBILITY_CONFIG), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' },
  });
});
