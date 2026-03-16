// Blog content import edge function — Google Docs + DOCX conversion
// Preserves headings, lists, bold/italic, hyperlinks, and images

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

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

// ─── Google Docs helpers ───

function extractGoogleDocId(url: string): string | null {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

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

// ─── Shared image helpers ───

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

function extFromContentType(ct: string): string {
  if (ct.includes("png")) return "png";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("svg")) return "svg";
  if (ct.includes("bmp")) return "bmp";
  if (ct.includes("tiff")) return "tiff";
  return "jpg";
}

function publicUrl(bucket: string, path: string): string {
  const base = Deno.env.get("SUPABASE_URL")!;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

// ─── Google Docs HTML → Markdown ───

function unwrapGoogleLink(href: string): string {
  const match = href.match(/https?:\/\/www\.google\.com\/url\?q=([^&]+)/i);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return href;
}

// deno-lint-ignore no-explicit-any
async function htmlToMarkdown(html: string, supabase: any, slug: string): Promise<string> {
  let content = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  content = content.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "");

  // Handle images
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
  const images: { placeholder: string; src: string }[] = [];
  let imgIdx = 0;
  content = content.replace(imgRegex, (_m, src) => {
    const placeholder = `__IMG_PLACEHOLDER_${imgIdx}__`;
    images.push({ placeholder, src });
    imgIdx++;
    return placeholder;
  });

  const uploadedMap: Record<string, string> = {};
  await Promise.all(
    images.map(async ({ placeholder, src }) => {
      const img = await downloadImage(src);
      if (!img) { uploadedMap[placeholder] = ""; return; }
      const fileName = `${slug}/${crypto.randomUUID()}.${img.ext}`;
      const { error } = await supabase.storage
        .from("blog-images")
        .upload(fileName, img.data, { contentType: `image/${img.ext}`, upsert: true });
      if (error) { console.error("Image upload error", error); uploadedMap[placeholder] = ""; return; }
      uploadedMap[placeholder] = publicUrl("blog-images", fileName);
    })
  );

  // Links
  content = content.replace(
    /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_, href, text) => {
      const url = unwrapGoogleLink(String(href));
      const cleanText = text.replace(/<[^>]+>/g, "").trim();
      return `[${cleanText}](${url})`;
    }
  );

  // Bold / Italic
  content = content.replace(/<span[^>]*font-weight:\s*700[^>]*>([\s\S]*?)<\/span>/gi, "**$1**");
  content = content.replace(/<span[^>]*font-weight:\s*bold[^>]*>([\s\S]*?)<\/span>/gi, "**$1**");
  content = content.replace(/<span[^>]*font-style:\s*italic[^>]*>([\s\S]*?)<\/span>/gi, "*$1*");
  content = content.replace(/<(b|strong)[^>]*>([\s\S]*?)<\/(b|strong)>/gi, "**$2**");
  content = content.replace(/<(i|em)[^>]*>([\s\S]*?)<\/(i|em)>/gi, "*$2*");

  // Headers
  content = content.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "# $1\n\n");
  content = content.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "## $1\n\n");
  content = content.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "### $1\n\n");
  content = content.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "#### $1\n\n");

  // Lists
  content = processLists(content);

  // Paragraphs / line breaks
  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n");
  content = content.replace(/<br\s*\/?>/gi, "\n");
  content = content.replace(/<hr[^>]*>/gi, "\n---\n");

  // Strip remaining HTML
  content = content.replace(/<[^>]+>/g, "");

  // HTML entities
  content = content
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—").replace(/&ndash;/g, "–")
    .replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"').replace(/&ldquo;/g, '"');

  // Put images back
  for (const { placeholder } of images) {
    const url = uploadedMap[placeholder];
    content = url ? content.replace(placeholder, `\n\n![](${url})\n\n`) : content.replace(placeholder, "");
  }

  // Cleanup
  content = content.replace(/\*\*\s*\*\*/g, "");
  content = content.replace(/^#{1,6}\s*$/gm, "");
  content = content.replace(/\n{3,}/g, "\n\n");
  content = content.replace(/(-\s+[^\n]+)\n\n(-\s+)/g, "$1\n$2");
  content = content.replace(/(\d+\.\s+[^\n]+)\n\n(\d+\.\s+)/g, "$1\n$2");

  return content.trim();
}

