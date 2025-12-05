import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Activity, Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface ApiCallLog {
  id: string;
  function_name: string;
  endpoint: string;
  method: string;
  status_code: number | null;
  response_time_ms: number | null;
  error_message: string | null;
  created_at: string;
}

const ApiAnalytics = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["api-call-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_call_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as ApiCallLog[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate stats
  const totalCalls = logs?.length || 0;
  const successfulCalls = logs?.filter((l) => l.status_code && l.status_code >= 200 && l.status_code < 300).length || 0;
  const failedCalls = logs?.filter((l) => l.error_message || (l.status_code && l.status_code >= 400)).length || 0;
  const avgResponseTime = logs?.length
    ? Math.round(logs.filter((l) => l.response_time_ms).reduce((acc, l) => acc + (l.response_time_ms || 0), 0) / logs.filter((l) => l.response_time_ms).length)
    : 0;

  // Group by function for chart
  const callsByFunction = logs?.reduce((acc, log) => {
    acc[log.function_name] = (acc[log.function_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const functionChartData = Object.entries(callsByFunction).map(([name, count]) => ({
    name: name.replace("trocador-", "").replace("sync-", ""),
    calls: count,
  }));

  // Group by hour for timeline
  const callsByHour = logs?.reduce((acc, log) => {
    const hour = new Date(log.created_at).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
    });
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const timelineData = Object.entries(callsByHour)
    .slice(0, 24)
    .reverse()
    .map(([time, count]) => ({ time, calls: count }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Trocador API Analytics</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{totalCalls}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-green-500">{successfulCalls}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-destructive">{failedCalls}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{avgResponseTime}ms</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Calls by Function</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={functionChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calls Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" className="text-xs" angle={-45} textAnchor="end" height={80} />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line type="monotone" dataKey="calls" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Function</th>
                      <th className="text-left py-2 px-2">Endpoint</th>
                      <th className="text-left py-2 px-2">Status</th>
                      <th className="text-left py-2 px-2">Response Time</th>
                      <th className="text-left py-2 px-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs?.slice(0, 20).map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2 font-mono text-xs">{log.function_name}</td>
                        <td className="py-2 px-2 font-mono text-xs">{log.endpoint}</td>
                        <td className="py-2 px-2">
                          {log.error_message ? (
                            <Badge variant="destructive">Error</Badge>
                          ) : log.status_code && log.status_code >= 200 && log.status_code < 300 ? (
                            <Badge variant="default" className="bg-green-500">{log.status_code}</Badge>
                          ) : (
                            <Badge variant="secondary">{log.status_code || "N/A"}</Badge>
                          )}
                        </td>
                        <td className="py-2 px-2">{log.response_time_ms ? `${log.response_time_ms}ms` : "-"}</td>
                        <td className="py-2 px-2 text-muted-foreground text-xs">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default ApiAnalytics;
