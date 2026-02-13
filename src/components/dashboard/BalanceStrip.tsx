import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Key, Copy, Check, Eye, EyeOff, LogOut, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface BalanceStripProps {
  token: string;
  balance: number;
  onFund: () => void;
  onLogout: () => void;
}

export const BalanceStrip = ({ token, balance, onFund, onLogout }: BalanceStripProps) => {
  const [showFull, setShowFull] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const truncated = `${token.slice(0, 8)}...${token.slice(-4)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    toast.success('Token copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    if (!showLogoutConfirm) {
      setShowLogoutConfirm(true);
      return;
    }
    onLogout();
  };

  return (
    <div className="p-4 rounded-lg bg-secondary/50 border border-border mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {/* Token display */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Key className="w-4 h-4 text-primary flex-shrink-0" />
          <code className="font-mono text-sm truncate">
            {showFull ? token : truncated}
          </code>
          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={handleCopy}>
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => setShowFull(!showFull)}>
            {showFull ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {/* Balance + actions */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-lg font-bold font-mono">${balance.toFixed(2)}</p>
          </div>
          <Button size="sm" onClick={onFund} className="gap-1">
            <Plus className="w-3.5 h-3.5" /> Fund
          </Button>
          {showLogoutConfirm ? (
            <div className="flex gap-1">
              <Button size="sm" variant="destructive" onClick={handleLogout} className="text-xs h-8">
                Confirm
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowLogoutConfirm(false)} className="text-xs h-8">
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={handleLogout} title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
      {showLogoutConfirm && (
        <p className="text-xs text-amber-400 mt-2">Make sure you've saved your token before logging out.</p>
      )}
    </div>
  );
};