function processLists(html: string, indent = 0): string {
  const prefix = "  ".repeat(indent);

  html = html.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, items) => {
    let result = "";
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let match;
    while ((match = liRegex.exec(items)) !== null) {
      const liContent = match[1];
      if (/<[uo]l[^>]*>/i.test(liContent)) {
        const nestedProcessed = processLists(liContent, indent + 1);
        const textPart = liContent.replace(/<[uo]l[^>]*>[\s\S]*<\/[uo]l>/gi, "").replace(/<[^>]+>/g, "").trim();
        const nestedPart = nestedProcessed.replace(/^[^-\d]*/, "");
        result += `${prefix}- ${textPart}\n${nestedPart}`;
      } else {
        result += `${prefix}- ${liContent.replace(/<[^>]+>/g, "").trim()}\n`;
      }
    }
    return result;
  });

  html = html.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, items) => {
    let result = "";
    let counter = 0;
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let match;
    while ((match = liRegex.exec(items)) !== null) {
      counter++;
      const liContent = match[1];
      if (/<[uo]l[^>]*>/i.test(liContent)) {
        const nestedProcessed = processLists(liContent, indent + 1);
        const textPart = liContent.replace(/<[uo]l[^>]*>[\s\S]*<\/[uo]l>/gi, "").replace(/<[^>]+>/g, "").trim();
        const nestedPart = nestedProcessed.replace(/^[^-\d]*/, "");
        result += `${prefix}${counter}. ${textPart}\n${nestedPart}`;
      } else {
        result += `${prefix}${counter}. ${liContent.replace(/<[^>]+>/g, "").trim()}\n`;
      }
    }
    return result;
  });

  return html;
}

// ─── DOCX Parser ───

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main";
const WP_NS = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing";

function getElements(node: Element, ns: string, tag: string): Element[] {
  return Array.from(node.getElementsByTagNameNS(ns, tag));
}

function getElement(node: Element, ns: string, tag: string): Element | null {
  const els = node.getElementsByTagNameNS(ns, tag);
  return els.length > 0 ? els[0] : null;
}

function getAttr(node: Element, ns: string, attr: string): string | null {
  return node.getAttributeNS(ns, attr) || node.getAttribute(`r:${attr}`) || node.getAttribute(attr);
}

interface DocxRelation {
  target: string;
  type: string;
}

function parseRels(xml: string): Map<string, DocxRelation> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const map = new Map<string, DocxRelation>();
  const rels = doc.getElementsByTagName("Relationship");
  for (let i = 0; i < rels.length; i++) {
    const el = rels[i];
    const id = el.getAttribute("Id") || "";
    const target = el.getAttribute("Target") || "";
    const type = el.getAttribute("Type") || "";
    map.set(id, { target, type });
  }
  return map;
}

// deno-lint-ignore no-explicit-any
async function parseDocx(zip: JSZip, supabase: any, slug: string): Promise<{ title: string; content: string }> {
  // Read document.xml
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) throw new Error("Invalid DOCX: missing document.xml");

  // Read relationships
  let rels = new Map<string, DocxRelation>();
  const relsFile = zip.file("word/_rels/document.xml.rels");
  if (relsFile) {
    const relsXml = await relsFile.async("string");
    rels = parseRels(relsXml);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(docXml, "text/xml");
  const body = doc.getElementsByTagNameNS(W_NS, "body")[0];
  if (!body) throw new Error("Invalid DOCX: missing body");

  let title = "";
  const mdParts: string[] = [];

  // Collect images to upload
  const imageUploads: Map<string, string> = new Map(); // rId -> public URL

  // Pre-upload all images from relationships
  const imagePromises: Promise<void>[] = [];
  for (const [rId, rel] of rels.entries()) {
    if (rel.type.includes("/image")) {
      imagePromises.push(
        (async () => {
          const imgPath = `word/${rel.target.replace(/^\.\.\//, "")}`;
          const imgFile = zip.file(imgPath) || zip.file(rel.target);
          if (!imgFile) return;
          const imgData = await imgFile.async("uint8array");
          const ext = extFromContentType(rel.target);
          const fileName = `${slug}/${crypto.randomUUID()}.${ext}`;
          const ct = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : ext === "svg" ? "image/svg+xml" : "image/jpeg";
          const { error } = await supabase.storage
            .from("blog-images")
            .upload(fileName, imgData, { contentType: ct, upsert: true });
          if (!error) {
            imageUploads.set(rId, publicUrl("blog-images", fileName));
          } else {
            console.error(`Image upload error for ${rId}:`, error);
          }
        })()
      );
    }
  }
  await Promise.all(imagePromises);

  // Process body children (paragraphs and tables)
  const children = body.children;
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    const localName = node.localName;

    if (localName === "p") {
      const md = processParagraph(node, rels, imageUploads);
      if (md !== null) {
        // Extract title from first heading
        if (!title && md.startsWith("# ")) {
          title = md.replace(/^#+\s*/, "").trim();
        }
        mdParts.push(md);
      }
    } else if (localName === "tbl") {
      mdParts.push(processTable(node, rels, imageUploads));
    }
  }

  const content = mdParts.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
  return { title: title || "Imported Document", content };
}

