import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Binance symbol mapping (ticker -> Binance trading pair)
const BINANCE_SYMBOLS: Record<string, string> = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
  LTC: "LTCUSDT",
  XMR: "XMRUSDT",
  DASH: "DASHUSDT",
  ZEC: "ZECUSDT",
  ADA: "ADAUSDT",
  AVAX: "AVAXUSDT",
  DOT: "DOTUSDT",
  ATOM: "ATOMUSDT",
  NEAR: "NEARUSDT",
  DOGE: "DOGEUSDT",
  SHIB: "SHIBUSDT",
  PEPE: "PEPEUSDT",
  BONK: "BONKUSDT",
  LINK: "LINKUSDT",
  UNI: "UNIUSDT",
  AAVE: "AAVEUSDT",
};

// Fetch single price from Binance
async function fetchBinancePrice(symbol: string): Promise<{ price: number; change24h: number } | null> {
  const binanceSymbol = BINANCE_SYMBOLS[symbol] || `${symbol}USDT`;
  
  try {
    // Get current price
    const priceResponse = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`
    );
    
    if (!priceResponse.ok) {
      console.warn(`Binance price API error for ${binanceSymbol}: ${priceResponse.status}`);
      return null;
    }
    
    const priceData = await priceResponse.json();
    const price = parseFloat(priceData.price);
    
    // Get 24h change
    const changeResponse = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`
    );
    
    let change24h = 0;
    if (changeResponse.ok) {
      const changeData = await changeResponse.json();
      change24h = parseFloat(changeData.priceChangePercent) || 0;
    }
    
    return { price, change24h };
  } catch (error) {
    console.error(`Error fetching Binance price for ${symbol}:`, error);
    return null;
  }
}

