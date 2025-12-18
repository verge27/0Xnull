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
        {/* Pool Status */}
        {!poolInfo.exists ? (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-center">
            <p className="text-xs text-muted-foreground">Pool not available</p>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-xs text-muted-foreground mb-1">Pool Totals</p>
            <p className="text-sm font-mono">
              YES: {(poolInfo.yes_pool_xmr ?? 0).toFixed(6)} XMR &nbsp;&nbsp; NO: {(poolInfo.no_pool_xmr ?? 0).toFixed(6)} XMR
            </p>
          </div>
        )}

        {/* Wallet info - only shown if wallet_created */}
        {!poolInfo.wallet_created ? (
          <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
            Wallet pending — address will appear when first bet is placed.
          </div>
        ) : (
          <>
            <div>
              <Label className="text-xs text-muted-foreground">Pool Address</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  readOnly
                  value={poolInfo.pool_address || ''}
                  className="font-mono text-xs"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(poolInfo.pool_address || '', 'address')}
                  disabled={!poolInfo.pool_address}
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
                  value={poolInfo.view_key || ''}
                  className="font-mono text-xs"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(poolInfo.view_key || '', 'viewKey')}
                  disabled={!poolInfo.view_key}
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
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  );
}
