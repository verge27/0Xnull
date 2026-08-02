import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface DeployCheck {
  id: string;
  deploy_fingerprint: string;
  asset_count: number | null;
  served_sitemap_count: number | null;
  triggered_by: string;
  forced: boolean;
  sitemap_submitted: boolean;
  sitemap_status: Record<string, unknown> | null;
  inspection_summary: Record<string, string | null> | null;
  checked_at: string;
}

const SHORT: Record<string, string> = {
  'https://0xnull.io/blog/anonymous-vps-hosting-crypto-guide': 'VPS guide',
  'https://0xnull.io/blog/cs2-betting-guide-crypto': 'CS2 guide',
};

export function DeployRecheckCard() {
  const [latest, setLatest] = useState<DeployCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('seo_deploy_checks')
      .select('*')
      .order('checked_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) console.error('seo_deploy_checks read failed:', error);
    setLatest((data as DeployCheck | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runNow = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('seo-deploy-recheck', {
        method: 'POST',
        body: { force: true },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(
        data?.status === 'skipped'
          ? 'No new deploy detected'
          : `Recheck done — sitemap ${data?.sitemap_submitted ? 'resubmitted' : 'submission failed'}`,
      );
      await load();
    } catch (e) {
      console.error('seo-deploy-recheck failed:', e);
      toast.error('Post-deploy recheck failed');
    } finally {
      setRunning(false);
    }
  };

  const status = latest?.sitemap_status as
    | { last_downloaded?: string | null; submitted_urls?: number | null; indexed_urls?: number | null; is_pending?: boolean | null }
    | null
    | undefined;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-lg">
          <span>Post-deploy Search Console recheck</span>
          {loading ? (
            <Badge variant="outline">Loading…</Badge>
          ) : latest?.sitemap_submitted ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-600">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Last run OK
            </Badge>
          ) : latest ? (
            <Badge variant="destructive">
              <AlertTriangle className="mr-1 h-3 w-3" /> Last run failed
            </Badge>
          ) : (
            <Badge variant="outline">No runs yet</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Runs automatically every 10 minutes, detects a new deploy from the served asset and sitemap fingerprint, then
          resubmits sitemap.xml and re-inspects the two tracked guides.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {latest ? (
          <>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDistanceToNow(new Date(latest.checked_at), { addSuffix: true })} ({latest.triggered_by}
                {latest.forced ? ', forced' : ''})
              </span>
              <span>Served sitemap URLs: {latest.served_sitemap_count ?? '—'}</span>
              <span className="font-mono text-xs">build {latest.deploy_fingerprint.slice(0, 10)}</span>
            </div>

            {status ? (
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-muted-foreground">
                <span>Google last downloaded: {status.last_downloaded ?? 'unknown'}</span>
                <span>Submitted: {status.submitted_urls ?? '—'}</span>
                <span>Indexed: {status.indexed_urls ?? '—'}</span>
                {status.is_pending ? <Badge variant="secondary">Pending</Badge> : null}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {Object.entries(latest.inspection_summary ?? {}).map(([url, verdict]) => (
                <Badge key={url} variant={verdict === 'PASS' ? 'default' : 'secondary'} className="font-normal">
                  {SHORT[url] ?? url}: {verdict ?? 'unknown'}
                </Badge>
              ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">
            No post-deploy recheck recorded yet. It fires on the next detected deploy, or run one now.
          </p>
        )}

        <Button size="sm" variant="outline" onClick={runNow} disabled={running}>
          <RefreshCw className={`mr-2 h-4 w-4 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Rechecking…' : 'Run recheck now'}
        </Button>
      </CardContent>
    </Card>
  );
}
