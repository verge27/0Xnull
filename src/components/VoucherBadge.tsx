import { useVoucher } from '@/hooks/useVoucher';
import { Badge } from '@/components/ui/badge';
import { Ticket, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VoucherBadgeProps {
  className?: string;
  showClear?: boolean;
}

export function VoucherBadge({ className = '', showClear = true }: VoucherBadgeProps) {
  const { voucher, voucherInfo, clearVoucher } = useVoucher();

  if (!voucher) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1.5 ${className}`}>
            <Badge 
              variant="outline" 
              className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors gap-1.5 pr-1"
            >
              <Sparkles className="w-3 h-3" />
              <span className="font-mono text-xs">{voucher}</span>
              {voucherInfo?.influencer && (
                <span className="text-emerald-300/70 text-[10px] hidden sm:inline">
                  via {voucherInfo.influencer}
                </span>
              )}
              {showClear && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-0.5 hover:bg-red-500/20 hover:text-red-400 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearVoucher();
                  }}
                >
                  <X className="w-2.5 h-2.5" />
                </Button>
              )}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5 text-emerald-400" />
              Referral Code Active
            </p>
            {voucherInfo ? (
              <>
                <p className="text-xs text-muted-foreground">
                  {voucherInfo.userBenefit}
                </p>
                <p className="text-xs text-muted-foreground">
                  Fee: {voucherInfo.effectiveFee}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Code: {voucher}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
