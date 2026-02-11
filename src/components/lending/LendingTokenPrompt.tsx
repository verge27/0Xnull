import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, Key, AlertTriangle, ArrowRight } from 'lucide-react';

interface LendingTokenPromptProps {
  onSubmit: (token: string) => void;
  loading?: boolean;
  compact?: boolean;
}

const TOKEN_REGEX = /^0xn_[a-f0-9]{64}$/;

export const LendingTokenPrompt = ({ onSubmit, loading, compact }: LendingTokenPromptProps) => {
  const [showInput, setShowInput] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');

  const isValid = TOKEN_REGEX.test(tokenInput);

  const handleSubmit = () => {
    if (!isValid) {
      setError('Invalid format. Token must be 0xn_ followed by 64 hex characters.');
      return;
    }
    setError('');
    onSubmit(tokenInput);
  };

  // Compact banner for public pages
  if (compact) {
    return (
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-6">
        <div className="flex items-start gap-3">
          <Key className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <p className="text-sm">
              <span className="font-medium text-foreground">You need a 0xNull token</span>{' '}
              <span className="text-muted-foreground">to deposit, borrow, and manage positions. Tokens are your anonymous private key to 0xNull — no email, no account, no KYC required.</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" asChild className="gap-1 h-7 text-xs">
                <Link to="/tokens">Get a Token <ArrowRight className="w-3 h-3" /></Link>
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowInput(!showInput)}>
                I have a token
              </Button>
            </div>
            {showInput && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="0xn_..."
                  value={tokenInput}
                  onChange={(e) => { setTokenInput(e.target.value); setError(''); }}
                  className="font-mono text-xs h-8"
                />
                <Button size="sm" onClick={handleSubmit} disabled={!tokenInput || loading} className="h-8 text-xs">
                  {loading ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Full-page prompt for authenticated pages
  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-16">
      <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
        <Key className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold">Connect Your Token</h2>
        <p className="text-muted-foreground text-sm mt-2">
          You need a 0xNull token to access your lending dashboard. Tokens are your anonymous private key — no email, no account, no KYC required.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button asChild className="gap-2">
          <Link to="/tokens">Get a Token <ArrowRight className="w-4 h-4" /></Link>
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or enter your token</span></div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="0xn_..."
            value={tokenInput}
            onChange={(e) => { setTokenInput(e.target.value); setError(''); }}
            className="font-mono text-sm"
          />
          <Button onClick={handleSubmit} disabled={!tokenInput || loading}>
            {loading ? 'Connecting...' : 'Connect'}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive text-left">{error}</p>}
      </div>

      <div className="space-y-2 text-left">
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-300/90">Your token IS your account. If you lose it, you lose access to your positions. Save it securely.</p>
        </div>
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-300/90">Do not share your token with anyone. Anyone with your token can access your funds.</p>
        </div>
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 pt-2">
          <Shield className="w-3 h-3" />
          Tokens work across all 0xNull services — predictions, lending, AI tools, and marketplace.
        </p>
      </div>
    </div>
  );
};
