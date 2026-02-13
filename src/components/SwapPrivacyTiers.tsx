import { Shield, ShieldCheck, ShieldAlert, ExternalLink, ArrowRight, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const tiers = [
  {
    name: 'Direct Swap',
    subtitle: 'Mixer-level privacy via Trocador or Exolix',
    badge: '🟡 Moderate',
    badgeClass: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/40',
    icon: ShieldAlert,
    iconClass: 'text-yellow-400',
    tradeoff: 'Fastest • Any coin accepted',
    flow: [
      { label: 'Your Wallet' },
      { label: 'Swap Service', highlight: true },
      { label: '0xNull', sub: 'public 0x address' },
    ],
  },
  {
    name: 'Railgun Shielded Swap',
    subtitle: 'Full zero-knowledge privacy on-chain',
    badge: '🟢 ZK Private',
    badgeClass: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/40',
    icon: ShieldCheck,
    iconClass: 'text-emerald-400',
    tradeoff: 'EVM tokens • Requires Railway Wallet',
    flow: [
      { label: 'Your Wallet' },
      { label: 'Shield 🛡️', highlight: true },
      { label: 'Private Swap', highlight: true },
      { label: 'Reshield 🛡️', highlight: true },
      { label: '0xNull', sub: '0zk address' },
    ],
    walletLink: true,
  },
  {
    name: 'XMR Native',
    subtitle: 'Protocol-level privacy — private by default',
    badge: '🟢 Native Private',
    badgeClass: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/40',
    icon: Shield,
    iconClass: 'text-emerald-400',
    tradeoff: 'Simplest • Already holding XMR? Just send.',
    flow: [
      { label: 'Your Wallet' },
      { label: 'Send XMR', highlight: true },
      { label: '0xNull', sub: 'unique subaddress' },
    ],
  },
];

export function SwapPrivacyTiers() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">Privacy Tiers</h2>
        <p className="text-sm text-muted-foreground">Choose how private your swap should be</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <Card key={tier.name} className="bg-secondary/30 border-border/50 relative overflow-hidden">
              <CardContent className="pt-5 pb-4 space-y-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-background/50 flex items-center justify-center shrink-0">
                    <Icon className={`h-5 w-5 ${tier.iconClass}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm leading-tight">{tier.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{tier.subtitle}</p>
                  </div>
                </div>

                {/* Flow diagram */}
                <div className="flex items-center gap-1 flex-wrap py-2">
                  {tier.flow.map((step, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className={`text-[10px] leading-tight px-1.5 py-1 rounded ${
                        step.highlight
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <span className="font-medium">{step.label}</span>
                        {step.sub && (
                          <span className="block text-[9px] opacity-70">{step.sub}</span>
                        )}
                      </div>
                      {i < tier.flow.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Badge + tradeoff */}
                <div className="flex items-center justify-between gap-2">
                  <Badge className={`text-[10px] border ${tier.badgeClass}`}>
                    {tier.badge}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{tier.tradeoff}</span>
                </div>

                {/* Railway wallet link for Tier 2 */}
                {tier.walletLink && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href="https://www.railway.xyz"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[11px] text-primary hover:underline mt-1"
                        >
                          <Download className="h-3 w-3" />
                          Get Railway Wallet
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[220px]">
                        <p className="text-xs mb-2">Railgun-compatible wallet with built-in shield/unshield and private swaps.</p>
                        <div className="flex flex-wrap gap-1.5">
                          <a href="https://apps.apple.com/gb/app/railway-private-defi-wallet/id6444296719" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[10px]">iOS</a>
                          <span className="text-muted-foreground">·</span>
                          <a href="https://play.google.com/store/apps/details?id=com.railway.rtp" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[10px]">Android</a>
                          <span className="text-muted-foreground">·</span>
                          <a href="https://www.railway.xyz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[10px]">Desktop</a>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
