import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ScanProgressProps {
  currentState: string | null;
  message: string | null;
}

const STAGES = [
  { key: 'LAUNCHING', label: 'Launching browser...', pct: 5 },
  { key: 'ENTRY', label: 'Navigating to target...', pct: 15 },
  { key: 'PRODUCT_DISCOVERY', label: 'Finding products...', pct: 30 },
  { key: 'ADD_TO_CART', label: 'Adding to cart...', pct: 45 },
  { key: 'NAVIGATE_CHECKOUT', label: 'Navigating checkout flow...', pct: 60 },
  { key: 'PAYMENT_PAGE', label: 'Analysing payment page...', pct: 80 },
  { key: 'ANALYSIS', label: 'Generating verdict...', pct: 92 },
];

const stateColor: Record<string, string> = {
  ENTRY: 'text-muted-foreground',
  PRODUCT_DISCOVERY: 'text-blue-400',
  ADD_TO_CART: 'text-blue-400',
  NAVIGATE_CHECKOUT: 'text-amber-400',
  PAYMENT_PAGE: 'text-emerald-400',
  ANALYSIS: 'text-purple-400',
  FAILED: 'text-destructive',
};

export const ScanProgress = ({ currentState, message }: ScanProgressProps) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const activeIdx = STAGES.findIndex((s) => s.key === currentState);
  const progress = activeIdx >= 0 ? STAGES[activeIdx].pct : 5;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Progress value={progress} className="h-2" />

      <div className="space-y-2">
        {STAGES.map((stage, i) => {
          const isActive = stage.key === currentState;
          const isDone = activeIdx > i;
          return (
            <div
              key={stage.key}
              className={`flex items-center gap-3 text-sm font-mono transition-opacity ${
                isDone ? 'opacity-50' : isActive ? 'opacity-100' : 'opacity-30'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : isActive ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
              <span>{stage.label}</span>
            </div>
          );
        })}
      </div>

      {message && (
        <p className={`text-sm font-mono ${stateColor[currentState || ''] || 'text-muted-foreground'}`}>
          [{currentState}] {message}
        </p>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Elapsed: {elapsed}s
      </p>
    </div>
  );
};
