import { useState, useEffect, useCallback } from 'react';
import { X, Check, Copy, ExternalLink } from 'lucide-react';
import type { MorphoVault } from '@/types/morpho';

type Step = 'input' | 'confirming' | 'success' | 'error';

interface MorphoDepositModalProps {
  vault: MorphoVault;
  allVaultsForAsset: MorphoVault[];
  txPending: boolean;
  onDeposit: (asset: string, amount: number, vaultAddress?: string) => Promise<{ tx_hash?: string; error?: string }>;
  onClose: () => void;
}

function formatTvl(tvl: number): string {
  if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(1)}M`;
  if (tvl >= 1_000) return `$${(tvl / 1_000).toFixed(1)}K`;
  return `$${tvl.toFixed(0)}`;
}

const CURATOR_COLORS: Record<string, string> = {
  steakhouse: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  gauntlet: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  hyperithm: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
};

function curatorBadge(curator: string): string {
  return CURATOR_COLORS[curator.toLowerCase()] || 'bg-zinc-700 text-zinc-300 border-zinc-700';
}

export function MorphoDepositModal({ vault, allVaultsForAsset, txPending, onDeposit, onClose }: MorphoDepositModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [amount, setAmount] = useState('');
  const [selectedVault, setSelectedVault] = useState(vault.address);
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState('');

  const amtNum = parseFloat(amount) || 0;
  const showVaultSelector = allVaultsForAsset.length > 1;
  const selected = allVaultsForAsset.find((v) => v.address === selectedVault) || vault;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (amtNum <= 0) return;
    setStep('confirming');
    const res = await onDeposit(vault.asset, amtNum, selectedVault);
    if (res.error) {
      setErrorMsg(res.error);
      setStep('error');
    } else {
      setTxHash(res.tx_hash || '');
      setStep('success');
    }
  }, [amtNum, vault.asset, selectedVault, onDeposit]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-zinc-800 p-6" onClick={(e) => e.stopPropagation()}>

        {/* ── INPUT ── */}
        {step === 'input' && (
          <>
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-semibold text-white">
                Deposit {vault.asset} → Morpho
              </h2>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>

            {/* Info */}
            <div className="bg-zinc-800/50 rounded-lg p-4 mt-4 space-y-1">
              <p className="text-sm text-zinc-300">
                Deposit {vault.asset} into a curated Morpho vault on Arbitrum.
              </p>
              <p className="text-sm text-zinc-400">
                Vault: <span className="text-white">{selected.name}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize border ${curatorBadge(selected.curator)}`}>
                  {selected.curator}
                </span>
                <span className="text-xs text-zinc-500">TVL: {formatTvl(selected.tvl_human)}</span>
              </div>
            </div>

            {/* Vault selector */}
            {showVaultSelector && (
              <div className="mt-4">
                <label className="text-sm text-zinc-400">Select Vault</label>
                <div className="mt-2 space-y-2">
                  {allVaultsForAsset.map((v) => (
                    <button
                      key={v.address}
                      onClick={() => setSelectedVault(v.address)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selectedVault === v.address
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white">{v.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] capitalize border ${curatorBadge(v.curator)}`}>
                          {v.curator}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 mt-1 block">TVL: {formatTvl(v.tvl_human)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="mt-4">
              <label className="text-sm text-zinc-400">Amount ({vault.asset})</label>
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

            <p className="mt-3 text-xs text-zinc-600">
              Amount is in human units (e.g. 100 = 100 {vault.asset}). The backend handles decimal conversion. Chain: Arbitrum.
            </p>

            <button
              disabled={amtNum <= 0}
              onClick={handleSubmit}
              className={`mt-4 w-full py-3 rounded-lg font-medium transition ${
                amtNum > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              Deposit {amtNum > 0 ? `${amtNum} ${vault.asset}` : vault.asset}
            </button>
          </>
        )}

        {/* ── CONFIRMING ── */}
        {step === 'confirming' && (
          <div className="flex flex-col items-center py-10">
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-lg text-white mt-4">Processing deposit...</p>
            <p className="text-sm text-zinc-400">Depositing into Morpho vault on Arbitrum</p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-xl text-white mt-4">Deposit successful</p>
            <p className="text-sm text-zinc-400 mt-1">{amtNum} {vault.asset} deposited into {selected.name}</p>
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
