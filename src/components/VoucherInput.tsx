import { useState, useEffect, useCallback } from 'react';
import { Check, X, Loader2, Tag, Trash2, Percent } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { useVoucher, VoucherInfo } from '@/hooks/useVoucher';

interface VoucherInputProps {
  onVoucherValidated: (code: string | null) => void;
  className?: string;
  compact?: boolean;
}

interface VoucherState {
  code: string;
  isValid: boolean | null;
  isLoading: boolean;
  influencer: string | null;
  benefit: string | null;
  effectiveFee: string | null;
  error: string | null;
}

export function VoucherInput({ onVoucherValidated, className, compact = false }: VoucherInputProps) {
  const { voucher: savedVoucher, voucherInfo: savedInfo, saveVoucher, clearVoucher } = useVoucher();
  
  const [state, setState] = useState<VoucherState>(() => ({
    code: savedVoucher || '',
    isValid: savedVoucher && savedInfo ? true : null,
    isLoading: false,
    influencer: savedInfo?.influencer || null,
    benefit: savedInfo?.userBenefit || null,
    effectiveFee: savedInfo?.effectiveFee || null,
    error: null,
  }));

  // Sync with saved voucher on mount
  useEffect(() => {
    if (savedVoucher && savedInfo) {
      setState(s => ({
        ...s,
        code: savedVoucher,
        isValid: true,
        influencer: savedInfo.influencer,
        benefit: savedInfo.userBenefit,
        effectiveFee: savedInfo.effectiveFee,
      }));
      onVoucherValidated(savedVoucher);
    }
  }, [savedVoucher, savedInfo, onVoucherValidated]);

  const validateVoucher = useDebouncedCallback(async (code: string) => {
    if (!code || code.length < 4) {
      setState(s => ({
        ...s,
        isValid: null,
        isLoading: false,
        influencer: null,
        benefit: null,
        effectiveFee: null,
        error: null,
      }));
      onVoucherValidated(null);
      return;
    }

    setState(s => ({ ...s, isLoading: true, error: null }));

    try {
      const result = await api.validateVoucher(code.toUpperCase());

      if (result.valid) {
        const info: VoucherInfo = {
          code: result.code,
          influencer: result.influencer,
          userBenefit: result.user_benefit,
          effectiveFee: result.effective_fee,
          validatedAt: Date.now(),
        };
        
        setState(s => ({
          ...s,
          isValid: true,
          isLoading: false,
          influencer: result.influencer,
          benefit: result.user_benefit,
          effectiveFee: result.effective_fee,
          error: null,
        }));
        
        saveVoucher(code.toUpperCase(), info);
        onVoucherValidated(code.toUpperCase());
      } else {
        setState(s => ({
          ...s,
          isValid: false,
          isLoading: false,
          influencer: null,
          benefit: null,
          effectiveFee: null,
          error: 'Invalid voucher code',
        }));
        onVoucherValidated(null);
      }
    } catch {
      setState(s => ({
        ...s,
        isValid: false,
        isLoading: false,
        influencer: null,
        benefit: null,
        effectiveFee: null,
        error: 'Failed to validate',
      }));
      onVoucherValidated(null);
    }
  }, 500);

  const handleClear = useCallback(() => {
    setState({
      code: '',
      isValid: null,
      isLoading: false,
      influencer: null,
      benefit: null,
      effectiveFee: null,
      error: null,
    });
    clearVoucher();
    onVoucherValidated(null);
  }, [clearVoucher, onVoucherValidated]);

  // Compact display when valid voucher is applied
  if (compact && state.isValid) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge 
          variant="outline" 
          className="gap-1.5 px-2 py-1 font-mono text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
        >
          <Check className="w-3 h-3" />
          <span className="uppercase tracking-wider">{state.code}</span>
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={handleClear}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
        <Tag className="w-3.5 h-3.5" />
        Voucher Code <span className="text-xs opacity-70">(optional)</span>
      </label>
      
      <div className="relative">
        <Input
          type="text"
          placeholder="e.g. WH1T0XF4D8"
          value={state.code}
          onChange={(e) => {
            const code = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            setState(s => ({ ...s, code }));
            validateVoucher(code);
          }}
          className={cn(
            'font-mono uppercase tracking-wider pr-10 bg-background/50',
            'placeholder:normal-case placeholder:tracking-normal placeholder:font-sans',
            state.isValid === true && 'border-emerald-500/50 bg-emerald-500/5',
            state.isValid === false && 'border-destructive/50 bg-destructive/5'
          )}
          maxLength={20}
        />
        
        {/* Status Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {state.isLoading && (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          )}
          {state.isValid === true && !state.isLoading && (
            <Check className="w-4 h-4 text-emerald-500" />
          )}
          {state.isValid === false && !state.isLoading && (
            <X className="w-4 h-4 text-destructive" />
          )}
        </div>
      </div>

      {/* Success Message */}
      {state.isValid && state.influencer && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              {state.influencer}'s code applied
            </p>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
              {state.benefit}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-emerald-600/60 hover:text-destructive"
            onClick={handleClear}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Error Message */}
      {state.error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <X className="w-3 h-3" />
          {state.error}
        </p>
      )}
    </div>
  );
}

// Fee comparison display when voucher is applied
interface FeeComparisonProps {
  voucherApplied: boolean;
  className?: string;
}

export function FeeComparison({ voucherApplied, className }: FeeComparisonProps) {
  if (!voucherApplied) return null;

  return (
    <div className={cn(
      'flex items-center justify-center gap-2 py-2 px-3 rounded-lg',
      'bg-emerald-500/10 border border-emerald-500/20',
      className
    )}>
      <Percent className="w-3.5 h-3.5 text-emerald-500" />
      <span className="text-sm">
        <span className="line-through text-muted-foreground">0.4% fee</span>
        <span className="text-emerald-500 font-medium ml-2">0.333% fee</span>
        <span className="text-emerald-500/80 text-xs ml-1">(17% savings)</span>
      </span>
    </div>
  );
}
