import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DIFFICULTY = 4; // Must match client-side

const isHex = (value: string, length: number) => new RegExp(`^[a-fA-F0-9]{${length}}$`).test(value);

// Server-side PoW verification
const verifyPoW = async (challenge: string, nonce: number): Promise<boolean> => {
  const encoder = new TextEncoder();
  const data = challenge + nonce.toString();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  const target = "0".repeat(DIFFICULTY);
  return hash.startsWith(target);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const publicKey = String(body?.publicKey ?? "");
    const displayName = String(body?.displayName ?? "");
    const nonce = Number(body?.nonce);

    // Validate inputs
    if (!isHex(publicKey, 64)) {
      return new Response(JSON.stringify({ error: "Invalid publicKey" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!displayName || displayName.length > 64) {
      return new Response(JSON.stringify({ error: "Invalid displayName" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isNaN(nonce) || nonce < 0) {
      return new Response(JSON.stringify({ error: "Invalid or missing nonce" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify Proof of Work
    const isValidPoW = await verifyPoW(publicKey, nonce);
    if (!isValidPoW) {
      console.log(`[pk-register] Invalid PoW for key ${publicKey.slice(0, 8)}... nonce=${nonce}`);
      return new Response(JSON.stringify({ error: "Invalid proof of work" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[pk-register] Valid PoW for key ${publicKey.slice(0, 8)}... nonce=${nonce}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data, error } = await supabaseAdmin
      .from("private_key_users")
      .insert({ public_key: publicKey, display_name: displayName })
      .select("id")
      .single();

    if (error) {
      console.error("pk-register insert failed:", error);
      return new Response(JSON.stringify({ error: "Failed to register key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[pk-register] User created: ${data.id}`);
    return new Response(JSON.stringify({ id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("pk-register error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
