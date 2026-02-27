import { useState, useEffect, useCallback } from 'react';
import { X, Check, Copy } from 'lucide-react';
import type { PendleMarket, PendleComparison } from '@/types/pendle';

type Step = 'input' | 'confirming' | 'success' | 'error';

interface PendleDepositModalProps {
  market: PendleMarket;
  comparison: PendleComparison | undefined;
  txPending: boolean;
  onDeposit: (marketAddress: string, amount: number, userAddress: string) => Promise<{ deposit_address?: string; instructions?: string; error?: string }>;
  onClose: () => void;
}

const EVM_RE = /^0x[0-9a-fA-F]{40}$/;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

export function PendleDepositModal({ market, comparison, txPending, onDeposit, onClose }: PendleDepositModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [depositAddress, setDepositAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const amtNum = parseFloat(amount) || 0;
  const addrValid = EVM_RE.test(address);
  const days = daysUntil(market.expiry);
  const effectiveYield = amtNum > 0 ? amtNum * (market.fixed_apy_pct / 100) * (days / 365) : 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (amtNum <= 0 || !addrValid) return;
    setStep('confirming');
    const res = await onDeposit(market.market_address, amtNum, address);
    if (res.error) {
      setErrorMsg(res.error);
      setStep('error');
    } else {
      setDepositAddress(res.deposit_address || '');
      setInstructions(res.instructions || '');
      setStep('success');
    }
  }, [amtNum, addrValid, address, market.market_address, onDeposit]);

  const copyText = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-zinc-800 p-6" onClick={(e) => e.stopPropagation()}>

        {/* ── INPUT ── */}
        {step === 'input' && (
          <>
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-semibold text-white">
                Lock Fixed {market.fixed_apy_pct.toFixed(2)}% on {market.name}
              </h2>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>

            {/* Info banner */}
            <div className="bg-zinc-800/50 rounded-lg p-4 mt-4 space-y-1">
              <p className="text-sm text-zinc-300">
                You deposit {market.deposit_token}. You receive PT (Principal Tokens) that redeem 1:1 at maturity.
              </p>
              <p className="text-sm text-zinc-400">Maturity: {fmtDate(market.expiry)}</p>
              {comparison && (
                <p className="text-sm text-emerald-400">
                  Aave is currently paying {comparison.aave_variable_apy}% variable — this locks in {market.fixed_apy_pct.toFixed(2)}% fixed
                  {comparison.apy_difference > 0 && ` (+${comparison.apy_difference.toFixed(2)}% advantage)`}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="mt-4">
              <label className="text-sm text-zinc-400">Amount ({market.deposit_token})</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full bg-zinc-800 border border-zinc-700 focus:border-emerald-500 rounded-lg p-3 text-xl font-mono text-white text-right outline-none transition"
              />
            </div>

            {/* Wallet address */}
            <div className="mt-3">
              <label className="text-sm text-zinc-400">Your Arbitrum wallet address (for withdrawal)</label>
              <input
                type="text"
                placeholder="0x..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full bg-zinc-800 border border-zinc-700 focus:border-emerald-500 rounded-lg p-3 font-mono text-sm text-white outline-none transition"
              />
              {address.length > 0 && !addrValid && (
                <p className="text-xs text-red-400 mt-1">Must be a valid 0x address (42 characters)</p>
              )}
            </div>

            {/* Projected returns */}
            <div className="mt-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
              {amtNum > 0 ? (
                <div className="space-y-1 text-sm">
                  <p className="text-zinc-300">At maturity you receive: <span className="text-white font-mono">{amtNum.toFixed(2)} {market.deposit_token}</span></p>
                  <p className="text-zinc-300">Effective yield: <span className="text-white font-mono">{effectiveYield.toFixed(4)} {market.deposit_token}</span></p>
                  <p className="text-emerald-400 font-medium">Annualized: {market.fixed_apy_pct.toFixed(2)}% APY</p>
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">Enter an amount to see projected returns</p>
              )}
            </div>

            <p className="mt-3 text-xs text-zinc-600">
              Send {market.deposit_token} to the provided address on Arbitrum. Funds are deposited into Pendle to purchase PT. No KYC required.
            </p>

            <button
              disabled={amtNum <= 0 || !addrValid}
              onClick={handleSubmit}
              className={`mt-4 w-full py-3 rounded-lg font-medium transition ${
                amtNum > 0 && addrValid
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              Deposit {amtNum > 0 ? `${amtNum} ${market.deposit_token}` : market.deposit_token}
            </button>
          </>
        )}

        {/* ── CONFIRMING ── */}
        {step === 'confirming' && (
          <div className="flex flex-col items-center py-10">
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-lg text-white mt-4">Processing deposit...</p>
            <p className="text-sm text-zinc-400">Creating your fixed-yield position</p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-xl text-white mt-4">Deposit initiated</p>

            {instructions && (
              <div className="relative w-full mt-4 bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                <p className="font-mono text-sm text-zinc-300 pr-8">{instructions}</p>
                <button
                  onClick={() => copyText(depositAddress || instructions, 'instructions')}
                  className="absolute top-3 right-3 text-zinc-500 hover:text-white transition"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {copied === 'instructions' && <span className="absolute top-3 right-10 text-xs text-emerald-400">Copied</span>}
              </div>
            )}

            {depositAddress && (
              <div className="w-full mt-3">
                <p className="text-xs text-zinc-500">Send to:</p>
                <button
                  onClick={() => copyText(depositAddress, 'address')}
                  className="font-mono text-emerald-400 text-sm break-all text-left hover:text-emerald-300 transition"
                >
                  {depositAddress}
                  {copied === 'address' && <span className="ml-2 text-xs text-emerald-300">Copied</span>}
                </button>
              </div>
            )}

            <button onClick={onClose} className="mt-4 w-full bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg py-3 font-medium transition">
              Done
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === 'error' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500 rounded-full flex items-center justify-center">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-zinc-300 mt-4 text-center">{errorMsg}</p>
            <button
              onClick={() => setStep('input')}
              className="mt-4 w-full bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg py-3 font-medium transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
