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
import { RefreshCw, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { SitemapFreshnessCard } from '@/components/seo/SitemapFreshnessCard';
import { DeployRecheckCard } from '@/components/seo/DeployRecheckCard';


interface Snapshot {
  id: string;
  url: string;
  verdict: string | null;
  coverage_state: string | null;
  robots_txt_state: string | null;
  indexing_state: string | null;
  page_fetch_state: string | null;
  google_canonical: string | null;
  user_canonical: string | null;
  last_crawl_time: string | null;
  error_message: string | null;
  checked_at: string;
}

const LABELS: Record<string, string> = {
  'https://0xnull.io/blog/anonymous-vps-hosting-crypto-guide': 'Anonymous VPS guide',
  'https://0xnull.io/blog/cs2-betting-guide-crypto': 'CS2 betting guide',
};

function verdictBadge(snapshot: Snapshot) {
  if (snapshot.error_message) {
    return <Badge variant="destructive">Check failed</Badge>;
  }
  if (snapshot.verdict === 'PASS') {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Indexed</Badge>;
  }
  if (snapshot.verdict === 'NEUTRAL' || snapshot.verdict === 'PARTIAL') {
    return <Badge variant="secondary">{snapshot.verdict}</Badge>;
  }
  return <Badge variant="destructive">{snapshot.verdict ?? 'Unknown'}</Badge>;
}

export default function SeoCoverage() {
  useSEO({ title: 'Search Console coverage — internal', description: 'Internal indexing coverage dashboard.' });
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [tracked, setTracked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh: boolean) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('seo-index-coverage', {
        method: refresh ? 'POST' : 'GET',
      });
      if (error) throw error;
      setSnapshots((data?.snapshots ?? []) as Snapshot[]);
      setTracked((data?.tracked ?? []) as string[]);
      if (refresh) toast.success('Search Console data refreshed');
    } catch (e) {
      console.error('seo-index-coverage failed:', e);
      toast.error('Could not load Search Console coverage');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load(false);
  }, [isAdmin, load]);

  const latestByUrl = useMemo(() => {
    const map = new Map<string, Snapshot>();
    for (const s of snapshots) if (!map.has(s.url)) map.set(s.url, s);
    return map;
  }, [snapshots]);

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
            <h1 className="text-3xl font-bold">Search Console indexing coverage</h1>
            <p className="mt-1 text-muted-foreground">
              Tracks index status, last crawl and errors for the VPS and CS2 guides over time.
            </p>
          </div>
          <Button onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Checking…' : 'Check now'}
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {tracked.map((url) => {
            const latest = latestByUrl.get(url);
            return (
              <Card key={url}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between gap-2 text-lg">
                    <span>{LABELS[url] ?? url}</span>
                    {latest ? verdictBadge(latest) : <Badge variant="outline">No data</Badge>}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 break-all">
                    <a href={url} target="_blank" rel="noreferrer" className="hover:underline">
                      {url.replace('https://0xnull.io', '')}
                    </a>
                    <ExternalLink className="h-3 w-3" />
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {latest ? (
                    <>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Coverage</span>
                        <span className="text-right">{latest.coverage_state ?? '—'}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Last crawled</span>
                        <span className="text-right">
                          {latest.last_crawl_time
                            ? format(new Date(latest.last_crawl_time), 'd MMM yyyy HH:mm')
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Robots.txt</span>
                        <span className="flex items-center gap-1 text-right">
                          {latest.robots_txt_state === 'ALLOWED' ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          )}
                          {latest.robots_txt_state ?? '—'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Fetch</span>
                        <span className="text-right">{latest.page_fetch_state ?? '—'}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Canonical match</span>
                        <span className="text-right">
                          {latest.google_canonical && latest.user_canonical
                            ? latest.google_canonical === latest.user_canonical
                              ? 'Matches'
                              : 'Mismatch'
                            : '—'}
                        </span>
                      </div>
                      {latest.error_message && (
                        <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                          {latest.error_message}
                        </p>
                      )}
                      <p className="pt-1 text-xs text-muted-foreground">
                        Checked {format(new Date(latest.checked_at), 'd MMM yyyy HH:mm')}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Run a check to record the first snapshot.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>

        <SitemapFreshnessCard />



        <Card>
          <CardHeader>
            <CardTitle>Snapshot history</CardTitle>
            <CardDescription>Every recorded check, newest first.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : snapshots.length === 0 ? (
              <p className="text-muted-foreground">No snapshots recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Checked</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>Verdict</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>Last crawled</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshots.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(s.checked_at), 'd MMM HH:mm')}
                      </TableCell>
                      <TableCell>{LABELS[s.url] ?? s.url}</TableCell>
                      <TableCell>{verdictBadge(s)}</TableCell>
                      <TableCell>{s.coverage_state ?? '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {s.last_crawl_time ? format(new Date(s.last_crawl_time), 'd MMM HH:mm') : '—'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-destructive">
                        {s.error_message ?? ''}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
