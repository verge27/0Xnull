import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, startOfDay, subDays } from 'date-fns';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Wallet, ExternalLink, Trophy, CheckCircle, ArrowLeft, Banknote, TrendingUp, RefreshCw, Layers, Filter, ChevronLeft, ChevronRight, CalendarIcon, X, BarChart3 } from 'lucide-react';
import { api, type PayoutEntry } from '@/services/api';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const XMR_EXPLORER_URL = 'https://xmrchain.net/tx';

export default function Payouts() {
  const [payouts, setPayouts] = useState<PayoutEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses' | 'refund'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const ITEMS_PER_PAGE = 10;

  const fetchPayouts = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const data = await api.getPredictionPayouts();
      setPayouts(data.payouts || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error('Failed to fetch payouts:', e);
      setError('Failed to load payouts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  // Helper to normalize side/outcome values for comparison
  const normalizeSide = (side: string | undefined): string => {
    if (!side) return '';
    const s = side.toLowerCase().trim();
    if (s === 'yes' || s === 'true' || s === '1') return 'yes';
    if (s === 'no' || s === 'false' || s === '0') return 'no';
    return s;
  };

  // Simple refund detection using API's per-bet 'type' field
  // API provides: type='win' or type='refund' per bet
  // Also payout_type at market level: 'winner_takes_pool', 'refund_one_sided', 'refund_all_losers', 'refund_draw'
  const isRefund = (payout: PayoutEntry) => {
    // Primary check: API's per-bet type field
    if (payout.type === 'refund') return true;
    
    // Fallback: market-level payout_type contains 'refund'
    const payoutType = payout.payout_type?.toLowerCase() || '';
    if (payoutType.includes('refund')) return true;
    
    // Legacy fallback: was_unopposed flag from proxy enrichment
    if (payout.was_unopposed === true) return true;
    
    return false;
  };
  
  // Simple loss detection: not a win and not a refund
  const isLoss = (payout: PayoutEntry) => {
    if (isRefund(payout)) return false;
    
    // If API says it's a win, it's not a loss
    if (payout.type === 'win') return false;
    
    // For single bets without explicit type: check side vs outcome
    if (payout.side && payout.outcome && payout.side !== 'MULTI') {
      const normalizedSide = normalizeSide(payout.side);
      const normalizedOutcome = normalizeSide(payout.outcome);
      if (normalizedSide !== normalizedOutcome) return true;
    }
    
    // For multibets/legs with known outcome
    if ((payout as any)._legOutcome === 'lost') return true;
    
    return false;
  };
  
  // Expand multibets into individual leg entries
  // NOTE: API only provides TOTAL stake/payout for the slip, not per-leg breakdown
  const expandedPayouts = payouts.flatMap(payout => {
    if (payout.market_id === 'multibet') {
      // If backend provides structured legs array, use it directly
      if (payout.legs && payout.legs.length > 0) {
        return payout.legs.map((leg, idx) => ({
          ...payout,
          bet_id: `${payout.bet_id}_leg${idx}`,
          market_id: leg.market_id,
          title: leg.title,
          description: `Leg ${idx + 1} of ${payout.legs!.length}`,
          stake_xmr: payout.stake_xmr,
          payout_xmr: payout.payout_xmr,
          payout_type: leg.outcome?.toLowerCase() === 'won' ? ('win' as const) : ('refund' as const),
          side: leg.side,
          outcome: leg.outcome?.toLowerCase() === 'won' ? leg.side : (leg.side?.toUpperCase() === 'YES' ? 'NO' : 'YES') as 'YES' | 'NO',
          _isExpandedLeg: true,
          _legIndex: idx,
          _totalLegs: payout.legs!.length,
          _winsCount: payout.legs!.filter(l => l.outcome?.toLowerCase() === 'won').length,
          _legSide: leg.side,
          _legOutcome: leg.outcome,
        }));
      }
      
      // Fallback: Parse from description string (legacy format)
      const description = payout.description || '';
      
      // Parse "(X/Y won)" from title to determine win/refund counts
      const wonMatch = payout.title.match(/\((\d+)\/(\d+)\s*won\)/i);
      const winsCount = wonMatch ? parseInt(wonMatch[1]) : 0;
      const totalLegs = wonMatch ? parseInt(wonMatch[2]) : 0;
      
      // Split by "?, " to get individual leg questions
      let legs = description.split(/\?,\s*/).map(t => t.trim()).filter(Boolean);
      
      // Handle "(+N more)" suffix embedded in last leg - extract and remove it
      legs = legs.map(leg => {
        const suffixMatch = leg.match(/^(.+?)\s*\(\+\d+\s*more\)$/i);
        return suffixMatch ? suffixMatch[1].trim() : leg;
      }).filter(leg => !leg.match(/^\(\+\d+\s*more\)$/i));
      
      // If no legs found, show as single entry
      if (legs.length === 0) {
        return [{
          ...payout,
          title: payout.description || payout.title,
        }];
      }
      
      // If totalLegs is known and we have fewer legs than expected, pad with numbered placeholders
      const expectedLegs = totalLegs > 0 ? totalLegs : legs.length;
      if (legs.length < expectedLegs) {
        for (let i = legs.length; i < expectedLegs; i++) {
          legs.push(`Bet leg #${i + 1}`);
        }
      }
      
      return legs.map((legTitle, idx) => {
        const fullTitle = legTitle.endsWith('?') ? legTitle : 
                          legTitle.startsWith('Bet leg #') ? legTitle : `${legTitle}?`;
        
        // Determine if this leg is a win or refund based on position
        // Note: This is a heuristic since we don't have per-leg outcome data in legacy format
        const isLegWin = idx < winsCount;
        
        return {
          ...payout,
          bet_id: `${payout.bet_id}_leg${idx}`,
          market_id: `expanded_leg_${idx}`,
          title: fullTitle,
          description: `Leg ${idx + 1} of ${expectedLegs}`,
          stake_xmr: payout.stake_xmr,
          payout_xmr: payout.payout_xmr,
          payout_type: isLegWin ? ('win' as const) : ('refund' as const),
          // Don't show misleading side for legacy format - use MULTI to indicate unknown
          side: 'MULTI' as const,
          outcome: isLegWin ? ('YES' as const) : ('NO' as const),
          _isExpandedLeg: true,
          _legIndex: idx,
          _totalLegs: expectedLegs,
          _winsCount: winsCount,
          _legSide: null, // Unknown in legacy format
          _legOutcome: isLegWin ? 'won' : 'lost',
        };
      });
    }
    return [payout];
  });

  // Calculate totals (use original payouts to avoid double-counting)
  const totalPaidOut = payouts.reduce((sum, p) => sum + p.payout_xmr, 0);
  
  // isWin: side matches outcome and not a refund
  const isWin = (payout: PayoutEntry) => {
    if (isRefund(payout)) return false;
    if (isLoss(payout)) return false;
    
    // For expanded legs and single bets
    if (payout.side && payout.outcome && payout.side !== 'MULTI') {
      const normalizedSide = normalizeSide(payout.side);
      const normalizedOutcome = normalizeSide(payout.outcome);
      if (normalizedSide === normalizedOutcome) return true;
    }
    
    // For multibets/legs with known outcome
    if ((payout as any)._legOutcome === 'won') return true;
    
    // Fall back to payout_type
    return payout.payout_type === 'win' || payout.payout_type === 'multibet_win';
  };
  
  // Get status label and style for display
  const getPayoutStatus = (payout: PayoutEntry) => {
    if (isWin(payout)) return { label: 'Winner', color: 'bg-emerald-600', textColor: 'text-emerald-400' };
    if (isLoss(payout)) return { label: 'Loss', color: 'bg-red-600', textColor: 'text-red-400' };
    if (isRefund(payout)) return { label: 'Refund', color: 'bg-blue-600', textColor: 'text-blue-400' };
    return { label: 'Unknown', color: 'bg-gray-600', textColor: 'text-gray-400' };
  };
  
  const winPayouts = expandedPayouts.filter(p => isWin(p));
  const lossPayouts = expandedPayouts.filter(p => isLoss(p));
  const refundPayouts = expandedPayouts.filter(p => isRefund(p));

  // Chart data: aggregate by day over last 30 days
  const chartData = useMemo(() => {
    const days = 30;
    const now = new Date();
    const data: { date: string; wins: number; losses: number; refunds: number }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const day = startOfDay(subDays(now, i));
      const dayEnd = new Date(day.getTime() + 86400000);
      const dayLabel = format(day, 'MMM d');
      
      const dayPayouts = expandedPayouts.filter(p => {
        const pDate = new Date(p.resolved_at * 1000);
        return pDate >= day && pDate < dayEnd;
      });
      
      data.push({
        date: dayLabel,
        wins: dayPayouts.filter(p => isWin(p)).length,
        losses: dayPayouts.filter(p => isLoss(p)).length,
        refunds: dayPayouts.filter(p => isRefund(p)).length,
      });
    }
    
    return data;
  }, [expandedPayouts]);

  // Pie chart data for distribution
  const pieData = useMemo(() => [
    { name: 'Wins', value: winPayouts.length, color: '#10b981' },
    { name: 'Losses', value: lossPayouts.length, color: '#ef4444' },
    { name: 'Refunds', value: refundPayouts.length, color: '#3b82f6' },
  ].filter(d => d.value > 0), [winPayouts.length, lossPayouts.length, refundPayouts.length]);

  // Filter payouts based on selected filter and date range
  const filteredPayouts = expandedPayouts.filter(payout => {
    // Type filter
    let matchesType = true;
    switch (filter) {
      case 'wins':
        matchesType = isWin(payout);
        break;
      case 'losses':
        matchesType = isLoss(payout);
        break;
      case 'refund':
        matchesType = isRefund(payout);
        break;
    }
    
    // Date filter
    const payoutDate = new Date(payout.resolved_at * 1000);
    const matchesStartDate = !startDate || payoutDate >= startDate;
    const matchesEndDate = !endDate || payoutDate <= new Date(endDate.getTime() + 86400000 - 1); // End of day
    
    return matchesType && matchesStartDate && matchesEndDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPayouts.length / ITEMS_PER_PAGE);
  const paginatedPayouts = filteredPayouts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filter changes
  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleDateChange = (type: 'start' | 'end', date: Date | undefined) => {
    if (type === 'start') {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    setCurrentPage(1);
  };

  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateTxid = (txid: string) => {
    if (txid.length <= 20) return txid;
    return `${txid.slice(0, 10)}...${txid.slice(-10)}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/predict">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Wallet className="w-8 h-8 text-emerald-400" />
              Payout History
            </h1>
            <p className="text-muted-foreground mt-1">
              All prediction market payouts across the platform
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchPayouts}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-emerald-950/20 border-emerald-600/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Banknote className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid Out</p>
                  <p className="text-2xl font-bold text-emerald-400 font-mono">
                    {totalPaidOut.toFixed(4)} XMR
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Single Bet Wins</p>
                  <p className="text-2xl font-bold">
                    {winPayouts.filter(p => p.market_id !== 'multibet').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-950/20 border-purple-600/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Layers className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Bets</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {expandedPayouts.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-950/20 border-blue-600/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Refunds</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {refundPayouts.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Area Chart - Breakdown Over Time */}
          <Card className="lg:col-span-2 bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Results Over Last 30 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWins" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLosses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRefunds" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="wins" 
                      name="Wins"
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorWins)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="losses" 
                      name="Losses"
                      stroke="#ef4444" 
                      fillOpacity={1} 
                      fill="url(#colorLosses)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="refunds" 
                      name="Refunds"
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorRefunds)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart - Distribution */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Overall Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => [`${value} bets`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>
              {/* Legend */}
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm text-muted-foreground">Wins</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-muted-foreground">Losses</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-muted-foreground">Refunds</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payouts List */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              {filter === 'all' ? 'All Payouts' : filter === 'wins' ? 'Wins' : filter === 'losses' ? 'Losses' : 'Refunds'} ({filteredPayouts.length})
            </h2>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'wins' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('wins')}
                className={filter === 'wins' ? 'bg-emerald-600 hover:bg-emerald-700' : 'hover:border-emerald-500/50'}
              >
                <Trophy className="w-3 h-3 mr-1" />
                Wins ({winPayouts.length})
              </Button>
              <Button
                variant={filter === 'losses' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('losses')}
                className={filter === 'losses' ? 'bg-red-600 hover:bg-red-700' : 'hover:border-red-500/50'}
              >
                <X className="w-3 h-3 mr-1" />
                Losses ({lossPayouts.length})
              </Button>
              <Button
                variant={filter === 'refund' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('refund')}
                className={filter === 'refund' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:border-blue-500/50'}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refunds ({refundPayouts.length})
              </Button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Date Range:</span>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  {startDate ? format(startDate, "PP") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => handleDateChange('start', date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            
            <span className="text-muted-foreground">to</span>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  {endDate ? format(endDate, "PP") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => handleDateChange('end', date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDateFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {loading ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading payouts...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-destructive/50">
              <CardContent className="py-12 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button variant="outline" onClick={fetchPayouts}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : payouts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Payouts Yet</h3>
                <p className="text-muted-foreground mb-4">
                  When markets resolve, payouts will appear here with transaction IDs.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Link to="/esports-predictions">
                    <Button variant="outline" size="sm">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Esports Markets
                    </Button>
                  </Link>
                  <Link to="/sports-predictions">
                    <Button variant="outline" size="sm">
                      <Trophy className="w-4 h-4 mr-2" />
                      Sports Markets
                    </Button>
                  </Link>
                  <Link to="/predictions">
                    <Button variant="outline" size="sm">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Crypto Markets
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : filteredPayouts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Matching Payouts</h3>
                <p className="text-muted-foreground mb-4">
                  No payouts match the selected filter.
                </p>
                <Button variant="outline" onClick={() => handleFilterChange('all')}>
                  Show All Payouts
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {(() => {
                  // Group consecutive expanded legs from same slip by original bet_id
                  const groups: { slipId: string | null; items: typeof paginatedPayouts }[] = [];
                  
                  paginatedPayouts.forEach((payout) => {
                    const isExpandedLeg = (payout as any)._isExpandedLeg;
                    // Extract original bet_id (before _legX suffix)
                    const originalBetId = isExpandedLeg 
                      ? payout.bet_id.replace(/_leg\d+$/, '') 
                      : null;
                    
                    const lastGroup = groups[groups.length - 1];
                    
                    if (isExpandedLeg && lastGroup?.slipId === originalBetId) {
                      // Add to existing group
                      lastGroup.items.push(payout);
                    } else {
                      // Start new group
                      groups.push({
                        slipId: originalBetId,
                        items: [payout],
                      });
                    }
                  });
                  
                  return groups.map((group, groupIdx) => {
                    const isSlipGroup = group.slipId !== null && group.items.length > 1;
                    const firstItem = group.items[0] as any;
                    const totalLegs = firstItem._totalLegs || group.items.length;
                    const winsCount = firstItem._winsCount || 0;
                    
                    if (isSlipGroup) {
                      // Render grouped slip legs
                      return (
                        <div 
                          key={`group-${groupIdx}`}
                          className="rounded-lg border-2 border-purple-500/40 bg-purple-950/10 overflow-hidden"
                        >
                          {/* Slip header */}
                          <div className="px-4 py-2 bg-purple-900/30 border-b border-purple-500/30 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-medium text-purple-300">
                              {totalLegs}-Leg Slip
                            </span>
                            <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-300">
                              {winsCount}/{totalLegs} won
                            </Badge>
                          </div>
                          
                          {/* Individual legs */}
                          <div className="divide-y divide-purple-500/20">
                            {group.items.map((payout, legIdx) => {
                              const legSide = (payout as any)._legSide;
                              const legOutcome = (payout as any)._legOutcome;
                              const isLegWon = legOutcome?.toLowerCase() === 'won' || isWin(payout);
                              
                              return (
                                <div 
                                  key={payout.bet_id}
                                  className={cn(
                                    "px-4 py-3",
                                    isLegWon ? 'bg-emerald-950/20' : 'bg-blue-950/20'
                                  )}
                                >
                                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    {/* Market Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <Badge className={cn(
                                          "text-xs",
                                          isLegWon ? 'bg-emerald-600' : isRefund(payout) ? 'bg-blue-600' : 'bg-red-600'
                                        )}>
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          {isLegWon ? 'Won' : isRefund(payout) ? 'Refund' : 'Lost'}
                                        </Badge>
                                        {/* Show actual side if available */}
                                        {legSide && (
                                          <Badge 
                                            variant="outline" 
                                            className={cn(
                                              "text-xs",
                                              legSide === 'YES' ? 'border-emerald-500/50 text-emerald-400' : 'border-red-500/50 text-red-400'
                                            )}
                                          >
                                            {legSide}
                                          </Badge>
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                          Leg {legIdx + 1} of {totalLegs}
                                        </span>
                                      </div>
                                      <p className="font-medium truncate">{payout.title}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Slip totals footer */}
                          <div className="px-4 py-3 bg-purple-900/20 border-t border-purple-500/30 flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">
                                {formatDate(firstItem.resolved_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 md:gap-6">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Total Stake</p>
                                <p className="font-mono text-sm">{firstItem.stake_xmr.toFixed(4)} XMR</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Total Payout</p>
                                <p className="font-mono text-sm">{firstItem.payout_xmr.toFixed(4)} XMR</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Profit/Loss</p>
                                {(() => {
                                  const profit = firstItem.payout_xmr - firstItem.stake_xmr;
                                  const isProfit = profit > 0.00001;
                                  const isLoss = profit < -0.00001;
                                  return (
                                    <p className={`font-mono text-sm font-bold ${isProfit ? 'text-emerald-400' : isLoss ? 'text-red-400' : 'text-muted-foreground'}`}>
                                      {isProfit ? '+' : ''}{profit.toFixed(4)} XMR
                                    </p>
                                  );
                                })()}
                              </div>
                            </div>
                            <a
                              href={`${XMR_EXPLORER_URL}/${firstItem.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors group bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/30"
                            >
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Transaction ID</p>
                                <p className="font-mono text-sm text-emerald-400 group-hover:text-emerald-300">
                                  {truncateTxid(firstItem.tx_hash)}
                                </p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
                            </a>
                          </div>
                        </div>
                      );
                    }
                    
                    // Render single items (non-grouped)
                    return group.items.map(payout => {
                      const status = getPayoutStatus(payout);
                      // For losses, payout is 0 and profit is -stake
                      const displayPayout = isLoss(payout) ? 0 : payout.payout_xmr;
                      const displayProfit = isLoss(payout) ? -payout.stake_xmr : payout.payout_xmr - payout.stake_xmr;
                      
                      return (
                      <Card 
                        key={payout.bet_id} 
                        className={cn(
                          isWin(payout) && 'border-emerald-600/30 bg-emerald-950/10',
                          isLoss(payout) && 'border-red-600/30 bg-red-950/10',
                          isRefund(payout) && 'border-blue-600/30 bg-blue-950/10'
                        )}
                      >
                        <CardContent className="py-4">
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            {/* Market Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge className={status.color}>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {status.label}
                                </Badge>
                                {payout.side && payout.side !== 'MULTI' && (
                                  <Badge variant={payout.side?.toUpperCase() === 'YES' ? 'default' : 'destructive'} className="text-xs">
                                    {payout.side?.toUpperCase()}
                                  </Badge>
                                )}
                                {payout.outcome && payout.outcome !== 'MULTI' && (
                                  <Badge variant="outline" className="text-xs">
                                    Outcome: {payout.outcome?.toUpperCase()}
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="font-medium truncate">{payout.title}</p>
                              {payout.description && !(payout as any)._isExpandedLeg && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {payout.description}
                                </p>
                              )}
                              
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(payout.resolved_at)}
                              </p>
                            </div>

                            {/* Amounts */}
                            <div className="flex items-center gap-4 md:gap-6">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Stake</p>
                                <p className="font-mono text-sm">{payout.stake_xmr.toFixed(4)} XMR</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Payout</p>
                                <p className="font-mono text-sm">
                                  {displayPayout.toFixed(4)} XMR
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Profit/Loss</p>
                                <p className={cn(
                                  "font-mono text-sm font-bold",
                                  displayProfit > 0.00001 ? 'text-emerald-400' : displayProfit < -0.00001 ? 'text-red-400' : 'text-muted-foreground'
                                )}>
                                  {displayProfit > 0 ? '+' : ''}{displayProfit.toFixed(4)} XMR
                                </p>
                              </div>
                            </div>

                            {/* Transaction Link */}
                            <a
                              href={`${XMR_EXPLORER_URL}/${payout.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors group",
                                isWin(payout) && "bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/30",
                                isLoss(payout) && "bg-red-600/20 hover:bg-red-600/30 border border-red-600/30",
                                isRefund(payout) && "bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30"
                              )}
                            >
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Transaction ID</p>
                                <p className={cn(
                                  "font-mono text-sm",
                                  isWin(payout) && "text-emerald-400 group-hover:text-emerald-300",
                                  isLoss(payout) && "text-red-400 group-hover:text-red-300",
                                  isRefund(payout) && "text-blue-400 group-hover:text-blue-300"
                                )}>
                                  {truncateTxid(payout.tx_hash)}
                                </p>
                              </div>
                              <ExternalLink className={cn(
                                "w-4 h-4",
                                isWin(payout) && "text-emerald-400 group-hover:text-emerald-300",
                                isLoss(payout) && "text-red-400 group-hover:text-red-300",
                                isRefund(payout) && "text-blue-400 group-hover:text-blue-300"
                              )} />
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    )});
                  });
                })()}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first, last, and pages around current
                        return page === 1 || 
                               page === totalPages || 
                               Math.abs(page - currentPage) <= 1;
                      })
                      .map((page, idx, arr) => (
                        <span key={page} className="flex items-center">
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="px-1 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        </span>
                      ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-sm text-muted-foreground ml-2">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredPayouts.length)} of {filteredPayouts.length}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}