import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface RobotsCheck {
  checked_at: string;
  robots_url?: string;
  http_status?: number | null;
  sitemap_directive?: string | null;
  sitemap_http_status?: number | null;
  sitemap_url_count?: number | null;
  is_healthy: boolean;
  changed_from_previous: boolean;
  issues: string[];
  alert_sent?: boolean;
}

export function RobotsMonitorCard() {
  const [latest, setLatest] = useState<RobotsCheck | null>(null);
  const [history, setHistory] = useState<RobotsCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from('robots_txt_checks')
      .select('checked_at, http_status, sitemap_directive, sitemap_http_status, sitemap_url_count, is_healthy, changed_from_previous, issues')
      .order('checked_at', { ascending: false })
      .limit(10);
    if (data) {
      const rows = data as unknown as RobotsCheck[];
      setHistory(rows);
      setLatest((prev) => prev ?? rows[0] ?? null);
    }
  }, []);

  const runCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('robots-monitor');
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setLatest(data as RobotsCheck);
      if (!data.is_healthy) {
        toast.error(`robots.txt problem: ${(data.issues ?? []).join(' | ')}`, { duration: 10000 });
      } else if (data.changed_from_previous) {
        toast.warning('robots.txt content changed since the last check.');
      } else {
        toast.success('robots.txt and its Sitemap directive look good.');
      }
      await loadHistory();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('robots-monitor failed:', message);
      setError(message);
      toast.error('robots.txt check failed');
    } finally {
      setLoading(false);
    }
  }, [loadHistory]);

  useEffect(() => {
    loadHistory().finally(() => setLoading(false));
  }, [loadHistory]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            robots.txt monitor
            {latest &&
              (latest.is_healthy ? (
                <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                  <CheckCircle2 className="h-3 w-3" /> Healthy
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> Problem
                </Badge>
              ))}
          </CardTitle>
          <CardDescription>
            Runs hourly: re-fetches robots.txt, checks the Sitemap directive is present and reachable, then emails
            admin@0xnull.io whenever it changes or breaks.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={runCheck} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Check now
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {error ? (
          <p className="text-destructive">{error}</p>
        ) : !latest ? (
          <p className="text-muted-foreground">No checks recorded yet — run one to get started.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground">robots.txt</p>
                <p className="font-mono text-lg">HTTP {latest.http_status ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sitemap reachable</p>
                <p className="font-mono text-lg">HTTP {latest.sitemap_http_status ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sitemap URLs</p>
                <p className="font-mono text-lg">{latest.sitemap_url_count ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Checked</p>
                <p>{format(new Date(latest.checked_at), 'd MMM HH:mm')}</p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground">Sitemap directive</p>
              <p className="break-all font-mono text-xs">{latest.sitemap_directive ?? 'MISSING'}</p>
            </div>

            {latest.issues?.length > 0 && (
              <ul className="space-y-1 text-xs text-destructive">
                {latest.issues.map((issue) => (
                  <li key={issue}>• {issue}</li>
                ))}
              </ul>
            )}

            {history.length > 1 && (
              <div>
                <p className="mb-1 font-medium">Recent checks</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {history.map((row) => (
                    <li key={row.checked_at} className="flex items-center gap-2">
                      <span className="font-mono">{format(new Date(row.checked_at), 'd MMM HH:mm')}</span>
                      <span>{row.is_healthy ? 'healthy' : 'problem'}</span>
                      {row.changed_from_previous && <span className="text-amber-500">changed</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
