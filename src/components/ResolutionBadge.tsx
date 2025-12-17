import { Check, Flag, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ResolutionBadgeProps {
  resolution?: 'auto' | 'manual';
  showLabel?: boolean;
  className?: string;
}

export function ResolutionBadge({ resolution, showLabel = true, className }: ResolutionBadgeProps) {
  if (!resolution) return null;

  const isAuto = resolution === 'auto';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${isAuto 
              ? 'border-green-700 text-green-400 bg-green-950/30' 
              : 'border-amber-700 text-amber-400 bg-amber-950/30'
            } gap-1 cursor-help ${className || ''}`}
          >
            {isAuto ? (
              <Check className="h-3 w-3" />
            ) : (
              <Flag className="h-3 w-3" />
            )}
            {showLabel && (isAuto ? 'Auto-resolve' : 'Manual')}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {isAuto ? (
            <p className="text-sm">
              <strong>Auto-resolve via Tapology</strong><br />
              Results scraped from Tapology. Markets resolve automatically within 24-48 hours when winner is confirmed.
            </p>
          ) : (
            <p className="text-sm">
              <strong>Manual verification</strong><br />
              Results verified by our team from Russian/local sources. May take 1-7 days after event completion.
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ResolutionInfoProps {
  resolution?: 'auto' | 'manual';
  promotionName?: string;
}

export function ResolutionInfo({ resolution, promotionName }: ResolutionInfoProps) {
  if (!resolution) return null;

  const isAuto = resolution === 'auto';

  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
      isAuto ? 'bg-green-950/30 border border-green-900/50' : 'bg-amber-950/30 border border-amber-900/50'
    }`}>
      <Info className={`h-4 w-4 mt-0.5 ${isAuto ? 'text-green-400' : 'text-amber-400'}`} />
      <div>
        <p className={`font-medium ${isAuto ? 'text-green-400' : 'text-amber-400'}`}>
          {isAuto ? 'Auto-resolve' : 'Manual verification'} {promotionName && `(${promotionName})`}
        </p>
        <p className="text-muted-foreground text-xs mt-1">
          {isAuto 
            ? 'Results will be scraped from Tapology within 24-48 hours of event completion.'
            : 'Results verified by our team from Russian/local sources. May take 1-7 days after event.'}
        </p>
      </div>
    </div>
  );
}