// Fetch multiple prices from Binance
async function fetchBinancePrices(symbols: string[]): Promise<Record<string, { price: number; change24h: number }>> {
  const results: Record<string, { price: number; change24h: number }> = {};
  
  // Binance has a batch endpoint for 24hr ticker
  try {
    const response = await fetch("https://api.binance.com/api/v3/ticker/24hr");
    if (!response.ok) {
      console.warn(`Binance batch API error: ${response.status}`);
      return results;
    }
    
    const allTickers = await response.json() as Array<{
      symbol: string;
      lastPrice: string;
      priceChangePercent: string;
    }>;
    
    // Create a map for quick lookup
    const tickerMap = new Map<string, { price: number; change24h: number }>();
    for (const ticker of allTickers) {
      tickerMap.set(ticker.symbol, {
        price: parseFloat(ticker.lastPrice),
        change24h: parseFloat(ticker.priceChangePercent),
      });
    }
    
    // Map requested symbols to results
    for (const symbol of symbols) {
      const binanceSymbol = BINANCE_SYMBOLS[symbol] || `${symbol}USDT`;
      const data = tickerMap.get(binanceSymbol);
      if (data) {
        results[symbol] = data;
      }
    }
  } catch (error) {
    console.error("Error fetching Binance batch prices:", error);
  }
  
  return results;
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
      const symbolsRaw = symbolsParam ?? Object.keys(BINANCE_SYMBOLS).join(",");
      const symbols = symbolsRaw
        .split(",")
        .map((s: string) => s.trim().toUpperCase())
        .filter((s: string) => Boolean(s));

      const prices = await fetchBinancePrices(symbols);

      return new Response(
        JSON.stringify({ prices, source: "binance" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Single-asset price endpoint
    if (action === "price") {
      const data = await fetchBinancePrice(symbol);

      if (!data) {
        console.warn("No data from Binance for", symbol);
        return new Response(
          JSON.stringify({ symbol, price: null, error: "NO_DATA", source: "binance" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          symbol,
          price: data.price,
          priceChange24h: data.change24h,
          timestamp: Date.now(),
          source: "binance",
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

      const data = await fetchBinancePrice(symbol);

      if (!data) {
        throw new Error("Could not fetch current price from Binance");
      }

      const currentPrice = data.price;

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
          source: "binance",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Auto-check and resolve all pending markets past their resolution_date
    if (action === "check-and-resolve") {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Fetch all open markets past resolution date
      const { data: pendingMarkets, error: fetchError } = await supabase
        .from("prediction_markets")
        .select("*")
        .eq("status", "open")
        .lte("resolution_date", new Date().toISOString());

      if (fetchError) {
        console.error("Failed to fetch pending markets:", fetchError);
        throw new Error("Failed to fetch pending markets");
      }

      if (!pendingMarkets || pendingMarkets.length === 0) {
        console.log("No markets pending resolution");
        return new Response(
          JSON.stringify({ resolved: 0, message: "No markets pending resolution", source: "binance" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      console.log(`Found ${pendingMarkets.length} markets to resolve`);

      const results: Array<{ id: string; outcome: string; price: number }> = [];

      for (const market of pendingMarkets) {
        try {
          // Parse the question to extract asset and price range
          const question = market.question || "";
          
          // Extract ticker from parentheses
          const tickerMatch = question.match(/\(([A-Z]+)\)/);
          const ticker = tickerMatch ? tickerMatch[1] : "BTC";
          
          // Extract price values
          const priceMatches = question.match(/\$([0-9,]+)/g);
          if (!priceMatches || priceMatches.length < 1) {
            console.warn(`Could not parse prices from: ${question}`);
            continue;
          }

          const prices = priceMatches.map((p: string) => parseFloat(p.replace(/[$,]/g, "")));
          
          // Determine comparison type
          let comparison: "above" | "below" | "between";
          let targetLow: number;
          let targetHigh: number | undefined;

          if (question.toLowerCase().includes("between") && prices.length >= 2) {
            comparison = "between";
            targetLow = Math.min(...prices);
            targetHigh = Math.max(...prices);
          } else if (question.toLowerCase().includes("above")) {
            comparison = "above";
            targetLow = prices[0];
          } else if (question.toLowerCase().includes("below")) {
            comparison = "below";
            targetLow = prices[0];
          } else {
            if (prices.length >= 2) {
              comparison = "between";
              targetLow = Math.min(...prices);
              targetHigh = Math.max(...prices);
            } else {
              comparison = "above";
              targetLow = prices[0];
            }
          }

          // Fetch current price from Binance
          const priceData = await fetchBinancePrice(ticker);

          if (!priceData) {
            console.warn(`No Binance price data for ${ticker}`);
            continue;
          }

          const currentPrice = priceData.price;

          // Determine outcome
          let outcome: "yes" | "no";
          if (comparison === "between" && targetHigh !== undefined) {
            outcome = currentPrice >= targetLow && currentPrice <= targetHigh ? "yes" : "no";
          } else if (comparison === "above") {
            outcome = currentPrice > targetLow ? "yes" : "no";
          } else {
            outcome = currentPrice < targetLow ? "yes" : "no";
          }

          console.log(
            `Resolving ${market.id}: ${ticker} @ $${currentPrice}, target: ${comparison} $${targetLow}${targetHigh ? `-$${targetHigh}` : ""} = ${outcome}`,
          );

          // Update market
          const { error: updateError } = await supabase
            .from("prediction_markets")
            .update({
              status: `resolved_${outcome}`,
              resolved_at: new Date().toISOString(),
            })
            .eq("id", market.id);

          if (updateError) {
            console.error(`Failed to resolve market ${market.id}:`, updateError);
            continue;
          }

          results.push({ id: market.id, outcome, price: currentPrice });
        } catch (err) {
          console.error(`Error resolving market ${market.id}:`, err);
        }
      }

      console.log(`Resolved ${results.length} markets`);

      return new Response(
        JSON.stringify({ resolved: results.length, results, source: "binance" }),
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
