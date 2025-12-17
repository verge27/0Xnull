import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Copy, Check, ChevronDown, Shield, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface PoolTransparencyProps {
  poolAddress?: string;
  viewKey?: string;
  className?: string;
}

export function PoolTransparency({ poolAddress, viewKey, className }: PoolTransparencyProps) {
  const [copied, setCopied] = useState<'address' | 'viewKey' | null>(null);
  const [howToOpen, setHowToOpen] = useState(false);

  if (!poolAddress && !viewKey) return null;

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

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          Pool Transparency
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Verify all deposits independently using a watch-only wallet.
        </p>

        {poolAddress && (
          <div>
            <Label className="text-xs text-muted-foreground">Pool Address</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                readOnly
                value={poolAddress}
                className="font-mono text-xs"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(poolAddress, 'address')}
              >
                {copied === 'address' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {viewKey && (
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Eye className="w-3 h-3" />
              View Key
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                readOnly
                value={viewKey}
                className="font-mono text-xs"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(viewKey, 'viewKey')}
              >
                {copied === 'viewKey' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

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
              This allows you to independently verify that all bets are recorded on-chain without trusting us.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
