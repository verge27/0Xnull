import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, Key } from 'lucide-react';

interface LendingTokenPromptProps {
  onSubmit: (token: string) => void;
  loading?: boolean;
}

export const LendingTokenPrompt = ({ onSubmit, loading }: LendingTokenPromptProps) => {
  const [tokenInput, setTokenInput] = useState('');
  const isValid = tokenInput.startsWith('0xn_') && tokenInput.length > 10;

  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-16">
      <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
        <Key className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold">Connect Your Token</h2>
        <p className="text-muted-foreground text-sm mt-2">
          Enter your 0xNull token to access your lending dashboard
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="0xn_..."
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          className="font-mono text-sm"
        />
        <Button onClick={() => onSubmit(tokenInput)} disabled={!isValid || loading}>
          {loading ? 'Connecting...' : 'Connect'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
        <Shield className="w-3 h-3" />
        Your token is stored locally and never shared
      </p>
    </div>
  );
};
