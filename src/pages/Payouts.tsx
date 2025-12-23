import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Wallet, ExternalLink, Trophy, CheckCircle, ArrowLeft, Banknote, TrendingUp, RefreshCw, Layers, Filter, ChevronLeft, ChevronRight, CalendarIcon, X } from 'lucide-react';
import { api, type PayoutEntry } from '@/services/api';
import { cn } from '@/lib/utils';

const XMR_EXPLORER_URL = 'https://xmrchain.net/tx';

export default function Payouts() {
  const [payouts, setPayouts] = useState<PayoutEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'single' | 'multibet' | 'refund'>('all');
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

  // Detect refunds: Trust outcome over payout_type
  // If side matches outcome = WIN, if side doesn't match outcome = REFUND
  const isRefund = (payout: PayoutEntry) => {
    // For single bets: trust side vs outcome comparison
    if (payout.market_id !== 'multibet' && payout.side && payout.outcome) {
      const normalizedSide = normalizeSide(payout.side);
      const normalizedOutcome = normalizeSide(payout.outcome);
      // If side matches outcome, it's a WIN (not refund), regardless of payout_type
      if (normalizedSide === normalizedOutcome) return false;
      // If side doesn't match outcome, it's a REFUND
      return true;
    }
    
    // For multibets or missing data, fall back to payout_type
    return payout.payout_type === 'refund';
  };
  
  // Calculate totals
  const isRefundPayout = isRefund; // Use same logic
  
  const totalPaidOut = payouts.reduce((sum, p) => sum + p.payout_xmr, 0);
  
  // isWin: trust outcome over payout_type - if side matches outcome and it's not a multibet, it's a win
  const isWin = (payout: PayoutEntry) => {
    if (isRefund(payout)) return false;
    // For single bets: if side matches outcome, it's a win regardless of payout_type
    if (payout.market_id !== 'multibet' && payout.side && payout.outcome) {
      const normalizedSide = normalizeSide(payout.side);
      const normalizedOutcome = normalizeSide(payout.outcome);
      if (normalizedSide === normalizedOutcome) return true;
    }
    // Fall back to payout_type for multibets
    return payout.payout_type === 'win' || payout.payout_type === 'multibet_win';
  };
  
  const winPayouts = payouts.filter(p => isWin(p));
  const refundPayouts = payouts.filter(p => isRefundPayout(p));
  const multibetPayouts = payouts.filter(p => p.market_id === 'multibet');

  const isMultibet = (payout: PayoutEntry) => payout.market_id === 'multibet';
  const isSingleWin = (payout: PayoutEntry) => isWin(payout) && payout.market_id !== 'multibet';

  // Filter payouts based on selected filter and date range
  const filteredPayouts = payouts.filter(payout => {
    // Type filter
    let matchesType = true;
    switch (filter) {
      case 'single':
        matchesType = isSingleWin(payout);
        break;
      case 'multibet':
        matchesType = isMultibet(payout);
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
                  <p className="text-sm text-muted-foreground">Multibet Wins</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {multibetPayouts.length}
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

        {/* Payouts List */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              {filter === 'all' ? 'All Payouts' : filter === 'single' ? 'Single Bet Wins' : filter === 'multibet' ? 'Multibet Wins' : 'Refunds'} ({filteredPayouts.length})
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
                variant={filter === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('single')}
                className={filter === 'single' ? '' : 'hover:border-primary/50'}
              >
                <Trophy className="w-3 h-3 mr-1" />
                Single Wins
              </Button>
              <Button
                variant={filter === 'multibet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('multibet')}
                className={filter === 'multibet' ? 'bg-purple-600 hover:bg-purple-700' : 'hover:border-purple-500/50'}
              >
                <Layers className="w-3 h-3 mr-1" />
                Multibets
              </Button>
              <Button
                variant={filter === 'refund' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('refund')}
                className={filter === 'refund' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:border-blue-500/50'}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refunds
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
                {paginatedPayouts.map(payout => (
                <Card 
                  key={payout.bet_id} 
                  className={isMultibet(payout)
                    ? 'border-purple-600/30 bg-purple-950/10'
                    : isWin(payout) 
                      ? 'border-emerald-600/30 bg-emerald-950/10' 
                      : 'border-blue-600/30 bg-blue-950/10'
                  }
                >
                  <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Market Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {isMultibet(payout) ? (
                            <>
                              <Badge className="bg-purple-600">
                                <Layers className="w-3 h-3 mr-1" />
                                Multibet
                              </Badge>
                              {/* Show if it's a partial refund situation */}
                              {payout.payout_type === 'refund' && (
                                <Badge className="bg-blue-600 text-xs">
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  Partial Refund
                                </Badge>
                              )}
                            </>
                          ) : (
                            <Badge className={isWin(payout) ? 'bg-emerald-600' : 'bg-blue-600'}>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {isWin(payout) ? 'Winner' : 'Refund'}
                            </Badge>
                          )}
                          {!isMultibet(payout) && (
                            <>
                              <Badge variant={payout.side === 'YES' ? 'default' : 'destructive'} className="text-xs">
                                {payout.side}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Outcome: {payout.outcome}
                              </Badge>
                            </>
                          )}
                        </div>
                        
                        {/* For multibets, show individual leg breakdown */}
                        {isMultibet(payout) ? (
                          <div className="space-y-1">
                            {payout.title.split(',').map((leg, idx) => {
                              const legTitle = leg.trim();
                              // Try to detect if this leg was refunded based on description
                              const desc = (payout.description || '').toLowerCase();
                              // Check if description mentions this leg being refunded
                              const isLegRefund = desc.includes('refund') && 
                                (desc.includes(legTitle.toLowerCase().slice(0, 20)) || 
                                 (idx === payout.title.split(',').length - 1 && desc.includes('leg') && desc.includes(`${idx + 1}`)));
                              
                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Leg {idx + 1}:</span>
                                  <span className="text-sm font-medium truncate flex-1">{legTitle}</span>
                                  {/* If payout_type is refund and stake equals payout, all legs likely refunded */}
                                  {payout.payout_type === 'refund' ? (
                                    <Badge variant="outline" className="text-xs bg-blue-600/20 border-blue-600/50 text-blue-400">
                                      <RefreshCw className="w-2 h-2 mr-1" />
                                      Refund
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs bg-emerald-600/20 border-emerald-600/50 text-emerald-400">
                                      <CheckCircle className="w-2 h-2 mr-1" />
                                      Win
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <>
                            <p className="font-medium truncate">{payout.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {payout.description}
                            </p>
                          </>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(payout.resolved_at)}
                        </p>
                      </div>

                      {/* Amounts */}
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Stake</p>
                          <p className="font-mono text-sm">{payout.stake_xmr.toFixed(4)} XMR</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Payout</p>
                          <p className={`font-mono text-lg font-bold ${isMultibet(payout) ? 'text-purple-400' : 'text-emerald-400'}`}>
                            {payout.payout_xmr.toFixed(4)} XMR
                          </p>
                        </div>
                      </div>

                      {/* Transaction Link */}
                      <a
                        href={`${XMR_EXPLORER_URL}/${payout.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors group ${
                          isMultibet(payout) 
                            ? 'bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/30'
                            : 'bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/30'
                        }`}
                      >
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Transaction ID</p>
                          <p className={`font-mono text-sm ${isMultibet(payout) ? 'text-purple-400 group-hover:text-purple-300' : 'text-emerald-400 group-hover:text-emerald-300'}`}>
                            {truncateTxid(payout.tx_hash)}
                          </p>
                        </div>
                        <ExternalLink className={`w-4 h-4 ${isMultibet(payout) ? 'text-purple-400 group-hover:text-purple-300' : 'text-emerald-400 group-hover:text-emerald-300'}`} />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
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