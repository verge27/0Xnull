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

  // Remove excessive blank lines inside lists coming from Google Docs export.
  // Example: "- item\n\n- item" -> "- item\n- item"
  md = md.replace(/\n\n(-\s+)/g, "\n$1");
  md = md.replace(/\n\n(\d+\.\s+)/g, "\n$1");

  return md.trim();
}

export function BlogPostContent({ content }: { content: string }) {
  const normalized = normalizeBlogMarkdown(content);

  return (
    <div className="prose prose-invert max-w-none prose-headings:font-bold prose-a:text-primary prose-pre:bg-muted/50 prose-hr:my-10 prose-hr:border-border/60">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalized}</ReactMarkdown>
    </div>
  );
}
