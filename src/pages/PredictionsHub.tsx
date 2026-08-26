import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Bitcoin, Gamepad2, Gavel, Info, ShieldCheck, Trophy, WalletCards } from 'lucide-react';


import { Navbar } from '@/components/Navbar';
import { PredictionsSubsiteNav } from '@/components/PredictionsSubsiteNav';
import { Footer } from '@/components/Footer';
import { RelatedGuides } from '@/components/RelatedGuides';
import { ServicePriceBar } from '@/components/ServicePriceBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSEO } from '@/hooks/useSEO';


const categories = [
  { title: 'Sports', description: 'All bookmaker-priced events', href: '/sports-predictions', icon: Trophy, color: 'text-emerald-400', live: true },
  { title: 'Cricket', description: 'Cricket-only event filter', href: '/cricket-predictions', icon: Trophy, color: 'text-cyan-400', live: true },
  { title: 'Combat', description: 'MMA and boxing events', href: '/predictions/sports/combat', icon: Trophy, color: 'text-red-400', live: true },
  { title: 'Esports', description: 'Model odds · PandaScore results', href: '/esports-predictions', icon: Gamepad2, color: 'text-purple-400', live: true },
  { title: 'Crypto', description: 'Awaiting a v2 odds adapter', href: '/predictions', icon: Bitcoin, color: 'text-orange-400', live: false },
  { title: 'Governance', description: 'Awaiting a v2 odds adapter', href: '/governance-predictions', icon: Gavel, color: 'text-amber-400', live: false },
];

export default function PredictionsHub() {
  useSEO({
    title: 'Prediction Markets | 0xNull',
    description: 'Token-funded prediction markets with bookmaker-priced treasury liquidity and automatic settlement.',
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <PredictionsSubsiteNav />

      <main className="container mx-auto flex-1 px-4 py-10">
        <section className="mx-auto max-w-5xl">
          <div className="text-center">
            <Badge className="border-primary/30 bg-primary/10 text-primary" variant="outline">Prediction v2</Badge>
            <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">One token. Every market.</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Stakes reserve from your existing 0xn_ balance. Markets no longer create a second wallet, address or view key.
            </p>
            <Button asChild className="mt-6">
              <Link to="/sports-predictions">View live markets <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          <ServicePriceBar
            className="mt-9"
            price="0.4% of winnings"
            tokenMetered
            trust={<>Treasury liquidity seeds every market from combined bookmaker odds and rotates back into the pool as markets settle.</>}
          />

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { icon: BarChart3, title: 'External opening odds', body: 'At least two fresh books; median no-vig consensus is stored with the seed.' },
              { icon: WalletCards, title: 'TXN-ledger funding', body: 'The stake moves from available to reserved on the same 0xn_ token.' },
              { icon: ShieldCheck, title: 'Automatic return', body: 'Wins and refunds credit the same balance. Withdraw only when you choose.' },
            ].map(({ icon: Icon, title, body }) => (
              <Card key={title} className="bg-card/50">
                <CardContent className="p-5">
                  <Icon className="h-6 w-6 text-primary" />
                  <h2 className="mt-3 font-semibold">{title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Market coverage</h2>
                <p className="mt-1 text-sm text-muted-foreground">Only externally priced sections accept v2 stakes.</p>
              </div>
              <Link className="text-sm text-primary hover:underline" to="/payouts">Payout model →</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map(({ title, description, href, icon: Icon, color, live }) => (
                <Link key={title} to={href}>
                  <Card className="h-full transition-colors hover:border-primary/40">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <Icon className={`h-6 w-6 ${color}`} />
                        <Badge variant="outline" className={live ? 'border-emerald-500/30 text-emerald-400' : 'text-muted-foreground'}>
                          {live ? 'Live' : 'Next adapter'}
                        </Badge>
                      </div>
                      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <RelatedGuides className="mt-12" compact heading="Betting guides" intro="How pricing, resolution and token settlement fit together." />
        </section>
      </main>

      <Footer />
    </div>
  );
}
