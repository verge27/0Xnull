import { Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PendingDataIndicatorProps {
  /** The type of data being awaited */
  type?: 'score' | 'result' | 'data';
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional classes */
  className?: string;
  /** Show a spinning loader icon */
  showLoader?: boolean;
}

export function PendingDataIndicator({
  type = 'data',
  size = 'md',
  className,
  showLoader = false,
}: PendingDataIndicatorProps) {
  const messages: Record<string, string> = {
    score: 'Score data pending',
    result: 'Result pending',
    data: 'Data pending',
  };

  const sizeClasses = {
    sm: 'text-xs gap-1 py-1 px-2',
    md: 'text-sm gap-2 p-2',
  };

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg bg-muted/30 border border-border/50 text-muted-foreground',
        sizeClasses[size],
        className
      )}
    >
      {showLoader ? (
        <Loader2 className={cn(iconSize, 'animate-spin')} />
      ) : (
        <Clock className={iconSize} />
      )}
      <span>{messages[type]}</span>
    </div>
  );
}
