import { useState } from 'react';
import { X, Trash2, Minus, Plus, ShoppingCart, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { BetSlipItem } from '@/hooks/useMultibetSlip';

interface BetSlipPanelProps {
  items: BetSlipItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: (id: string) => void;
  onUpdateAmount: (id: string, amount: number) => void;
  onClear: () => void;
  totalUsd: number;
  onCheckout: (payoutAddress?: string) => Promise<any>;
  isCheckingOut: boolean;
}

export function BetSlipPanel({
  items,
  isOpen,
  onOpenChange,
  onRemove,
  onUpdateAmount,
  onClear,
  totalUsd,
  onCheckout,
  isCheckingOut,
}: BetSlipPanelProps) {
  const [payoutAddress, setPayoutAddress] = useState('');

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Add at least one bet to your slip');
      return;
    }

    // Validate each item
    for (const item of items) {
      if (item.amount < 0.5) {
        toast.error(`Minimum $0.50 per leg`);
        return;
      }
    }

    // Validate payout address if provided
    if (payoutAddress && (!payoutAddress.startsWith('4') && !payoutAddress.startsWith('8'))) {
      toast.error('Invalid Monero address');
      return;
    }

    try {
      const slip = await onCheckout(payoutAddress || undefined);
      if (slip) {
        toast.success('Multibet slip created!');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create multibet';
      toast.error(message);
    }
  };

  return (
    <>
      {/* Floating button when closed */}
      {!isOpen && items.length > 0 && (
        <Button
          onClick={() => onOpenChange(true)}
          className="fixed bottom-6 right-6 z-50 h-14 px-4 gap-2 shadow-lg"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-semibold">{items.length}</span>
          <Badge variant="secondary" className="ml-1">
            ${totalUsd.toFixed(2)}
          </Badge>
        </Button>
      )}

      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Bet Slip ({items.length})
              </span>
              {items.length > 0 && (
                <Button variant="ghost" size="sm" onClick={onClear}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Your bet slip is empty</p>
                <p className="text-sm">Add bets from any market</p>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-3 py-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-muted/50 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.marketTitle}
                          </p>
                          <Badge 
                            variant={item.side === 'YES' ? 'default' : 'destructive'}
                            className="mt-1"
                          >
                            {item.side}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => onRemove(item.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onUpdateAmount(item.id, item.amount - 1)}
                          disabled={item.amount <= 0.5}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.amount}
                          onChange={(e) => onUpdateAmount(item.id, parseFloat(e.target.value) || 0.5)}
                          className="h-8 w-20 text-center"
                          min={0.5}
                          step={0.5}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onUpdateAmount(item.id, item.amount + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground ml-auto">
                          ${item.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t pt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Payout Address (optional)
                  </label>
                  <Input
                    placeholder="Your Monero address (4... or 8...)"
                    value={payoutAddress}
                    onChange={(e) => setPayoutAddress(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You can add this later before claiming winnings
                  </p>
                </div>

                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${totalUsd.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}

          <SheetFooter className="mt-4">
            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={items.length === 0 || isCheckingOut}
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Slip...
                </>
              ) : (
                <>
                  Place {items.length} Bet{items.length !== 1 ? 's' : ''}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
