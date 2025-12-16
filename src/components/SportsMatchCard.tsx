import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TeamLogo } from '@/components/TeamLogo';
import { getSportLabel, formatRelativeTime, type SportsMatch, type SportsOdds } from '@/hooks/useSportsCategories';
import { Clock, Users } from 'lucide-react';

interface SportsMatchCardProps {
  match: SportsMatch;
  odds?: SportsOdds;
  onBetClick: (match: SportsMatch) => void;
  isLive?: boolean;
  hasMarket?: boolean;
}

export function SportsMatchCard({ match, odds, onBetClick, isLive, hasMarket }: SportsMatchCardProps) {
  const now = Date.now() / 1000;
  const gameStarted = match.commence_timestamp <= now;
  
  const formatGameTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="hover:border-primary/50 transition-colors bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-xs">
            {getSportLabel(match.sport)}
          </Badge>
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge className="bg-red-600 text-xs animate-pulse">LIVE</Badge>
            )}
            {hasMarket && (
              <Badge variant="secondary" className="text-xs">Active</Badge>
            )}
          </div>
        </div>
        
        {/* Teams */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TeamLogo teamName={match.home_team} sport={match.sport} size="sm" />
            <span className="font-medium text-sm truncate">{match.home_team}</span>
          </div>
          <span className="text-muted-foreground font-bold shrink-0">VS</span>
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <span className="font-medium text-sm truncate">{match.away_team}</span>
            <TeamLogo teamName={match.away_team} sport={match.sport} size="sm" />
          </div>
        </div>
        
        {/* Odds Display */}
        {odds && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 rounded bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-lg font-bold text-emerald-400">{odds.best_odds.home.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Home</div>
            </div>
            {odds.best_odds.draw !== undefined && (
              <div className="text-center p-2 rounded bg-muted/50 border border-border">
                <div className="text-lg font-bold">{odds.best_odds.draw.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Draw</div>
              </div>
            )}
            <div className="text-center p-2 rounded bg-blue-500/10 border border-blue-500/30">
              <div className="text-lg font-bold text-blue-400">{odds.best_odds.away.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Away</div>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(match.commence_timestamp)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatGameTime(match.commence_timestamp)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {odds && (
              <Badge variant="outline" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                {odds.bookmaker_count} books
              </Badge>
            )}
            {!gameStarted && (
              <Button
                size="sm"
                onClick={() => onBetClick(match)}
              >
                Bet Now
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
