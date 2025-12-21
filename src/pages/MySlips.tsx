import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Receipt, 
  ChevronRight, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Wallet,
  Copy,
  ExternalLink,
  Trash2,
  Timer,
  AlertTriangle
} from 'lucide-react';
import { api, type MultibetSlip } from '@/services/api';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { roundUpXmr } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const SLIPS_STORAGE_KEY = 'multibet_slips';
const ACTIVE_SLIP_KEY = 'multibet_active_slip';
const EXPIRY_MINUTES = 60;

// Helper to calculate time remaining
const getTimeRemaining = (createdAt: number): { minutes: number; seconds: number; expired: boolean } => {
  const expiresAt = createdAt + EXPIRY_MINUTES * 60 * 1000;
  const remaining = Math.max(0, expiresAt - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
    expired: remaining === 0,
  };
};

// Timer component for awaiting deposit slips
function SlipTimer({ createdAt }: { createdAt: number }) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(createdAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(createdAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  if (timeRemaining.expired) {
    return (
      <span className="flex items-center gap-1 text-xs text-red-500">
        <AlertTriangle className="w-3 h-3" />
        Expired
      </span>
    );
  }

  const isExpiringSoon = timeRemaining.minutes < 5;

  return (
    <span className={`flex items-center gap-1 text-xs ${isExpiringSoon ? 'text-orange-500 animate-pulse' : 'text-muted-foreground'}`}>
      <Timer className="w-3 h-3" />
      {timeRemaining.minutes}:{timeRemaining.seconds.toString().padStart(2, '0')}
    </span>
  );
}

export default function MySlips() {
  const [slips, setSlips] = useState<MultibetSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<MultibetSlip | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [payoutAddress, setPayoutAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSlips();
  }, []);

  const loadSlips = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      // Load from localStorage - saved slips
      const stored = localStorage.getItem(SLIPS_STORAGE_KEY);
      let localSlips: MultibetSlip[] = [];
      
      console.log('[MySlips] Loading slips from localStorage...');
      console.log('[MySlips] SLIPS_STORAGE_KEY data:', stored);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localSlips = parsed;
          console.log('[MySlips] Found saved slips:', localSlips.length);
        }
      }
      
      // Also load active slip that may not be in saved slips yet
      const activeStored = localStorage.getItem(ACTIVE_SLIP_KEY);
      console.log('[MySlips] ACTIVE_SLIP_KEY data:', activeStored);
      
      if (activeStored) {
        try {
          const activeSlip: MultibetSlip = JSON.parse(activeStored);
          console.log('[MySlips] Found active slip:', activeSlip?.slip_id);
          // Check if it's already in localSlips
          if (activeSlip && activeSlip.slip_id && !localSlips.find(s => s.slip_id === activeSlip.slip_id)) {
            localSlips = [activeSlip, ...localSlips];
            console.log('[MySlips] Added active slip to list');
          }
        } catch (e) {
          console.error('[MySlips] Error parsing active slip:', e);
        }
      }
      
      console.log('[MySlips] Total slips to display:', localSlips.length);
      
      if (localSlips.length > 0) {
        // Refresh status for each slip
        const refreshedSlips = await Promise.all(
          localSlips.map(async (slip) => {
            try {
              const updated = await api.getMultibetSlip(slip.slip_id);
              return updated;
            } catch {
              return slip;
            }
          })
        );
        
        setSlips(refreshedSlips);
        // Save back to localStorage (excluding active slip which is stored separately)
        const slipsWithoutActive = refreshedSlips.filter(s => {
          const activeData = localStorage.getItem(ACTIVE_SLIP_KEY);
          if (!activeData) return true;
          try {
            const active = JSON.parse(activeData);
            return s.slip_id !== active.slip_id;
          } catch {
            return true;
          }
        });
        localStorage.setItem(SLIPS_STORAGE_KEY, JSON.stringify(slipsWithoutActive));
      } else {
        setSlips([]);
      }
    } catch (error) {
      console.error('Error loading slips:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshSlip = async (slipId: string) => {
    try {
      const updated = await api.getMultibetSlip(slipId);
      setSlips(prev => prev.map(s => s.slip_id === slipId ? updated : s));
      if (selectedSlip?.slip_id === slipId) {
        setSelectedSlip(updated);
      }
      localStorage.setItem(SLIPS_STORAGE_KEY, JSON.stringify(
        slips.map(s => s.slip_id === slipId ? updated : s)
      ));
      toast.success('Slip refreshed');
    } catch (error) {
      toast.error('Failed to refresh slip');
    }
  };

  const handleSubmitPayout = async () => {
    if (!selectedSlip || !payoutAddress) return;
    
    if (!payoutAddress.startsWith('4') && !payoutAddress.startsWith('8')) {
      toast.error('Invalid Monero address');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.updateMultibetPayoutAddress(selectedSlip.slip_id, payoutAddress);
      const updated = { ...selectedSlip, payout_address: payoutAddress };
      setSelectedSlip(updated);
      setSlips(prev => prev.map(s => s.slip_id === selectedSlip.slip_id ? updated : s));
      localStorage.setItem(SLIPS_STORAGE_KEY, JSON.stringify(
        slips.map(s => s.slip_id === selectedSlip.slip_id ? updated : s)
      ));
      toast.success('Payout address saved');
      setPayoutAddress('');
    } catch (error) {
      toast.error('Failed to save payout address');
    } finally {
      setSubmitting(false);
    }
  };

  const removeSlip = (slipId: string) => {
    const updated = slips.filter(s => s.slip_id !== slipId);
    setSlips(updated);
    localStorage.setItem(SLIPS_STORAGE_KEY, JSON.stringify(updated));
    toast.success('Slip removed from history');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'awaiting_deposit':
        return <Badge className="bg-amber-600"><Clock className="w-3 h-3 mr-1" /> Awaiting Deposit</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-600"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
      case 'resolved':
        return <Badge className="bg-purple-600"><CheckCircle className="w-3 h-3 mr-1" /> Resolved</Badge>;
      case 'paid':
        return <Badge className="bg-green-600"><Wallet className="w-3 h-3 mr-1" /> Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome) return null;
    if (outcome === 'WON') {
      return <Badge className="bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> Won</Badge>;
    }
    return <Badge className="bg-red-600"><XCircle className="w-3 h-3 mr-1" /> Lost</Badge>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/predict" className="hover:text-foreground">Predictions</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">My Slips</span>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Receipt className="w-8 h-8 text-primary" />
                My Bet Slips
              </h1>
              <p className="text-muted-foreground mt-1">Track your multibet slips</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadSlips} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 transition-transform duration-500 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh All'}
            </Button>
          </div>

          {/* Slips List */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
              <p className="text-muted-foreground">Loading slips...</p>
            </div>
          ) : slips.length === 0 ? (
            <Card className="bg-secondary/30">
              <CardContent className="py-12 text-center">
                <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No bet slips yet</p>
                <p className="text-muted-foreground mb-4">
                  Create a multibet by adding predictions to your slip
                </p>
                <div className="flex gap-3 justify-center">
                  <Link to="/sports-predictions">
                    <Button variant="outline">Sports Markets</Button>
                  </Link>
                  <Link to="/predictions">
                    <Button variant="outline">Crypto Markets</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {slips.map((slip) => (
                <Card 
                  key={slip.slip_id} 
                  className="hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => { setSelectedSlip(slip); setDetailOpen(true); }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(slip.status)}
                        {slip.status === 'awaiting_deposit' && slip.created_at && (
                          <SlipTimer createdAt={slip.created_at} />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                          {slip.slip_id.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); refreshSlip(slip.slip_id); }}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); removeSlip(slip.slip_id); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{slip.legs.length} bet{slip.legs.length > 1 ? 's' : ''}</p>
                        <p className="text-sm text-muted-foreground">
                          {slip.legs.map(l => l.side).join(' + ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${slip.total_amount_usd.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {roundUpXmr(slip.total_amount_xmr)} XMR
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Slip Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Slip Details
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {selectedSlip?.slip_id}
            </DialogDescription>
          </DialogHeader>

          {selectedSlip && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedSlip.status)}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => refreshSlip(selectedSlip.slip_id)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Deposit Info (if awaiting) */}
              {selectedSlip.status === 'awaiting_deposit' && (
                <div className="p-4 rounded-lg bg-secondary/50 border space-y-3">
                  <p className="text-sm font-medium text-center">Send exactly:</p>
                  <p className="text-2xl font-bold text-center font-mono">
                    {roundUpXmr(selectedSlip.total_amount_xmr)} XMR
                  </p>
                  
                  <div className="flex justify-center">
                    <QRCodeSVG 
                      value={`monero:${selectedSlip.xmr_address}?tx_amount=${selectedSlip.total_amount_xmr}`}
                      size={160}
                      className="rounded-lg"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Input 
                      value={selectedSlip.xmr_address} 
                      readOnly 
                      className="text-xs font-mono"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(selectedSlip.xmr_address)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Legs */}
              <div className="space-y-2">
                <p className="font-medium">Bets ({selectedSlip.legs.length})</p>
                {selectedSlip.legs.map((leg, i) => (
                  <div 
                    key={leg.leg_id} 
                    className="p-3 rounded-lg bg-muted/50 border flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{leg.market_id}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={leg.side === 'YES' ? 'default' : 'destructive'} className="text-xs">
                          {leg.side}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ${leg.amount_usd.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {getOutcomeBadge(leg.outcome)}
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex justify-between text-sm">
                  <span>Total Stake</span>
                  <span className="font-bold">${selectedSlip.total_amount_usd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>XMR</span>
                  <span>{roundUpXmr(selectedSlip.total_amount_xmr)}</span>
                </div>
              </div>

              {/* Payout Address */}
              {selectedSlip.status !== 'awaiting_deposit' && !selectedSlip.payout_address && (
                <div className="space-y-2">
                  <Label>Set Payout Address</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="4... or 8..."
                      value={payoutAddress}
                      onChange={(e) => setPayoutAddress(e.target.value)}
                    />
                    <Button onClick={handleSubmitPayout} disabled={submitting}>
                      {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save'}
                    </Button>
                  </div>
                </div>
              )}

              {selectedSlip.payout_address && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-xs text-muted-foreground mb-1">Payout Address</p>
                  <p className="text-xs font-mono break-all">{selectedSlip.payout_address}</p>
                </div>
              )}

              {/* View Key */}
              {selectedSlip.view_key && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    View Key (for verification)
                  </summary>
                  <div className="mt-2 p-2 rounded bg-muted font-mono break-all">
                    {selectedSlip.view_key}
                  </div>
                </details>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
