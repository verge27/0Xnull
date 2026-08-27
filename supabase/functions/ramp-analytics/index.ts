import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_EVENTS = new Set([
  "route_check",
  "route_decision",
  "quote_failure",
  "config_failure",
  "redirect",
  "redirect_failure",
]);

const ALLOWED_DECISIONS = new Set(["direct", "hodlhodl", "none", "unknown"]);

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function str(value: unknown, max: number): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s.slice(0, max) : null;
}

function bool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
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

    const eventType = str(body.event_type, 32);
    if (!eventType || !ALLOWED_EVENTS.has(eventType)) {
      return json({ error: "Invalid event type" }, 400);
    }

    const decision = str(body.decision, 16);
    if (decision && !ALLOWED_DECISIONS.has(decision)) {
      return json({ error: "Invalid decision" }, 400);
    }

    const rawAmount = Number(body.amount);
    const amount = Number.isFinite(rawAmount) && rawAmount > 0 ? Math.min(rawAmount, 1e12) : null;

    const row = {
      event_type: eventType,
      // Deliberately do not accept or persist browser/session identifiers.
      session_id: null,
      side: str(body.side, 8),
      country_code: str(body.country_code, 2)?.toUpperCase() ?? null,
      asset: str(body.asset, 16),
      fiat: str(body.fiat, 16),
      payment_method: str(body.payment_method, 64),
      amount,
      decision,
      direct_allowed: bool(body.direct_allowed),
      hodlhodl_allowed: bool(body.hodlhodl_allowed),
      quote_ok: bool(body.quote_ok),
      reason: str(body.reason, 2000),
      provider: str(body.provider, 64),
      error_message: str(body.error_message, 2000),
      target_url: str(body.target_url, 2048),
    };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { error } = await supabase.from("ramp_events").insert(row);
    if (error) {
      console.error("ramp-analytics insert failed", error.message);
      return json({ error: "Could not record event" }, 500);
    }

    console.log(
      `ramp-analytics ${eventType} country=${row.country_code ?? "?"} decision=${row.decision ?? "?"} ` +
        `direct=${row.direct_allowed} hodl=${row.hodlhodl_allowed} quote_ok=${row.quote_ok} ` +
        `reason=${row.reason ?? "-"} error=${row.error_message ?? "-"}`,
    );

    return json({ ok: true }, 200);
  } catch (e) {
    console.error("ramp-analytics unhandled error", e instanceof Error ? e.message : e);
    return json({ error: "Unexpected error" }, 500);
  }
});
