// Public Hodl Hodl offer book proxy.
// The /api/v1/offers endpoint is PUBLIC and needs no API key.
// TODO: HODLHODL_API_KEY (Supabase secret) is only required for authenticated
// endpoints (e.g. GET /api/v1/users/me). Keys expire one year after issue —
// rotation due by 2027-08-21.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_CURRENCIES = ["GBP", "EUR", "USD", "CHF", "CAD", "AUD"];

// In-memory cache, 60s TTL (Hodl Hodl rate-limits aggressively)
const cache = new Map<string, { at: number; body: unknown }>();
const TTL_MS = 60_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const requested = (url.searchParams.get("currency") || "GBP").toUpperCase();
  const currency = ALLOWED_CURRENCIES.includes(requested) ? requested : "GBP";

  const cached = cache.get(currency);
  if (cached && Date.now() - cached.at < TTL_MS) {
    return new Response(JSON.stringify({ ...cached.body as object, cached: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const upstream = new URL("https://hodlhodl.com/api/v1/offers");
  upstream.searchParams.set("filters[side]", "sell");
  upstream.searchParams.set("filters[asset_code]", "BTC");
  upstream.searchParams.set("filters[currency_code]", currency);
  upstream.searchParams.set("filters[include_global]", "true");
  upstream.searchParams.set("pagination[limit]", "30");

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(upstream.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.error("hodlhodl upstream error", res.status);
      return new Response(
        JSON.stringify({ error: "upstream_error", status: res.status, offers: [] }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    const raw = Array.isArray(data?.offers) ? data.offers : [];

    const offers = raw
      // Exclude Ark asset-layer offers when the field is present
      .filter((o: Record<string, unknown>) => !o.asset_layer || o.asset_layer === "BTC")
      .map((o: Record<string, any>) => ({
        id: String(o.id ?? ""),
        title: o.title ?? "",
        price: Number(o.price ?? 0),
        currency_code: o.currency_code ?? currency,
        min_amount: o.min_amount ?? null,
        max_amount: o.max_amount ?? null,
        payment_method_instructions: (o.payment_method_instructions || []).map((p: any) => ({
          name: p?.payment_method_name ?? p?.name ?? "Other",
          type: p?.payment_method_type ?? null,
        })),
        seller: {
          login: o.trader?.login ?? "unknown",
          rating: o.trader?.rating ?? null,
          trades_count: o.trader?.trades_count ?? 0,
          online_status: o.trader?.online_status ?? "offline",
          strong_hodler: Boolean(o.trader?.strong_hodler),
          average_payment_time_minutes: o.trader?.average_payment_time_minutes ?? null,
          average_release_time_minutes: o.trader?.average_release_time_minutes ?? null,
          verified: Boolean(o.trader?.verified),
        },
      }))
      .sort((a: { price: number }, b: { price: number }) => a.price - b.price);

    const body = { currency, offers, fetched_at: new Date().toISOString() };
    cache.set(currency, { at: Date.now(), body });

    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("hodlhodl fetch failed", e instanceof Error ? e.message : e);
    return new Response(JSON.stringify({ error: "fetch_failed", offers: [] }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
