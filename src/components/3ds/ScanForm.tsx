import { useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ScanFormProps {
  onSubmit: (url: string) => void;
  isScanning: boolean;
  scansRemaining: number;
  rateLimitResetTime: number | null;
}

export const ScanForm = ({ onSubmit, isScanning, scansRemaining, rateLimitResetTime }: ScanFormProps) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a URL.');
      return;
    }
    try {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      if (parsed.protocol !== 'https:') {
        setError('Only HTTPS URLs are supported.');
        return;
      }
      onSubmit(parsed.toString());
    } catch {
      setError('Please enter a valid URL.');
    }
  };

  const isRateLimited = scansRemaining <= 0;

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <Input
            type="text"
            placeholder="https://store.example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isScanning || isRateLimited}
            className="bg-secondary/50 border-border font-mono text-sm"
          />
          <Button
            type="submit"
            disabled={isScanning || isRateLimited}
            className="gap-2 flex-shrink-0"
          >
            <Shield className="w-4 h-4" />
            {isScanning ? 'Scanning...' : 'Scan Checkout'}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Scans typically take 30–90 seconds. We navigate the full checkout flow using a headless browser.</span>
          <span className="flex-shrink-0 ml-4">
            {isRateLimited && rateLimitResetTime ? (
              <span className="text-amber-400">
                Rate limit reached. Try again in {Math.ceil((rateLimitResetTime - Date.now()) / 60000)}m.
              </span>
            ) : (
              <span>{scansRemaining}/3 scans remaining</span>
            )}
          </span>
        </div>
      </form>
    </div>
  );
};
