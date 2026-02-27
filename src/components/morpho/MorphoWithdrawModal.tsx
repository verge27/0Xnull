import { useState, useEffect, useCallback } from 'react';
import { X, Check, ExternalLink } from 'lucide-react';
import type { MorphoPosition } from '@/types/morpho';

type Step = 'input' | 'confirming' | 'success' | 'error';

interface MorphoWithdrawModalProps {
  position: MorphoPosition;
  txPending: boolean;
  onWithdraw: (asset: string, amount: number, vaultAddress?: string, destinationAddress?: string) => Promise<{ withdraw_tx?: string; status?: string; error?: string }>;
  onClose: () => void;
}

const EVM_RE = /^0x[0-9a-fA-F]{40}$/;

function fmtAmount(n: number, asset: string): string {
  const dec = ['USDC', 'USDT'].includes(asset) ? 2 : 4;
  return `${n.toFixed(dec)} ${asset}`;
}

export function MorphoWithdrawModal({ position, txPending, onWithdraw, onClose }: MorphoWithdrawModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState<'keep' | 'wallet'>('keep');
  const [walletAddress, setWalletAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState('');

  const amtNum = parseFloat(amount) || 0;
  const addrValid = destination === 'keep' || EVM_RE.test(walletAddress);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleMax = () => {
    setAmount(position.max_withdraw_human.toString());
  };

  const handleSubmit = useCallback(async () => {
    if (amtNum <= 0 || !addrValid) return;
    setStep('confirming');
    const destAddr = destination === 'wallet' ? walletAddress : undefined;
    const res = await onWithdraw(position.asset_symbol, amtNum, position.vault_address, destAddr);
    if (res.error) {
      setErrorMsg(res.error);
      setStep('error');
    } else {
      setTxHash(res.withdraw_tx || '');
      setTxStatus(res.status || 'success');
      setStep('success');
    }
  }, [amtNum, addrValid, destination, walletAddress, position, onWithdraw]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-zinc-800 p-6" onClick={(e) => e.stopPropagation()}>

        {/* ── INPUT ── */}
        {step === 'input' && (
          <>
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-semibold text-white">
                Withdraw {position.asset_symbol}
              </h2>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>

            {/* Summary */}
            <div className="bg-zinc-800/50 rounded-lg p-4 mt-4 space-y-1 text-sm">
              <p className="text-white">Vault: {position.vault_name}</p>
              <p className="text-zinc-400">Balance: <span className="text-white font-mono">{fmtAmount(position.assets_human, position.asset_symbol)}</span></p>
              <p className="text-zinc-400">Max withdraw: <span className="text-white font-mono">{fmtAmount(position.max_withdraw_human, position.asset_symbol)}</span></p>
            </div>

            {/* Amount */}
            <div className="mt-4">
              <label className="text-sm text-zinc-400">Amount ({position.asset_symbol})</label>
              <div className="relative mt-1">
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-emerald-500 rounded-lg p-3 pr-16 text-xl font-mono text-white text-right outline-none transition"
                />
                <button
                  onClick={handleMax}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded px-2 py-1 transition"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Destination toggle */}
            <div className="mt-4">
              <label className="text-sm text-zinc-400">Destination</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => setDestination('keep')}
                  className={`p-3 rounded-lg border text-sm transition ${
                    destination === 'keep'
                      ? 'border-emerald-500 bg-emerald-500/5 text-white'
                      : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  Keep in 0xNull
                </button>
                <button
                  onClick={() => setDestination('wallet')}
                  className={`p-3 rounded-lg border text-sm transition ${
                    destination === 'wallet'
                      ? 'border-emerald-500 bg-emerald-500/5 text-white'
                      : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  Send to wallet
                </button>
              </div>
            </div>

            {/* Wallet address */}
            {destination === 'wallet' && (
              <div className="mt-3">
                <label className="text-sm text-zinc-400">Wallet address (Arbitrum)</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="mt-1 w-full bg-zinc-800 border border-zinc-700 focus:border-emerald-500 rounded-lg p-3 font-mono text-sm text-white outline-none transition"
                />
                {walletAddress.length > 0 && !EVM_RE.test(walletAddress) && (
                  <p className="text-xs text-red-400 mt-1">Must be a valid 0x address (42 characters)</p>
                )}
              </div>
            )}

            <button
              disabled={amtNum <= 0 || !addrValid}
              onClick={handleSubmit}
              className={`mt-4 w-full py-3 rounded-lg font-medium transition ${
                amtNum > 0 && addrValid
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              Withdraw {amtNum > 0 ? `${amtNum} ${position.asset_symbol}` : position.asset_symbol}
            </button>
          </>
        )}

        {/* ── CONFIRMING ── */}
        {step === 'confirming' && (
          <div className="flex flex-col items-center py-10">
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-lg text-white mt-4">Processing withdrawal...</p>
            <p className="text-sm text-zinc-400">Withdrawing from Morpho vault</p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-xl text-white mt-4">
              {txStatus === 'partial' ? 'Partial success' : 'Withdrawal successful'}
            </p>
            {txStatus === 'partial' && (
              <p className="text-sm text-amber-400 mt-1 text-center">
                Tokens withdrawn from vault but payout to wallet failed. Contact support.
              </p>
            )}
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
