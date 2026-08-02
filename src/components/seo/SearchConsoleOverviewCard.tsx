import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, AlertTriangle, CheckCircle2, ScanSearch } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Row {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface Inspection {
  url: string;
  verdict?: string | null;
  coverage_state?: string | null;
  robots_txt_state?: string | null;
  page_fetch_state?: string | null;
  last_crawl_time?: string | null;
  error?: string | null;
  error_message?: string | null;
}

interface SitemapEntry {
  path: string;
  lastDownloaded: string | null;
  isPending: boolean;
  errors: number;
  warnings: number;
  submitted: number;
}

interface Health {
  property: string;
  totals: { clicks: number; impressions: number; ctr: number; avgPosition: number };
  pages: Row[];
  queries: Row[];
  sitemaps: SitemapEntry[];
  inspections: Inspection[];
  deepScan: boolean;
  checkedAt: string;
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const short = (u: string) => u.replace('https://0xnull.io', '') || '/';

function verdictBadge(i: Inspection) {
  if (i.error || i.error_message) return <Badge variant="destructive">Check failed</Badge>;
  if (i.verdict === 'PASS') return <Badge className="bg-emerald-600 hover:bg-emerald-600">Indexed</Badge>;
  if (i.verdict === 'NEUTRAL' || i.verdict === 'PARTIAL') return <Badge variant="secondary">{i.verdict}</Badge>;
  return <Badge variant="destructive">{i.verdict ?? 'Unknown'}</Badge>;
}

export function SearchConsoleOverviewCard() {
  const [data, setData] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'refresh' | 'scan' | null>(null);

  const load = useCallback(async (mode: 'load' | 'refresh' | 'scan') => {
    if (mode === 'load') setLoading(true);
    else setBusy(mode === 'scan' ? 'scan' : 'refresh');
    try {
      const { data: res, error } = await supabase.functions.invoke('seo-site-health', {
        body: { deepScan: mode === 'scan' },
      });
      if (error) throw error;
      if (res?.error) throw new Error(res.error);
      setData(res as Health);
      if (mode !== 'load') toast.success(mode === 'scan' ? 'Crawl scan complete' : 'Search Console data refreshed');
    } catch (e) {
      console.error('seo-site-health failed:', e);
      toast.error('Could not load Search Console metrics');
    } finally {
      setLoading(false);
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    load('load');
  }, [load]);

  const problems = (data?.inspections ?? []).filter(
    (i) => i.error || i.error_message || (i.verdict && i.verdict !== 'PASS') || i.robots_txt_state === 'DISALLOWED',
  );

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Search Console overview</CardTitle>
          <CardDescription>
            Last 28 days of performance plus indexing and crawl errors
            {data ? ` · ${data.property}` : ''}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => load('refresh')} disabled={busy !== null}>
            <RefreshCw className={`mr-2 h-4 w-4 ${busy === 'refresh' ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => load('scan')} disabled={busy !== null}>
            <ScanSearch className={`mr-2 h-4 w-4 ${busy === 'scan' ? 'animate-pulse' : ''}`} />
            {busy === 'scan' ? 'Scanning…' : 'Scan crawl status'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-muted-foreground">Loading Search Console metrics…</p>
        ) : !data ? (
          <p className="text-muted-foreground">No data available.</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Clicks', value: data.totals.clicks.toLocaleString() },
                { label: 'Impressions', value: data.totals.impressions.toLocaleString() },
                { label: 'CTR', value: pct(data.totals.ctr) },
                { label: 'Avg. position', value: data.totals.avgPosition.toFixed(1) },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border bg-card/50 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-2xl font-semibold">{s.value}</p>
                </div>
              ))}
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                {problems.length === 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                Indexing and crawl issues
                <span className="text-muted-foreground font-normal">
                  ({problems.length} of {data.inspections.length} checked URLs)
                </span>
              </h3>
              {data.inspections.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Run "Scan crawl status" to inspect the first sitemap URLs in Search Console.
                </p>
              ) : problems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No indexing or crawl errors on the checked URLs.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Coverage</TableHead>
                        <TableHead>Robots</TableHead>
                        <TableHead>Fetch</TableHead>
                        <TableHead>Last crawled</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {problems.map((i) => (
                        <TableRow key={i.url}>
                          <TableCell className="max-w-[240px] truncate">{short(i.url)}</TableCell>
                          <TableCell>{verdictBadge(i)}</TableCell>
                          <TableCell>{i.coverage_state ?? '—'}</TableCell>
                          <TableCell>{i.robots_txt_state ?? '—'}</TableCell>
                          <TableCell>{i.page_fetch_state ?? '—'}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {i.last_crawl_time ? format(new Date(i.last_crawl_time), 'd MMM HH:mm') : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Sitemaps</h3>
              {data.sitemaps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sitemaps submitted for this property.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sitemap</TableHead>
                        <TableHead>URLs</TableHead>
                        <TableHead>Errors</TableHead>
                        <TableHead>Warnings</TableHead>
                        <TableHead>Last downloaded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.sitemaps.map((s) => (
                        <TableRow key={s.path}>
                          <TableCell className="max-w-[260px] truncate">{short(s.path)}</TableCell>
                          <TableCell>{s.submitted}</TableCell>
                          <TableCell className={s.errors ? 'text-destructive' : ''}>{s.errors}</TableCell>
                          <TableCell className={s.warnings ? 'text-amber-500' : ''}>{s.warnings}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {s.lastDownloaded ? format(new Date(s.lastDownloaded), 'd MMM yyyy') : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold">Top pages</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Impr.</TableHead>
                      <TableHead className="text-right">Pos.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.pages.slice(0, 10).map((r) => (
                      <TableRow key={r.keys[0]}>
                        <TableCell className="max-w-[220px] truncate">{short(r.keys[0])}</TableCell>
                        <TableCell className="text-right">{r.clicks}</TableCell>
                        <TableCell className="text-right">{r.impressions}</TableCell>
                        <TableCell className="text-right">{r.position.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Top queries</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Impr.</TableHead>
                      <TableHead className="text-right">Pos.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.queries.slice(0, 10).map((r) => (
                      <TableRow key={r.keys[0]}>
                        <TableCell className="max-w-[220px] truncate">{r.keys[0]}</TableCell>
                        <TableCell className="text-right">{r.clicks}</TableCell>
                        <TableCell className="text-right">{r.impressions}</TableCell>
                        <TableCell className="text-right">{r.position.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Updated {format(new Date(data.checkedAt), 'd MMM yyyy HH:mm')}
              {data.deepScan ? ' · fresh crawl scan' : ' · crawl statuses from last stored scan'}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
