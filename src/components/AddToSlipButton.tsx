import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, ChevronDown, ShoppingCart, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { isAddingClosingSoonItem, formatCountdown } from '@/hooks/useBetSlipValidation';

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

interface AddToSlipButtonProps {
  marketId: string;
  marketTitle: string;
  yesPool?: number;
  noPool?: number;
  onAdd: (marketId: string, title: string, side: 'YES' | 'NO', amount: number, yesPool: number, noPool: number, bettingClosesAt?: number) => void;
  onOpenSlip?: () => void;
  defaultAmount?: number;
  variant?: 'icon' | 'full' | 'compact';
  className?: string;
  bettingClosesAt?: number;
}

export function AddToSlipButton({
  marketId,
  marketTitle,
  yesPool = 0,
  noPool = 0,
  onAdd,
  onOpenSlip,
  defaultAmount = 5,
  variant = 'icon',
  className = '',
  bettingClosesAt,
}: AddToSlipButtonProps) {
  const [open, setOpen] = useState(false);

  const handleAdd = (side: 'YES' | 'NO', amount: number = defaultAmount) => {
    const isClosingSoon = isAddingClosingSoonItem(bettingClosesAt);
    
    onAdd(marketId, marketTitle, side, amount, yesPool, noPool, bettingClosesAt);
    
    // Show warning if closing soon
    if (isClosingSoon && bettingClosesAt) {
      const timeUntilClose = (bettingClosesAt * 1000) - Date.now();
      toast.warning(
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Closes in {formatCountdown(timeUntilClose)}</span>
        </div>,
        {
          description: 'This market closes soon. Place your bet quickly!',
          duration: 5000,
        }
      );
    } else {
      toast.success(
        <div className="flex items-center justify-between gap-3">
          <span>Added ${amount} {side} bet</span>
          {onOpenSlip && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => {
                onOpenSlip();
                toast.dismiss();
              }}
            >
              <ShoppingCart className="w-3 h-3" />
              View Slip
            </Button>
          )}
        </div>
      );
    }
    setOpen(false);
  };

  if (variant === 'icon') {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={className}
            title="Add to bet slip"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2 cursor-pointer">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Add YES</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {PRESET_AMOUNTS.map((amount) => (
                  <DropdownMenuItem
                    key={amount}
                    onClick={() => handleAdd('YES', amount)}
                    className="cursor-pointer"
                  >
                    ${amount}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2 cursor-pointer">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span>Add NO</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {PRESET_AMOUNTS.map((amount) => (
                  <DropdownMenuItem
                    key={amount}
                    onClick={() => handleAdd('NO', amount)}
                    className="cursor-pointer"
                  >
                    ${amount}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={`gap-1 ${className}`}>
            <Plus className="w-3 h-3" />
            Slip
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2 cursor-pointer">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Add YES</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {PRESET_AMOUNTS.map((amount) => (
                  <DropdownMenuItem
                    key={amount}
                    onClick={() => handleAdd('YES', amount)}
                    className="cursor-pointer"
                  >
                    ${amount}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2 cursor-pointer">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span>Add NO</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {PRESET_AMOUNTS.map((amount) => (
                  <DropdownMenuItem
                    key={amount}
                    onClick={() => handleAdd('NO', amount)}
                    className="cursor-pointer"
                  >
                    ${amount}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Full variant
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`gap-2 ${className}`}>
          <Plus className="w-4 h-4" />
          Add to Slip
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2 cursor-pointer">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Add YES</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {PRESET_AMOUNTS.map((amount) => (
                <DropdownMenuItem
                  key={amount}
                  onClick={() => handleAdd('YES', amount)}
                  className="cursor-pointer"
                >
                  ${amount}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2 cursor-pointer">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span>Add NO</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {PRESET_AMOUNTS.map((amount) => (
                <DropdownMenuItem
                  key={amount}
                  onClick={() => handleAdd('NO', amount)}
                  className="cursor-pointer"
                >
                  ${amount}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
