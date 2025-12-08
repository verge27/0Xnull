import { useState, useEffect, useRef } from 'react';
import { useToken } from '@/hooks/useToken';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wallet, Plus, Key, Copy, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

export function TokenBadge() {
  const { balance, hasToken, token, loading, refreshBalance, setCustomToken } = useToken();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editToken, setEditToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setIsRefreshing(false);
  };

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success('Token copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveToken = async () => {
    if (!editToken.trim()) {
      toast.error('Please enter a token');
      return;
    }

    setIsSaving(true);
    const success = await setCustomToken(editToken.trim());
    setIsSaving(false);

    if (success) {
      toast.success('Token updated successfully');
      setEditMode(false);
      setEditToken('');
    } else {
      toast.error('Invalid token. Please check and try again.');
    }
  };

  if (!hasToken) {
    return (
      <Badge variant="outline" className="gap-1">
        <Wallet className="h-3 w-3" />
        <Loader2 className="h-3 w-3 animate-spin" />
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Balance display (non-clickable) */}
      <Badge 
        variant="outline" 
        className="gap-1"
      >
        <Wallet className="h-3 w-3" />
        {loading || isRefreshing ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <span>${balance?.toFixed(2) ?? '0.00'}</span>
        )}
      </Badge>

      {/* View Token button */}
      <Dialog open={showTokenDialog} onOpenChange={(open) => {
        setShowTokenDialog(open);
        if (!open) {
          setEditMode(false);
          setEditToken('');
        }
      }}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="View Token">
            <Key className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit Token' : 'Your Token'}</DialogTitle>
            <DialogDescription>
              {editMode 
                ? 'Enter a token to restore your balance from another device.'
                : 'Save this token to restore your balance on any device.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!editMode && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-destructive">Keep this token safe!</p>
                    <p className="text-muted-foreground">
                      There is no account recovery. If you lose this token, your balance is gone forever.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {editMode ? (
              <div className="space-y-3">
                <Input 
                  value={editToken}
                  onChange={(e) => setEditToken(e.target.value)}
                  placeholder="Paste your token here (0xn_...)"
                  className="font-mono text-xs"
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditMode(false);
                      setEditToken('');
                    }}
                    className="flex-1"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveToken}
                    className="flex-1"
                    disabled={isSaving || !editToken.trim()}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Token'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input 
                    value={token || ''} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleCopyToken}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleRefresh} className="flex-1">
                    Refresh Balance
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => setEditMode(true)} 
                    className="flex-1"
                  >
                    Use Different Token
                  </Button>
                </div>

                <Button onClick={() => setShowTokenDialog(false)} className="w-full">
                  Done
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <TopupDialog />
    </div>
  );
}

export function TopupDialog() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('10');
  const [address, setAddress] = useState<string | null>(null);
  const [xmrAmount, setXmrAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const { token, refreshBalance, balance } = useToken();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialBalanceRef = useRef<number>(0);

  const handleTopup = async () => {
    if (!token) return;
    
    initialBalanceRef.current = balance;
    setIsLoading(true);
    try {
      const result = await api.topup(token, parseFloat(amount));
      setAddress(result.address);
      setXmrAmount(result.amount_xmr);
      setIsPolling(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create deposit');
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for deposit confirmation by checking balance
  useEffect(() => {
    if (!isPolling || !token) return;

    const checkStatus = async () => {
      try {
        const newBalance = await refreshBalance();
        
        // If balance increased, payment was received
        if (newBalance && newBalance > initialBalanceRef.current) {
          setIsPolling(false);
          toast.success(`Payment confirmed! $${amount} added to your balance.`);
          setTimeout(() => setOpen(false), 2000);
        }
      } catch (error) {
        console.error('Failed to check balance:', error);
      }
    };

    // Check immediately, then every 10 seconds
    checkStatus();
    pollIntervalRef.current = setInterval(checkStatus, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isPolling, amount, refreshBalance, token]);

  // Cleanup on dialog close
  useEffect(() => {
    if (!open && pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, [open]);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetState = () => {
    setAmount('10');
    setAddress(null);
    setXmrAmount(null);
    setIsPolling(false);
    setCopied(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Top Up Balance</DialogTitle>
          <DialogDescription>
            Add funds to your token using Monero (XMR).
          </DialogDescription>
        </DialogHeader>

        {!address ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Amount (USD)</label>
              <div className="flex gap-2">
                {['5', '10', '25', '50'].map((val) => (
                  <Button
                    key={val}
                    variant={amount === val ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAmount(val)}
                  >
                    ${val}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                className="mt-2"
              />
            </div>

            <Button 
              onClick={handleTopup} 
              className="w-full"
              disabled={isLoading || !amount || parseFloat(amount) < 1}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Get XMR Address'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCodeSVG 
                value={`monero:${address}?tx_amount=${xmrAmount}`}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Send Exactly</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  {xmrAmount?.toFixed(6)} XMR
                </p>
                <p className="text-sm text-muted-foreground">≈ ${amount} USD</p>
              </CardContent>
            </Card>

            <div>
              <label className="text-sm font-medium mb-2 block">To Address</label>
              <div className="flex gap-2">
                <Input 
                  value={address} 
                  readOnly 
                  className="font-mono text-xs"
                />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {isPolling && (
              <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Waiting for payment confirmation...
                </span>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Scan QR with your Monero wallet • Balance updates after 1 confirmation
            </p>

            <Button variant="outline" onClick={() => setOpen(false)} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface TokenRequiredProps {
  children: React.ReactNode;
}

export function TokenRequired({ children }: TokenRequiredProps) {
  const { hasToken, loading } = useToken();

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground mt-2">Initializing...</p>
      </Card>
    );
  }

  if (!hasToken) {
    return (
      <Card className="p-8 text-center">
        <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Token Required</h3>
        <p className="text-sm text-muted-foreground mb-4">
          A token is being created automatically. Please wait...
        </p>
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
      </Card>
    );
  }

  return <>{children}</>;
}
