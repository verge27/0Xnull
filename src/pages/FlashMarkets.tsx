import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, Timer, Zap } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const API = 'https://api.0xnull.io';

interface FlashRound {
  round_id: string;
  asset: string;
  start_time: number;
  cutoff_time: number;
  resolve_time: number;
  current_price: number;
  phase: 'upcoming' | 'betting' | 'locked' | 'resolved';
  time_remaining: number;
  can_bet: boolean;
  pools: { up: number; down: number };
  implied_odds: { up: number; down: number };
  total_pool: number;
  view_key: string;
}

interface BetResult {
  bet_id: string;
  deposit_address: string;
  view_key: string;
  expires_at: number;
  qr_uri: string;
}

export default function FlashMarkets() {
  const [asset, setAsset] = useState('BTC');
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedSide, setSelectedSide] = useState<'up' | 'down'>('up');
  const [betAmount, setBetAmount] = useState('0.01');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [betResult, setBetResult] = useState<BetResult | null>(null);

  // Poll current round every second
  const { data: round } = useQuery<FlashRound>({
    queryKey: ['flash-round', asset],
    queryFn: async () => {
      const res = await fetch(`${API}/api/flash/rounds/current/${asset}`);
      if (!res.ok) throw new Error('Failed to fetch round');
      return res.json();
    },
    refetchInterval: 1000,
  });

  // Place bet mutation
  const placeBet = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/api/flash/bet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round_id: round?.round_id,
          side: selectedSide,
          amount_xmr: parseFloat(betAmount),
          payout_address: payoutAddress,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => setBetResult(data),
  });

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalPool = (round?.pools?.up || 0) + (round?.pools?.down || 0);
  const upPercent = totalPool > 0 ? (round!.pools.up / totalPool) * 100 : 50;

  const openBetModal = (side: 'up' | 'down') => {
    setSelectedSide(side);
    setBetResult(null);
    setShowBetModal(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2 text-foreground">
              <Zap className="h-8 w-8 text-purple-500" />
              Bull vs Bear
            </h1>
            <p className="text-muted-foreground mt-1">
              Predict UP or DOWN in 5 minutes
            </p>
          </div>

          {/* Asset Tabs */}
          <div className="flex gap-2 justify-center">
            {['BTC', 'XMR', 'ETH'].map((a) => (
              <Button
                key={a}
                variant={asset === a ? 'default' : 'outline'}
                onClick={() => setAsset(a)}
                className={asset === a ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                {a}
              </Button>
            ))}
          </div>

          {/* Current Price */}
          <Card className="p-6 bg-card border-border">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current {asset} Price</p>
              <p className="text-4xl font-bold text-foreground mt-1">
                ${round?.current_price?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }) || '---'}
              </p>
            </div>
          </Card>

          {/* Timer */}
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className={`h-5 w-5 ${round?.phase === 'betting' ? 'text-green-500' : 'text-yellow-500'}`} />
                <span className="text-muted-foreground">
                  {round?.phase === 'betting' ? 'Betting closes' :
                   round?.phase === 'locked' ? 'Result in' : 'Starts in'}
                </span>
              </div>
              <span className={`text-2xl font-mono font-bold ${round?.phase === 'betting' ? 'text-green-500' : 'text-yellow-500'}`}>
                {formatTime(round?.time_remaining || 0)}
              </span>
            </div>
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${round?.phase === 'betting' ? 'bg-green-500' : 'bg-yellow-500'}`}
                style={{ width: `${Math.min(100, ((round?.time_remaining || 0) / 300) * 100)}%` }}
              />
            </div>
          </Card>

          {/* Pool Distribution */}
          <Card className="p-4 bg-card border-border">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-green-500">UP: {round?.pools?.up?.toFixed(4) || '0.0000'} XMR ({upPercent.toFixed(0)}%)</span>
              <span className="text-red-500">DOWN: {round?.pools?.down?.toFixed(4) || '0.0000'} XMR ({(100-upPercent).toFixed(0)}%)</span>
            </div>
            <div className="flex h-10 rounded-lg overflow-hidden border border-border">
              <div 
                className="bg-green-600 flex items-center justify-center text-white font-bold transition-all duration-300"
                style={{ width: `${upPercent}%` }}
              >
                {round?.implied_odds?.up?.toFixed(2) || '1.00'}x
              </div>
              <div 
                className="bg-red-600 flex items-center justify-center text-white font-bold transition-all duration-300"
                style={{ width: `${100 - upPercent}%` }}
              >
                {round?.implied_odds?.down?.toFixed(2) || '1.00'}x
              </div>
            </div>
          </Card>

          {/* Bet Buttons */}
          {round?.can_bet && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                className="h-16 text-xl bg-green-600 hover:bg-green-700 text-white"
                onClick={() => openBetModal('up')}
              >
                <TrendingUp className="mr-2 h-6 w-6" />
                UP
              </Button>
              <Button
                size="lg"
                className="h-16 text-xl bg-red-600 hover:bg-red-700 text-white"
                onClick={() => openBetModal('down')}
              >
                <TrendingDown className="mr-2 h-6 w-6" />
                DOWN
              </Button>
            </div>
          )}

          {/* Locked state */}
          {round?.phase === 'locked' && (
            <Card className="p-8 bg-card border-border text-center">
              <p className="text-4xl mb-2">⏳</p>
              <p className="text-muted-foreground">Waiting for result...</p>
            </Card>
          )}

          {/* How it works */}
          <Card className="p-4 bg-card border-border">
            <h3 className="font-semibold text-foreground mb-2">How it works</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Bet on {asset} going UP or DOWN in 5 minutes</li>
              <li>• Winners split the losers' pool</li>
              <li>• 0.4% fee on winnings only</li>
              <li>• One-sided rounds = full refund</li>
            </ul>
          </Card>
        </div>
      </main>

      <Footer />

      {/* Bet Modal */}
      <Dialog open={showBetModal} onOpenChange={setShowBetModal}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className={selectedSide === 'up' ? 'text-green-500' : 'text-red-500'}>
              Bet {selectedSide.toUpperCase()} on {asset}
            </DialogTitle>
          </DialogHeader>
          
          {betResult ? (
            // QR Code Display
            <div className="space-y-4 text-center">
              <div className="bg-white p-4 rounded-lg inline-block mx-auto">
                <QRCodeSVG value={betResult.qr_uri} size={200} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Send {betAmount} XMR to:</p>
                <p className="font-mono text-xs bg-muted p-2 rounded mt-1 break-all text-foreground">
                  {betResult.deposit_address}
                </p>
              </div>
              <p className="text-sm text-yellow-500">
                Expires in {Math.max(0, Math.floor((betResult.expires_at - Date.now()/1000) / 60))} min
              </p>
              <Button onClick={() => setShowBetModal(false)} className="w-full">
                Done
              </Button>
            </div>
          ) : (
            // Bet Form
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Amount (XMR)</label>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  step="0.001"
                  min="0.001"
                  max="10"
                  className="bg-muted border-border mt-1"
                />
                <div className="flex gap-2 mt-2">
                  {['0.01', '0.05', '0.1', '0.5'].map((a) => (
                    <Button 
                      key={a} 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setBetAmount(a)}
                      className="flex-1"
                    >
                      {a}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground">Payout Address (XMR)</label>
                <Input
                  value={payoutAddress}
                  onChange={(e) => setPayoutAddress(e.target.value)}
                  placeholder="4..."
                  className="bg-muted border-border mt-1 text-sm"
                />
              </div>
              
              <Button
                className={`w-full ${selectedSide === 'up' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                onClick={() => placeBet.mutate()}
                disabled={placeBet.isPending || !payoutAddress}
              >
                {placeBet.isPending ? 'Creating...' : `Bet ${selectedSide.toUpperCase()}`}
              </Button>
              
              {placeBet.isError && (
                <p className="text-sm text-red-500 text-center">
                  {(placeBet.error as Error).message}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
