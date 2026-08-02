import { Link } from 'react-router-dom';
import { Key, Copy, Check, RefreshCw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useToken } from '@/hooks/useToken';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * Compact navbar widget showing the current 0xn_ token status and balance.
 * Reinforces that the same bearer token is used across every service and market.
 */
export const TokenStatusWidget = () => {
  const { token, balance, hasToken, loading, refreshBalance } = useToken();
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (loading && !hasToken) {
    return (
      <div className="h-8 w-24 rounded-md bg-muted/40 animate-pulse" aria-hidden="true" />
    );
  }

  if (!hasToken || !token) {
    return (
      <Button variant="outline" size="sm" asChild className="gap-1.5">
        <Link to="/dashboard">
          <Key className="w-3.5 h-3.5" />
          <span className="text-xs">Get token</span>
        </Link>
      </Button>
    );
  }

  const truncated = `${token.slice(0, 10)}…${token.slice(-4)}`;

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    toast.success('Token copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshBalance();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 border border-primary/30 bg-primary/5 hover:bg-primary/10"
          aria-label="0xn_ token status and balance"
        >
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <Key className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <code className="font-mono text-xs text-muted-foreground hidden lg:inline">{truncated}</code>
          <span className="font-mono text-xs font-semibold">${balance.toFixed(2)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold">Token active</span>
          <span className="ml-auto font-mono text-sm font-semibold">${balance.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5">
          <code className="font-mono text-xs truncate flex-1">{truncated}</code>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyToken} aria-label="Copy token">
            {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRefresh}
            aria-label="Refresh balance"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-primary/40 pl-2">
          One 0xn_ token per user. It stays the same across every service and every market you enter — each
          position just gets a fresh single-use Monero address.
        </p>

        <Button variant="secondary" size="sm" asChild className="w-full">
          <Link to="/dashboard">Open token dashboard</Link>
        </Button>
      </PopoverContent>
    </Popover>
  );
};