function processParagraph(
  para: Element,
  rels: Map<string, DocxRelation>,
  imageUploads: Map<string, string>
): string | null {
  // Check paragraph style for heading level
  const pPr = getElement(para, W_NS, "pPr");
  let headingLevel = 0;
  let isListItem = false;
  let listLevel = 0;
  let isOrdered = false;

  if (pPr) {
    const pStyle = getElement(pPr, W_NS, "pStyle");
    if (pStyle) {
      const styleVal = pStyle.getAttributeNS(W_NS, "val") || pStyle.getAttribute("w:val") || "";
      const headingMatch = styleVal.match(/^Heading(\d)$/i) || styleVal.match(/^heading\s*(\d)$/i);
      if (headingMatch) {
        headingLevel = parseInt(headingMatch[1], 10);
      }
      if (styleVal.includes("ListParagraph") || styleVal.includes("List")) {
        isListItem = true;
      }
    }

    // Check for numbering (list)
    const numPr = getElement(pPr, W_NS, "numPr");
    if (numPr) {
      isListItem = true;
      const ilvl = getElement(numPr, W_NS, "ilvl");
      if (ilvl) {
        listLevel = parseInt(ilvl.getAttributeNS(W_NS, "val") || ilvl.getAttribute("w:val") || "0", 10);
      }
      const numId = getElement(numPr, W_NS, "numId");
      if (numId) {
        const nid = parseInt(numId.getAttributeNS(W_NS, "val") || numId.getAttribute("w:val") || "0", 10);
        // Even numIds are typically ordered lists in Word (heuristic)
        isOrdered = nid % 2 === 0;
      }
    }
  }

  // Process runs to build text
  const runs = getElements(para, W_NS, "r");
  const parts: string[] = [];

  // Also check for drawings/images at paragraph level
  const drawings = getElements(para, WP_NS, "inline").concat(getElements(para, WP_NS, "anchor"));

  for (const run of runs) {
    const rPr = getElement(run, W_NS, "rPr");
    const isBold = rPr ? (getElement(rPr, W_NS, "b") !== null) : false;
    const isItalic = rPr ? (getElement(rPr, W_NS, "i") !== null) : false;

    // Text content
    const texts = getElements(run, W_NS, "t");
    let textContent = texts.map((t) => t.textContent || "").join("");

    // Check for hyperlink parent
    // (hyperlinks are w:hyperlink wrapping w:r)

    // Check for drawing (image) inside run
    const runDrawings = getElements(run, WP_NS, "inline").concat(getElements(run, WP_NS, "anchor"));
    for (const drawing of runDrawings) {
      const blips = getElements(drawing, A_NS, "blip");
      for (const blip of blips) {
        const embedId = getAttr(blip, R_NS, "embed");
        if (embedId && imageUploads.has(embedId)) {
          parts.push(`![](${imageUploads.get(embedId)})`);
        }
      }
    }

    if (textContent) {
      if (isBold) textContent = `**${textContent}**`;
      if (isItalic) textContent = `*${textContent}*`;
      parts.push(textContent);
    }
  }

  // Handle hyperlinks (w:hyperlink elements inside paragraph)
  const hyperlinks = getElements(para, W_NS, "hyperlink");
  for (const hl of hyperlinks) {
    const rId = getAttr(hl, R_NS, "id");
    let url = "#";
    if (rId && rels.has(rId)) {
      url = rels.get(rId)!.target;
    }
    const hlRuns = getElements(hl, W_NS, "r");
    const hlText = hlRuns
      .map((r) => getElements(r, W_NS, "t").map((t) => t.textContent || "").join(""))
      .join("");
    if (hlText) {
      parts.push(`[${hlText}](${url})`);
    }
  }

  // Handle standalone drawings not inside runs
  for (const drawing of drawings) {
    const blips = getElements(drawing, A_NS, "blip");
    for (const blip of blips) {
      const embedId = getAttr(blip, R_NS, "embed");
      if (embedId && imageUploads.has(embedId)) {
        // Only add if not already added by run processing
        const imgMd = `![](${imageUploads.get(embedId)})`;
        if (!parts.includes(imgMd)) {
          parts.push(imgMd);
        }
      }
    }
  }

  const text = parts.join("").trim();
  if (!text) return null;

  // Apply heading prefix
  if (headingLevel > 0 && headingLevel <= 6) {
    return `${"#".repeat(headingLevel)} ${text}`;
  }

  // Apply list prefix
  if (isListItem) {
    const indent = "  ".repeat(listLevel);
    return isOrdered ? `${indent}1. ${text}` : `${indent}- ${text}`;
  }

  return text;
}

