import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TIER_COLORS, SubscriptionTier } from '@/hooks/useSubscriptionTiers';
import { cn } from '@/lib/utils';

interface TierBadgeProps {
  tier: SubscriptionTier;
  size?: 'sm' | 'md';
  className?: string;
}

export const TierBadge = ({ tier, size = 'sm', className }: TierBadgeProps) => {
  const colors = TIER_COLORS[tier.color] || TIER_COLORS.orange;
  
  return (
    <Badge 
      className={cn(
        'gap-1 border',
        colors.bg,
        colors.text,
        colors.border,
        size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1',
        className
      )}
    >
      <Crown className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {tier.name}
    </Badge>
  );
};

interface TierGatedOverlayProps {
  requiredTier: SubscriptionTier;
  onUpgrade?: () => void;
}

export const TierGatedOverlay = ({ requiredTier, onUpgrade }: TierGatedOverlayProps) => {
  const colors = TIER_COLORS[requiredTier.color] || TIER_COLORS.orange;
  
  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-10">
      <div className={cn(
        'p-4 rounded-xl text-center max-w-[200px]',
        'bg-gradient-to-br',
        colors.gradient,
        'border',
        colors.border
      )}>
        <Crown className={cn('w-8 h-8 mx-auto mb-2', colors.text)} />
        <p className="font-semibold text-sm mb-1">
          {requiredTier.name} Exclusive
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Upgrade to {requiredTier.name} tier to unlock this content
        </p>
        <Badge className={cn(colors.bg, colors.text, colors.border, 'border')}>
          {requiredTier.priceXmr} XMR/month
        </Badge>
      </div>
    </div>
  );
};
