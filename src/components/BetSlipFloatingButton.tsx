import { ShoppingCart, Eye, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { BetSlipItem } from '@/hooks/useMultibetSlip';

interface BetSlipFloatingButtonProps {
  items: BetSlipItem[];
  totalUsd: number;
  onOpen: () => void;
  hasActiveSlip?: boolean;
  isExpiringSoon?: boolean;
  timeLeft?: string;
  awaitingDepositCount?: number;
  onViewActiveSlip?: () => void;
}

export function BetSlipFloatingButton({
  items,
  totalUsd,
  onOpen,
  hasActiveSlip,
  isExpiringSoon,
  timeLeft,
  awaitingDepositCount = 0,
  onViewActiveSlip,
}: BetSlipFloatingButtonProps) {
  if (items.length === 0 && !hasActiveSlip) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
      {/* View Active Slip button - shown when there's an awaiting deposit */}
      {hasActiveSlip && onViewActiveSlip && (
        <Button
          onClick={onViewActiveSlip}
          variant="secondary"
          className={`h-12 px-4 gap-2 shadow-lg border-0 relative ${
            isExpiringSoon 
              ? 'bg-orange-500 hover:bg-orange-600 animate-pulse' 
              : 'bg-amber-500 hover:bg-amber-600'
          } text-white`}
        >
          <Eye className="w-4 h-4" />
          <span className="font-medium">
            {timeLeft || 'View Slip'}
          </span>
          {awaitingDepositCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
              {awaitingDepositCount}
            </span>
          )}
        </Button>
      )}
      
      {/* Regular bet slip button with preview */}
      {items.length > 0 && (
        <Card className="bg-card/95 backdrop-blur-sm border-primary/30 shadow-xl">
          <Button
            onClick={onOpen}
            className="h-auto p-3 gap-3 flex-col items-start w-full"
            variant="ghost"
          >
            <div className="flex items-center gap-2 w-full">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <span className="font-semibold">View Slip ({items.length})</span>
              <Badge variant="secondary" className="ml-auto">
                ${totalUsd.toFixed(2)}
              </Badge>
            </div>
            
            {/* Mini preview of first 2 selections */}
            {items.length > 0 && (
              <div className="w-full space-y-1 text-left">
                {items.slice(0, 2).map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <Badge 
                      variant="outline"
                      className={`h-4 px-1 text-[10px] ${
                        item.side === 'YES' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {item.side}
                    </Badge>
                    <span className="truncate flex-1">{item.marketTitle}</span>
                    <span className="font-mono">${item.amount.toFixed(0)}</span>
                  </div>
                ))}
                {items.length > 2 && (
                  <div className="text-[10px] text-muted-foreground/60">
                    +{items.length - 2} more selection{items.length > 3 ? 's' : ''}
                  </div>
                )}
              </div>
            )}
          </Button>
        </Card>
      )}
    </div>
  );
}
