import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Copy, Check, ChevronDown, Shield, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, type PoolInfo } from '@/services/api';

interface PoolTransparencyProps {
  marketId: string;
  className?: string;
}

export function PoolTransparency({ marketId, className }: PoolTransparencyProps) {
  const [copied, setCopied] = useState<'address' | 'viewKey' | null>(null);
  const [howToOpen, setHowToOpen] = useState(false);
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPoolInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPoolInfo(marketId);
      setPoolInfo(data);
    } catch (e) {
      setError('Pool info is temporarily unavailable');
      console.error('Pool info error:', e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'address' | 'viewKey') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Lazy-load pool info: only fetch when user requests it.
  if (!poolInfo) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              Pool Transparency
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPoolInfo}
              disabled={loading}
              className="h-7"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Loading
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Load
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="py-2 text-xs text-muted-foreground">
          {error ? error : 'Load pool details to verify deposits with a watch-only wallet.'}
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            Pool Transparency
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchPoolInfo}
            disabled={loading}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live Balance */}
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pool Balance</p>
          <p className="text-lg font-bold font-mono text-emerald-400">
            {poolInfo.balance_xmr.toFixed(6)} XMR
          </p>
          {poolInfo.unlocked_balance_xmr !== poolInfo.balance_xmr && (
            <p className="text-xs text-muted-foreground">
              ({poolInfo.unlocked_balance_xmr.toFixed(6)} unlocked)
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Verify all deposits independently using a watch-only wallet.
        </p>

        <div>
          <Label className="text-xs text-muted-foreground">Pool Address</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              readOnly
              value={poolInfo.pool_address}
              className="font-mono text-xs"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => copyToClipboard(poolInfo.pool_address, 'address')}
            >
              {copied === 'address' ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Eye className="w-3 h-3" />
            View Key
          </Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              readOnly
              value={poolInfo.view_key}
              className="font-mono text-xs"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => copyToClipboard(poolInfo.view_key, 'viewKey')}
            >
              {copied === 'viewKey' ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <Collapsible open={howToOpen} onOpenChange={setHowToOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
              How to verify
              <ChevronDown className={`w-4 h-4 transition-transform ${howToOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Open Cake Wallet or Feather Wallet</li>
              <li>Create a watch-only wallet</li>
              <li>Paste the pool address and view key</li>
              <li>You can now see all deposits to this pool</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border">
              {poolInfo.verify_instructions}
            </p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
