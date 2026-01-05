import { Card, CardContent } from '@/components/ui/card';

interface SEORichTextProps {
  title: string;
  content: string;
  className?: string;
}

export const SEORichText = ({ title, content, className = '' }: SEORichTextProps) => {
  return (
    <section className={`container mx-auto px-4 py-16 ${className}`}>
      <Card className="bg-card/30 border-border/30">
        <CardContent className="p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">{title}</h2>
          <div 
            className="prose prose-invert prose-sm md:prose-base max-w-none text-muted-foreground [&>p]:mb-4 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-foreground [&>h3]:mt-6 [&>h3]:mb-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </CardContent>
      </Card>
    </section>
  );
};
