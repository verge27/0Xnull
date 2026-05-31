import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-0xnull-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TOKEN_REGEX = /^0xn_[a-f0-9]{64}$/;

interface CreateMarketBody {
  question: string;
  description?: string;
  resolution_criteria?: string;
  resolution_date: string; // ISO
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const token = req.headers.get('x-0xnull-token') || '';
    if (!TOKEN_REGEX.test(token)) {
      return jsonResponse({ error: 'Invalid or missing 0xNull token' }, 401);
    }

    let body: CreateMarketBody;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const question = (body.question || '').trim();
    const description = (body.description || '').trim() || null;
    const resolution_criteria = (body.resolution_criteria || '').trim() || null;
    const resolution_date = body.resolution_date;

    if (!question || question.length < 8 || question.length > 280) {
      return jsonResponse({ error: 'Question must be 8-280 characters' }, 400);
    }
    if (description && description.length > 2000) {
      return jsonResponse({ error: 'Description too long (max 2000 chars)' }, 400);
    }
    if (resolution_criteria && resolution_criteria.length > 1000) {
      return jsonResponse({ error: 'Resolution criteria too long (max 1000 chars)' }, 400);
    }
    if (!resolution_date) {
      return jsonResponse({ error: 'resolution_date required' }, 400);
    }
    const resDate = new Date(resolution_date);
    if (isNaN(resDate.getTime()) || resDate.getTime() < Date.now()) {
      return jsonResponse({ error: 'resolution_date must be a valid future ISO date' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Validate token -> pk user
    const { data: pkUser, error: pkErr } = await supabase
      .from('private_key_users')
      .select('id')
      .eq('payment_token', token)
      .maybeSingle();

    if (pkErr) {
      console.error('[pk-create-market] lookup error:', pkErr);
      return jsonResponse({ error: 'Token validation failed' }, 500);
    }
    if (!pkUser) {
      return jsonResponse({ error: 'Unknown token' }, 401);
    }

    const { data: market, error: insertErr } = await supabase
      .from('prediction_markets')
      .insert({
        question,
        description,
        resolution_criteria,
        resolution_date: resDate.toISOString(),
        status: 'open',
        creator_id: null,
        creator_pk_id: pkUser.id,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('[pk-create-market] insert error:', insertErr);
      return jsonResponse({ error: insertErr.message }, 500);
    }

    console.log(`[pk-create-market] created ${market.id} for pk ${pkUser.id}`);
    return jsonResponse({ market }, 200);
  } catch (e) {
    console.error('[pk-create-market] error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});
