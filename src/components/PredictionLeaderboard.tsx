import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, TrendingUp, Wallet } from 'lucide-react';
import { type PredictionBet } from '@/hooks/usePredictionBets';

interface LeaderboardProps {
  userBets: PredictionBet[];
}

export function PredictionLeaderboard({ userBets }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState('your-stats');
  
  // Calculate user's winnings from local bets
  const wonBets = userBets.filter(bet => bet.status === 'won' || bet.status === 'paid');
  const totalWonXmr = wonBets.reduce((sum, bet) => {
    // Simplified payout calculation - in reality depends on pool odds at resolution
    // Assuming 2x payout for demonstration
    return sum + (bet.amount_xmr * 2);
  }, 0);
  const totalWonUsd = wonBets.reduce((sum, bet) => sum + (bet.amount_usd * 2), 0);
  
  const activeBets = userBets.filter(bet => bet.status === 'confirmed');
  const pendingBets = userBets.filter(bet => bet.status === 'awaiting_deposit');
  
  // Mock global leaderboard data (would come from API in production)
  const mockLeaderboard = [
    { rank: 1, address: '4AdUnd...x5Usx', totalWon: 12.5432, wins: 8 },
    { rank: 2, address: '8BosbzM...PMy', totalWon: 8.2341, wins: 5 },
    { rank: 3, address: '4QmPV...3kL9', totalWon: 5.1234, wins: 4 },
    { rank: 4, address: '8Nxm7...pK2w', totalWon: 3.8901, wins: 3 },
    { rank: 5, address: '4WdYn...mR8q', totalWon: 2.4567, wins: 3 },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="your-stats">Your Stats</TabsTrigger>
            <TabsTrigger value="top-winners">Top Winners</TabsTrigger>
          </TabsList>
          
          <TabsContent value="your-stats" className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-emerald-500">{wonBets.length}</p>
                <p className="text-xs text-muted-foreground">Wins</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold font-mono">{totalWonXmr.toFixed(4)}</p>
                <p className="text-xs text-muted-foreground">XMR Won</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">{activeBets.length}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-amber-500">{pendingBets.length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
            
            {/* Recent Wins */}
            {wonBets.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recent Wins</p>
                {wonBets.slice(0, 3).map((bet) => (
                  <div 
                    key={bet.bet_id}
                    className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm">{bet.market_id}</span>
                      <Badge variant="outline" className="text-emerald-500 border-emerald-500">
                        {bet.side}
                      </Badge>
                    </div>
                    <span className="font-mono text-sm text-emerald-500">
                      +{(bet.amount_xmr * 2).toFixed(4)} XMR
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No wins yet. Place some bets!</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="top-winners" className="space-y-3">
            <p className="text-xs text-muted-foreground mb-3">
              Top winners by total XMR won
            </p>
            {mockLeaderboard.map((entry) => (
              <div 
                key={entry.rank}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  entry.rank <= 3 ? 'bg-muted/50' : 'bg-background'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getRankIcon(entry.rank)}
                  <div>
                    <p className="font-mono text-sm">{entry.address}</p>
                    <p className="text-xs text-muted-foreground">{entry.wins} wins</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-emerald-500">
                    {entry.totalWon.toFixed(4)} XMR
                  </p>
                </div>
              </div>
            ))}
            <p className="text-xs text-center text-muted-foreground pt-2">
              Global leaderboard updates hourly
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
