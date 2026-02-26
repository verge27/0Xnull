import { useState, useCallback } from 'react';
import { X, Check, Wallet } from 'lucide-react';

interface WithdrawModalProps {
  asset: string;
  position: { balance_formatted: string; value_usd: number };
  txPending: boolean;
  onWithdraw: (asset: string, amount: string, destination: "reshield" | "wallet", walletAddress?: string) => Promise<{ tx_hash?: string; error?: string }>;
  onClose: () => void;
}

type Step = 'input' | 'confirming' | 'success' | 'error';
type Destination = 'reshield' | 'wallet';

const DECIMALS: Record<string, number> = { USDC: 6, USDT: 6, WETH: 18, DAI: 18 };

function toRawAmount(display: string, asset: string): string {
  const dec = DECIMALS[asset] ?? 18;
  const num = parseFloat(display);
  if (isNaN(num) || num <= 0) return '0';
  const parts = display.split('.');
  const whole = parts[0] || '0';
  const frac = (parts[1] || '').padEnd(dec, '0').slice(0, dec);
  return (whole + frac).replace(/^0+/, '') || '0';
}

const EVM_ADDR = /^0x[0-9a-fA-F]{40}$/;

export function WithdrawModal({ asset, position, txPending, onWithdraw, onClose }: WithdrawModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState<Destination>('wallet');
  const [walletAddress, setWalletAddress] = useState('');
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const bal = parseFloat(position.balance_formatted) || 0;
  const amt = parseFloat(amount) || 0;
  const addrValid = destination === 'reshield' || EVM_ADDR.test(walletAddress);
  const canSubmit = amt > 0 && amt <= bal && addrValid && !txPending;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setStep('confirming');
    const raw = toRawAmount(amount, asset);
    const res = await onWithdraw(asset, raw, destination, destination === 'wallet' ? walletAddress : undefined);
    if (res.error) {
      setErrorMsg(res.error);
      setStep('error');
    } else {
      setTxHash(res.tx_hash || '');
      setStep('success');
    }
  }, [canSubmit, amount, asset, destination, walletAddress, onWithdraw]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md mx-4 bg-zinc-900 rounded-2xl border border-zinc-800 p-6" onClick={(e) => e.stopPropagation()}>

        {step === 'input' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Withdraw {asset} from Aave</h2>
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
                onClick={() => setAmount(position.balance_formatted)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded transition-colors"
              >
                Max
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Earning: {position.balance_formatted} {asset} (~${position.value_usd.toFixed(2)})
            </p>

            {/* Withdrawal address */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Withdrawal Address (Arbitrum)</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <button
              disabled={!canSubmit}
              onClick={handleSubmit}
              className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${canSubmit ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}
            >
              Withdraw {asset}
            </button>
          </div>
        )}

        {step === 'confirming' && (
          <div className="flex flex-col items-center py-10 gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-lg text-foreground">Processing withdrawal...</p>
            <p className="text-sm text-zinc-400">This may take a moment</p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-xl text-foreground font-semibold">Withdrawal submitted</p>
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
