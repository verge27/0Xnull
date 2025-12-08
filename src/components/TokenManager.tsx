import { useState, useEffect, useRef } from 'react';
import { useToken } from '@/hooks/useToken';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wallet, Plus, Key, Copy, Check, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

export function TokenBadge() {
  const { balance, hasToken, isLoading, refreshBalance } = useToken();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setIsRefreshing(false);
  };

  if (!hasToken) {
    return <TokenDialog trigger={
      <Button variant="outline" size="sm" className="gap-2">
        <Wallet className="h-4 w-4" />
        <span className="hidden sm:inline">Get Started</span>
      </Button>
    } />;
  }

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className="gap-1 cursor-pointer hover:bg-secondary/80 transition-colors"
        onClick={handleRefresh}
      >
        <Wallet className="h-3 w-3" />
        {isLoading || isRefreshing ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <span>${balance?.toFixed(2) ?? '0.00'}</span>
        )}
      </Badge>
      <TopupDialog />
    </div>
  );
}

interface TokenDialogProps {
  trigger?: React.ReactNode;
}

export function TokenDialog({ trigger }: TokenDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'choose' | 'create' | 'enter'>('choose');
  const [inputToken, setInputToken] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { createToken, enterToken, isLoading, error } = useToken();

  const handleCreate = async () => {
    const token = await createToken();
    if (token) {
      setNewToken(token);
      setMode('create');
    }
  };

  const handleEnter = async () => {
    const success = await enterToken(inputToken);
    if (success) {
      toast.success('Token loaded successfully');
      setOpen(false);
      resetState();
    }
  };

  const handleCopy = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      setCopied(true);
      toast.success('Token copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDone = () => {
    setOpen(false);
    resetState();
  };

  const resetState = () => {
    setMode('choose');
    setInputToken('');
    setNewToken(null);
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetState();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Wallet className="h-4 w-4" />
            Token
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'choose' && 'Access 0xNull Services'}
            {mode === 'create' && 'Your New Token'}
            {mode === 'enter' && 'Enter Your Token'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'choose' && 'Create a token or enter an existing one to use paid services.'}
            {mode === 'create' && 'Save this token! It cannot be recovered.'}
            {mode === 'enter' && 'Enter your existing token to restore your balance.'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'choose' && (
          <div className="space-y-3">
            <Button 
              onClick={handleCreate} 
              className="w-full gap-2" 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create New Token
            </Button>
            <Button 
              onClick={() => setMode('enter')} 
              variant="outline" 
              className="w-full gap-2"
            >
              <Key className="h-4 w-4" />
              Enter Existing Token
            </Button>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>
        )}

        {mode === 'create' && newToken && (
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-destructive">Save this token now!</p>
                  <p className="text-muted-foreground">
                    There is no account recovery. If you lose this token, your balance is gone forever.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Input 
                value={newToken} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <Button onClick={handleDone} className="w-full">
              I've Saved My Token
            </Button>
          </div>
        )}

        {mode === 'enter' && (
          <div className="space-y-4">
            <Input 
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="Enter your token..."
              className="font-mono"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setMode('choose')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleEnter}
                disabled={!inputToken || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Load Token'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function TopupDialog() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('10');
  const [address, setAddress] = useState<string | null>(null);
  const [xmrAmount, setXmrAmount] = useState<number | null>(null);
  const [depositId, setDepositId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const { token, refreshBalance } = useToken();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleTopup = async () => {
    if (!token) return;
    
    setIsLoading(true);
    const { api } = await import('@/lib/api');
    const result = await api.createDeposit(parseFloat(amount));
    
    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      setAddress(result.data.xmr_address);
      setXmrAmount(result.data.xmr_amount);
      setDepositId(result.data.deposit_id);
      setIsPolling(true);
    }
    setIsLoading(false);
  };

  // Poll for deposit confirmation
  useEffect(() => {
    if (!depositId || !isPolling) return;

    const checkStatus = async () => {
      const { api } = await import('@/lib/api');
      const result = await api.getDepositStatus(depositId);
      
      if (result.data?.confirmed) {
        setIsPolling(false);
        toast.success(`Payment confirmed! $${amount} added to your balance.`);
        await refreshBalance();
        // Keep dialog open briefly to show success, then close
        setTimeout(() => setOpen(false), 2000);
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
  }, [depositId, isPolling, amount, refreshBalance]);

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
    setDepositId(null);
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

export function TokenRequired({ children }: { children: React.ReactNode }) {
  const { hasToken } = useToken();

  if (!hasToken) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-primary" />
          <CardTitle>Token Required</CardTitle>
          <CardDescription>
            Create or enter a token to use this service. No email or password needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <TokenDialog trigger={
            <Button className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Create New Token
            </Button>
          } />
          <TokenDialog trigger={
            <Button variant="outline" className="w-full gap-2">
              <Key className="h-4 w-4" />
              Enter Existing Token
            </Button>
          } />
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
