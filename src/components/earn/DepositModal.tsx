import { useState, useCallback, useEffect, useRef } from 'react';
import { X, Check, Shield, Copy, Loader2 } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { requestDirectDeposit, fetchDirectDepositPending, type DirectDepositResponse, type DirectDepositPending } from '@/lib/earnApi';

interface DepositModalProps {
  asset: string;
  rate: number | undefined;
  shieldedBalance: string;
  txPending: boolean;
  token: string | null;
  onDeposit: (asset: string, amount: string) => Promise<{ tx_hash?: string; error?: string }>;
  onClose: () => void;
}

type Method = 'direct' | 'railgun';
type DirectStep = 'input' | 'address' | 'polling' | 'success' | 'error';
type RailgunStep = 'input' | 'confirming' | 'success' | 'error';

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

export function DepositModal({ asset, rate, shieldedBalance, txPending, token, onDeposit, onClose }: DepositModalProps) {
  const bal = parseFloat(shieldedBalance) || 0;
  const railgunEnabled = bal > 0;

  const [method, setMethod] = useState<Method>('direct');
  const [amount, setAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Direct deposit state
  const [directStep, setDirectStep] = useState<DirectStep>('input');
  const [depositInfo, setDepositInfo] = useState<DirectDepositResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Railgun deposit state
  const [railgunStep, setRailgunStep] = useState<RailgunStep>('input');
  const [txHash, setTxHash] = useState('');

  const amt = parseFloat(amount) || 0;
  const apy = rate ?? 0;

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const copyAddress = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // --- Direct Deposit handlers ---
  const handleDirectSubmit = useCallback(async () => {
    if (amt <= 0 || !token) return;
    setDirectStep('address');
    try {
      const info = await requestDirectDeposit(asset, amount, token);
      setDepositInfo(info);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to get deposit address');
      setDirectStep('error');
    }
  }, [amt, token, asset, amount]);

  const startPolling = useCallback(() => {
    if (!token) return;
    setDirectStep('polling');
    pollRef.current = setInterval(async () => {
      try {
        const pending = await fetchDirectDepositPending(token);
        const match = pending.find((d) => d.asset === asset && d.status === 'confirmed');
        if (match) {
          if (pollRef.current) clearInterval(pollRef.current);
          setDirectStep('success');
        }
      } catch {
        // ignore polling errors
      }
    }, 10_000);
  }, [token, asset]);

  // --- Railgun Deposit handlers ---
  const canSubmitRailgun = amt > 0 && amt <= bal && !txPending;

  const handleRailgunSubmit = useCallback(async () => {
    if (!canSubmitRailgun) return;
    setRailgunStep('confirming');
    const raw = toRawAmount(amount, asset);
    const res = await onDeposit(asset, raw);
    if (res.error) {
      setErrorMsg(res.error);
      setRailgunStep('error');
    } else {
      setTxHash(res.tx_hash || '');
      setRailgunStep('success');
    }
  }, [canSubmitRailgun, amount, asset, onDeposit]);

  const resetState = () => {
    setAmount('');
    setErrorMsg('');
    setDirectStep('input');
    setRailgunStep('input');
    setDepositInfo(null);
    setTxHash('');
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const switchMethod = (m: Method) => {
    if (m === 'railgun' && !railgunEnabled) return;
    resetState();
    setMethod(m);
  };

  // --- Shared APY info panel ---
  const apyPanel = (
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
  );

  const amountInput = (maxValue?: string) => (
    <div className="space-y-1">
      <div className="relative">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-2xl text-right font-mono text-foreground focus:outline-none focus:border-emerald-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {maxValue && parseFloat(maxValue) > 0 && (
          <button
            onClick={() => setAmount(maxValue)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded transition-colors"
          >
            Max
          </button>
        )}
      </div>
      {maxValue && <p className="text-xs text-zinc-400">Available: {maxValue} {asset}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md mx-4 bg-zinc-900 rounded-2xl border border-zinc-800 p-6" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Deposit {asset} to Aave</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Method Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => switchMethod('direct')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
              method === 'direct'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            Direct Deposit
          </button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => switchMethod('railgun')}
                  disabled={!railgunEnabled}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-1.5 ${
                    method === 'railgun'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                      : railgunEnabled
                        ? 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                        : 'border-zinc-800 bg-zinc-800/30 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Private (Railgun)
                </button>
              </TooltipTrigger>
              {!railgunEnabled && (
                <TooltipContent>
                  <p>Shield tokens via Railgun first to use private deposits</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* ============ DIRECT DEPOSIT FLOW ============ */}
        {method === 'direct' && (
          <>
            {directStep === 'input' && (
              <div className="space-y-4">
                {amountInput()}
                {apyPanel}
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Send ERC-20 tokens from your wallet (MetaMask, etc.) to a generated Arbitrum address.
                </p>
                <button
                  disabled={amt <= 0}
                  onClick={handleDirectSubmit}
                  className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${amt > 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}
                >
                  Get Deposit Address
                </button>
              </div>
            )}

            {directStep === 'address' && depositInfo && (
              <div className="space-y-4">
                <div className="border-l-2 border-emerald-500 bg-zinc-800/60 rounded-r-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Send {amount} {asset} to</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-emerald-300 font-mono break-all flex-1">{depositInfo.deposit_address}</code>
                      <button onClick={() => copyAddress(depositInfo.deposit_address)} className="text-zinc-400 hover:text-emerald-400 transition-colors flex-shrink-0">
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500">Token contract</span>
                      <p className="text-zinc-300 font-mono truncate">{depositInfo.token_contract}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Chain</span>
                      <p className="text-zinc-300">{depositInfo.chain}</p>
                    </div>
                  </div>
                  {depositInfo.note && (
                    <p className="text-[11px] text-zinc-500 leading-relaxed">{depositInfo.note}</p>
                  )}
                </div>
                <button
                  onClick={startPolling}
                  className="w-full py-3 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  I've Sent the Tokens
                </button>
              </div>
            )}

            {directStep === 'address' && !depositInfo && (
              <div className="flex flex-col items-center py-10 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-sm text-zinc-400">Generating deposit address...</p>
              </div>
            )}

            {directStep === 'polling' && (
              <div className="flex flex-col items-center py-10 gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-lg text-foreground">Waiting for deposit...</p>
                <p className="text-sm text-zinc-400">Polling every 10 seconds for confirmation</p>
              </div>
            )}

            {directStep === 'success' && (
              <div className="flex flex-col items-center py-8 gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center">
                  <Check className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-xl text-foreground font-semibold">Deposit confirmed</p>
                <p className="text-zinc-300 font-mono">{amount} {asset}</p>
                <button onClick={onClose} className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-lg text-sm font-medium transition-colors mt-2">
                  Done
                </button>
              </div>
            )}

            {directStep === 'error' && (
              <div className="flex flex-col items-center py-8 gap-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-zinc-300 text-center">{errorMsg}</p>
                <button onClick={() => { setDirectStep('input'); setErrorMsg(''); }} className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-lg text-sm font-medium transition-colors">
                  Try Again
                </button>
              </div>
            )}
          </>
        )}

        {/* ============ RAILGUN (PRIVATE) DEPOSIT FLOW ============ */}
        {method === 'railgun' && (
          <>
            {railgunStep === 'input' && (
              <div className="space-y-4">
                {!railgunEnabled && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-300">
                    You need to shield tokens via Railgun before using private deposits. Use the Shield tab on the main dashboard first.
                  </div>
                )}
                {amountInput(shieldedBalance)}
                {apyPanel}
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Assets are unshielded → deposited to Aave → aTokens re-shielded via Railgun
                </p>
                <button
                  disabled={!canSubmitRailgun}
                  onClick={handleRailgunSubmit}
                  className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${canSubmitRailgun ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}
                >
                  Deposit {asset} (Private)
                </button>
              </div>
            )}

            {railgunStep === 'confirming' && (
              <div className="flex flex-col items-center py-10 gap-4">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-lg text-foreground">Generating Railgun proof...</p>
                <p className="text-sm text-zinc-400">This may take 30–60 seconds</p>
              </div>
            )}

            {railgunStep === 'success' && (
              <div className="flex flex-col items-center py-8 gap-4">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 border-2 border-purple-500 flex items-center justify-center">
                  <Check className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-xl text-foreground font-semibold">Deposit submitted</p>
                <p className="text-zinc-300 font-mono">{amount} {asset}</p>
                {txHash && (
                  <a
                    href={`https://arbiscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-400 underline hover:text-purple-300"
                  >
                    View on Arbiscan
                  </a>
                )}
                <button onClick={onClose} className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-lg text-sm font-medium transition-colors mt-2">
                  Done
                </button>
              </div>
            )}

            {railgunStep === 'error' && (
              <div className="flex flex-col items-center py-8 gap-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-zinc-300 text-center">{errorMsg}</p>
                <button onClick={() => { setRailgunStep('input'); setErrorMsg(''); }} className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-lg text-sm font-medium transition-colors">
                  Try Again
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
