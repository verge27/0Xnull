import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://0xnull.io";
const FEED_URL = `${SITE_URL}/rss.xml`;
const FEED_TITLE = "0xNull Blog";
const FEED_DESCRIPTION =
  "Guides on private, no-KYC infrastructure: Monero betting, anonymous VPS, lending, swaps and privacy tooling.";
const MAX_ITEMS = 50;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/rss+xml; charset=utf-8",
};

/** Escapes the five XML predefined entities for attribute/text content. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Wraps free text in CDATA, neutralising any nested terminator. */
function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

/** Strips markdown to a plain-text summary for readers that ignore HTML. */
function toSummary(markdown: string, limit = 400): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).replace(/\s+\S*$/, "")}…`;
}

function absoluteImage(image: string | null): string | null {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  return `${SITE_URL}${image.startsWith("/") ? "" : "/"}${image}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select(
        "slug, title, excerpt, meta_description, content, category, tags, author_name, featured_image, published_at, updated_at",
      )
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(MAX_ITEMS);

    if (error) throw error;

    const items = posts ?? [];
    console.log(`[blog-rss] Building feed with ${items.length} items`);

    // Feed-level lastBuildDate mirrors the newest post, not "now", so the feed
    // stays byte-identical between builds when nothing was published.
    const newest = items[0]?.published_at
      ? new Date(items[0].published_at).toUTCString()
      : undefined;

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml +=
      '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">\n';
    xml += "  <channel>\n";
    xml += `    <title>${escapeXml(FEED_TITLE)}</title>\n`;
    xml += `    <link>${SITE_URL}/blog</link>\n`;
    xml += `    <description>${escapeXml(FEED_DESCRIPTION)}</description>\n`;
    xml += "    <language>en</language>\n";
    xml += `    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />\n`;
    if (newest) {
      xml += `    <lastBuildDate>${newest}</lastBuildDate>\n`;
      xml += `    <pubDate>${newest}</pubDate>\n`;
    }
    xml += `    <image>\n      <url>${SITE_URL}/favicon-512.png</url>\n      <title>${escapeXml(
      FEED_TITLE,
    )}</title>\n      <link>${SITE_URL}/blog</link>\n    </image>\n`;

    for (const post of items) {
      const url = `${SITE_URL}/blog/${post.slug}`;
      const summary =
        post.excerpt?.trim() ||
        post.meta_description?.trim() ||
        toSummary(post.content ?? "");
      const image = absoluteImage(post.featured_image);

      xml += "    <item>\n";
      xml += `      <title>${cdata(post.title ?? "")}</title>\n`;
      xml += `      <link>${url}</link>\n`;
      xml += `      <guid isPermaLink="true">${url}</guid>\n`;
      if (post.published_at) {
        xml += `      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>\n`;
      }
      if (post.author_name) {
        xml += `      <dc:creator>${cdata(post.author_name)}</dc:creator>\n`;
      }
      if (post.category) {
        xml += `      <category>${cdata(post.category)}</category>\n`;
      }
      for (const tag of (post.tags ?? []) as string[]) {
        xml += `      <category>${cdata(tag)}</category>\n`;
      }
      xml += `      <description>${cdata(summary)}</description>\n`;
      if (image) {
        xml += `      <enclosure url="${escapeXml(image)}" type="image/jpeg" />\n`;
      }
      xml += "    </item>\n";
    }

    xml += "  </channel>\n</rss>\n";

    return new Response(xml, { headers: corsHeaders });
  } catch (error) {
    console.error("[blog-rss] Feed generation error:", error);
    return new Response("Error generating RSS feed", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
