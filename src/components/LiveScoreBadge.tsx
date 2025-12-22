import { Badge } from '@/components/ui/badge';
import { Activity, Radio } from 'lucide-react';
import { type LiveScores } from '@/hooks/useEsportsEvents';

interface LiveScoreBadgeProps {
  eventId: string;
  teamA: string;
  teamB: string;
  liveScores: LiveScores;
  variant?: 'compact' | 'full';
}

export function LiveScoreBadge({ 
  eventId, 
  teamA, 
  teamB, 
  liveScores, 
  variant = 'compact' 
}: LiveScoreBadgeProps) {
  const score = liveScores[eventId];
  
  if (!score) {
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
