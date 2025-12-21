import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Trash2, Minus, Plus, ShoppingCart, ArrowRight, Loader2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { BetSlipItem } from '@/hooks/useMultibetSlip';

interface BetSlipPanelProps {
  items: BetSlipItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: (id: string) => void;
  onUpdateAmount: (id: string, amount: number) => void;
  onClear: () => void;
  onReorder: (items: BetSlipItem[]) => void;
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
  onReorder,
  totalUsd,
  onCheckout,
  isCheckingOut,
}: BetSlipPanelProps) {
  const [payoutAddress, setPayoutAddress] = useState('');
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    if (e.currentTarget instanceof HTMLElement) {
      dragNodeRef.current = e.currentTarget as HTMLDivElement;
      setTimeout(() => {
        if (dragNodeRef.current) {
          dragNodeRef.current.style.opacity = '0.5';
        }
      }, 0);
    }
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);
    onReorder(newItems);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleClearClick = () => {
    setShowClearDialog(true);
  };

  const handleConfirmClear = () => {
    onClear();
    setShowClearDialog(false);
    toast.info('Bet slip cleared');
  };

  const handleCheckout = useCallback(async () => {
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
  }, [items, payoutAddress, onCheckout]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape') {
        onOpenChange(false);
        return;
      }

      // Ctrl/Cmd + Enter to checkout
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && items.length > 0 && !isCheckingOut) {
        e.preventDefault();
        handleCheckout();
        return;
      }

      // Ctrl/Cmd + Backspace to clear (with confirmation)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Backspace' && items.length > 0) {
        e.preventDefault();
        setShowClearDialog(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items.length, isCheckingOut, handleCheckout, onOpenChange, onClear]);

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
                <Button variant="ghost" size="sm" onClick={handleClearClick}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>

          {/* Clear Confirmation Dialog */}
          <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Bet Slip?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all {items.length} bet{items.length !== 1 ? 's' : ''} from your slip. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`bg-muted/50 rounded-lg p-3 space-y-2 cursor-grab active:cursor-grabbing transition-all ${
                        dragOverIndex === index ? 'border-2 border-primary border-dashed' : 'border-2 border-transparent'
                      } ${draggedIndex === index ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
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

          <SheetFooter className="mt-4 space-y-2">
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
            <p className="text-xs text-muted-foreground text-center">
              <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">⌘</kbd>+<kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">↵</kbd> to checkout • <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> to close
            </p>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
