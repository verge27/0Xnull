// Blog content import edge function - parses Google Docs and Word documents

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRequest {
  type: 'google-docs' | 'docx';
  url?: string; // For Google Docs
  fileBase64?: string; // For Word docs
  fileName?: string;
}

/**
 * Extract Google Doc ID from various URL formats
 */
function extractGoogleDocId(url: string): string | null {
  // Formats:
  // https://docs.google.com/document/d/DOC_ID/edit
  // https://docs.google.com/document/d/DOC_ID/view
  // https://docs.google.com/document/d/DOC_ID
  const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Fetch Google Doc content as HTML (public docs only)
 */
async function fetchGoogleDocContent(docId: string): Promise<{ title: string; html: string }> {
  // Export as HTML
  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=html`;
  
  const response = await fetch(exportUrl);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Google Doc not found. Make sure the document exists and is publicly accessible.');
    }
    throw new Error(`Failed to fetch Google Doc: ${response.status}`);
  }
  
  const html = await response.text();
  
  // Extract title from HTML
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(' - Google Docs', '').trim() : 'Untitled';
  
  return { title, html };
}

/**
 * Convert HTML to clean markdown-ish content
 */
function htmlToCleanContent(html: string): string {
  // Remove style tags and their content
  let content = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove script tags
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Remove head section
  content = content.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  
  // Convert headers
  content = content.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n');
  content = content.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n');
  content = content.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n');
  content = content.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1\n\n');
  
  // Convert paragraphs
  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
  
  // Convert line breaks
  content = content.replace(/<br\s*\/?>/gi, '\n');
  
  // Convert bold
  content = content.replace(/<(b|strong)[^>]*>([\s\S]*?)<\/(b|strong)>/gi, '**$2**');
  
  // Convert italic
  content = content.replace(/<(i|em)[^>]*>([\s\S]*?)<\/(i|em)>/gi, '*$2*');
  
  // Convert links
  content = content.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
  
  // Convert unordered lists
  content = content.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, items) => {
    return items.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n') + '\n';
  });
  
  // Convert ordered lists
  let listCounter = 0;
  content = content.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, items) => {
    listCounter = 0;
    return items.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, () => {
      listCounter++;
      return `${listCounter}. `;
    }) + '\n';
  });
  
  // Remove remaining HTML tags
  content = content.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  content = content.replace(/&nbsp;/g, ' ');
  content = content.replace(/&amp;/g, '&');
  content = content.replace(/&lt;/g, '<');
  content = content.replace(/&gt;/g, '>');
  content = content.replace(/&quot;/g, '"');
  content = content.replace(/&#39;/g, "'");
  
  // Clean up whitespace
  content = content.replace(/\n{3,}/g, '\n\n');
  content = content.trim();
  
  return content;
}

/**
 * Parse Word document from base64
 * Simple extraction - gets text content from docx XML
 */
async function parseWordDocument(base64: string): Promise<{ title: string; content: string }> {
  // Decode base64 to bytes
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  
  // DOCX is a ZIP file - we need to extract document.xml
  // Using a simple approach: find the document.xml content
  
  // Look for XML content markers in the binary
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const fullContent = decoder.decode(bytes);
  
  // Try to find the word/document.xml content
  const docXmlMatch = fullContent.match(/<w:document[^>]*>([\s\S]*?)<\/w:document>/);
  
  if (!docXmlMatch) {
    // Fallback: extract all text between XML tags
    const textContent = fullContent
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return {
      title: 'Imported Document',
      content: textContent.substring(0, 10000), // Limit for safety
    };
  }
  
  const docXml = docXmlMatch[0];
  
  // Extract paragraphs
  const paragraphs: string[] = [];
  const pMatches = docXml.matchAll(/<w:p[^>]*>([\s\S]*?)<\/w:p>/g);
  
  for (const match of pMatches) {
    const pContent = match[1];
    // Extract text runs
    const texts: string[] = [];
    const tMatches = pContent.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    for (const tMatch of tMatches) {
      texts.push(tMatch[1]);
    }
    if (texts.length > 0) {
      paragraphs.push(texts.join(''));
    }
  }
  
  const content = paragraphs.join('\n\n');
  const title = paragraphs[0]?.substring(0, 100) || 'Imported Document';
  
  return { title, content };
}

/**
 * Generate a URL-safe slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

/**
 * Generate excerpt from content
 */
function generateExcerpt(content: string, maxLength = 200): string {
  const plainText = content
    .replace(/[#*_\[\]()]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  return plainText.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const body: ImportRequest = await req.json();
    
    let title: string;
    let content: string;
    let sourceInfo: string;
    
    if (body.type === 'google-docs') {
      if (!body.url) {
        return new Response(
          JSON.stringify({ error: 'Google Doc URL is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const docId = extractGoogleDocId(body.url);
      if (!docId) {
        return new Response(
          JSON.stringify({ error: 'Invalid Google Doc URL format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('[import-blog-content] Fetching Google Doc:', docId);
      
      const { title: docTitle, html } = await fetchGoogleDocContent(docId);
      title = docTitle;
      content = htmlToCleanContent(html);
      sourceInfo = `Imported from Google Docs`;
      
    } else if (body.type === 'docx') {
      if (!body.fileBase64) {
        return new Response(
          JSON.stringify({ error: 'Word document file is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('[import-blog-content] Parsing Word document:', body.fileName);
      
      const parsed = await parseWordDocument(body.fileBase64);
      title = parsed.title;
      content = parsed.content;
      sourceInfo = `Imported from ${body.fileName || 'Word document'}`;
      
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid import type. Use "google-docs" or "docx"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate metadata
    const slug = generateSlug(title) + '-' + Date.now().toString(36);
    const excerpt = generateExcerpt(content);
    
    console.log('[import-blog-content] Successfully parsed:', {
      title,
      contentLength: content.length,
      slug,
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          title,
          content,
          slug,
          excerpt,
          source: sourceInfo,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[import-blog-content] Error:', error);
    
    const message = error instanceof Error ? error.message : 'Failed to import content';
    
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
