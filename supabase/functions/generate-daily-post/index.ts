import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const AUTHOR_NAME = "0xNull";
const BANNED = [
  "revolutionary",
  "seamless",
  "empower",
  "unlock",
  "game-changer",
  "cutting-edge",
  "excited",
  "not financial advice",
];
const DAY_10_BANNED = ["EFL", "Premier League", "Championship", "FA Cup", "Scottish", "Welsh"];
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/u;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface QueueRow {
  id: string;
  day_index: number;
  product_key: string;
  title_hint: string;
  reader: string;
  page_url: string;
  constraint: string | null;
  facts: string;
}

const verifiedFacts = (facts: string) =>
  facts
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.includes("[VERIFY]") && !/\[VERIFY[: ]/i.test(l));

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

function validate(body: string, dayIndex: number): string | null {
  const words = wordCount(body);
  if (words < 350) return `body too short (${words} words)`;
  if (words > 800) return `body too long (${words} words)`;
  if (body.includes("!")) return "contains an exclamation mark";
  if (/\w+, \w+, and \w+/.test(body)) return "contains an Oxford comma";
  if (EMOJI.test(body)) return "contains an emoji";
  if (/^#\s*\w/m.test(body)) return "contains a markdown hashtag heading";
  for (const w of BANNED) {
    if (body.toLowerCase().includes(w.toLowerCase())) return `contains banned phrase "${w}"`;
  }
  const links = body.match(/0xnull\.io/g) || [];
  if (links.length !== 1) return `expected exactly one 0xnull.io mention, found ${links.length}`;
  const boldLeadIns = body.match(/\*\*[^*\n]+\*\*/g) || [];
  if (boldLeadIns.length < 3) return `fewer than three bold lead-ins (${boldLeadIns.length})`;
  if (dayIndex === 10) {
    for (const t of DAY_10_BANNED) {
      if (body.includes(t)) return `Day 10 forbidden term "${t}"`;
    }
  }
  return null;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // --- Auth: cron secret, or an admin's JWT (manual regenerate from /admin/blog-queue)
  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("authorization") || "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  const requestSecret = req.headers.get("x-cron-secret") || bearer;

  let authorised = Boolean(cronSecret && requestSecret && requestSecret === cronSecret);
  if (!authorised && bearer) {
    const { data: userData } = await admin.auth.getUser(bearer);
    if (userData?.user) {
      const { data: roleRow } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      authorised = Boolean(roleRow);
    }
  }
  if (!authorised) {
    console.error("[generate-daily-post] Unauthorized");
    return json({ error: "Unauthorized" }, 401);
  }

  let payload: { day_index?: number; force?: boolean } = {};
  try {
    if (req.method === "POST") payload = await req.json();
  } catch (_) {
    payload = {};
  }

  const { data: settings } = await admin
    .from("blog_settings")
    .select("publish_mode, run_hour_london, enabled")
    .limit(1)
    .maybeSingle();

  if (!settings) return json({ error: "blog_settings row missing" }, 500);

  const manual = typeof payload.day_index === "number";
  if (!settings.enabled && !manual) {
    console.log("[generate-daily-post] disabled, exiting");
    return json({ status: "disabled" });
  }

  if (!manual) {
    // Cron runs hourly; only act at the configured London hour.
    const londonHour = Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        hour: "2-digit",
        hour12: false,
      }).format(new Date()),
    );
    if (londonHour !== settings.run_hour_london && !payload.force) {
      return json({ status: "not_run_hour", london_hour: londonHour });
    }
  }

  const { data: voice } = await admin.from("blog_voice").select("spec").limit(1).maybeSingle();
  if (!voice?.spec) return json({ error: "blog_voice spec missing" }, 500);

  // --- Pick a row
  const pickRow = async (): Promise<QueueRow | null> => {
    if (manual) {
      const { data } = await admin
        .from("blog_queue")
        .select("*")
        .eq("day_index", payload.day_index!)
        .maybeSingle();
      return (data as QueueRow) ?? null;
    }
    const { data } = await admin
      .from("blog_queue")
      .select("*")
      .eq("status", "pending")
      .order("day_index", { ascending: true })
      .limit(1)
      .maybeSingle();
    return (data as QueueRow) ?? null;
  };

  let row = await pickRow();
  const skipped: number[] = [];

  // Skip thin fact blocks and move on to the next pending row.
  while (row && verifiedFacts(row.facts).length < 4) {
    console.log(`[generate-daily-post] day_index=${row.day_index} status=skipped reason=thin_facts`);
    await admin
      .from("blog_queue")
      .update({ status: "skipped", error: "fact block too thin", updated_at: new Date().toISOString() })
      .eq("id", row.id);
    skipped.push(row.day_index);
    if (manual) return json({ status: "skipped", day_index: row.day_index, skipped });
    row = await pickRow();
  }

  if (!row) {
    console.log("[generate-daily-post] queue finished, nothing to do");
    return json({ status: "queue_empty", skipped });
  }

  const facts = verifiedFacts(row.facts).join("\n");
  const userMessage = `PRODUCT: ${row.product_key}
TITLE HINT: ${row.title_hint}
READER: ${row.reader}
PAGE: ${row.page_url}
CONSTRAINT: ${row["constraint"] || "none"}

FACT BLOCK — the only claims you may make:
${facts}

Write the post. Return JSON only.`;

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json({ error: "Missing LOVABLE_API_KEY" }, 500);

  const markFailed = async (error: string, raw: string | null) => {
    console.log(`[generate-daily-post] day_index=${row!.day_index} status=failed error=${error}`);
    await admin
      .from("blog_queue")
      .update({
        status: "failed",
        error,
        raw_response: raw,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row!.id);
    return json({ status: "failed", day_index: row!.day_index, error }, 200);
  };

  let raw = "";
  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: voice.spec },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error(`[generate-daily-post] gateway ${aiRes.status}: ${text.slice(0, 400)}`);
      return json({ error: `AI gateway error ${aiRes.status}`, detail: text.slice(0, 400) }, aiRes.status);
    }

    const aiJson = await aiRes.json();
    raw = aiJson?.choices?.[0]?.message?.content ?? "";
  } catch (e) {
    console.error("[generate-daily-post] gateway request failed", e);
    return json({ error: "AI gateway request failed" }, 503);
  }

  let parsed: { title?: string; slug?: string; excerpt?: string; body_markdown?: string };
  try {
    const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch (_) {
    return await markFailed("response was not valid JSON", raw);
  }

  const body = (parsed.body_markdown || "").trim();
  const title = (parsed.title || "").trim();
  if (!title || !body) return await markFailed("missing title or body_markdown", raw);

  const failure = validate(body, row.day_index);
  if (failure) return await markFailed(failure, raw);

  const publishNow = settings.publish_mode === "auto";
  const nowIso = new Date().toISOString();
  const slug = slugify(parsed.slug || title);

  const { data: post, error: insertError } = await admin
    .from("blog_posts")
    .insert({
      title,
      slug,
      excerpt: (parsed.excerpt || "").trim().slice(0, 300) || null,
      meta_description: (parsed.excerpt || "").trim().slice(0, 160) || null,
      content: body,
      author_name: AUTHOR_NAME,
      status: publishNow ? "published" : "draft",
      published_at: publishNow ? nowIso : null,
    })
    .select("id")
    .single();

  if (insertError || !post) {
    return await markFailed(`insert failed: ${insertError?.message ?? "unknown"}`, raw);
  }

  await admin
    .from("blog_queue")
    .update({
      status: publishNow ? "published" : "generated",
      generated_at: nowIso,
      published_at: publishNow ? nowIso : null,
      post_id: post.id,
      raw_response: raw,
      error: null,
      updated_at: nowIso,
    })
    .eq("id", row.id);

  const words = wordCount(body);
  console.log(
    `[generate-daily-post] day_index=${row.day_index} status=${publishNow ? "published" : "generated"} words=${words}`,
  );

  return json({
    status: publishNow ? "published" : "generated",
    day_index: row.day_index,
    post_id: post.id,
    slug,
    word_count: words,
    skipped,
  });
});
