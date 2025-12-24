import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Pause } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BackoffBadgeProps {
  backoffUntil: number;
  className?: string;
}

export function BackoffBadge({ backoffUntil, className }: BackoffBadgeProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      const diff = backoffUntil - now;
      
      if (diff <= 0) {
        setTimeLeft('');
        return;
      }

      const seconds = Math.ceil(diff / 1000);
      if (seconds >= 60) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        setTimeLeft(`${mins}m ${secs}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [backoffUntil]);

  if (!timeLeft) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`border-amber-500/50 text-amber-400 gap-1 text-xs ${className}`}
          >
            <Pause className="w-3 h-3" />
            Score in {timeLeft}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-[250px]">
          <p className="text-xs">
            Live score data is temporarily unavailable after multiple failed attempts. 
            Polling is paused to reduce unnecessary requests. It will resume automatically.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
