import { Progress } from '@/components/ui/progress';
import { Loader2, Eye, Clock, CheckCircle } from 'lucide-react';

interface PendingDeposit {
  deposit_id: string;
  asset: string;
  amount: string;
  status: string;
  confirmations?: number;
  confirmations_required?: number;
  txid?: string;
  seen_at?: string;
}

interface DepositStatusTrackerProps {
  deposit: PendingDeposit;
}

export const DepositStatusTracker = ({ deposit }: DepositStatusTrackerProps) => {
  const { status, confirmations, confirmations_required, txid } = deposit;
  const progress = confirmations && confirmations_required
    ? (confirmations / confirmations_required) * 100
    : 0;

  if (status === 'confirmed') {
    return (
      <div className="flex items-center gap-2 justify-center py-2">
        <CheckCircle className="w-5 h-5 text-green-400" />
        <span className="text-sm font-medium text-green-400">Deposit confirmed!</span>
      </div>
    );
  }

  if (status === 'confirming') {
    return (
      <div className="space-y-2 py-2">
        <div className="flex items-center gap-2 justify-center">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-muted-foreground">
            Confirming: {confirmations}/{confirmations_required} confirmations
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        {txid && (
          <p className="text-xs text-muted-foreground text-center font-mono">{txid.slice(0, 20)}...</p>
        )}
      </div>
    );
  }

  if (status === 'seen') {
    return (
      <div className="space-y-1 py-2">
        <div className="flex items-center gap-2 justify-center">
          <Eye className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">Transaction detected!</span>
        </div>
        {txid && (
          <p className="text-xs text-muted-foreground text-center font-mono">{txid.slice(0, 20)}...</p>
        )}
        <p className="text-xs text-muted-foreground text-center">Waiting for confirmations...</p>
      </div>
    );
  }

  // Default: awaiting_deposit / pending
  return (
    <div className="flex items-center gap-2 justify-center py-2">
      <Loader2 className="w-4 h-4 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Waiting for transaction...</span>
    </div>
  );
};
