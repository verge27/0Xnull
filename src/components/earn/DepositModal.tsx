import { useState, useCallback, useEffect, useRef } from 'react';
import { X, Check, Copy, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { requestDirectDeposit, fetchDirectDepositPending, type DirectDepositResponse } from '@/lib/earnApi';

interface DepositModalProps {
  asset: string;
  rate: number | undefined;
  token: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'input' | 'address' | 'waiting' | 'success' | 'error';

function formatEst(n: number): string {
  if (n < 0.0001) return '$0.00';
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

export function DepositModal({ asset, rate, token, onClose, onSuccess }: DepositModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [amount, setAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [depositInfo, setDepositInfo] = useState<DirectDepositResponse | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const amt = parseFloat(amount) || 0;
  const apy = rate ?? 0;

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const copyText = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (amt <= 0 || !token) return;
    setStep('address');
    try {
      const info = await requestDirectDeposit(asset, amount, token);
      setDepositInfo(info);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to get deposit address');
      setStep('error');
    }
  }, [amt, token, asset, amount]);

  const startWaiting = useCallback(() => {
    if (!token) return;
    setStep('waiting');
    pollRef.current = setInterval(async () => {
      try {
        const pending = await fetchDirectDepositPending(token);
        const match = pending.find((d) => d.asset === asset && d.status === 'confirmed');
        if (match) {
          if (pollRef.current) clearInterval(pollRef.current);
          setStep('success');
          onSuccess?.();
        }
      } catch {
        // ignore polling errors
      }
    }, 10_000);
  }, [token, asset, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md mx-4 bg-zinc-900 rounded-2xl border border-zinc-800 p-6" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">Deposit {asset} to Aave</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Step 1: Input */}
        {step === 'input' && (
          <div className="space-y-4">
            <div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-2xl text-right font-mono text-foreground focus:outline-none focus:border-emerald-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

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
              Send tokens from any Arbitrum wallet. Privacy is handled automatically.
            </p>

            <button
              disabled={amt <= 0}
              onClick={handleSubmit}
              className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${amt > 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}
            >
              Deposit {asset}
            </button>
          </div>
        )}

        {/* Step 2: Deposit Address */}
        {step === 'address' && depositInfo && (
          <div className="space-y-4">
            <p className="text-sm text-emerald-400 font-medium">
              Send exactly {amount} {asset} to this address from any Arbitrum wallet
            </p>

            {/* Deposit address */}
            <div className="border-l-2 border-emerald-500 bg-zinc-800/60 rounded-r-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-zinc-500 mb-1.5">Deposit Address</p>
                <code className="block text-sm text-emerald-300 font-mono break-all leading-relaxed">{depositInfo.deposit_address}</code>
              </div>
              <button
                onClick={() => copyText(depositInfo.deposit_address, 'address')}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-sm font-medium transition-colors"
              >
                {copied === 'address' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied === 'address' ? 'Copied!' : 'Copy Address'}
              </button>
            </div>

            {/* QR Code */}
            <div className="flex justify-center py-2">
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG value={depositInfo.deposit_address} size={140} />
              </div>
            </div>

            {/* Token contract & chain */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800/40 rounded-lg p-3">
                <p className="text-[10px] text-zinc-500 mb-1">Token Contract (verify in wallet)</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-zinc-300 font-mono truncate flex-1">{depositInfo.token_contract}</p>
                  <button onClick={() => copyText(depositInfo.token_contract, 'contract')} className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0">
                    {copied === 'contract' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="bg-zinc-800/40 rounded-lg p-3">
                <p className="text-[10px] text-zinc-500 mb-1">Chain</p>
                <p className="text-xs text-zinc-300">{depositInfo.chain}</p>
              </div>
            </div>

            {depositInfo.note && (
              <p className="text-[11px] text-zinc-500 leading-relaxed">{depositInfo.note}</p>
            )}

            <button
              onClick={startWaiting}
              className="w-full py-3 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              I've Sent the Tokens
            </button>
          </div>
        )}

        {/* Loading deposit address */}
        {step === 'address' && !depositInfo && (
          <div className="flex flex-col items-center py-10 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm text-zinc-400">Generating deposit address...</p>
          </div>
        )}

        {/* Step 3: Waiting for confirmation */}
        {step === 'waiting' && (
          <div className="flex flex-col items-center py-10 gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-lg text-foreground">Waiting for deposit...</p>
            <p className="text-sm text-zinc-400">Checking every 10 seconds for confirmation</p>
            <p className="text-xs text-zinc-500 mt-2">{amount} {asset} → Aave V3</p>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-xl text-foreground font-semibold">Deposit confirmed!</p>
            <p className="text-sm text-zinc-300 text-center">
              Your {amount} {asset} is now earning {(apy * 100).toFixed(2)}% APY on Aave V3.
            </p>
            <button onClick={onClose} className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-lg text-sm font-medium transition-colors mt-2">
              View Position
            </button>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-zinc-300 text-center">{errorMsg}</p>
            <button onClick={() => { setStep('input'); setErrorMsg(''); }} className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-lg text-sm font-medium transition-colors">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
