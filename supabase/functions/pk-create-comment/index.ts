import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-0xnull-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TOKEN_REGEX = /^0xn_[a-f0-9]{64}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CreateCommentBody {
  content_id: string;
  content: string;
  is_content_request?: boolean;
  parent_id?: string | null;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const token = req.headers.get('x-0xnull-token') || '';
    if (!TOKEN_REGEX.test(token)) {
      return json({ error: 'Invalid or missing 0xNull token' }, 401);
    }

    let body: CreateCommentBody;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const content_id = (body.content_id || '').trim();
    const content = (body.content || '').trim();
    const is_content_request = !!body.is_content_request;
    const parent_id = body.parent_id ? String(body.parent_id).trim() : null;

    if (!content_id || content_id.length > 200) {
      return json({ error: 'Invalid content_id' }, 400);
    }
    if (!content || content.length < 1 || content.length > 4000) {
      return json({ error: 'Comment must be 1-4000 characters' }, 400);
    }
    if (parent_id && !UUID_REGEX.test(parent_id)) {
      return json({ error: 'Invalid parent_id' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: pkUser, error: pkErr } = await supabase
      .from('private_key_users')
      .select('id')
      .eq('payment_token', token)
      .maybeSingle();

    if (pkErr) {
      console.error('[pk-create-comment] lookup error:', pkErr);
      return json({ error: 'Token validation failed' }, 500);
    }
    if (!pkUser) {
      return json({ error: 'Unknown token' }, 401);
    }

    const { data: comment, error: insertErr } = await supabase
      .from('creator_comments')
      .insert({
        content_id,
        content,
        is_content_request,
        parent_id,
        pk_user_id: pkUser.id,
        user_id: null,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('[pk-create-comment] insert error:', insertErr);
      return json({ error: insertErr.message }, 500);
    }

    return json({ comment }, 200);
  } catch (e) {
    console.error('[pk-create-comment] error:', e);
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});
