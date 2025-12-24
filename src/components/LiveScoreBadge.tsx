import { Badge } from '@/components/ui/badge';
import { Activity, Radio, Clock, Info } from 'lucide-react';
import { type LiveScores } from '@/hooks/useEsportsEvents';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LiveScoreBadgeProps {
  eventId: string;
  teamA: string;
  teamB: string;
  liveScores: LiveScores;
  variant?: 'compact' | 'full';
  /** When true and no score yet, show "Awaiting data" instead of just LIVE */
  showNoDataHint?: boolean;
  /** When true, show info icon explaining score delay */
  showScoreDelayHint?: boolean;
}

export function LiveScoreBadge({ 
  eventId, 
  teamA, 
  teamB, 
  liveScores, 
  variant = 'compact',
  showNoDataHint = false,
  showScoreDelayHint = false,
}: LiveScoreBadgeProps) {
  const score = liveScores[eventId];
  
  if (!score) {
    // Show a helpful "awaiting data" hint when requested
    if (showNoDataHint) {
      return (
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="border-red-500/50 text-red-400 animate-pulse gap-1 cursor-help">
                  <Radio className="w-3 h-3" />
                  LIVE
                  {showScoreDelayHint && <Info className="w-3 h-3 ml-0.5 opacity-70" />}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px]">
                <p className="text-xs">
                  Live scores update every few seconds. "Score in Xm" means polling is paused after failed attempts and will resume automatically.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Awaiting data
          </span>
        </div>
      );
    }
    return (
      <Badge variant="outline" className="border-red-500/50 text-red-400 animate-pulse gap-1">
        <Radio className="w-3 h-3" />
        LIVE
      </Badge>
    );
  }

  const isTeamAWinning = score.score_a > score.score_b;
  const isTeamBWinning = score.score_b > score.score_a;
  const isTied = score.score_a === score.score_b;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-red-600 text-white animate-pulse gap-1">
          <Radio className="w-3 h-3" />
          LIVE
        </Badge>
        <div className="flex items-center gap-1 text-sm font-mono font-bold">
          <span className={isTeamAWinning ? 'text-emerald-400' : isTied ? 'text-amber-400' : 'text-muted-foreground'}>
            {score.score_a}
          </span>
          <span className="text-muted-foreground">-</span>
          <span className={isTeamBWinning ? 'text-emerald-400' : isTied ? 'text-amber-400' : 'text-muted-foreground'}>
            {score.score_b}
          </span>
        </div>
      </div>
    );
  }

  // Full variant with team names
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/30">
      <div className="flex items-center gap-2">
        <Badge className="bg-red-600 text-white animate-pulse gap-1">
          <Radio className="w-3 h-3" />
          LIVE
        </Badge>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <div className={`font-medium ${isTeamAWinning ? 'text-emerald-400' : ''}`}>
          {teamA}
        </div>
        <div className="flex items-center gap-1 font-mono font-bold text-lg">
          <span className={isTeamAWinning ? 'text-emerald-400' : isTied ? 'text-amber-400' : 'text-foreground'}>
            {score.score_a}
          </span>
          <span className="text-muted-foreground">:</span>
          <span className={isTeamBWinning ? 'text-emerald-400' : isTied ? 'text-amber-400' : 'text-foreground'}>
            {score.score_b}
          </span>
        </div>
        <div className={`font-medium ${isTeamBWinning ? 'text-emerald-400' : ''}`}>
          {teamB}
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Activity className="w-3 h-3 text-red-400" />
        <span>Live</span>
      </div>
    </div>
  );
}

// Simple inline score display for market cards
export function InlineScore({ 
  eventId, 
  liveScores 
}: { 
  eventId: string; 
  liveScores: LiveScores;
}) {
  const score = liveScores[eventId];
  
  if (!score) return null;

  return (
    <span className="font-mono font-bold text-sm">
      <span className={score.score_a > score.score_b ? 'text-emerald-400' : 'text-muted-foreground'}>
        {score.score_a}
      </span>
      <span className="text-muted-foreground mx-1">-</span>
      <span className={score.score_b > score.score_a ? 'text-emerald-400' : 'text-muted-foreground'}>
        {score.score_b}
      </span>
    </span>
  );
}
