import { useState, useCallback } from 'react';
import { X, Check } from 'lucide-react';

interface DepositModalProps {
  asset: string;
  rate: number | undefined;
  shieldedBalance: string;
  txPending: boolean;
  onDeposit: (asset: string, amount: string) => Promise<{ tx_hash?: string; error?: string }>;
  onClose: () => void;
}

type Step = 'input' | 'confirming' | 'success' | 'error';

const DECIMALS: Record<string, number> = {
  USDC: 6,
  USDT: 6,
  WETH: 18,
  DAI: 18,
};

function toRawAmount(display: string, asset: string): string {
  const dec = DECIMALS[asset] ?? 18;
  const num = parseFloat(display);
  if (isNaN(num) || num <= 0) return '0';
  const parts = display.split('.');
  const whole = parts[0] || '0';
  const frac = (parts[1] || '').padEnd(dec, '0').slice(0, dec);
  return (whole + frac).replace(/^0+/, '') || '0';
}

function formatEst(n: number): string {
  if (n < 0.0001) return '$0.00';
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

export function DepositModal({ asset, rate, shieldedBalance, txPending, onDeposit, onClose }: DepositModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const bal = parseFloat(shieldedBalance) || 0;
  const amt = parseFloat(amount) || 0;
  const apy = rate ?? 0;
  const canSubmit = amt > 0 && amt <= bal && !txPending;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setStep('confirming');
    const raw = toRawAmount(amount, asset);
    const res = await onDeposit(asset, raw);
    if (res.error) {
      setErrorMsg(res.error);
      setStep('error');
    } else {
      setTxHash(res.tx_hash || '');
      setStep('success');
    }
  }, [canSubmit, amount, asset, onDeposit]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md mx-4 bg-zinc-900 rounded-2xl border border-zinc-800 p-6" onClick={(e) => e.stopPropagation()}>

        {step === 'input' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Deposit {asset} to Aave</h2>
              <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-2xl text-right font-mono text-foreground focus:outline-none focus:border-emerald-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => setAmount(shieldedBalance)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded transition-colors"
              >
                Max
              </button>
            </div>
            <p className="text-xs text-zinc-400">Available: {shieldedBalance} {asset}</p>

            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">APY</span>
                <span className="text-emerald-400 font-mono">{(apy * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Est. daily</span>
                <span className="text-zinc-300 font-mono">{formatEst(amt * apy / 365)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Est. monthly</span>
                <span className="text-zinc-300 font-mono">{formatEst(amt * apy / 12)}</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Assets are unshielded → deposited to Aave → aTokens re-shielded via Railgun
            </p>

            <button
              disabled={!canSubmit}
              onClick={handleSubmit}
              className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${canSubmit ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}
            >
              Deposit {asset}
            </button>
          </div>
        )}

        {step === 'confirming' && (
          <div className="flex flex-col items-center py-10 gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-lg text-foreground">Generating Railgun proof...</p>
            <p className="text-sm text-zinc-400">This may take 30–60 seconds</p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-xl text-foreground font-semibold">Deposit submitted</p>
            <p className="text-zinc-300 font-mono">{amount} {asset}</p>
            {txHash && (
              <a
                href={`https://arbiscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-emerald-400 underline hover:text-emerald-300"
              >
                View on Arbiscan
              </a>
            )}
            <button onClick={onClose} className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-lg text-sm font-medium transition-colors mt-2">
              Done
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-zinc-300 text-center">{errorMsg}</p>
            <button onClick={() => setStep('input')} className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-lg text-sm font-medium transition-colors">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
