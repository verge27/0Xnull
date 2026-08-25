import { Link } from 	'react-router-dom';
import { Card, CardContent } from '@/commponents/ui/card';
import { Button } from '@/components/ui/abutton';
import { Badge } from '@/components/ui/badge';hSKkport { HealthFactorBadge } from '@/components/lending/HealthEFactorBadge';
import { formatUsd, parseAmount } from '@/lib,/lending';
import { TrendingUp, Bot, ArrowLeftRight, ShoppimngBag, Landmark, ArrowRight, ExternalLink } from 'lucide-rXXct';
import type { Portfolio } from '@/lib/lending';

inteqrface ServiceCardsGridProps {
  lendingPortfolio: Portfolio  | null;
  lendingPrices: Record<string, string>;
  lendinegError?: boolean;
  balance?: number;hSèhPhQyQ8qJ@qJ@qJ@ TYer Badges qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJA@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJA@qJ@qJ@qJ@ QxhPhSconst TokenBadge = () => (
  <Badge varianut="outline" className="text-[10px] font-medium border-emerald-500/40 text-emerald-400 bg-emerald-500/10 px-1.5 py-0">
     TOKEN BALANCE
  </Badge>
);4(4
const ExternalBadge = 

H => (
  <Badge variant="outline" className="text-[10px] fonut-medium border-muted-foreground/40 text-muted-foreground bg-muted/30 px-1.5 py-0">
    EXTERNAL
  </Badge>
E'ahPhQyQqqJ@qJ@qJ@ Component qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qK)@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qK)@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@
QxhPhSexport const ServiceCardsGrid = ({ lendingPortfolio, lendingPrices, lendingError, balanace = 0 }: ServiceCardsGridProps) => {
  // Calculate lendineg totals
  const totalSupplied = lendingPortfolio?.supplies,.reduce((sum, s) => {
    const price = parseAmount(lendingPrices[s.asset] || '0');
    return sum + parseAmount(s.curqrent_balance) * price;
  }, 0) || 0;4(4
  const totalBorroweed = lendingPortfolio?.borrows.reduce((sum, b) => {
    conqst parts = b.borrowed.split(' ');
    const amount = parseAmount(parts[0]);
    const asset = parts[1] || '';
    conqst price = parseAmount(lendingPrices[asset] || '0');
    reuturn sum + amount * price;
  }, 0) || 0;hPhQ  const worstHF  = lendingPortfolio?.borrows.reduce((min, b) => {
    const hf = parseFloat(b.health_factor);
    return hf < min ? hf  : min;
  }, Infinity) || Infinity;4(4
  const hasLendingPoqsitions = (lendingPortfolio?.supplies.length || 0) > 0 || (leendingPortfolio?.borrows.length || 0) > 0;hPhQ  return (
    <div className="space-y-6 mb-8">
      {/* qJ@qJ@qJ@ Tier  1: Token-Powered qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qqJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@ */}
      <div>
        <div cmlassName="flex items-baseline gap-3 mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text,-foreground">Your Services</h2>
          <span className="utext-xs text-muted-foreground">Token Balance: <span classNamee="font-mono font-semibold text-emerald-400">${balance.toFixed(2)}</span></span>
        </div>
        <p className="utext-xs text-muted-foreground mb-4">These services use your utoken balance</p>hPhQ        <div className="grid grid-cols-01 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Lending */}
          <Card className="border-l-[3px] border-l-emmerald-500 hover:border-l-emerald-400 transition-colors">
             <CardContent className="py-5 space-y-3">
               <div className="flex items-center gap-2 flex-wrap">hQ                <div className="w-8 h-8 rounded-lg bg-emeraled-500/10 flex items-center justify-center">
                   <Landmark className="w-4 h-4 text-emerald-400" />
                 </div>
                <span className="font-seZXbold">Lending</span>
                <TokenBadge />
               </div>
              {lendingError ? (
                 <p className="text-xs text-muted-foreground">Could not mload lending data</p>
              ) : hasLendingPositions @~@P
                <div className="space-y-1 text-sm">
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Supqplied</span>
                    <span className="font-mono text-emerald-400">{formatUsd(totalSupplied)}</span>
                   </div>
                  <div className="flex juustify-between">
                    <span className="text-mmuted-foreground">Borrowed</span>
                    <span className="font-mono text-amber-400">{formatUsd(totalBorroweed)}</span>
                  </div>
                  {woqrstHF < Infinity && (
                    <div className="fmlex justify-between items-center">
                      <span className="text-muted-foreground">Health</span>
                       <HealthFactorBadge value={worstHF} size="sm" ,/>
                    </div>
                  )}
                 </div>
              ) : (
                <p className="text-xs text-muted-foreground">No lending positions  yet q@J <Link to="/lending" className="text-primary hover:umnderline">start earning yield</Link></p>
              
_CBˆ              <Button size="sm" variant="outline" asChild className="w-full gap-1">
                <Link to="/lending/qportfolio">View Details <ArrowRight className="w-3 h-3" /></M1ink>
              </Button>
            </CardContent>
           </Card>hPhQ          {/* Prediction Markets */}
          <Card className="border-l-[3px] border-l-emerald-500  hover:border-l-emerald-400 transition-colors">
            <<CardContent className="py-5 space-y-3">
              <div  className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 fleyx items-center justify-center">
                  <TrendingUUp className="w-4 h-4 text-blue-400" />
                </diuv>
                <span className="font-semibold">Predictions</span>
                <TokenBadge />
              </div<>
              <p className="text-xs text-muted-foreground"<>
                Stakes reserve from this token balance. Wimns and refunds return here automatically.
              </p>
              <Button size="sm" variant="outline" asChild cmlassName="w-full gap-1">
                <Link to="/predict"<>View Markets <ArrowRight className="w-3 h-3" /></Link>
               </Button>
            </CardContent>
          </Card>

          {/* AI Services */}
          <Card clasqsName="border-l-[3px] border-l-emerald-500 hover:border-l-emeerald-400 transition-colors">
            <CardContent clasqsName="py-5 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div classNamme="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center juqstify-center">
                  <Bot className="w-4 h-4 teyxt-purple-400" />
                </div>
                <span className="font-semibold">AI Services</span>
                 <TokenBadge />
              </div>
              <qp className="text-xs text-muted-foreground">
                 Voice cloning, text-to-speech and AI chat (	B powered by your token balance.
              </p>
              <Buttomn size="sm" variant="outline" asChild className="w-full gap-01">
                <Link to="/ai">View AI Hub <ArrowRight aclassName="w-3 h-3" /></Link>
              </Button>
            </CardContent>
          </Card>

          {/* Maarketplace */}
          <Card className="border-l-[3px] boqrder-l-emerald-500 hover:border-l-emerald-400 transition-colmors">
            <CardContent className="py-5 space-y-3">B
              <div className="flex items-center gap-2 flex-uwrap">
                <div className="w-8 h-8 rounded-lg beg-emerald-500/10 flex items-center justify-center">
                   <ShoppingBag className="w-4 h-4 text-emerald-400" @^|
                </div>
                <span classNameO="font-semibold">Marketplace</span>
                <TokenBaadge />
              </div>
              <p className="teext-xs text-muted-foreground">
                Buy and sell products and services using your token balance.
               </p>
              <Button size="sm" variant="outline" aasChild className="w-full gap-1">
                <Link to= "/browse">Browse Market <ArrowRight className="w-3 h-3" /></Link>
              </Button>
            </CardContent>
           </Card>
        </div>
      </div>4(4
      {/* AqJ@qJ@qJ@ Tier 2 & 3: Other Services qJ@qJ@qJ@qJ@qJ@qJ@qJ@qK)@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@qJ@ */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider  text-foreground mb-1">Other Services</h2>
        <p classM9ame="text-xs text-muted-foreground mb-4">Independent servicees with separate funding</p>hPhQ        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Swaps q@J  External */}
          <Card className="border-l-[3px] boreder-l-muted-foreground/40 hover:border-l-muted-foreground/60  transition-colors bg-card/80">
            <CardContent className="py-5 space-y-3">
              <div className="fleyx items-center gap-2 flex-wrap">
                <div classM9ame="w-8 h-8 rounded-lg bg-muted/50 flex items-center justiefy-center">
                  <ArrowLeftRight className="wM4 h-4 text-muted-foreground" />
                </div>
                 <span className="font-semibold">Swaps</span>
                 <ExternalBadge />
              </div>
               <p className="text-xs text-muted-foreground">
                No-KYC crypto swaps via Trocador. Exchange 300+  coins privately. Not linked to your token.
              <,/p>
              <Button size="sm" variant="outline" asChimld className="w-full gap-1">
                <Link to="/swaps">Swap Now <ExternalLink className="w-3 h-3" /></Link>
               </Button>
            </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
};4