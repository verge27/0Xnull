import { useState, useEffect, useCallback } from 'react';
import { X, Check, ExternalLink } from 'lucide-react';
import type { PendlePosition } from '@/types/pendle';

type Step = 'input' | 'confirming' | 'success' | 'error';

interface PendleWithdrawModalProps {
  position: PendlePosition;
  txPending: boolean;
  onWithdraw: (positionId: string, userAddress: string) => Promise<{ tx_hash?: string; error?: string }>;
  onClose: () => void;
}

const EVM_RE = /^0x[0-9a-fA-F]{40}$/;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtAmount(n: number, token: string): string {
  const dec = ['USDC', 'USDT'].includes(token) ? 2 : ['WBTC'].includes(token) ? 6 : 4;
  return `${n.toFixed(dec)} ${token}`;
}

export function PendleWithdrawModal({ position, txPending, onWithdraw, onClose }: PendleWithdrawModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState('');

  const addrValid = EVM_RE.test(address);
  const matured = position.is_matured;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!addrValid) return;
    setStep('confirming');
    const res = await onWithdraw(position.id, address);
    if (res.error) {
      setErrorMsg(res.error);
      setStep('error');
    } else {
      setTxHash(res.tx_hash || '');
      setStep('success');
    }
  }, [addrValid, address, position.id, onWithdraw]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-zinc-800 p-6" onClick={(e) => e.stopPropagation()}>

        {/* ── INPUT ── */}
        {step === 'input' && (
          <>
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-semibold text-white">
                {matured ? `Redeem ${position.deposit_token} Position` : `Withdraw ${position.deposit_token} Early`}
              </h2>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>

            {/* Summary */}
            <div className="bg-zinc-800/50 rounded-lg p-4 mt-4 space-y-1 text-sm">
              <p className="text-white font-mono">Deposited: {fmtAmount(position.amount_deposited, position.deposit_token)}</p>
              <p className="text-emerald-400">Fixed rate: {position.fixed_apy_pct.toFixed(2)}%</p>
              <p className="text-zinc-400">
                Status: {matured ? 'Matured ✓' : `Active — matures ${fmtDate(position.expiry)}`}
              </p>
            </div>

            {/* Warning / success banner */}
            {matured ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mt-3">
                <p className="text-sm text-emerald-400 font-medium">✓ Position matured</p>
                <p className="text-sm text-emerald-300/80 mt-1">
                  Your PT redeems 1:1 for {position.deposit_token}. You'll receive {fmtAmount(position.amount_deposited, position.deposit_token)}.
                </p>
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mt-3">
                <p className="text-sm text-amber-400 font-medium">⚠ Early withdrawal</p>
                <p className="text-sm text-amber-300/80 mt-1">
                  Your PT will be sold on the Pendle AMM. The amount you receive may be less than your original deposit due to market conditions and slippage.
                </p>
                <p className="text-sm text-amber-300/80 mt-1">
                  Consider waiting until maturity ({fmtDate(position.expiry)}) for guaranteed 1:1 redemption.
                </p>
              </div>
            )}

            {/* Address */}
            <div className="mt-4">
              <label className="text-sm text-zinc-400">Withdrawal address (Arbitrum)</label>
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

            <button
              disabled={!addrValid}
              onClick={handleSubmit}
              className={`mt-4 w-full py-3 rounded-lg font-medium transition ${
                addrValid
                  ? matured
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {matured ? `Redeem ${fmtAmount(position.amount_deposited, position.deposit_token)}` : 'Withdraw Early'}
            </button>
          </>
        )}

        {/* ── CONFIRMING ── */}
        {step === 'confirming' && (
          <div className="flex flex-col items-center py-10">
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-lg text-white mt-4">{matured ? 'Redeeming position...' : 'Selling PT on market...'}</p>
            <p className="text-sm text-zinc-400">This may take a moment</p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-xl text-white mt-4">{matured ? 'Position redeemed' : 'Position withdrawn'}</p>
            {txHash && (
              <a
                href={`https://arbiscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 text-sm mt-2 flex items-center gap-1 transition"
              >
                View on Arbiscan <ExternalLink className="w-3.5 h-3.5" />
              </a>
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
