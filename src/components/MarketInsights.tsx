import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, BookOpen, TrendingUp } from 'lucide-react';

export const MarketInsights = () => {
  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <CardTitle>Market Insights & Additional Reading</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Featured Article */}
        <div className="border-l-4 border-primary pl-4 py-2">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="font-semibold text-lg">XMRBazaar's Best-Selling Categories</h3>
            <Badge variant="secondary" className="shrink-0">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            By AilliA • The Meritocrat • Oct 29, 2025
          </p>
          <p className="text-sm mb-4 leading-relaxed">
            Analysis of XMRBazaar's marketplace data reveals the most popular categories and successful trading patterns. 
            The data shows buyers' and sellers' listings versus successfully completed orders, ranked by orders per product type.
          </p>
          
          <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-3">
            <h4 className="font-medium text-sm">Key Insights:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Privacy-first marketplace users can delete completed orders, so visible data represents only a slice of actual activity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>The most important opportunities may be products not yet listed on the marketplace</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Focus on what's missing rather than just following existing trends</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>"Competition is for losers" - Consider underserved niches in the privacy-focused community</span>
              </li>
            </ul>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-sm mb-2">Recommended Reading:</h4>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Economics in One Lesson</span> by Henry Hazlitt
                <br />
                <span className="text-xs">Learn to see beyond immediate effects and understand indirect consequences</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">"That Which Is Seen, and That Which Is Not Seen"</span> by Frédéric Bastiat
                <br />
                <span className="text-xs">Classic essay on the importance of invisible data and unseen opportunities</span>
              </p>
            </div>
          </div>

          <a
            href="https://themeritocrat.substack.com/p/xmrbazaars-best-selling-categories"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            Read full article on The Meritocrat
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Additional Resources */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-3">More Resources</h4>
          <div className="grid gap-3">
            <a
              href="https://xmrbazaar.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              <span>XMRBazaar Official Marketplace</span>
            </a>
            <a
              href="https://fee.org/ebooks/economics-in-one-lesson/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              <span>Economics in One Lesson (Free eBook)</span>
            </a>
            <a
              href="http://bastiat.org/en/twisatwins.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              <span>Bastiat's Essay on Seen & Unseen</span>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};