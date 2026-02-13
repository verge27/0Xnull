import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Key, ArrowRight, Copy, Check, AlertTriangle, Loader2, Shield, Clipboard } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

const TOKEN_REGEX = /^0xn_[a-f0-9]{64}$/;

interface TokenEntryScreenProps {
  onTokenSet: (token: string) => Promise<boolean>;
}

export const TokenEntryScreen = ({ onTokenSet }: TokenEntryScreenProps) => {
  const [mode, setMode] = useState<'choose' | 'enter' | 'generate'>('choose');
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);

  // Generate flow state
  const [newToken, setNewToken] = useState<string | null>(null);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedConfirmed, setSavedConfirmed] = useState(false);

  const handleUnlock = async () => {
    if (!TOKEN_REGEX.test(tokenInput)) {
      setError('Invalid token format. Must be 0xn_ followed by 64 hex characters.');
      setShakeKey(k => k + 1);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const success = await onTokenSet(tokenInput);
      if (!success) {
        setError('Invalid token. Could not verify.');
        setShakeKey(k => k + 1);
      }
    } catch {
      setError('Failed to verify token.');
      setShakeKey(k => k + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const token = await api.createToken();
      setNewToken(token);
      // Try to get deposit address
      try {
        const topup = await api.topup(token, 10);
        setDepositAddress(topup.address);
      } catch {
        // Deposit address optional
      }
    } catch (e) {
      toast.error('Failed to generate token. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      setCopied(true);
      toast.success('Token copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTokenInput(text.trim());
      setError('');
    } catch {
      toast.error('Could not read clipboard');
    }
  };

  const handleProceed = async () => {
    if (!newToken) return;
    setLoading(true);
    const success = await onTokenSet(newToken);
    setLoading(false);
    if (!success) {
      toast.error('Failed to activate token');
    }
  };

  // Choose screen
  if (mode === 'choose') {
    return (
      <div className="max-w-lg mx-auto text-center space-y-8 py-16 px-4">
        <div className="space-y-3">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Key className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">0xNull Dashboard</h1>
          <p className="text-muted-foreground">
            No email. No password. No KYC. Just your token.
          </p>
        </div>

        <div className="grid gap-4">
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors text-left"
            onClick={() => setMode('enter')}
          >
            <CardContent className="py-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">I have a token</p>
                <p className="text-sm text-muted-foreground">Enter your existing 0xNull token to unlock your dashboard</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors text-left"
            onClick={() => setMode('generate')}
          >
            <CardContent className="py-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Get a new token</p>
                <p className="text-sm text-muted-foreground">Generate an anonymous token — fund it with XMR to get started</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground">
          Your token is your identity. It grants access to lending, predictions, AI tools, and more.
        </p>
      </div>
    );
  }

  // Enter existing token
  if (mode === 'enter') {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-16 px-4">
        <Button variant="ghost" size="sm" onClick={() => setMode('choose')} className="mb-4">
          ← Back
        </Button>
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Key className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Unlock Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Paste your 0xNull token to access your account</p>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              key={shakeKey}
              placeholder="0xn_a3f2..."
              value={tokenInput}
              onChange={(e) => { setTokenInput(e.target.value); setError(''); }}
              className={`font-mono text-sm ${error ? 'animate-shake border-destructive' : ''}`}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <Button variant="outline" size="icon" onClick={handlePaste} title="Paste from clipboard">
              <Clipboard className="w-4 h-4" />
            </Button>
          </div>
          {error && <p className="text-sm text-destructive text-left">{error}</p>}
          <Button onClick={handleUnlock} disabled={!tokenInput || loading} className="w-full">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying...</> : 'Unlock'}
          </Button>
        </div>
      </div>
    );
  }

  // Generate new token
  if (mode === 'generate' && !newToken) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-16 px-4">
        <Button variant="ghost" size="sm" onClick={() => setMode('choose')} className="mb-4">
          ← Back
        </Button>
        <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
          <Shield className="w-8 h-8 text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Generate Token</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your token is your identity. No email, no password. Fund it with XMR to get started.
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={loading} className="w-full" size="lg">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</> : 'Generate Token'}
        </Button>
      </div>
    );
  }

  // Show new token
  if (mode === 'generate' && newToken) {
    return (
      <div className="max-w-md mx-auto space-y-6 py-12 px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold">Your New Token</h2>
        </div>

        {/* Critical warning */}
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-amber-300">Save this token now.</p>
              <p className="text-amber-400/80 mt-1">It cannot be recovered. Losing it means losing access to your funds forever.</p>
            </div>
          </div>
        </div>

        {/* Token display */}
        <div className="p-4 rounded-lg bg-secondary/50 border border-border">
          <p className="text-xs text-muted-foreground mb-2">Your Token</p>
          <div className="flex gap-2">
            <code className="flex-1 text-xs font-mono break-all bg-background/50 p-3 rounded border border-border">
              {newToken}
            </code>
            <Button variant="outline" size="icon" onClick={handleCopyToken} className="flex-shrink-0">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Funding info */}
        {depositAddress && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">Fund your token with XMR to start using 0xNull services:</p>
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCodeSVG value={`monero:${depositAddress}`} size={160} />
            </div>
            <div className="flex gap-2">
              <Input value={depositAddress} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => {
                navigator.clipboard.writeText(depositAddress);
                toast.success('Address copied');
              }}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Confirmation checkbox */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
          <Checkbox
            id="saved"
            checked={savedConfirmed}
            onCheckedChange={(checked) => setSavedConfirmed(!!checked)}
            className="mt-0.5"
          />
          <label htmlFor="saved" className="text-sm cursor-pointer">
            I have saved my token securely. I understand it cannot be recovered if lost.
          </label>
        </div>

        <Button onClick={handleProceed} disabled={!savedConfirmed || loading} className="w-full" size="lg">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Activating...</> : 'Continue to Dashboard'}
        </Button>
      </div>
    );
  }

  return null;
};
