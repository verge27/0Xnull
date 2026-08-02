import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Freshness {
  checked_at: string;
  sitemap_url: string;
  generated_count: number;
  served_count: number;
  is_stale: boolean;
  missing_from_served: string[];
  stale_in_served: string[];
}

export function SitemapFreshnessCard() {
  const [data, setData] = useState<Freshness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async (notify: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('sitemap-freshness');
      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);
      setData(result as Freshness);
      if (result.is_stale) {
        toast.warning(
          `Sitemap out of date: ${result.generated_count} generated URLs vs ${result.served_count} served. Publish to ship the new sitemap.xml.`,
          { duration: 10000 },
        );
      } else if (notify) {
        toast.success('Served sitemap.xml matches the generated one.');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('sitemap-freshness failed:', message);
      setError(message);
      if (notify) toast.error('Sitemap freshness check failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    check(false);
  }, [check]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            Sitemap freshness
            {data &&
              (data.is_stale ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> Out of date
                </Badge>
              ) : (
                <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                  <CheckCircle2 className="h-3 w-3" /> In sync
                </Badge>
              ))}
          </CardTitle>
          <CardDescription>
            Compares the generated sitemap against the live {data?.sitemap_url ?? '/sitemap.xml'} Google fetches.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => check(true)} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Check
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {error ? (
          <p className="text-destructive">{error}</p>
        ) : !data ? (
          <p className="text-muted-foreground">Checking…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Generated URLs</p>
                <p className="font-mono text-lg">{data.generated_count}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Served URLs</p>
                <p className="font-mono text-lg">{data.served_count}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Checked</p>
                <p>{format(new Date(data.checked_at), 'd MMM HH:mm')}</p>
              </div>
            </div>

            {data.missing_from_served.length > 0 && (
              <div>
                <p className="mb-1 font-medium text-destructive">
                  Missing from the live sitemap ({data.missing_from_served.length})
                </p>
                <ul className="space-y-1 font-mono text-xs text-muted-foreground">
                  {data.missing_from_served.map((url) => (
                    <li key={url} className="truncate">{url}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.stale_in_served.length > 0 && (
              <div>
                <p className="mb-1 font-medium text-amber-500">
                  Still served but no longer generated ({data.stale_in_served.length})
                </p>
                <ul className="space-y-1 font-mono text-xs text-muted-foreground">
                  {data.stale_in_served.map((url) => (
                    <li key={url} className="truncate">{url}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.is_stale && (
              <p className="text-muted-foreground">
                Click Publish to redeploy so the live file matches the generated set.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
