// Blog content import edge function — faithful Google Docs conversion
// Preserves headings, lists, bold/italic, hyperlinks, and images

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ImportRequest {
  type: "google-docs" | "docx";
  url?: string;
  fileBase64?: string;
  fileName?: string;
}

/** Extract Google Doc ID from various URL formats */
function extractGoogleDocId(url: string): string | null {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/** Fetch Google Doc as HTML (public docs only) */
async function fetchGoogleDocContent(
  docId: string
): Promise<{ title: string; html: string }> {
  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=html`;
  const response = await fetch(exportUrl);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "Google Doc not found. Make sure the document is publicly accessible."
      );
    }
    throw new Error(`Failed to fetch Google Doc: ${response.status}`);
  }
  const html = await response.text();
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch
    ? titleMatch[1].replace(" - Google Docs", "").trim()
    : "Untitled";
  return { title, html };
}

/** Download image from URL and return Uint8Array + extension */
async function downloadImage(
  src: string
): Promise<{ data: Uint8Array; ext: string } | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    let ext = "jpg";
    if (ct.includes("png")) ext = "png";
    else if (ct.includes("gif")) ext = "gif";
    else if (ct.includes("webp")) ext = "webp";
    const ab = await res.arrayBuffer();
    return { data: new Uint8Array(ab), ext };
  } catch {
    return null;
  }
}

/** Convert Google redirect link to actual destination URL */
function unwrapGoogleLink(href: string): string {
  const match = href.match(
    /https?:\/\/www\.google\.com\/url\?q=([^&]+)/i
  );
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return href;
}

/** Convert HTML from Google Docs export to clean Markdown, uploading images */
async function htmlToMarkdown(
  html: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  slug: string
): Promise<string> {
  // Remove style/script/head
  let content = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  content = content.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "");

  // --- Handle images first (before stripping other tags) ---
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
  const images: { placeholder: string; src: string }[] = [];
  let imgIdx = 0;
  content = content.replace(imgRegex, (_m, src) => {
    const placeholder = `__IMG_PLACEHOLDER_${imgIdx}__`;
    images.push({ placeholder, src });
    imgIdx++;
    return placeholder;
  });

  // Upload images in parallel
  const publicUrl = (bucket: string, path: string) => {
    const base = Deno.env.get("SUPABASE_URL")!;
    return `${base}/storage/v1/object/public/${bucket}/${path}`;
  };
  const uploadedMap: Record<string, string> = {};
  await Promise.all(
    images.map(async ({ placeholder, src }) => {
      const img = await downloadImage(src);
      if (!img) {
        uploadedMap[placeholder] = "";
        return;
      }
      const fileName = `${slug}/${crypto.randomUUID()}.${img.ext}`;
      const { error } = await supabase.storage
        .from("blog-images")
        .upload(fileName, img.data, {
          contentType: `image/${img.ext}`,
          upsert: true,
        });
      if (error) {
        console.error("Image upload error", error);
        uploadedMap[placeholder] = "";
        return;
      }
      uploadedMap[placeholder] = publicUrl("blog-images", fileName);
    })
  );

  // --- Convert links (before stripping spans) ---
  content = content.replace(
    /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_, href, text) => {
      const url = unwrapGoogleLink(String(href));
      const cleanText = text.replace(/<[^>]+>/g, "").trim();
      return `[${cleanText}](${url})`;
    }
  );

  // --- Bold / Italic (handle nested spans with styles) ---
  // Google Docs uses inline styles for bold/italic
  content = content.replace(
    /<span[^>]*font-weight:\s*700[^>]*>([\s\S]*?)<\/span>/gi,
    "**$1**"
  );
  content = content.replace(
    /<span[^>]*font-weight:\s*bold[^>]*>([\s\S]*?)<\/span>/gi,
    "**$1**"
  );
  content = content.replace(
    /<span[^>]*font-style:\s*italic[^>]*>([\s\S]*?)<\/span>/gi,
    "*$1*"
  );
  // Standard HTML tags
  content = content.replace(
    /<(b|strong)[^>]*>([\s\S]*?)<\/(b|strong)>/gi,
    "**$2**"
  );
  content = content.replace(/<(i|em)[^>]*>([\s\S]*?)<\/(i|em)>/gi, "*$2*");

  // --- Headers ---
  content = content.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "# $1\n\n");
  content = content.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "## $1\n\n");
  content = content.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "### $1\n\n");
  content = content.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "#### $1\n\n");

  // --- Lists ---
  // Process nested lists - handle ul/ol with proper indentation
  function processLists(html: string, indent = 0): string {
    const prefix = "  ".repeat(indent);
    
    // Unordered lists
    html = html.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, items) => {
      let result = "";
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let match;
      while ((match = liRegex.exec(items)) !== null) {
        let liContent = match[1];
        // Check for nested lists
        if (/<[uo]l[^>]*>/i.test(liContent)) {
          const nestedProcessed = processLists(liContent, indent + 1);
          // Split into text before nested list and the nested list itself
          const textPart = liContent.replace(/<[uo]l[^>]*>[\s\S]*<\/[uo]l>/gi, "").replace(/<[^>]+>/g, "").trim();
          const nestedPart = nestedProcessed.replace(/^[^-\d]*/, "");
          result += `${prefix}- ${textPart}\n${nestedPart}`;
        } else {
          const cleanContent = liContent.replace(/<[^>]+>/g, "").trim();
          result += `${prefix}- ${cleanContent}\n`;
        }
      }
      return result;
    });
    
    // Ordered lists
    html = html.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, items) => {
      let result = "";
      let counter = 0;
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let match;
      while ((match = liRegex.exec(items)) !== null) {
        counter++;
        let liContent = match[1];
        if (/<[uo]l[^>]*>/i.test(liContent)) {
          const nestedProcessed = processLists(liContent, indent + 1);
          const textPart = liContent.replace(/<[uo]l[^>]*>[\s\S]*<\/[uo]l>/gi, "").replace(/<[^>]+>/g, "").trim();
          const nestedPart = nestedProcessed.replace(/^[^-\d]*/, "");
          result += `${prefix}${counter}. ${textPart}\n${nestedPart}`;
        } else {
          const cleanContent = liContent.replace(/<[^>]+>/g, "").trim();
          result += `${prefix}${counter}. ${cleanContent}\n`;
        }
      }
      return result;
    });
    
    return html;
  }
  
  content = processLists(content);

  // --- Paragraphs / line breaks ---
  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n");
  content = content.replace(/<br\s*\/?>/gi, "\n");

  // --- Horizontal rule for dividers ---
  content = content.replace(/<hr[^>]*>/gi, "\n---\n");

  // --- Strip remaining HTML tags ---
  content = content.replace(/<[^>]+>/g, "");

  // --- HTML entities ---
  content = content
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"');

  // --- Put images back ---
  for (const { placeholder } of images) {
    const url = uploadedMap[placeholder];
    if (url) {
      content = content.replace(placeholder, `\n\n![](${url})\n\n`);
    } else {
      content = content.replace(placeholder, "");
    }
  }

  // --- Cleanup ---
  // Remove empty bold markers
  content = content.replace(/\*\*\s*\*\*/g, "");
  // Remove empty headers
  content = content.replace(/^#{1,6}\s*$/gm, "");
  // Collapse excessive blank lines (more than 2 newlines -> 2)
  content = content.replace(/\n{3,}/g, "\n\n");
  // Remove blank lines between list items (keep lists tight)
  content = content.replace(/(-\s+[^\n]+)\n\n(-\s+)/g, "$1\n$2");
  content = content.replace(/(\d+\.\s+[^\n]+)\n\n(\d+\.\s+)/g, "$1\n$2");
  
  return content.trim();
}

/** Generate URL-safe slug */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

/** Generate excerpt from Markdown content */
function generateExcerpt(content: string, maxLength = 200): string {
  const plain = content
    .replace(/!\[\]\([^)]+\)/g, "") // strip images
    .replace(/[#*_\[\]()]/g, "")
    .replace(/\n+/g, " ")
    .trim();
  if (plain.length <= maxLength) return plain;
  return plain.substring(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ImportRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let title: string;
    let content: string;
    let sourceInfo: string;

    if (body.type === "google-docs") {
      if (!body.url) {
        return new Response(
          JSON.stringify({ error: "Google Doc URL is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const docId = extractGoogleDocId(body.url);
      if (!docId) {
        return new Response(
          JSON.stringify({ error: "Invalid Google Doc URL format" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      console.log("[import-blog-content] Fetching Google Doc:", docId);
      const { title: docTitle, html } = await fetchGoogleDocContent(docId);
      title = docTitle;
      const tempSlug = generateSlug(docTitle) || "post";
      content = await htmlToMarkdown(html, supabase, tempSlug);
      sourceInfo = "Imported from Google Docs";
    } else if (body.type === "docx") {
      // Keep simple fallback for docx (not improved here)
      if (!body.fileBase64) {
        return new Response(
          JSON.stringify({ error: "Word document file is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      console.log(
        "[import-blog-content] Parsing Word document:",
        body.fileName
      );
      // Minimal docx handling (unchanged logic, placeholder)
      title = "Imported Document";
      content = "[DOCX import placeholder — implement as needed]";
      sourceInfo = `Imported from ${body.fileName || "Word document"}`;
    } else {
      return new Response(
        JSON.stringify({
          error: 'Invalid import type. Use "google-docs" or "docx"',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const slug = generateSlug(title) + "-" + Date.now().toString(36);
    const excerpt = generateExcerpt(content);

    console.log("[import-blog-content] Success:", {
      title,
      contentLength: content.length,
      slug,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: { title, content, slug, excerpt, source: sourceInfo },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[import-blog-content] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to import content";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
