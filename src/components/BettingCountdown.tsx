import { useState, useEffect } from 'react';
import { Clock, Lock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BettingCountdownProps {
  bettingClosesAt?: number;
  bettingOpen?: boolean;
  resolutionTime?: number;
  commenceTime?: number;  // Match start time - betting should close when match starts
  variant?: 'badge' | 'inline' | 'full';
  onBettingClosed?: () => void;
}

export function BettingCountdown({ 
  bettingClosesAt, 
  bettingOpen,
  resolutionTime,
  commenceTime,
  variant = 'inline',
  onBettingClosed
}: BettingCountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isClosed, setIsClosed] = useState(false);
  const [isClosingSoon, setIsClosingSoon] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      // Priority: betting_closes_at > commence_time > resolution_time
      const closes = bettingClosesAt || commenceTime || resolutionTime || 0;
      const diff = closes - now;
      
      // Check if betting is already marked as closed by the API
      if (bettingOpen === false) {
        setIsClosed(true);
        setTimeLeft('Betting Closed');
        return;
      }
      
      if (diff <= 0) {
        setIsClosed(true);
        setTimeLeft('Betting Closed');
        if (onBettingClosed) onBettingClosed();
      } else if (diff < 300) { // Less than 5 minutes
        setIsClosingSoon(true);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        setTimeLeft(`${mins}m ${secs}s`);
      } else if (diff < 3600) { // Less than 1 hour
        setIsClosingSoon(true);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        setTimeLeft(`${mins}m ${secs}s`);
      } else if (diff < 86400) { // Less than 24 hours
        setIsClosingSoon(diff < 7200); // Closing soon if less than 2 hours
        const hours = Math.floor(diff / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        setTimeLeft(`${hours}h ${mins}m`);
      } else {
        const days = Math.floor(diff / 86400);
        const hours = Math.floor((diff % 86400) / 3600);
        setTimeLeft(`${days}d ${hours}h`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [bettingClosesAt, bettingOpen, resolutionTime, commenceTime, onBettingClosed]);

  if (variant === 'badge') {
    if (isClosed) {
      return (
        <Badge className="bg-zinc-700 text-zinc-300">
          <Lock className="w-3 h-3 mr-1" />
          CLOSED
        </Badge>
      );
    }
    if (isClosingSoon) {
      return (
        <Badge className="bg-amber-600 text-white animate-pulse">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {timeLeft}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-border/50">
        <Clock className="w-3 h-3 mr-1" />
        {timeLeft}
      </Badge>
    );
  }

  if (variant === 'full') {
    if (isClosed) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
          <Lock className="w-5 h-5 text-zinc-400" />
          <div>
            <div className="font-medium text-zinc-300">Betting Closed</div>
            <div className="text-xs text-zinc-500">Match in progress or completed</div>
          </div>
        </div>
      );
    }

    const closesDate = new Date((bettingClosesAt || resolutionTime || 0) * 1000);
    const formatted = closesDate.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    return (
      <div className={`flex items-center gap-2 p-3 rounded-lg ${
        isClosingSoon 
          ? 'bg-amber-900/30 border border-amber-600/50' 
          : 'bg-primary/10 border border-primary/30'
      }`}>
        <Clock className={`w-5 h-5 ${isClosingSoon ? 'text-amber-400' : 'text-primary'}`} />
        <div>
          <div className={`font-medium ${isClosingSoon ? 'text-amber-400' : 'text-primary'}`}>
            Betting closes in {timeLeft}
          </div>
          <div className="text-xs text-muted-foreground">{formatted}</div>
        </div>
      </div>
    );
  }

  // Inline variant
  if (isClosed) {
    return (
      <span className="flex items-center gap-1 text-zinc-400">
        <Lock className="w-3 h-3" />
        <span>Betting Closed</span>
      </span>
    );
  }

  return (
    <span className={`flex items-center gap-1 ${isClosingSoon ? 'text-amber-400' : 'text-muted-foreground'}`}>
      <Clock className="w-3 h-3" />
      <span>Closes in {timeLeft}</span>
    </span>
  );
}

// Helper to format betting closes datetime
export function formatBettingClosesAt(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

// Helper to check if betting is open
export function isBettingOpen(market: { betting_open?: boolean; betting_closes_at?: number; resolution_time?: number; commence_time?: number }): boolean {
  // If API provides betting_open, use it (most reliable)
  if (typeof market.betting_open === 'boolean') {
    return market.betting_open;
  }
  
  // Otherwise calculate from timestamps
  const now = Math.floor(Date.now() / 1000);
  
  // Priority: betting_closes_at > commence_time > resolution_time
  // commence_time is the match start time - betting should close when match starts
  const closes = market.betting_closes_at || market.commence_time || market.resolution_time || 0;
  return now < closes;
}

// Helper to check if betting closes within a certain number of minutes
export function isBettingClosingSoon(market: { betting_open?: boolean; betting_closes_at?: number; resolution_time?: number; commence_time?: number }, minutes: number = 5): boolean {
  if (!isBettingOpen(market)) return false;
  
  const now = Math.floor(Date.now() / 1000);
  const closes = market.betting_closes_at || market.commence_time || market.resolution_time || 0;
  const diff = closes - now;
  
  return diff > 0 && diff < minutes * 60;
}

// Helper to show warning toast for bets on markets closing soon
export function showBettingClosingSoonWarning(toast: (message: string, options?: { description?: string }) => void): void {
  toast('⚠️ Betting closes soon!', {
    description: 'This market closes in less than 5 minutes. Your deposit may not confirm in time if sent now. Monero blocks take ~2 minutes on average.',
  });
}
