import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useSEO } from '@/hooks/useSEO';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface SourceRow {
  id: string;
  name: string;
  url: string;
  kind: string;
  mode: string;
  escrow: boolean;
  enabled: boolean;
  last_ok_at: string | null;
  last_error: string | null;
}

interface FetchRun {
  id: number;
  source_id: string | null;
  started_at: string;
  finished_at: string | null;
  fetched: number | null;
  inserted: number | null;
  updated: number | null;
  blocked: number | null;
  error: string | null;
}

interface CronRow {
  jobname: string;
  schedule: string;
  active: boolean;
}

interface JobCount {
  source_id: string;
  total: number;
  hidden: number;
  last_seen_at: string | null;
}

const relative = (iso: string | null) => {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
};

const absolute = (iso: string | null) => (iso ? new Date(iso).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '—');

export default function JobsAdmin() {
  useSEO({ title: 'Jobs ingest dashboard — internal', description: 'Internal dashboard for the /work jobs ingest pipeline.' });
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [runs, setRuns] = useState<FetchRun[]>([]);
  const [counts, setCounts] = useState<JobCount[]>([]);
  const [crons, setCrons] = useState<CronRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sourcesRes, runsRes, jobsRes, cronRes] = await Promise.all([
        supabase.from('sources').select('*').order('name'),
        supabase.from('fetch_runs').select('*').order('started_at', { ascending: false }).limit(30),
        supabase.from('jobs').select('source_id, hidden, last_seen_at').limit(5000),
        supabase.rpc('get_jobs_cron_schedules'),
      ]);

      if (sourcesRes.error) throw sourcesRes.error;
      setSources((sourcesRes.data ?? []) as SourceRow[]);
      if (!runsRes.error) setRuns((runsRes.data ?? []) as FetchRun[]);
      if (!cronRes.error) setCrons((cronRes.data ?? []) as CronRow[]);

      if (!jobsRes.error) {
        const map = new Map<string, JobCount>();
        for (const row of (jobsRes.data ?? []) as { source_id: string; hidden: boolean; last_seen_at: string }[]) {
          const entry = map.get(row.source_id) ?? { source_id: row.source_id, total: 0, hidden: 0, last_seen_at: null };
          entry.total += 1;
          if (row.hidden) entry.hidden += 1;
          if (!entry.last_seen_at || row.last_seen_at > entry.last_seen_at) entry.last_seen_at = row.last_seen_at;
          map.set(row.source_id, entry);
        }
        setCounts([...map.values()]);
      }
    } catch (e) {
      console.error('jobs admin load failed:', e);
      toast.error('Could not load ingest data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const countBySource = useMemo(() => new Map(counts.map((c) => [c.source_id, c])), [counts]);
  const lastRunBySource = useMemo(() => {
    const map = new Map<string, FetchRun>();
    for (const run of runs) if (run.source_id && !map.has(run.source_id)) map.set(run.source_id, run);
    return map;
  }, [runs]);

  const totals = useMemo(() => {
    const total = counts.reduce((sum, c) => sum + c.total, 0);
    const hidden = counts.reduce((sum, c) => sum + c.hidden, 0);
    return { total, hidden, visible: total - hidden, active: sources.filter((s) => s.enabled).length };
  }, [counts, sources]);

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-muted-foreground">Checking access…</main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <h1 className="text-2xl font-semibold">Admin access required</h1>
          <p className="mt-2 text-muted-foreground">This internal dashboard is restricted to site admins.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Jobs ingest dashboard</h1>
            <p className="mt-1 text-muted-foreground">Sources, ingest runs, job counts and timer schedule powering /work.</p>
          </div>
          <Button onClick={load} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Active sources', value: `${totals.active} / ${sources.length}` },
            { label: 'Total jobs', value: totals.total },
            { label: 'Visible on /work', value: totals.visible },
            { label: 'Hidden (blocklist)', value: totals.hidden },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-3xl font-mono">{stat.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Sources</CardTitle>
            <CardDescription>Last successful ingest, job counts and current error state per source.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Jobs</TableHead>
                  <TableHead>Last ingest</TableHead>
                  <TableHead>Last run result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => {
                  const count = countBySource.get(source.id);
                  const run = lastRunBySource.get(source.id);
                  return (
                    <TableRow key={source.id}>
                      <TableCell>
                        <div className="font-medium">{source.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{source.id}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={source.mode === 'ingest' ? 'default' : 'secondary'}>{source.mode}</Badge>
                      </TableCell>
                      <TableCell>
                        {source.enabled ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600">Enabled</Badge>
                        ) : (
                          <Badge variant="destructive">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {count?.total ?? 0}
                        {count?.hidden ? <span className="text-muted-foreground"> ({count.hidden} hidden)</span> : null}
                      </TableCell>
                      <TableCell>
                        <div>{relative(source.last_ok_at)}</div>
                        <div className="text-xs text-muted-foreground">{absolute(source.last_ok_at)}</div>
                      </TableCell>
                      <TableCell className="max-w-[22rem]">
                        {source.last_error ? (
                          <span className="flex items-start gap-1 text-sm text-destructive">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            {source.last_error}
                          </span>
                        ) : run ? (
                          <span className="font-mono text-xs text-muted-foreground">
                            {run.fetched ?? 0} fetched · {run.inserted ?? 0} new · {run.updated ?? 0} updated · {run.blocked ?? 0} blocked
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">No recorded run</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> Timer schedule
              </CardTitle>
              <CardDescription>Scheduled runs that drive the ingest pipeline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {crons.length === 0 && <p className="text-sm text-muted-foreground">No jobs-related schedules found.</p>}
              {crons.map((cron) => (
                <div key={cron.jobname} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div>
                    <div className="font-medium">{cron.jobname}</div>
                    <div className="font-mono text-xs text-muted-foreground">{cron.schedule}</div>
                  </div>
                  <Badge variant={cron.active ? 'default' : 'destructive'}>{cron.active ? 'Active' : 'Paused'}</Badge>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Push-ingest sources (mode <span className="font-mono">ingest</span>) are driven by an external timer that posts to the
                aggregate-jobs endpoint every 30 minutes; their freshness is shown by last ingest above.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent ingest runs</CardTitle>
              <CardDescription>Last 30 recorded runs, newest first.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[28rem] overflow-y-auto space-y-2">
              {runs.length === 0 && <p className="text-sm text-muted-foreground">No run history available.</p>}
              {runs.map((run) => (
                <div key={run.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{run.source_id ?? 'all sources'}</span>
                    <span className="text-xs text-muted-foreground">{relative(run.started_at)}</span>
                  </div>
                  {run.error ? (
                    <p className="mt-1 text-destructive">{run.error}</p>
                  ) : (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {run.fetched ?? 0} fetched · {run.inserted ?? 0} new · {run.updated ?? 0} updated · {run.blocked ?? 0} blocked
                      {run.finished_at ? '' : ' · running'}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
