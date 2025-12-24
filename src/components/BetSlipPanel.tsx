import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Trash2, Minus, Plus, ShoppingCart, ArrowRight, Loader2, GripVertical, Undo2, TrendingUp, Timer, Eye, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
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
import { playErrorSound } from '@/lib/sounds';
import { validateBetSlip, isBettingClosedError } from '@/hooks/useMarketStatus';
import { useBetSlipValidation, formatCountdown } from '@/hooks/useBetSlipValidation';
import { VoucherInput, FeeComparison } from '@/components/VoucherInput';

// Bet slip expires 60 minutes after deposit address is created
const EXPIRY_MINUTES = 60;

interface ActiveSlip {
  slip_id: string;
  status: string;
  xmr_address?: string;
  total_amount_xmr?: number;
  created_at?: number;
}

interface BetSlipPanelProps {
  items: BetSlipItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: (id: string) => void;
  onUpdateAmount: (id: string, amount: number) => void;
  onClear: () => void;
  onReorder: (items: BetSlipItem[]) => void;
  onUndo: () => void;
  lastRemoved: { item: BetSlipItem; index: number } | null;
  totalUsd: number;
  calculatePotentialPayout: (item: BetSlipItem) => number;
  calculateTotalPotentialPayout: () => number;
  onCheckout: (payoutAddress?: string, voucherCode?: string) => Promise<any>;
  isCheckingOut: boolean;
  activeSlip?: ActiveSlip | null;
  onViewActiveSlip?: () => void;
  awaitingDepositCount?: number;
  onCheckResolvedMarkets?: () => Promise<void>;
  initialVoucherCode?: string | null;
}

