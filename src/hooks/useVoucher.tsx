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
export function useVoucherFromUrl() {
  const { saveVoucher, validateVoucher } = useVoucher();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlVoucher = params.get('voucher');

    if (urlVoucher && urlVoucher.length >= 4) {
      validateVoucher(urlVoucher).then((info) => {
        if (info) {
          saveVoucher(info.code, info);
          toast.success(`${info.influencer}'s code applied!`, {
            description: info.userBenefit,
          });
          
          // Remove voucher param from URL without reload
          const newParams = new URLSearchParams(window.location.search);
          newParams.delete('voucher');
          const newUrl = newParams.toString() 
            ? `${window.location.pathname}?${newParams.toString()}`
            : window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      });
    }
  }, [saveVoucher, validateVoucher]);
}
