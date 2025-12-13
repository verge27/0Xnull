import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// CoinGecko ID mapping (ticker -> coingecko id)
const COINGECKO_IDS: Record<string, string> = {
  // Major
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  LTC: "litecoin",
  // Privacy
  XMR: "monero",
  DASH: "dash",
  ZEC: "zcash",
  ARRR: "pirate-chain",
  // L1s
  ADA: "cardano",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  ATOM: "cosmos",
  NEAR: "near",
  // Memes
  DOGE: "dogecoin",
  SHIB: "shiba-inu",
  PEPE: "pepe",
  BONK: "bonk",
  // DeFi
  LINK: "chainlink",
  UNI: "uniswap",
  AAVE: "aave",
};

async function fetchCoinGeckoPrices(coinIds: string[]) {
  const uniqueIds = Array.from(new Set(coinIds));
  if (uniqueIds.length === 0) {
    return { data: {} as Record<string, any>, rateLimited: false };
  }

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
    uniqueIds.join(","),
  )}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;

  const response = await fetch(url, { headers: { Accept: "application/json" } });

  if (response.status === 429) {
    const body = await response.text();
    console.warn("CoinGecko rate limit hit:", body);
    return { data: {} as Record<string, any>, rateLimited: true };
  }

  if (!response.ok) {
    const text = await response.text();
    console.error("CoinGecko API error:", text);
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = (await response.json()) as Record<string, any>;
  return { data, rateLimited: false };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "price";
    const symbol = (url.searchParams.get("symbol") || "BTC").toUpperCase();

    // Batch price endpoint: /?action=prices&symbols=BTC,ETH,XMR
    if (action === "prices") {
      const symbolsParam = url.searchParams.get("symbols");
      const symbolsRaw = symbolsParam ?? Object.keys(COINGECKO_IDS).join(",");
      const symbols = symbolsRaw
        .split(",")
        .map((s: string) => s.trim().toUpperCase())
        .filter((s: string) => Boolean(s));

      const ids = symbols
        .map((s: string) => COINGECKO_IDS[s])
        .filter((id: string | undefined): id is string => Boolean(id));

      const { data, rateLimited } = await fetchCoinGeckoPrices(ids);

      if (rateLimited) {
        return new Response(
          JSON.stringify({ error: "RATE_LIMIT", prices: {} }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const prices: Record<string, { price: number; change24h: number }> = {};

      for (const sym of symbols) {
        const id = COINGECKO_IDS[sym];
        if (!id) continue;
        const coinData = data[id];
        if (!coinData || typeof coinData.usd !== "number") continue;

        prices[sym] = {
          price: coinData.usd,
          change24h: typeof coinData.usd_24h_change === "number" ? coinData.usd_24h_change : 0,
        };
      }

      return new Response(
        JSON.stringify({ prices }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Single-asset price endpoint (kept for direct calls)
    if (action === "price") {
      const coinId = COINGECKO_IDS[symbol] || symbol.toLowerCase();
      const { data, rateLimited } = await fetchCoinGeckoPrices([coinId]);

      if (rateLimited) {
        // Soft-fail: return empty price instead of 500
        return new Response(
          JSON.stringify({ symbol, price: null, error: "RATE_LIMIT" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const coinData = data[coinId];
      if (!coinData || typeof coinData.usd !== "number") {
        console.warn("No data from CoinGecko for", symbol, "(id:", coinId, ")");
        return new Response(
          JSON.stringify({ symbol, price: null, error: "NO_DATA" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          symbol,
          price: coinData.usd,
          priceChange24h: coinData.usd_24h_change,
          volume24h: coinData.usd_24h_vol,
          timestamp: Date.now(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Auto-resolve a prediction market based on price
    if (action === "resolve-market") {
      const { marketId, targetPrice, comparison } = await req.json();

      if (!marketId || !targetPrice || !comparison) {
        throw new Error("Missing required fields: marketId, targetPrice, comparison");
      }

      const coinId = COINGECKO_IDS[symbol] || symbol.toLowerCase();
      const { data, rateLimited } = await fetchCoinGeckoPrices([coinId]);

      if (rateLimited) {
        throw new Error("Oracle rate limited, try again later");
      }

      const coinData = data[coinId];
      const currentPrice = coinData?.usd;

      if (!currentPrice) {
        throw new Error("Could not fetch current price");
      }

      console.log(
        `Current ${symbol} price: $${currentPrice}, Target: $${targetPrice}, Comparison: ${comparison}`,
      );

      let outcome: "yes" | "no";
      if (comparison === "above") {
        outcome = currentPrice > targetPrice ? "yes" : "no";
      } else if (comparison === "below") {
        outcome = currentPrice < targetPrice ? "yes" : "no";
      } else if (comparison === "equals") {
        outcome = Math.abs(currentPrice - targetPrice) < 100 ? "yes" : "no";
      } else {
        throw new Error("Invalid comparison type. Use: above, below, equals");
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const { error: updateError } = await supabase
        .from("prediction_markets")
        .update({
          status: `resolved_${outcome}`,
          resolved_at: new Date().toISOString(),
          resolution_criteria: `Oracle resolved at $${currentPrice.toFixed(2)} (target: ${targetPrice}, ${comparison})`,
        })
        .eq("id", marketId);

      if (updateError) {
        console.error("Failed to update market:", updateError);
        throw new Error("Failed to resolve market");
      }

      console.log(`Market ${marketId} resolved as ${outcome} at price $${currentPrice}`);

      return new Response(
        JSON.stringify({
          success: true,
          marketId,
          outcome,
          currentPrice,
          targetPrice,
          comparison,
          timestamp: Date.now(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Price oracle error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