export function BetSlipPanel({
  items,
  isOpen,
  onOpenChange,
  onRemove,
  onUpdateAmount,
  onClear,
  onReorder,
  onUndo,
  lastRemoved,
  totalUsd,
  calculatePotentialPayout,
  calculateTotalPotentialPayout,
  onCheckout,
  isCheckingOut,
  activeSlip,
  onViewActiveSlip,
  awaitingDepositCount = 0,
  onCheckResolvedMarkets,
  initialVoucherCode,
}: BetSlipPanelProps) {
  const [payoutAddress, setPayoutAddress] = useState('');
  const [voucherCode, setVoucherCode] = useState<string | null>(initialVoucherCode || null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(EXPIRY_MINUTES * 60);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);
  const hasExpiredRef = useRef(false);
  const hasCheckedMarketsRef = useRef(false);

  // Use the bet slip validation hook for continuous validation
  const {
    validCount,
    invalidCount,
    closingSoonCount,
    closingSoonItems,
    closedItems,
    removeAllClosed,
    isClosingSoon,
    isClosed,
    getTimeUntilClose,
    validate,
  } = useBetSlipValidation({
    items,
    onRemoveItem: onRemove,
    isOpen,
    enabled: true,
  });

  // Check for resolved markets when panel opens
  useEffect(() => {
    if (isOpen && items.length > 0 && onCheckResolvedMarkets && !hasCheckedMarketsRef.current) {
      hasCheckedMarketsRef.current = true;
      onCheckResolvedMarkets();
    }
    if (!isOpen) {
      hasCheckedMarketsRef.current = false;
    }
  }, [isOpen, items.length, onCheckResolvedMarkets]);

  const potentialPayout = calculateTotalPotentialPayout();
  const potentialProfit = potentialPayout - totalUsd;

  // Check if there's an active slip awaiting deposit to show countdown
  const hasActiveAwaitingSlip = activeSlip && activeSlip.status === 'awaiting_deposit';

  const toMs = (value: unknown): number | null => {
    if (value == null) return null;
    const n = typeof value === 'string' ? Number(value) : (value as number);
    if (typeof n !== 'number' || !Number.isFinite(n)) return null;
    // seconds -> ms
    if (n > 0 && n < 1_000_000_000_000) return n * 1000;
    return n;
  };

  const slipCreatedAtMs = toMs(activeSlip?.created_at);

  // Update countdown timer - only when there's an active slip awaiting deposit
  useEffect(() => {
    if (!hasActiveAwaitingSlip || !slipCreatedAtMs) {
      setTimeLeft(EXPIRY_MINUTES * 60);
      hasExpiredRef.current = false;
      return;
    }

    const expiresAt = slipCreatedAtMs + EXPIRY_MINUTES * 60 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(remaining);

      // Auto-clear when expired
      if (remaining === 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        playErrorSound();
        toast.error('Bet slip expired! Clearing slip...', {
          description: 'Your deposit window has ended. Please create a new bet slip.',
          duration: 5000,
        });
        onClear();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [hasActiveAwaitingSlip, slipCreatedAtMs, onClear]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpiringSoon = timeLeft < 300; // Less than 5 minutes

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

  const handleRemove = (id: string) => {
    const item = items.find(i => i.id === id);
    onRemove(id);
    if (item) {
      toast('Bet removed', {
        action: {
          label: 'Undo',
          onClick: onUndo,
        },
        duration: 5000,
      });
    }
  };

  const isValidPayoutAddress = payoutAddress.trim().length > 0 && 
    (payoutAddress.startsWith('4') || payoutAddress.startsWith('8'));

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

    // Pre-flight validation: Check if any markets are closed
    const validation = validateBetSlip(
      items.map(item => ({
        marketId: item.marketId,
        marketTitle: item.marketTitle,
        bettingClosesAt: item.bettingClosesAt,
        bettingOpen: item.bettingOpen,
        resolved: item.resolved,
        outcome: item.outcome,
      }))
    );

    if (!validation.valid) {
      playErrorSound();
      toast.error('Some markets are now closed', {
        description: validation.errors.slice(0, 3).join('\n') + (validation.errors.length > 3 ? `\n...and ${validation.errors.length - 3} more` : ''),
      });
      // Remove closed legs from slip
      for (const closedId of validation.closedMarketIds) {
        const closedItem = items.find(i => i.marketId === closedId);
        if (closedItem) {
          onRemove(closedItem.id);
        }
      }
      return;
    }

    // Validate payout address is required
    if (!payoutAddress.trim()) {
      toast.error('Payout address is required');
      return;
    }

    if (!payoutAddress.startsWith('4') && !payoutAddress.startsWith('8')) {
      toast.error('Invalid Monero address - must start with 4 or 8');
      return;
    }

    try {
      const slip = await onCheckout(payoutAddress || undefined, voucherCode || undefined);
      if (slip) {
        toast.success('Multibet slip created!');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create multibet';
      // Handle betting closed errors from backend
      if (isBettingClosedError(error)) {
        playErrorSound();
        toast.error('Some markets have closed', {
          description: 'One or more matches have started. Refreshing...',
        });
        // Trigger a refresh via the onCheckResolvedMarkets callback if available
        if (onCheckResolvedMarkets) {
          await onCheckResolvedMarkets();
        }
      } else {
        toast.error(message);
      }
    }
  }, [items, payoutAddress, voucherCode, onCheckout, onRemove, onCheckResolvedMarkets]);

  // Calculate individual odds for display
  const getOddsDisplay = (item: BetSlipItem): string => {
    const totalPool = item.yesPool + item.noPool + item.amount;
    const winningPool = item.side === 'YES' 
      ? item.yesPool + item.amount 
      : item.noPool + item.amount;
    
    if (winningPool === 0 || totalPool === 0) return '2.00x';
    
    const multiplier = totalPool / winningPool;
    return `${multiplier.toFixed(2)}x`;
  };

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

      // Ctrl/Cmd + Z to undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && lastRemoved) {
        e.preventDefault();
        onUndo();
        toast.success('Bet restored');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items.length, isCheckingOut, handleCheckout, onOpenChange, onClear, lastRemoved, onUndo]);

  const hasAwaitingDeposit = activeSlip && activeSlip.status === 'awaiting_deposit';

  return (
    <>
      {/* Floating buttons when closed */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
          {/* View Active Slip button - shown when there's an awaiting deposit */}
          {hasAwaitingDeposit && onViewActiveSlip && (
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
                {slipCreatedAtMs ? formatTime(timeLeft) : 'View Slip'}
              </span>
              {awaitingDepositCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                  {awaitingDepositCount}
                </span>
              )}
            </Button>
          )}
          
          {/* Regular bet slip button */}
          {items.length > 0 && (
            <Button
              onClick={() => onOpenChange(true)}
              className="h-14 px-4 gap-2 shadow-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-semibold">{items.length}</span>
              <Badge variant="secondary" className="ml-1">
                ${totalUsd.toFixed(2)}
              </Badge>
            </Button>
          )}
        </div>
      )}

      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Bet Slip ({items.length})
              </span>
              <div className="flex items-center gap-1">
                {lastRemoved && (
                  <Button variant="ghost" size="sm" onClick={() => { onUndo(); toast.success('Bet restored'); }}>
                    <Undo2 className="w-4 h-4 mr-1" />
                    Undo
                  </Button>
                )}
                {items.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClearClick}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </SheetTitle>
            
            {/* Validation Status Indicator */}
            {items.length > 0 && (invalidCount > 0 || closingSoonCount > 0) && (
              <div className="flex items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-2 text-xs">
                  {invalidCount > 0 ? (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="w-3 h-3" />
                      {validCount}/{items.length} valid
                    </Badge>
                  ) : (
                    <Badge variant="default" className="gap-1 bg-emerald-600">
                      <CheckCircle className="w-3 h-3" />
                      All valid
                    </Badge>
                  )}
                  {closingSoonCount > 0 && invalidCount === 0 && (
                    <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-500">
                      <Clock className="w-3 h-3 animate-pulse" />
                      {closingSoonCount} closing soon
                    </Badge>
                  )}
                </div>
                {invalidCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={removeAllClosed}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remove {invalidCount}
                  </Button>
                )}
              </div>
            )}
            
            {/* Expiry Timer - only show when there's an active slip awaiting deposit with valid created_at */}
            {hasActiveAwaitingSlip && slipCreatedAtMs && (
              <div className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium mt-2 ${
                isExpiringSoon
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 animate-pulse'
                  : 'bg-muted text-muted-foreground'
              }`}>
                <Timer className="w-3 h-3" />
                <span>Slip expires in {formatTime(timeLeft)}</span>
              </div>
            )}
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
                  {items.map((item, index) => {
                    const itemPayout = calculatePotentialPayout(item);
                    const itemOdds = getOddsDisplay(item);
                    const itemIsClosed = isClosed(item);
                    const itemIsClosingSoon = isClosingSoon(item);
                    const timeUntilClose = getTimeUntilClose(item);
                    
                    return (
                      <div
                        key={item.id}
                        draggable={!itemIsClosed}
                        onDragStart={(e) => !itemIsClosed && handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`rounded-lg p-3 space-y-2 transition-all ${
                          itemIsClosed 
                            ? 'bg-destructive/10 border-2 border-destructive/30 opacity-70' 
                            : itemIsClosingSoon
                              ? 'bg-amber-500/10 border-2 border-amber-500/30'
                              : 'bg-muted/50 border-2 border-transparent cursor-grab active:cursor-grabbing'
                        } ${dragOverIndex === index ? 'border-primary border-dashed' : ''} ${draggedIndex === index ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {!itemIsClosed && <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />}
                            {itemIsClosed && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${itemIsClosed ? 'line-through text-muted-foreground' : ''}`}>
                                {item.marketTitle}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge 
                                  variant={item.side === 'YES' ? 'default' : 'destructive'}
                                >
                                  {item.side}
                                </Badge>
                                <span className="text-xs text-muted-foreground font-mono">
                                  {itemOdds}
                                </span>
                                {/* Closed indicator */}
                                {itemIsClosed && (
                                  <Badge variant="destructive" className="text-[10px] py-0 h-4">
                                    CLOSED
                                  </Badge>
                                )}
                                {/* Closing soon indicator with countdown */}
                                {itemIsClosingSoon && !itemIsClosed && timeUntilClose && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-[10px] py-0 h-4 border-amber-500/50 text-amber-500 animate-pulse gap-1"
                                  >
                                    <Clock className="w-2.5 h-2.5" />
                                    {formatCountdown(timeUntilClose)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => handleRemove(item.id)}
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
                          <div className="ml-auto text-right">
                            <span className="text-sm text-muted-foreground">
                              ${item.amount.toFixed(2)}
                            </span>
                            <p className="text-xs text-green-500">
                              → ${itemPayout.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="border-t pt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Payout Address <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Your Monero address (4... or 8...)"
                    value={payoutAddress}
                    onChange={(e) => setPayoutAddress(e.target.value)}
                    className={!isValidPayoutAddress && payoutAddress.length > 0 ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Required to receive your winnings
                  </p>
                </div>

                {/* Voucher Input */}
                <VoucherInput 
                  onVoucherValidated={setVoucherCode}
                  compact={false}
                />

                {/* Fee Comparison */}
                <FeeComparison voucherApplied={!!voucherCode} />

                {/* Summary Section */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Stake</span>
                    <span className="font-medium">${totalUsd.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Potential Payout</span>
                    <span className="font-medium text-green-500">${potentialPayout.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm border-t pt-2">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Potential Profit
                    </span>
                    <span className="font-semibold text-green-500">+${potentialProfit.toFixed(2)}</span>
                  </div>
                  {items.length > 1 && (
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      Combined odds: {(potentialPayout / totalUsd).toFixed(2)}x
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <SheetFooter className="mt-4 space-y-2">
            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={items.length === 0 || isCheckingOut || !isValidPayoutAddress}
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Slip...
                </>
              ) : (
                <>
                  Place {items.length} Bet{items.length !== 1 ? 's' : ''} - Win ${potentialPayout.toFixed(2)}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            {isCheckingOut && (
              <p className="text-xs text-amber-500 text-center animate-pulse">
                This may take up to 90 seconds while we create your wallet...
              </p>
            )}
            <p className="text-xs text-muted-foreground text-center">
              <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">⌘</kbd>+<kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">↵</kbd> checkout • <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">⌘</kbd>+<kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Z</kbd> undo • <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> close
            </p>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
