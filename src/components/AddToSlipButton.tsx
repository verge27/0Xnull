import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react';
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

interface AddToSlipButtonProps {
  marketId: string;
  marketTitle: string;
  onAdd: (marketId: string, title: string, side: 'YES' | 'NO', amount: number) => void;
  defaultAmount?: number;
  variant?: 'icon' | 'full' | 'compact';
  className?: string;
}

export function AddToSlipButton({
  marketId,
  marketTitle,
  onAdd,
  defaultAmount = 5,
  variant = 'icon',
  className = '',
}: AddToSlipButtonProps) {
  const [open, setOpen] = useState(false);

  const handleAdd = (side: 'YES' | 'NO', amount: number = defaultAmount) => {
    onAdd(marketId, marketTitle, side, amount);
    toast.success(`Added $${amount} ${side} bet to slip`);
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
