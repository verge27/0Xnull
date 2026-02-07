import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api, type PredictionMarket } from '@/services/api';
import { usePredictionBets, type PlaceBetResponse } from '@/hooks/usePredictionBets';
import { useMultibetSlip } from '@/hooks/useMultibetSlip';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useVoucher, useVoucherFromUrl } from '@/hooks/useVoucher';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useSEO, useEventListSEO } from '@/hooks/useSEO';
import { BETTING_CONFIG, validateBetAmount, formatMinimumBet } from '@/lib/bettingConfig';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { GovernanceMarketCard } from '@/components/GovernanceMarketCard';
import { BetDepositModal } from '@/components/BetDepositModal';
import { BetSlipPanel } from '@/components/BetSlipPanel';
import { MultibetDepositModal } from '@/components/MultibetDepositModal';
import { MyBets } from '@/components/MyBets';
import { VoucherBadge } from '@/components/VoucherBadge';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Gavel, TrendingUp, Clock, Loader2, Info, ArrowLeft, HelpCircle, RefreshCw, MessageSquarePlus, CheckCircle2, XCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function GovernancePredictions() {
  useSEO({
    title: 'Governance Predictions | Crypto Policy & Protocol Markets – 0xNull',
    description: 'Predict outcomes on crypto governance, protocol upgrades, and policy decisions. Anonymous betting with Monero on 0xNull.',
  });
  
  const { bets, storeBet, getBetsForMarket, checkBetStatus, submitPayoutAddress } = usePredictionBets();
  const { xmrUsdRate } = useExchangeRate();
  const { isAdmin } = useIsAdmin();
  const { voucher: savedVoucher } = useVoucher();
  useVoucherFromUrl();
  
  const betSlip = useMultibetSlip();
  const [multibetDepositOpen, setMultibetDepositOpen] = useState(false);
  
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [currentBetData, setCurrentBetData] = useState<PlaceBetResponse | null>(null);
  
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');
  const [betAmountUsd, setBetAmountUsd] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [placingBet, setPlacingBet] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const [activeTab, setActiveTab] = useState('markets');
  
  // Request market dialog state
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestOracle, setRequestOracle] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  
  // Event list SEO
  const eventListData = useMemo(() => {
    if (markets.length === 0) return null;
    return {
      events: markets.filter(m => !m.resolved).slice(0, 20).map(m => ({
        id: m.market_id,
        question: m.title || 'Governance prediction market',
        description: m.description,
        resolutionDate: m.resolution_time ? new Date(m.resolution_time * 1000).toISOString() : undefined,
        status: m.resolved ? 'resolved' as const : 'open' as const,
        totalPool: m.yes_pool_xmr + m.no_pool_xmr,
        eventType: 'other' as const,
      })),
      pageTitle: 'Governance Predictions - 0xNull',
      pageDescription: 'Predict crypto governance outcomes with Monero. Protocol upgrades, policy decisions, and more.',
      pageUrl: 'https://0xnull.io/governance-predictions',
    };
  }, [markets]);
  useEventListSEO(eventListData);
  
  // Timer for bet creation
  useEffect(() => {
    if (!placingBet) {
      setElapsedSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [placingBet]);
  
  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 60000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const { markets: apiMarkets } = await api.getPredictionMarkets(true, 'governance');
      setMarkets(apiMarkets);
    } catch (error) {
      console.error('Error fetching governance markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBetClick = (market: PredictionMarket, side: 'yes' | 'no') => {
    setSelectedMarket(market);
    setBetSide(side);
    setBetDialogOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedMarket) return;
    
    const amountUsd = parseFloat(betAmountUsd);
    const validation = validateBetAmount(amountUsd);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    if (!payoutAddress || (!payoutAddress.startsWith('4') && !payoutAddress.startsWith('8'))) {
      toast.error('Please enter a valid Monero address starting with 4 or 8');
      return;
    }
    if (payoutAddress.length < 95) {
      toast.error('Monero address is too short');
      return;
    }
    
    setPlacingBet(true);
    setElapsedSeconds(0);
    
    try {
      const response = await api.placePredictionBet({
        market_id: selectedMarket.market_id,
        side: betSide.toUpperCase() as 'YES' | 'NO',
        amount_usd: amountUsd,
        payout_address: payoutAddress,
        voucher_code: savedVoucher || undefined,
      });
      
      storeBet(response);
      setCurrentBetData(response);
      setBetDialogOpen(false);
      setDepositModalOpen(true);
      setBetAmountUsd('');
      setPayoutAddress('');
      
      toast.success('Bet created! Send XMR to confirm.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to place bet';
      if (message === 'BETTING_CLOSED' || message.toLowerCase().includes('betting closed')) {
        toast.error('Betting has closed for this market');
        fetchMarkets();
        setBetDialogOpen(false);
      } else {
        toast.error(message);
      }
    } finally {
      setPlacingBet(false);
      setElapsedSeconds(0);
    }
  };

  const handleBetConfirmed = () => {
    fetchMarkets();
  };

  const handleSubmitRequest = async () => {
    if (!requestTitle.trim() || !requestOracle.trim()) {
      toast.error('Please fill in the market question and oracle/resolution criteria');
      return;
    }
    
    setRequestSubmitting(true);
    
    // For now, we'll just show a success message
    // In production, this could send to a backend endpoint or open a Matrix/email
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Market request submitted! We\'ll review and add qualifying markets.');
    setRequestDialogOpen(false);
    setRequestTitle('');
    setRequestDescription('');
    setRequestOracle('');
    setRequestSubmitting(false);
  };

  const activeMarkets = markets.filter(m => !m.resolved && m.betting_open !== false);
  const closedMarkets = markets.filter(m => m.resolved || m.betting_open === false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-background to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <Link to="/predict" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm">
              <ArrowLeft className="w-4 h-4" />
              Back to Predictions Hub
            </Link>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Gavel className="h-7 w-7 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Governance Predictions</h1>
                  <p className="text-muted-foreground">Predict crypto governance outcomes, protocol upgrades & policy decisions</p>
                </div>
              </div>
              
              <Button 
                onClick={() => setRequestDialogOpen(true)}
                variant="outline"
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 shrink-0"
              >
                <MessageSquarePlus className="w-4 h-4 mr-2" />
                Request a Market
              </Button>
            </div>
            
            {savedVoucher && <VoucherBadge className="mb-4" />}
            
            {/* Info Card */}
            <Card className="bg-amber-500/10 border-amber-500/30 mb-6">
              <CardContent className="p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-400 mb-1">Admin-Resolved Markets</p>
                  <p className="text-muted-foreground">
                    Governance markets are resolved by 0xNull admin based on publicly verifiable events. 
                    Resolution dates may be years away — these are long-term prediction markets on major crypto events.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Markets Section */}
        <section className="container mx-auto px-4 pb-12">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="markets" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Active Markets
              </TabsTrigger>
              <TabsTrigger value="mybets" className="gap-2">
                <Clock className="w-4 h-4" />
                My Bets
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="markets">
              {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-4" />
                      <Skeleton className="h-8 w-full" />
                    </Card>
                  ))}
                </div>
              ) : activeMarkets.length === 0 ? (
                <Card className="p-8 text-center">
                  <Gavel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Governance Markets</h3>
                  <p className="text-muted-foreground mb-4">
                    Check back later for new governance prediction opportunities.
                  </p>
                  <Button variant="outline" onClick={fetchMarkets}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeMarkets.map(market => (
                    <GovernanceMarketCard
                      key={market.market_id}
                      market={market}
                      onBetClick={handleBetClick}
                      onAddToSlip={(marketId, title, side, amount, yesPool, noPool, bettingClosesAt) => {
                        betSlip.addToBetSlip(marketId, title, side, amount, yesPool, noPool, bettingClosesAt);
                      }}
                      onOpenSlip={() => betSlip.setIsOpen(true)}
                    />
                  ))}
                </div>
              )}
              
              {/* Closed/Resolved Markets */}
              {closedMarkets.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    Closed & Resolved Markets
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-75">
                    {closedMarkets.map(market => (
                      <GovernanceMarketCard
                        key={market.market_id}
                        market={market}
                        onBetClick={() => {}}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="mybets">
              <MyBets 
                bets={bets} 
                onStatusUpdate={checkBetStatus} 
                onPayoutSubmit={submitPayoutAddress}
              />
            </TabsContent>
          </Tabs>
        </section>
        
        {/* How it Works */}
        <section className="container mx-auto px-4 pb-12">
          <Card className="bg-secondary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                How Governance Markets Work
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">1. Long-Term Predictions</h4>
                <p className="text-sm text-muted-foreground">
                  Governance markets cover major crypto events like protocol upgrades, hard forks, and policy changes. Resolution dates can be months or years away.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Admin Resolution</h4>
                <p className="text-sm text-muted-foreground">
                  Unlike sports markets with automated oracles, governance markets are resolved by 0xNull admin based on publicly verifiable outcomes.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Same Betting Flow</h4>
                <p className="text-sm text-muted-foreground">
                  Place bets with XMR just like any other market. Winners split the pool proportionally. Only 0.4% fee on winnings.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      
      <Footer />
      
      {/* Bet Dialog */}
      <Dialog open={betDialogOpen} onOpenChange={setBetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Place {betSide.toUpperCase()} Bet</DialogTitle>
            <DialogDescription>{selectedMarket?.title}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Bet Amount (USD)</Label>
              <Input
                type="number"
                placeholder={`Min ${formatMinimumBet()}`}
                value={betAmountUsd}
                onChange={(e) => setBetAmountUsd(e.target.value)}
                min={BETTING_CONFIG.MINIMUM_BET_USD}
              />
              {xmrUsdRate && betAmountUsd && (
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {(parseFloat(betAmountUsd) / xmrUsdRate).toFixed(4)} XMR
                </p>
              )}
            </div>
            
            <div>
              <Label>Payout Address (XMR)</Label>
              <Input
                type="text"
                placeholder="Your Monero address for winnings"
                value={payoutAddress}
                onChange={(e) => setPayoutAddress(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Must start with 4 or 8
              </p>
            </div>
            
            {savedVoucher && (
              <div className="bg-primary/10 rounded-lg p-3 text-sm">
                <span className="text-primary font-medium">Voucher applied:</span> {savedVoucher}
              </div>
            )}
            
            <Button 
              onClick={handlePlaceBet} 
              className="w-full"
              disabled={placingBet}
            >
              {placingBet ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating bet... {elapsedSeconds}s
                </span>
              ) : (
                `Place ${betSide.toUpperCase()} Bet`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Deposit Modal */}
      <BetDepositModal
        open={depositModalOpen}
        onOpenChange={setDepositModalOpen}
        betData={currentBetData}
        onCheckStatus={checkBetStatus}
        onConfirmed={handleBetConfirmed}
      />
      
      {/* Multibet Slip */}
      <BetSlipPanel
        items={betSlip.items}
        isOpen={betSlip.isOpen}
        onOpenChange={betSlip.setIsOpen}
        onRemove={betSlip.removeFromBetSlip}
        onUpdateAmount={betSlip.updateAmount}
        onClear={betSlip.clearBetSlip}
        onReorder={betSlip.reorderItems}
        onUndo={betSlip.undoRemove}
        lastRemoved={betSlip.lastRemoved}
        calculatePotentialPayout={betSlip.calculatePotentialPayout}
        calculateTotalPotentialPayout={betSlip.calculateTotalPotentialPayout}
        onCheckout={async (payoutAddress) => {
          if (betSlip.activeSlip && betSlip.activeSlip.status === 'awaiting_deposit') {
            setMultibetDepositOpen(true);
            return betSlip.activeSlip;
          }
          const slip = await betSlip.checkout(payoutAddress);
          if (slip) setMultibetDepositOpen(true);
          return slip;
        }}
        totalUsd={betSlip.totalUsd}
        isCheckingOut={betSlip.isCheckingOut}
        activeSlip={betSlip.activeSlip}
        onViewActiveSlip={() => setMultibetDepositOpen(true)}
        awaitingDepositCount={betSlip.savedSlips.filter(s => s.status === 'awaiting_deposit').length}
        onCheckResolvedMarkets={betSlip.checkAndRemoveResolvedMarkets}
      />

      <MultibetDepositModal
        open={multibetDepositOpen}
        onOpenChange={setMultibetDepositOpen}
        slip={betSlip.activeSlip}
        onCheckStatus={betSlip.checkSlipStatus}
        onUpdatePayoutAddress={betSlip.updatePayoutAddress}
        onConfirmed={() => betSlip.clearBetSlip()}
      />
      
      {/* Request Market Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-amber-400" />
              Request a Governance Market
            </DialogTitle>
            <DialogDescription>
              Suggest a prediction market for crypto governance, protocol upgrades, or policy decisions.
            </DialogDescription>
          </DialogHeader>
          
          {/* Requirements */}
          <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm">Requirements for Approval</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Clear Oracle:</strong> Outcome must be verifiable from public sources (blockchain data, official announcements, etc.)
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Binary Outcome:</strong> Must resolve to YES or NO with no ambiguity
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Defined Timeframe:</strong> Must have a specific resolution date or deadline
                </span>
              </div>
              <div className="flex items-start gap-2 opacity-60">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">
                  We don't accept subjective markets, price predictions, or markets without verifiable outcomes
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Market Question *</Label>
              <Input
                placeholder='e.g. "Will Ethereum implement EIP-XXXX before Dec 2025?"'
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
              />
            </div>
            
            <div>
              <Label>Additional Context</Label>
              <Textarea
                placeholder="Background info, links to proposals, why this matters..."
                value={requestDescription}
                onChange={(e) => setRequestDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div>
              <Label>Oracle / Resolution Criteria *</Label>
              <Textarea
                placeholder='e.g. "Resolves YES if EIP-XXXX is included in a mainnet hard fork. Verified via ethereum.org announcements."'
                value={requestOracle}
                onChange={(e) => setRequestOracle(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Describe exactly how the winner will be determined
              </p>
            </div>
            
            <Button 
              onClick={handleSubmitRequest} 
              className="w-full bg-amber-500 hover:bg-amber-600 text-black"
              disabled={requestSubmitting || !requestTitle.trim() || !requestOracle.trim()}
            >
              {requestSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit Market Request'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
