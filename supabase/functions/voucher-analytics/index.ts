import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_EVENTS = new Set([
  "view",
  "bet_placed",
  "bet_won",
  "bet_lost",
  "token_created",
]);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitizeString(value: unknown, maxLength: number): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (!str) return null;
  return str.slice(0, maxLength);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const voucherCode = sanitizeString(body.voucher_code, 32);
    if (!voucherCode || voucherCode.length < 4) {
      return json({ error: "Invalid voucher code" }, 400);
    }

    const eventType = sanitizeString(body.event_type, 32);
    if (!eventType || !ALLOWED_EVENTS.has(eventType)) {
      return json({ error: "Invalid event type" }, 400);
    }

    const userToken = sanitizeString(body.user_token, 64);
    const page = sanitizeString(body.page, 2048);
    let marketId = sanitizeString(body.market_id, 64);

    if (marketId && !UUID_REGEX.test(marketId)) {
      marketId = null;
    }

    const betAmount = typeof body.bet_amount === "number" && !isNaN(body.bet_amount)
      ? Math.max(0, body.bet_amount)
      : null;

    const metadata = typeof body.metadata === "object" && body.metadata !== null
      ? body.metadata
      : {};

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { error: insertErr } = await supabase.from("voucher_analytics").insert({
      voucher_code: voucherCode.toUpperCase(),
      event_type: eventType,
      user_token: userToken,
      page,
      market_id: marketId,
      bet_amount: betAmount,
      metadata,
    });

    if (insertErr) {
      console.error("[voucher-analytics] insert error:", insertErr);
      return json({ error: "Failed to record analytics" }, 500);
    }

    return json({ success: true }, 200);
  } catch (error) {
    console.error("[voucher-analytics] error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
