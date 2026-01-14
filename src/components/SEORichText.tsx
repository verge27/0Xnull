import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SEORichTextProps {
  title: string;
  content: string;
  className?: string;
}

export const SEORichText = ({ title, content, className = '' }: SEORichTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className={`container mx-auto px-4 py-16 ${className}`}>
      <Card className="bg-card/30 border-border/30">
        <CardContent className="p-8 md:p-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground hover:text-foreground"
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <>
                  Read Less <ChevronUp className="ml-1 h-4 w-4" />
                </>
              ) : (
                <>
                  Read More <ChevronDown className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          {/* Content is always in DOM for SEO, but visually hidden when collapsed */}
          <div 
            className={`prose prose-invert prose-sm md:prose-base max-w-none text-muted-foreground [&>p]:mb-4 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-foreground [&>h3]:mt-6 [&>h3]:mb-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 transition-all duration-300 ${
              isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 overflow-hidden opacity-0'
            }`}
            dangerouslySetInnerHTML={{ __html: content }}
            aria-hidden={!isExpanded}
          />
          {/* Hidden content for search engines - always visible to crawlers */}
          <noscript>
            <div 
              className="prose prose-invert prose-sm md:prose-base max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </noscript>
        </CardContent>
      </Card>
    </section>
  );
};
