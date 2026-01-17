import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { toast } from 'sonner';

const VOUCHER_KEY = '0xnull_voucher';
const VOUCHER_INFO_KEY = '0xnull_voucher_info';

export interface VoucherInfo {
  code: string;
  influencer: string;
  userBenefit: string;
  effectiveFee: string;
  validatedAt: number;
}

export interface VoucherState {
  code: string;
  isValid: boolean | null;
  isLoading: boolean;
  influencer: string | null;
  benefit: string | null;
  effectiveFee: string | null;
  error: string | null;
}

export function useVoucher() {
  const [voucher, setVoucher] = useState<string | null>(() => {
    try {
      return localStorage.getItem(VOUCHER_KEY);
    } catch {
      return null;
    }
  });

  const [voucherInfo, setVoucherInfo] = useState<VoucherInfo | null>(() => {
    try {
      const stored = localStorage.getItem(VOUCHER_INFO_KEY);
      if (stored) {
        const info = JSON.parse(stored);
        // Expire after 7 days
        if (info.validatedAt && Date.now() - info.validatedAt < 7 * 24 * 60 * 60 * 1000) {
          return info;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const saveVoucher = useCallback((code: string | null, info?: VoucherInfo | null) => {
    try {
      if (code) {
        localStorage.setItem(VOUCHER_KEY, code);
        if (info) {
          localStorage.setItem(VOUCHER_INFO_KEY, JSON.stringify(info));
          setVoucherInfo(info);
        }
      } else {
        localStorage.removeItem(VOUCHER_KEY);
        localStorage.removeItem(VOUCHER_INFO_KEY);
        setVoucherInfo(null);
      }
      setVoucher(code);
    } catch {
      // localStorage might be unavailable
    }
  }, []);

  const clearVoucher = useCallback(() => {
    try {
      localStorage.removeItem(VOUCHER_KEY);
      localStorage.removeItem(VOUCHER_INFO_KEY);
    } catch {
      // ignore
    }
    setVoucher(null);
    setVoucherInfo(null);
  }, []);

  const validateVoucher = useCallback(async (code: string): Promise<VoucherInfo | null> => {
    if (!code || code.length < 4) return null;

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
        return info;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Auto-validate stored voucher on mount
  useEffect(() => {
    if (voucher && !voucherInfo) {
      validateVoucher(voucher).then((info) => {
        if (info) {
          setVoucherInfo(info);
          try {
            localStorage.setItem(VOUCHER_INFO_KEY, JSON.stringify(info));
          } catch {
            // ignore
          }
        } else {
          // Voucher no longer valid, clear it
          clearVoucher();
        }
      });
    }
  }, [voucher, voucherInfo, validateVoucher, clearVoucher]);

  return {
    voucher,
    voucherInfo,
    saveVoucher,
    clearVoucher,
    validateVoucher,
  };
}

// Hook to read voucher from URL params
// Supports both ?voucher= and ?ref= parameters for flexibility
export function useVoucherFromUrl() {
  const { saveVoucher, validateVoucher, voucher: existingVoucher } = useVoucher();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Support both 'voucher' and 'ref' URL parameters
    const urlVoucher = params.get('voucher') || params.get('ref');
    const paramUsed = params.has('voucher') ? 'voucher' : params.has('ref') ? 'ref' : null;

    // Only process if we have a URL param and it's different from existing (or no existing)
    if (urlVoucher && urlVoucher.length >= 4) {
      const normalizedCode = urlVoucher.toUpperCase();
      
      // Skip if we already have this exact voucher saved
      if (existingVoucher?.toUpperCase() === normalizedCode) {
        // Still clean up URL
        if (paramUsed) {
          const newParams = new URLSearchParams(window.location.search);
          newParams.delete('voucher');
          newParams.delete('ref');
          const newUrl = newParams.toString() 
            ? `${window.location.pathname}?${newParams.toString()}`
            : window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
        return;
      }
      
      console.log('[useVoucherFromUrl] Capturing voucher from URL:', normalizedCode, 'param:', paramUsed);
      
      validateVoucher(urlVoucher).then((info) => {
        if (info) {
          saveVoucher(info.code, info);
          toast.success(`${info.influencer}'s code applied!`, {
            description: info.userBenefit,
          });
          console.log('[useVoucherFromUrl] Voucher validated and saved:', info.code);
        } else {
          console.log('[useVoucherFromUrl] Voucher validation failed:', normalizedCode);
        }
        
        // Remove voucher/ref param from URL without reload
        if (paramUsed) {
          const newParams = new URLSearchParams(window.location.search);
          newParams.delete('voucher');
          newParams.delete('ref');
          const newUrl = newParams.toString() 
            ? `${window.location.pathname}?${newParams.toString()}`
            : window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      });
    }
  }, [saveVoucher, validateVoucher, existingVoucher]);
}
