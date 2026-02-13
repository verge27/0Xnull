import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { TokenEntryScreen } from '@/components/dashboard/TokenEntryScreen';
import { BalanceStrip } from '@/components/dashboard/BalanceStrip';
import { ServiceCardsGrid } from '@/components/dashboard/ServiceCardsGrid';
import { TokenSecurityPanel } from '@/components/dashboard/TokenSecurityPanel';
import { TopupDialog } from '@/components/TokenManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToken } from '@/hooks/useToken';
import { lendingApi, type Portfolio } from '@/lib/lending';
import { api } from '@/services/api';
import { Loader2, Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

const Dashboard = () => {
  const { token, balance, loading, hasToken, refreshBalance, setCustomToken, clearToken } = useToken();
  const [lendingPortfolio, setLendingPortfolio] = useState<Portfolio | null>(null);
  const [lendingPrices, setLendingPrices] = useState<Record<string, string>>({});
  const [lendingError, setLendingError] = useState(false);
  const [showFunding, setShowFunding] = useState(false);
  const [fundAddress, setFundAddress] = useState<string | null>(null);
  const [fundXmrAmount, setFundXmrAmount] = useState<number | null>(null);
  const [fundLoading, setFundLoading] = useState(false);
  const [fundCopied, setFundCopied] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // Fetch lending portfolio
  const fetchLending = useCallback(async () => {
    if (!token) return;
    try {
      const [portfolio, prices] = await Promise.all([
        lendingApi.getPortfolio(token).catch(() => null),
        lendingApi.getPrices().catch(() => ({})),
      ]);
      if (portfolio) {
        setLendingPortfolio(portfolio);
        setLendingError(false);
      }
      setLendingPrices(prices);
    } catch {
      setLendingError(true);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchLending();
    }
  }, [fetchLending, token]);

  // Refresh balance periodically
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [token, refreshBalance]);

  // Funding modal polling
  useEffect(() => {
    if (!isPolling || !token) return;
    const initialBalance = balance;
    const interval = setInterval(async () => {
      const newBalance = await refreshBalance();
      if (newBalance && newBalance > initialBalance) {
        setIsPolling(false);
        setShowFunding(false);
        toast.success('Deposit confirmed!');
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isPolling, token, balance, refreshBalance]);

  const handleFund = async () => {
    if (!token) return;
    setShowFunding(true);
    setFundLoading(true);
    try {
      const result = await api.topup(token, 0);
      setFundAddress(result.address);
      setFundXmrAmount(result.amount_xmr);
      setIsPolling(true);
    } catch {
      // Just show the modal, address generation might fail
    } finally {
      setFundLoading(false);
    }
  };

  const handleLogout = () => {
    clearToken();
  };

  const handleTokenSet = async (newToken: string): Promise<boolean> => {
    return setCustomToken(newToken);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  // No token - show entry screen
  if (!hasToken || !token) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4">
          <TokenEntryScreen onTokenSet={handleTokenSet} />
        </main>
        <Footer />
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button variant="ghost" size="sm" onClick={() => { refreshBalance(); fetchLending(); }} className="gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </Button>
        </div>

        {/* Balance Strip */}
        <BalanceStrip
          token={token}
          balance={balance}
          onFund={handleFund}
          onLogout={handleLogout}
        />

        {/* Service Cards */}
        <ServiceCardsGrid
          lendingPortfolio={lendingPortfolio}
          lendingPrices={lendingPrices}
          lendingError={lendingError}
        />

        {/* Token Security */}
        <TokenSecurityPanel token={token} />
      </main>
      <Footer />

      {/* Funding Modal */}
      <Dialog open={showFunding} onOpenChange={(open) => {
        setShowFunding(open);
        if (!open) { setFundAddress(null); setIsPolling(false); }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fund Your Token</DialogTitle>
            <DialogDescription>Send any amount of XMR to the address below.</DialogDescription>
          </DialogHeader>
          {fundLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : fundAddress ? (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG value={`monero:${fundAddress}`} size={180} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Deposit Address</p>
                <div className="flex gap-2">
                  <Input value={fundAddress} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={() => {
                    navigator.clipboard.writeText(fundAddress);
                    setFundCopied(true);
                    toast.success('Address copied');
                    setTimeout(() => setFundCopied(false), 2000);
                  }}>
                    {fundCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              {isPolling && (
                <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Waiting for deposit...</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Deposits typically confirm in 10-20 minutes (10 confirmations)
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Could not generate deposit address. Try again.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
