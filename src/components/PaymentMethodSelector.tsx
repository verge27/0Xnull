import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Wallet, CreditCard, ArrowRightLeft, Lock } from 'lucide-react';

export type PaymentMethod = 'direct_xmr' | 'trocador' | 'wallet_balance';

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  walletBalance?: number;
  totalXmr: number;
  disabled?: boolean;
}

export function PaymentMethodSelector({
  selected,
  onChange,
  walletBalance = 0,
  totalXmr,
  disabled = false
}: PaymentMethodSelectorProps) {
  const hasEnoughBalance = walletBalance >= totalXmr;

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Payment Method</Label>
      <RadioGroup
        value={selected}
        onValueChange={(v) => onChange(v as PaymentMethod)}
        disabled={disabled}
        className="space-y-2"
      >
        {/* Direct XMR */}
        <Card className={`cursor-pointer transition-colors ${selected === 'direct_xmr' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <RadioGroupItem value="direct_xmr" id="direct_xmr" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="direct_xmr" className="flex items-center gap-2 cursor-pointer font-medium">
                  <Wallet className="w-4 h-4 text-primary" />
                  Direct XMR Payment
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Send XMR directly to the seller's address. Fastest and most private option.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trocador AnonPay */}
        <Card className={`cursor-pointer transition-colors ${selected === 'trocador' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <RadioGroupItem value="trocador" id="trocador" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="trocador" className="flex items-center gap-2 cursor-pointer font-medium">
                  <ArrowRightLeft className="w-4 h-4 text-primary" />
                  Any Crypto via Trocador
                  <Badge variant="secondary" className="text-xs">Multi-coin</Badge>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Pay with BTC, ETH, or 200+ other cryptocurrencies. Automatically swapped to XMR.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Balance (Future) */}
        <Card className={`cursor-pointer transition-colors opacity-50 ${selected === 'wallet_balance' ? 'border-primary bg-primary/5' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <RadioGroupItem value="wallet_balance" id="wallet_balance" className="mt-1" disabled />
              <div className="flex-1">
                <Label htmlFor="wallet_balance" className="flex items-center gap-2 cursor-not-allowed font-medium">
                  <CreditCard className="w-4 h-4" />
                  Wallet Balance
                  <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                  <Lock className="w-3 h-3 text-muted-foreground" />
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Use your deposited XMR balance for instant checkout.
                  {walletBalance > 0 && (
                    <span className="block mt-1">
                      Current balance: {walletBalance.toFixed(6)} XMR
                      {!hasEnoughBalance && <span className="text-destructive"> (insufficient)</span>}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </RadioGroup>
    </div>
  );
}