function processTable(
  tbl: Element,
  rels: Map<string, DocxRelation>,
  imageUploads: Map<string, string>
): string {
  const rows = getElements(tbl, W_NS, "tr");
  if (rows.length === 0) return "";

  const tableData: string[][] = [];
  for (const row of rows) {
    const cells = getElements(row, W_NS, "tc");
    const rowData: string[] = [];
    for (const cell of cells) {
      const paras = getElements(cell, W_NS, "p");
      const cellText = paras
        .map((p) => {
          const runs = getElements(p, W_NS, "r");
          return runs.map((r) => getElements(r, W_NS, "t").map((t) => t.textContent || "").join("")).join("");
        })
        .join(" ")
        .trim();
      rowData.push(cellText);
    }
    tableData.push(rowData);
  }

  if (tableData.length === 0) return "";

  // Build markdown table
  const colCount = Math.max(...tableData.map((r) => r.length));
  const lines: string[] = [];

  // Header row
  const header = tableData[0];
  while (header.length < colCount) header.push("");
  lines.push(`| ${header.join(" | ")} |`);
  lines.push(`| ${header.map(() => "---").join(" | ")} |`);

  // Data rows
  for (let i = 1; i < tableData.length; i++) {
    const row = tableData[i];
    while (row.length < colCount) row.push("");
    lines.push(`| ${row.join(" | ")} |`);
  }

  return lines.join("\n");
}

// ─── Shared utilities ───

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

function generateExcerpt(content: string, maxLength = 200): string {
  const plain = content
    .replace(/!\[\]\([^)]+\)/g, "")
    .replace(/[#*_\[\]()]/g, "")
    .replace(/\n+/g, " ")
    .trim();
  if (plain.length <= maxLength) return plain;
  return plain.substring(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

// ─── Main handler ───

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
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const docId = extractGoogleDocId(body.url);
      if (!docId) {
        return new Response(
          JSON.stringify({ error: "Invalid Google Doc URL format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("[import-blog-content] Fetching Google Doc:", docId);
      const { title: docTitle, html } = await fetchGoogleDocContent(docId);
      title = docTitle;
      const tempSlug = generateSlug(docTitle) || "post";
      content = await htmlToMarkdown(html, supabase, tempSlug);
      sourceInfo = "Imported from Google Docs";
    } else if (body.type === "docx") {
      if (!body.fileBase64) {
        return new Response(
          JSON.stringify({ error: "Word document file is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("[import-blog-content] Parsing Word document:", body.fileName);

      // Decode base64 to binary
      const binaryStr = atob(body.fileBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      // Unzip and parse
      const zip = await JSZip.loadAsync(bytes);
      const tempSlug = generateSlug(body.fileName?.replace(/\.docx$/i, "") || "post") || "post";
      const result = await parseDocx(zip, supabase, tempSlug);
      title = result.title;
      content = result.content;
      sourceInfo = `Imported from ${body.fileName || "Word document"}`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid import type. Use "google-docs" or "docx"' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const slug = generateSlug(title) + "-" + Date.now().toString(36);
    const excerpt = generateExcerpt(content);

    console.log("[import-blog-content] Success:", { title, contentLength: content.length, slug });

    return new Response(
      JSON.stringify({ success: true, data: { title, content, slug, excerpt, source: sourceInfo } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[import-blog-content] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to import content";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
