import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, DollarSign, Eye, Target, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format, subDays, startOfDay, parseISO } from 'date-fns';

interface AnalyticsEvent {
  id: string;
  voucher_code: string;
  event_type: string;
  user_token: string | null;
  page: string | null;
  market_id: string | null;
  bet_amount: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface DailyStats {
  date: string;
  views: number;
  bets: number;
  volume: number;
  unique_users: number;
}

interface VoucherSummary {
  voucher_code: string;
  total_views: number;
  total_bets: number;
  total_volume: number;
  unique_users: number;
  conversion_rate: number;
}

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function VoucherAnalytics() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      
      if (!token) {
        setLoading(false);
        return;
      }

      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const startDate = subDays(new Date(), days).toISOString();

      const response = await fetch(
        `${supabaseUrl}/rest/v1/voucher_analytics?created_at=gte.${startDate}&order=created_at.desc`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin, dateRange]);

  // Filter events by selected voucher
  const filteredEvents = useMemo(() => {
    if (selectedVoucher === 'all') return events;
    return events.filter(e => e.voucher_code === selectedVoucher);
  }, [events, selectedVoucher]);

  // Get unique voucher codes
  const voucherCodes = useMemo(() => {
    const codes = new Set(events.map(e => e.voucher_code));
    return Array.from(codes).sort();
  }, [events]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const views = filteredEvents.filter(e => e.event_type === 'view').length;
    const bets = filteredEvents.filter(e => e.event_type === 'bet_placed').length;
    const volume = filteredEvents
      .filter(e => e.event_type === 'bet_placed')
      .reduce((sum, e) => sum + (e.bet_amount || 0), 0);
    const uniqueUsers = new Set(filteredEvents.map(e => e.user_token).filter(Boolean)).size;
    const conversionRate = views > 0 ? (bets / views) * 100 : 0;

    return { views, bets, volume, uniqueUsers, conversionRate };
  }, [filteredEvents]);

  // Calculate daily stats for charts
  const dailyStats = useMemo(() => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const statsMap = new Map<string, DailyStats>();

    // Initialize all days
    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      statsMap.set(date, { date, views: 0, bets: 0, volume: 0, unique_users: 0 });
    }

    // Aggregate events
    const dailyUsers = new Map<string, Set<string>>();
    
    filteredEvents.forEach(event => {
      const date = format(parseISO(event.created_at), 'yyyy-MM-dd');
      const stats = statsMap.get(date);
      if (!stats) return;

      if (event.event_type === 'view') {
        stats.views++;
      } else if (event.event_type === 'bet_placed') {
        stats.bets++;
        stats.volume += event.bet_amount || 0;
      }

      if (event.user_token) {
        if (!dailyUsers.has(date)) {
          dailyUsers.set(date, new Set());
        }
        dailyUsers.get(date)!.add(event.user_token);
      }
    });

    // Add unique users count
    dailyUsers.forEach((users, date) => {
      const stats = statsMap.get(date);
      if (stats) {
        stats.unique_users = users.size;
      }
    });

    return Array.from(statsMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredEvents, dateRange]);

  // Voucher comparison data
  const voucherComparison = useMemo(() => {
    const summaries = new Map<string, VoucherSummary>();

    events.forEach(event => {
      if (!summaries.has(event.voucher_code)) {
        summaries.set(event.voucher_code, {
          voucher_code: event.voucher_code,
          total_views: 0,
          total_bets: 0,
          total_volume: 0,
          unique_users: 0,
          conversion_rate: 0,
        });
      }

      const summary = summaries.get(event.voucher_code)!;
      if (event.event_type === 'view') {
        summary.total_views++;
      } else if (event.event_type === 'bet_placed') {
        summary.total_bets++;
        summary.total_volume += event.bet_amount || 0;
      }
    });

    // Calculate conversion rates and unique users
    const usersByVoucher = new Map<string, Set<string>>();
    events.forEach(event => {
      if (!usersByVoucher.has(event.voucher_code)) {
        usersByVoucher.set(event.voucher_code, new Set());
      }
      if (event.user_token) {
        usersByVoucher.get(event.voucher_code)!.add(event.user_token);
      }
    });

    summaries.forEach((summary, code) => {
      summary.unique_users = usersByVoucher.get(code)?.size || 0;
      summary.conversion_rate = summary.total_views > 0 
        ? (summary.total_bets / summary.total_views) * 100 
        : 0;
    });

    return Array.from(summaries.values())
      .sort((a, b) => b.total_volume - a.total_volume);
  }, [events]);

  // Event type distribution for pie chart
  const eventDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    filteredEvents.forEach(event => {
      counts.set(event.event_type, (counts.get(event.event_type) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredEvents]);

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Admin access required to view analytics.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Campaign Analytics</h1>
            <p className="text-muted-foreground">Track voucher performance and conversions</p>
          </div>
          
          <div className="flex gap-3">
            <Select value={selectedVoucher} onValueChange={setSelectedVoucher}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Vouchers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vouchers</SelectItem>
                {voucherCodes.map(code => (
                  <SelectItem key={code} value={code}>{code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" onClick={fetchAnalytics} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Eye className="w-4 h-4" /> Views
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summaryStats.views.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="w-4 h-4" /> Unique Users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summaryStats.uniqueUsers.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Target className="w-4 h-4" /> Bets Placed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summaryStats.bets.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Volume (USD)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${summaryStats.volume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Conversion Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center gap-2">
                {summaryStats.conversionRate.toFixed(1)}%
                {summaryStats.conversionRate > 5 ? (
                  <ArrowUpRight className="w-5 h-5 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="comparison">Voucher Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Views & Conversions Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Views & Conversions</CardTitle>
                  <CardDescription>Daily views and bets placed over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(val) => format(parseISO(val), 'MMM d')}
                          className="text-xs"
                        />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          labelFormatter={(val) => format(parseISO(val as string), 'MMM d, yyyy')}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="views" 
                          stackId="1"
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                          name="Views"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="bets" 
                          stackId="2"
                          stroke="hsl(var(--chart-2))" 
                          fill="hsl(var(--chart-2))"
                          fillOpacity={0.6}
                          name="Bets"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Event Distribution Pie */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Distribution</CardTitle>
                  <CardDescription>Breakdown by event type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={eventDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {eventDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Unique Users Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Unique Users per Day</CardTitle>
                <CardDescription>Number of unique visitors with voucher codes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => format(parseISO(val), 'MMM d')}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        labelFormatter={(val) => format(parseISO(val as string), 'MMM d, yyyy')}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="unique_users" fill="hsl(var(--chart-3))" name="Unique Users" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="volume" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Bet Volume</CardTitle>
                <CardDescription>Total USD volume from voucher referrals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => format(parseISO(val), 'MMM d')}
                        className="text-xs"
                      />
                      <YAxis 
                        tickFormatter={(val) => `$${val}`}
                        className="text-xs" 
                      />
                      <Tooltip 
                        labelFormatter={(val) => format(parseISO(val as string), 'MMM d, yyyy')}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Volume']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="volume" 
                        stroke="hsl(var(--chart-4))" 
                        fill="hsl(var(--chart-4))"
                        fillOpacity={0.4}
                        name="Volume"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Voucher Performance Comparison</CardTitle>
                <CardDescription>Compare all active voucher codes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Voucher Code</th>
                        <th className="text-right py-3 px-4 font-medium">Views</th>
                        <th className="text-right py-3 px-4 font-medium">Unique Users</th>
                        <th className="text-right py-3 px-4 font-medium">Bets</th>
                        <th className="text-right py-3 px-4 font-medium">Volume</th>
                        <th className="text-right py-3 px-4 font-medium">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voucherComparison.map((voucher) => (
                        <tr key={voucher.voucher_code} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="font-mono">
                              {voucher.voucher_code}
                            </Badge>
                          </td>
                          <td className="text-right py-3 px-4">{voucher.total_views.toLocaleString()}</td>
                          <td className="text-right py-3 px-4">{voucher.unique_users.toLocaleString()}</td>
                          <td className="text-right py-3 px-4">{voucher.total_bets.toLocaleString()}</td>
                          <td className="text-right py-3 px-4 font-medium">
                            ${voucher.total_volume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="text-right py-3 px-4">
                            <span className={voucher.conversion_rate > 5 ? 'text-green-500' : 'text-muted-foreground'}>
                              {voucher.conversion_rate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                      {voucherComparison.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground">
                            No voucher data available for this period
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Volume by Voucher Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Volume by Voucher</CardTitle>
                <CardDescription>Total betting volume comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={voucherComparison} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        type="number"
                        tickFormatter={(val) => `$${val}`}
                        className="text-xs"
                      />
                      <YAxis 
                        type="category"
                        dataKey="voucher_code"
                        width={120}
                        className="text-xs"
                      />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Volume']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="total_volume" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Events */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Latest 20 analytics events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Time</th>
                    <th className="text-left py-2 px-3 font-medium">Voucher</th>
                    <th className="text-left py-2 px-3 font-medium">Event</th>
                    <th className="text-left py-2 px-3 font-medium">Page</th>
                    <th className="text-right py-2 px-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.slice(0, 20).map((event) => (
                    <tr key={event.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 text-muted-foreground">
                        {format(parseISO(event.created_at), 'MMM d, HH:mm')}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {event.voucher_code}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        <Badge 
                          variant={event.event_type === 'bet_placed' ? 'default' : 'secondary'}
                        >
                          {event.event_type}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground font-mono text-xs">
                        {event.page || '-'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {event.bet_amount ? `$${event.bet_amount.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No events recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
