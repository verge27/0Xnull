import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

export function BlogPostContent({ content }: { content: string }) {
  const normalized = normalizeBlogMarkdown(content);

  return (
    <div className="prose prose-invert max-w-none 
      prose-headings:font-bold prose-headings:text-foreground
      prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
      prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
      prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
      prose-strong:text-foreground prose-strong:font-semibold
      prose-ul:my-4 prose-ul:pl-6 prose-ul:list-disc
      prose-ol:my-4 prose-ol:pl-6 prose-ol:list-decimal
      prose-li:text-muted-foreground prose-li:my-1 prose-li:leading-relaxed
      prose-pre:bg-muted/50 
      prose-hr:my-10 prose-hr:border-border/60
      prose-img:rounded-lg prose-img:my-8"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalized}</ReactMarkdown>
    </div>
  );
}
