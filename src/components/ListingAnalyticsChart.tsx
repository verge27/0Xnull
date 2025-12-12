import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2, TrendingUp, Eye, DollarSign } from 'lucide-react';
import { DbListing } from '@/hooks/useListings';

interface AnalyticsData {
  date: string;
  views: number;
  sales: number;
  revenue: number;
}

interface ListingAnalyticsChartProps {
  listings: DbListing[];
}

export const ListingAnalyticsChart = ({ listings }: ListingAnalyticsChartProps) => {
  const [selectedListing, setSelectedListing] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ views: 0, sales: 0, revenue: 0 });

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (listings.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));
      const startDateStr = startDate.toISOString().split('T')[0];

      let query = supabase
        .from('listing_analytics')
        .select('date, views, sales, revenue, listing_id')
        .gte('date', startDateStr)
        .order('date', { ascending: true });

      if (selectedListing !== 'all') {
        query = query.eq('listing_id', selectedListing);
      } else {
        query = query.in('listing_id', listings.map(l => l.id));
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching analytics:', error);
        setLoading(false);
        return;
      }

      // Aggregate data by date
      const aggregated: Record<string, AnalyticsData> = {};
      
      // Initialize all dates in range
      for (let i = 0; i <= parseInt(timeRange); i++) {
        const date = new Date();
        date.setDate(date.getDate() - (parseInt(timeRange) - i));
        const dateStr = date.toISOString().split('T')[0];
        aggregated[dateStr] = { date: dateStr, views: 0, sales: 0, revenue: 0 };
      }

      // Fill in actual data
      data?.forEach(row => {
        if (aggregated[row.date]) {
          aggregated[row.date].views += row.views || 0;
          aggregated[row.date].sales += row.sales || 0;
          aggregated[row.date].revenue += Number(row.revenue) || 0;
        }
      });

      const chartData = Object.values(aggregated).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Calculate totals
      const totalViews = chartData.reduce((sum, d) => sum + d.views, 0);
      const totalSales = chartData.reduce((sum, d) => sum + d.sales, 0);
      const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);

      setAnalyticsData(chartData);
      setTotals({ views: totalViews, sales: totalSales, revenue: totalRevenue });
      setLoading(false);
    };

    fetchAnalytics();
  }, [listings, selectedListing, timeRange]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (listings.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedListing} onValueChange={setSelectedListing}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select listing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Listings</SelectItem>
                {listings.map(listing => (
                  <SelectItem key={listing.id} value={listing.id}>
                    {listing.title.length > 20 ? listing.title.slice(0, 20) + '...' : listing.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as '7' | '30' | '90')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm mb-1">
              <Eye className="w-3 h-3" />
              Views
            </div>
            <div className="text-2xl font-bold">{totals.views.toLocaleString()}</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm mb-1">
              <TrendingUp className="w-3 h-3" />
              Sales
            </div>
            <div className="text-2xl font-bold text-primary">{totals.sales.toLocaleString()}</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm mb-1">
              <DollarSign className="w-3 h-3" />
              Revenue
            </div>
            <div className="text-2xl font-bold text-primary">${totals.revenue.toFixed(2)}</div>
          </div>
        </div>

        {/* Chart */}
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : analyticsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="left"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelFormatter={formatDate}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="views"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                dot={false}
                name="Views"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="sales"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="Sales"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No analytics data yet. Views and sales will appear here as they occur.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
