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

  // Remove duplicate horizontal rules (multiple --- in a row)
  md = md.replace(/(\n---\n)+/g, "\n---\n");
  md = md.replace(/---\n+---/g, "---");

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
  // Enhanced ordered list - no bullets, just numbers
  ol: ({ children, ...props }) => (
    <ol className="my-4 ml-6 space-y-3 list-decimal pl-4" {...props}>
      {children}
    </ol>
  ),
  // List items - only add bullets for unordered lists (handled via parent context)
  li: ({ children, node, ...props }) => {
    // Check if parent is ordered list by looking at sibling structure
    const isOrderedList = node?.position?.start?.column === 1;
    // We'll use CSS to handle this - ordered lists use list-decimal, unordered get custom bullets
    return (
      <li className="relative text-muted-foreground leading-relaxed [ul>&]:pl-6 [ul>&]:before:content-['•'] [ul>&]:before:absolute [ul>&]:before:left-0 [ul>&]:before:text-primary [ul>&]:before:font-bold" {...props}>
        {children}
      </li>
    );
  },
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
  // Tables
  table: ({ children, ...props }) => (
    <div className="my-8 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted/50 border-b border-border" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-border" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="hover:bg-muted/30 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th className="px-4 py-3 text-left font-semibold text-foreground" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-3 text-muted-foreground" {...props}>
      {children}
    </td>
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
