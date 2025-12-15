import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePredictionBets, type PlaceBetResponse } from '@/hooks/usePredictionBets';
import { useCricketEvents, CRICKET_MATCH_TYPES, getMatchTypeLabel, getMatchTypeIcon, formatCricketScore, type CricketMatch } from '@/hooks/useCricketEvents';
import { api, type PredictionMarket } from '@/services/api';
import cricketBackground from '@/assets/cricket-background.jpg';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BetDepositModal } from '@/components/BetDepositModal';
import { MyBets } from '@/components/MyBets';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, RefreshCw, Calendar, Users, Trophy, Gamepad2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Radio } from 'lucide-react';

export default function CricketPredictions() {
  const { bets, storeBet, getBetsForMarket, checkBetStatus, submitPayoutAddress } = usePredictionBets();
  const { matches, liveMatches, upcomingMatches, loading: matchesLoading, fetchMatches, createCricketMarket } = useCricketEvents();
  
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [currentBetData, setCurrentBetData] = useState<PlaceBetResponse | null>(null);
  
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');
  const [betAmountUsd, setBetAmountUsd] = useState('');
  const [placingBet, setPlacingBet] = useState(false);
  
  const [selectedMatchType, setSelectedMatchType] = useState<string>('all');
  const [teamSelectDialog, setTeamSelectDialog] = useState<{ open: boolean; match: CricketMatch | null }>({
    open: false,
    match: null,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchMarkets();
    fetchMatches();
    
    const interval = setInterval(() => {
      fetchMarkets();
      fetchMatches();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchMatches]);

  const fetchMarkets = async () => {
    try {
      const { markets: apiMarkets } = await api.getPredictionMarkets();
      setMarkets(apiMarkets.filter(m => m.oracle_type === 'cricket'));
    } catch (error) {
      console.error('Error fetching markets:', error);
      toast.error('Failed to load markets');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBet = async () => {
    if (!selectedMarket) return;
    
    const amountUsd = parseFloat(betAmountUsd);
    if (isNaN(amountUsd) || amountUsd < 1) {
      toast.error('Minimum bet is $1');
      return;
    }
    
    setPlacingBet(true);
    
    try {
      const response = await api.placePredictionBet({
        market_id: selectedMarket.market_id,
        side: betSide.toUpperCase() as 'YES' | 'NO',
        amount_usd: amountUsd,
      });
      
      storeBet(response);
      setCurrentBetData(response);
      setBetDialogOpen(false);
      setDepositModalOpen(true);
      setBetAmountUsd('');
      
      toast.success('Bet created! Send XMR to confirm.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to place bet';
      toast.error(message);
    } finally {
      setPlacingBet(false);
    }
  };
  
  const handleBetConfirmed = () => {
    fetchMarkets();
  };

  const handleCreateMarket = async (match: CricketMatch, team: string) => {
    setCreating(true);
    const success = await createCricketMarket(match, team);
    setCreating(false);
    setTeamSelectDialog({ open: false, match: null });
    if (success) {
      fetchMarkets();
    }
  };

  const getOdds = (market: PredictionMarket) => {
    const total = market.yes_pool_xmr + market.no_pool_xmr;
    if (total === 0) return { yes: 50, no: 50 };
    return {
      yes: Math.round((market.yes_pool_xmr / total) * 100),
      no: Math.round((market.no_pool_xmr / total) * 100),
    };
  };

  const getStatusBadge = (market: PredictionMarket) => {
    const now = Date.now() / 1000;
    
    if (market.resolved) {
      if (market.outcome === 'YES') {
        return <Badge className="bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> YES Won</Badge>;
      } else {
        return <Badge className="bg-red-600"><XCircle className="w-3 h-3 mr-1" /> NO Won</Badge>;
      }
    }
    
    if (market.resolution_time <= now) {
      return <Badge className="bg-amber-600 animate-pulse"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Resolving...</Badge>;
    }
    
    return <Badge className="bg-green-600"><Clock className="w-3 h-3 mr-1" /> Open</Badge>;
  };

  const formatMatchTime = (datetimeGmt: string) => {
    const date = new Date(datetimeGmt);
    if (isNaN(date.getTime())) return 'TBD';
    return date.toLocaleString('en-GB', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }) + ' UTC';
  };

  const getMatchMarketStatus = (match: CricketMatch) => {
    const teamASlug = match.team_a.toLowerCase().replace(/\s+/g, '_');
    const teamBSlug = match.team_b.toLowerCase().replace(/\s+/g, '_');
    const teamAExists = markets.some(m => m.market_id === `cricket_${match.event_id}_${teamASlug}`);
    const teamBExists = markets.some(m => m.market_id === `cricket_${match.event_id}_${teamBSlug}`);
    
    if (teamAExists && teamBExists) return 'both';
    if (teamAExists || teamBExists) return 'partial';
    return 'none';
  };

  const getMatchTypeColors = (matchType: string) => {
    switch (matchType) {
      case 't20':
        return { border: 'border-orange-500/30', bg: 'from-orange-950/30', accent: 'text-orange-400', glow: 'hover:shadow-[0_0_15px_hsl(25_100%_50%/0.2)]' };
      case 'odi':
        return { border: 'border-blue-500/30', bg: 'from-blue-950/30', accent: 'text-blue-400', glow: 'hover:shadow-[0_0_15px_hsl(210_100%_50%/0.2)]' };
      case 'test':
        return { border: 'border-red-500/30', bg: 'from-red-950/30', accent: 'text-red-400', glow: 'hover:shadow-[0_0_15px_hsl(0_100%_50%/0.2)]' };
      case 'ipl':
        return { border: 'border-purple-500/30', bg: 'from-purple-950/30', accent: 'text-purple-400', glow: 'hover:shadow-[0_0_15px_hsl(270_100%_50%/0.2)]' };
      default:
        return { border: 'border-emerald-500/30', bg: 'from-emerald-950/30', accent: 'text-emerald-400', glow: 'hover:shadow-[0_0_15px_hsl(150_100%_50%/0.2)]' };
    }
  };

  const filteredMatches = selectedMatchType === 'all'
    ? matches 
    : matches.filter(m => m.match_type === selectedMatchType);

  const activeMarkets = markets.filter(m => m.resolved === 0);
  const resolvedMarkets = markets.filter(m => m.resolved === 1);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${cricketBackground})` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-background/80 via-background/70 to-background/95" />
      
      <div className="relative z-10">
        <Navbar />
      
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <span className="text-4xl">🏏</span>
                Cricket Predictions
              </h1>
              <p className="text-muted-foreground mt-1">Bet on T20, ODI, Test & IPL matches with XMR</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/predictions">
                <Button variant="outline" size="sm">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Crypto
                </Button>
              </Link>
              <Link to="/sports-predictions">
                <Button variant="outline" size="sm">
                  <Trophy className="w-4 h-4 mr-2" />
                  Sports
                </Button>
              </Link>
              <Link to="/esports-predictions">
                <Button variant="outline" size="sm">
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Esports
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={fetchMarkets} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Live Matches Section */}
          {liveMatches.length > 0 && (
            <div className="mb-6">
              <Card className="border-red-500/30 bg-gradient-to-r from-red-950/20 via-background to-red-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-red-400">
                    <Radio className="w-5 h-5 animate-pulse" />
                    Live Matches
                    <Badge className="bg-red-600 animate-pulse ml-2">{liveMatches.length} LIVE</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {liveMatches.map(match => {
                      const marketStatus = getMatchMarketStatus(match);
                      const colors = getMatchTypeColors(match.match_type);
                      
                      return (
                        <div
                          key={match.event_id}
                          className={`p-4 rounded-lg border-2 ${colors.border} bg-gradient-to-br ${colors.bg} to-background relative overflow-hidden`}
                        >
                          {/* Animated live indicator */}
                          <div className="absolute top-2 right-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                          </div>
                          
                          {/* Match Type & Venue */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">{getMatchTypeIcon(match.match_type)}</span>
                            <div>
                              <Badge variant="outline" className={`text-xs ${colors.border}`}>
                                {getMatchTypeLabel(match.match_type)}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">{match.venue}</p>
                            </div>
                          </div>
                          
                          {/* Teams */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 flex-1">
                              {match.team_a_image ? (
                                <img src={match.team_a_image} alt={match.team_a} className="w-8 h-8 object-contain rounded" />
                              ) : (
                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                                  {match.team_a.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="font-medium text-sm truncate max-w-[80px]">{match.team_a}</span>
                            </div>
                            
                            <div className={`px-2 py-1 bg-background/50 rounded-lg border ${colors.border}`}>
                              <span className={`text-xs font-mono ${colors.accent}`}>VS</span>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <span className="font-medium text-sm truncate max-w-[80px]">{match.team_b}</span>
                              {match.team_b_image ? (
                                <img src={match.team_b_image} alt={match.team_b} className="w-8 h-8 object-contain rounded" />
                              ) : (
                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                                  {match.team_b.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Score */}
                          {match.score && match.score.length > 0 && (
                            <div className="text-center mb-3">
                              <p className={`text-sm font-mono ${colors.accent}`}>{formatCricketScore(match.score)}</p>
                            </div>
                          )}
                          
                          {/* Status */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground truncate max-w-[150px]">
                              {match.status}
                            </span>
                            {marketStatus !== 'both' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs border-red-500/50 hover:bg-red-500/20"
                                onClick={() => setTeamSelectDialog({ open: true, match })}
                              >
                                Bet Now
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Upcoming Matches */}
            <div className="lg:col-span-1">
              <Card className="border-emerald-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming Matches
                    <span className="text-xs font-normal text-muted-foreground">(Times in UTC)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={selectedMatchType} onValueChange={(v) => {
                    setSelectedMatchType(v);
                    if (v === 'all') fetchMatches();
                    else fetchMatches(v);
                  }}>
                    <TabsList className="mb-4 w-full">
                      <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                      {CRICKET_MATCH_TYPES.map(type => (
                        <TabsTrigger key={type.key} value={type.key} className="flex-1">
                          {type.icon}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value={selectedMatchType} className="mt-0">
                      {matchesLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading matches...</div>
                      ) : filteredMatches.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No upcoming matches</div>
                      ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                          {filteredMatches.filter(m => !m.match_ended).map(match => {
                            const marketStatus = getMatchMarketStatus(match);
                            const colors = getMatchTypeColors(match.match_type);
                            
                            return (
                              <div
                                key={match.event_id}
                                className={`p-3 rounded-lg border ${colors.border} hover:border-primary/50 transition-colors ${colors.glow}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span>{getMatchTypeIcon(match.match_type)}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {getMatchTypeLabel(match.match_type)}
                                    </Badge>
                                    {match.match_started && !match.match_ended && (
                                      <Badge className="bg-red-600 text-xs animate-pulse">LIVE</Badge>
                                    )}
                                    {marketStatus === 'both' && (
                                      <Badge variant="secondary" className="text-xs">Active</Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 mb-2">
                                  {match.team_a_image ? (
                                    <img src={match.team_a_image} alt={match.team_a} className="w-6 h-6 object-contain rounded" />
                                  ) : (
                                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold">
                                      {match.team_a.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="font-medium text-sm">{match.team_a}</span>
                                  <span className="text-muted-foreground">vs</span>
                                  <span className="font-medium text-sm">{match.team_b}</span>
                                  {match.team_b_image ? (
                                    <img src={match.team_b_image} alt={match.team_b} className="w-6 h-6 object-contain rounded" />
                                  ) : (
                                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold">
                                      {match.team_b.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                
                                <p className="text-xs text-muted-foreground mb-2 truncate">{match.venue}</p>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {formatMatchTime(match.datetime_gmt)}
                                  </span>
                                  
                                  {marketStatus !== 'both' && !match.match_started && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs"
                                      onClick={() => setTeamSelectDialog({ open: true, match })}
                                    >
                                      <Users className="w-3 h-3 mr-1" />
                                      Create
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Markets */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading markets...</div>
              ) : activeMarkets.length === 0 && resolvedMarkets.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <span className="text-6xl mb-4 block">🏏</span>
                    <p className="text-muted-foreground mb-4">No cricket markets yet.</p>
                    <p className="text-sm text-muted-foreground">Select a match from the left panel to create markets.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Active Markets */}
                  {activeMarkets.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-500" />
                        Active Markets ({activeMarkets.length})
                      </h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {activeMarkets.map(market => {
                          const odds = getOdds(market);
                          const marketBets = getBetsForMarket(market.market_id);
                          
                          return (
                            <Card key={market.market_id} className="hover:border-primary/50 transition-colors">
                              <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-base">{market.title}</CardTitle>
                                  {getStatusBadge(market)}
                                </div>
                                <p className="text-xs text-muted-foreground">{market.description}</p>
                              </CardHeader>
                              <CardContent>
                                {/* Odds Display */}
                                <div className="flex gap-2 mb-4">
                                  <div className="flex-1 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                                    <div className="text-2xl font-bold text-emerald-400">{odds.yes}%</div>
                                    <div className="text-xs text-muted-foreground">YES</div>
                                    <div className="text-xs text-muted-foreground mt-1">{market.yes_pool_xmr.toFixed(4)} XMR</div>
                                  </div>
                                  <div className="flex-1 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                                    <div className="text-2xl font-bold text-red-400">{odds.no}%</div>
                                    <div className="text-xs text-muted-foreground">NO</div>
                                    <div className="text-xs text-muted-foreground mt-1">{market.no_pool_xmr.toFixed(4)} XMR</div>
                                  </div>
                                </div>
                                
                                {/* User's Bets */}
                                {marketBets.length > 0 && (
                                  <div className="mb-4 p-2 rounded bg-secondary/50 text-xs">
                                    <p className="font-medium mb-1">Your bets:</p>
                                    {marketBets.map(bet => (
                                      <div key={bet.bet_id} className="flex justify-between">
                                        <span>{bet.side} - ${bet.amount_usd}</span>
                                        <Badge variant="outline" className="text-[10px]">{bet.status}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Bet Buttons */}
                                {!market.resolved && market.resolution_time > Date.now() / 1000 && (
                                  <div className="flex gap-2">
                                    <Button
                                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                      onClick={() => {
                                        setSelectedMarket(market);
                                        setBetSide('yes');
                                        setBetDialogOpen(true);
                                      }}
                                    >
                                      <TrendingUp className="w-4 h-4 mr-2" />
                                      Bet YES
                                    </Button>
                                    <Button
                                      className="flex-1 bg-red-600 hover:bg-red-700"
                                      onClick={() => {
                                        setSelectedMarket(market);
                                        setBetSide('no');
                                        setBetDialogOpen(true);
                                      }}
                                    >
                                      <TrendingDown className="w-4 h-4 mr-2" />
                                      Bet NO
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Resolved Markets */}
                  {resolvedMarkets.length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between mb-4">
                          <span className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-muted-foreground" />
                            Resolved Markets ({resolvedMarkets.length})
                          </span>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {resolvedMarkets.map(market => {
                            const odds = getOdds(market);
                            
                            return (
                              <Card key={market.market_id} className="opacity-75">
                                <CardHeader className="pb-2">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">{market.title}</CardTitle>
                                    {getStatusBadge(market)}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{market.description}</p>
                                </CardHeader>
                                <CardContent>
                                  <div className="flex gap-2">
                                    <div className={`flex-1 p-3 rounded-lg text-center ${market.outcome === 'YES' ? 'bg-emerald-500/20 border border-emerald-500' : 'bg-secondary/50'}`}>
                                      <div className="text-xl font-bold">{odds.yes}%</div>
                                      <div className="text-xs text-muted-foreground">YES</div>
                                    </div>
                                    <div className={`flex-1 p-3 rounded-lg text-center ${market.outcome === 'NO' ? 'bg-red-500/20 border border-red-500' : 'bg-secondary/50'}`}>
                                      <div className="text-xl font-bold">{odds.no}%</div>
                                      <div className="text-xs text-muted-foreground">NO</div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* My Bets */}
                  <MyBets 
                    bets={bets}
                    onStatusUpdate={checkBetStatus}
                    onPayoutSubmit={submitPayoutAddress}
                  />
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* Team Selection Dialog */}
      <Dialog open={teamSelectDialog.open} onOpenChange={(open) => setTeamSelectDialog({ open, match: teamSelectDialog.match })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Market</DialogTitle>
            <DialogDescription>
              Choose which team to create a "Will they win?" market for
            </DialogDescription>
          </DialogHeader>
          
          {teamSelectDialog.match && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {teamSelectDialog.match.team_a} vs {teamSelectDialog.match.team_b}
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  disabled={creating || markets.some(m => m.market_id === `cricket_${teamSelectDialog.match!.event_id}_${teamSelectDialog.match!.team_a.toLowerCase().replace(/\s+/g, '_')}`)}
                  onClick={() => handleCreateMarket(teamSelectDialog.match!, teamSelectDialog.match!.team_a)}
                >
                  {teamSelectDialog.match.team_a_image && (
                    <img src={teamSelectDialog.match.team_a_image} alt={teamSelectDialog.match.team_a} className="w-8 h-8 object-contain" />
                  )}
                  <span className="text-sm font-medium">{teamSelectDialog.match.team_a}</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  disabled={creating || markets.some(m => m.market_id === `cricket_${teamSelectDialog.match!.event_id}_${teamSelectDialog.match!.team_b.toLowerCase().replace(/\s+/g, '_')}`)}
                  onClick={() => handleCreateMarket(teamSelectDialog.match!, teamSelectDialog.match!.team_b)}
                >
                  {teamSelectDialog.match.team_b_image && (
                    <img src={teamSelectDialog.match.team_b_image} alt={teamSelectDialog.match.team_b} className="w-8 h-8 object-contain" />
                  )}
                  <span className="text-sm font-medium">{teamSelectDialog.match.team_b}</span>
                </Button>
              </div>
              
              {creating && (
                <p className="text-center text-sm text-muted-foreground">
                  <RefreshCw className="w-4 h-4 inline animate-spin mr-2" />
                  Creating market...
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bet Dialog */}
      <Dialog open={betDialogOpen} onOpenChange={setBetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Your Bet</DialogTitle>
            <DialogDescription>
              {selectedMarket?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                variant={betSide === 'yes' ? 'default' : 'outline'}
                className={`flex-1 ${betSide === 'yes' ? 'bg-emerald-600' : ''}`}
                onClick={() => setBetSide('yes')}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                YES
              </Button>
              <Button
                variant={betSide === 'no' ? 'default' : 'outline'}
                className={`flex-1 ${betSide === 'no' ? 'bg-red-600' : ''}`}
                onClick={() => setBetSide('no')}
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                NO
              </Button>
            </div>
            
            <div>
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                placeholder="Enter amount..."
                value={betAmountUsd}
                onChange={(e) => setBetAmountUsd(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Minimum: $1</p>
            </div>
            
            <Button
              className="w-full"
              disabled={placingBet || !betAmountUsd}
              onClick={handlePlaceBet}
            >
              {placingBet ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Place $${betAmountUsd || '0'} on ${betSide.toUpperCase()}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deposit Modal */}
      <BetDepositModal
        open={depositModalOpen}
        onOpenChange={setDepositModalOpen}
        betData={currentBetData}
        onCheckStatus={checkBetStatus}
        onConfirmed={handleBetConfirmed}
      />
    </div>
  );
}
