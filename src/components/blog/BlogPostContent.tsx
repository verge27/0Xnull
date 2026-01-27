import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

function normalizeBlogMarkdown(input: string): string {
  if (!input) return "";

  let md = input;

  // Remove parser artifacts if any made it into storage.
  md = md.replace(/<parsed-image>[\s\S]*?<\/parsed-image>/g, "");

  // Ensure there is only one H1 on the page (the post title in the template).
  // Convert any markdown H1 into H2.
  md = md.replace(/^# (.+)$/gm, "## $1");

  // Add separators between top-level sections (H2). The DOCX screenshot shows
  // thin rules separating major blocks.
  const parts = md.split(/\n(?=##\s+)/g);
  if (parts.length > 1) {
    md = parts
      .map((p, idx) => (idx === 0 ? p.trim() : `---\n\n${p.trim()}`))
      .join("\n\n");
  }

  // Normalize multiple blank lines.
  md = md.replace(/\n{3,}/g, "\n\n");

  // Keep lists tight (remove excessive blank lines inside lists)
  md = md.replace(/(-\s+[^\n]+)\n\n(-\s+)/g, "$1\n$2");
  md = md.replace(/(\d+\.\s+[^\n]+)\n\n(\d+\.\s+)/g, "$1\n$2");

  return md.trim();
}

// Custom components for enhanced rendering
const components: Components = {
  // Enhanced paragraph - detect bold-only paragraphs (sub-headers like "Traditional sportsbooks:")
  p: ({ children, ...props }) => {
    // Check if this is a bold-only paragraph (acts as a sub-header)
    const childArray = Array.isArray(children) ? children : [children];
    const isBoldOnly = childArray.length === 1 && 
      typeof childArray[0] === 'object' && 
      childArray[0] !== null &&
      'type' in childArray[0] &&
      childArray[0].type === 'strong';
    
    if (isBoldOnly) {
      return (
        <p className="text-foreground font-bold mt-6 mb-3" {...props}>
          {children}
        </p>
      );
    }
    
    return <p {...props}>{children}</p>;
  },
  // Enhanced unordered list with proper bullet styling
  ul: ({ children, ...props }) => (
    <ul className="my-4 ml-6 space-y-3 list-none" {...props}>
      {children}
    </ul>
  ),
  // Enhanced ordered list
  ol: ({ children, ...props }) => (
    <ol className="my-4 ml-6 space-y-3 list-decimal" {...props}>
      {children}
    </ol>
  ),
  // Enhanced list items with visible bullets
  li: ({ children, ...props }) => (
    <li className="relative pl-6 text-muted-foreground leading-relaxed before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold" {...props}>
      {children}
    </li>
  ),
  // Strong text with high visibility
  strong: ({ children, ...props }) => (
    <strong className="text-foreground font-bold" {...props}>
      {children}
    </strong>
  ),
  // H2 headers
  h2: ({ children, ...props }) => (
    <h2 className="text-2xl font-bold text-foreground mt-10 mb-4" {...props}>
      {children}
    </h2>
  ),
  // H3 headers
  h3: ({ children, ...props }) => (
    <h3 className="text-xl font-bold text-foreground mt-8 mb-3" {...props}>
      {children}
    </h3>
  ),
  // Horizontal rules
  hr: () => (
    <hr className="my-10 border-t border-border/60" />
  ),
  // Images
  img: ({ src, alt, ...props }) => (
    <img src={src} alt={alt || ""} className="rounded-lg my-8 max-w-full" {...props} />
  ),
  // Links
  a: ({ children, href, ...props }) => (
    <a href={href} className="text-primary hover:underline" {...props}>
      {children}
    </a>
  ),
};

export function BlogPostContent({ content }: { content: string }) {
  const normalized = normalizeBlogMarkdown(content);

  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
