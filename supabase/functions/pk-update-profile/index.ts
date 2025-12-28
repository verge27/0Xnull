import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to derive public key from private key using SHA-256
async function derivePublicKey(privateKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(privateKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { privateKey, timestamp, updates } = await req.json();

    if (!privateKey || !timestamp || !updates) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify timestamp is recent (within 5 minutes)
    if (Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
      return new Response(JSON.stringify({ error: 'Request expired' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Derive public key from private key (proof of ownership)
    const encoder = new TextEncoder();
    const data = encoder.encode(privateKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const publicKey = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get PK user
    const { data: pkUser, error: userError } = await supabase
      .from('private_key_users')
      .select('id')
      .eq('public_key', publicKey)
      .maybeSingle();

    if (userError || !pkUser) {
      console.log(`[pk-update-profile] User not found for key ${publicKey.slice(0, 8)}...`);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Whitelist allowed update fields
    const allowedFields = ['display_name', 'payment_token', 'pgp_public_key', 'pgp_encrypted_private_key'];
    const sanitizedUpdates: Record<string, unknown> = {};
    
    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key)) {
        // Validate display_name length
        if (key === 'display_name' && typeof updates[key] === 'string') {
          if (updates[key].length > 64) {
            return new Response(JSON.stringify({ error: 'Display name too long (max 64 chars)' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        sanitizedUpdates[key] = updates[key];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update the user
    const { data: updatedUser, error: updateError } = await supabase
      .from('private_key_users')
      .update({ ...sanitizedUpdates, updated_at: new Date().toISOString() })
      .eq('id', pkUser.id)
      .select('id, display_name, payment_token, reputation_score, total_trades')
      .single();

    if (updateError) {
      console.error('[pk-update-profile] Update error:', updateError);
      throw updateError;
    }

    console.log(`[pk-update-profile] Updated user ${pkUser.id}`);

    return new Response(JSON.stringify({ user: updatedUser }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[pk-update-profile] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
