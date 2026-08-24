import { useEffect, useMemo, useState } from "react";
import { Briefcase, ExternalLink, Search, AlertTriangle, RefreshCw, Clock, Coins } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Job = {
  id: string;
  source_id: string;
  title: string;
  body: string;
  url: string;
  pay_xmr: number | null;
  pay_type: string;
  tags: string[];
  posted_at: string | null;
  first_seen_at: string;
};

type Source = {
  id: string;
  name: string;
  url: string;
  kind: string;
  escrow: boolean;
  enabled: boolean;
  last_ok_at: string | null;
  last_error: string | null;
};

type SortKey = "newest" | "pay-high" | "pay-low";

const PAY_TYPE_LABELS: Record<string, string> = {
  hourly: "Hourly",
  fixed: "Fixed price",
  unknown: "Pay not stated",
};

const formatXmr = (value: number) =>
  value
    .toFixed(10)
    .replace(/0+$/, "")
    .replace(/\.$/, "");

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86_400_000;
  if (diff < 120_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < day) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 30 * day) return `${Math.floor(diff / day)}d ago`;
  return `${Math.floor(diff / (30 * day))}mo ago`;
};

const Work = () => {
  useSEO();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [payType, setPayType] = useState<string>("all");
  const [sourceId, setSourceId] = useState<string>("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError(null);

      const [jobsRes, sourcesRes] = await Promise.all([
        supabase
          .from("jobs")
          .select("id, source_id, title, body, url, pay_xmr, pay_type, tags, posted_at, first_seen_at")
          .eq("hidden", false)
          .order("first_seen_at", { ascending: false })
          .limit(500),
        supabase.from("sources").select("*").order("name"),
      ]);

      if (cancelled) return;

      if (jobsRes.error) {
        setLoadError("Could not load the job feed. Please try again in a moment.");
      } else {
        setJobs((jobsRes.data ?? []) as Job[]);
      }
      setSources((sourcesRes.data ?? []) as Source[]);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sourceById = useMemo(() => {
    return sources.reduce<Record<string, Source>>((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {});
  }, [sources]);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    jobs.forEach((job) => (job.tags ?? []).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [jobs]);

  const visibleJobs = useMemo(() => {
    const needle = search.trim().toLowerCase();

    const filtered = jobs.filter((job) => {
      if (payType !== "all" && job.pay_type !== payType) return false;
      if (sourceId !== "all" && job.source_id !== sourceId) return false;
      if (activeTag && !(job.tags ?? []).includes(activeTag)) return false;
      if (needle) {
        const haystack = `${job.title} ${job.body} ${(job.tags ?? []).join(" ")}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });

    const withPay = (job: Job) => (job.pay_xmr === null ? undefined : job.pay_xmr);

    return [...filtered].sort((a, b) => {
      if (sort === "newest") {
        const at = new Date(a.posted_at ?? a.first_seen_at).getTime();
        const bt = new Date(b.posted_at ?? b.first_seen_at).getTime();
        return bt - at;
      }
      const ap = withPay(a);
      const bp = withPay(b);
      // Listings with no stated pay always sort last, whichever direction is picked.
      if (ap === undefined && bp === undefined) return 0;
      if (ap === undefined) return 1;
      if (bp === undefined) return -1;
      return sort === "pay-high" ? bp - ap : ap - bp;
    });
  }, [jobs, search, sort, payType, sourceId, activeTag]);

  const unavailableSources = sources.filter((s) => !s.enabled);
  const liveSources = sources.filter((s) => s.enabled);
  const hasFilters = Boolean(search || activeTag) || payType !== "all" || sourceId !== "all";

  const clearFilters = () => {
    setSearch("");
    setSort("newest");
    setPayType("all");
    setSourceId("all");
    setActiveTag(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-3">Work Paid in Monero</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
              Every XMR job we can find, in one place. Aggregated from public boards, refreshed every 30 minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <Badge variant="outline">{jobs.length} open listings</Badge>
              <Badge variant="outline">{liveSources.length} live sources</Badge>
              <Badge variant="outline">No account needed</Badge>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-8 border-border/50">
            <CardContent className="pt-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="job-search"
                  aria-label="Search Monero jobs"
                  placeholder="Search titles, descriptions and skills"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="job-sort" className="text-xs text-muted-foreground">Sort</Label>
                  <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                    <SelectTrigger id="job-sort" aria-label="Sort jobs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="pay-high">Pay: high to low</SelectItem>
                      <SelectItem value="pay-low">Pay: low to high</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="job-type" className="text-xs text-muted-foreground">Type</Label>
                  <Select value={payType} onValueChange={setPayType}>
                    <SelectTrigger id="job-type" aria-label="Filter by pay type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="fixed">Fixed price</SelectItem>
                      <SelectItem value="unknown">Pay not stated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="job-source" className="text-xs text-muted-foreground">Source</Label>
                  <Select value={sourceId} onValueChange={setSourceId}>
                    <SelectTrigger id="job-source" aria-label="Filter by source board">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="all">All sources</SelectItem>
                      {liveSources.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {allTags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(([tag, count]) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                        aria-pressed={activeTag === tag}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          activeTag === tag
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {tag} <span className="opacity-60">{count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-sm text-muted-foreground">
                  Showing {visibleJobs.length} of {jobs.length} listings
                </p>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Listings */}
          <div className="space-y-4 mb-12">
            {loading ? (
              [0, 1, 2].map((i) => (
                <Card key={i} className="border-border/50">
                  <CardHeader className="space-y-3">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardHeader>
                </Card>
              ))
            ) : loadError ? (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="py-10 text-center space-y-2">
                  <AlertTriangle className="h-6 w-6 text-destructive mx-auto" />
                  <p className="text-sm text-muted-foreground">{loadError}</p>
                </CardContent>
              </Card>
            ) : visibleJobs.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center space-y-3">
                  <p className="text-muted-foreground">
                    {jobs.length === 0
                      ? "No listings right now. The aggregator refreshes every 30 minutes, so check back shortly."
                      : "No listings match these filters."}
                  </p>
                  {hasFilters && (
                    <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              visibleJobs.map((job) => {
                const source = sourceById[job.source_id];
                return (
                  <Card key={job.id} className="border-border/50 hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <CardTitle className="text-lg leading-snug">{job.title}</CardTitle>
                        {job.pay_xmr !== null && (
                          <div className="flex items-center gap-1.5 font-mono text-primary shrink-0">
                            <Coins className="h-4 w-4" />
                            <span>
                              {formatXmr(job.pay_xmr)} XMR
                              {job.pay_type === "hourly" && <span className="text-muted-foreground">/hr</span>}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {source && <Badge variant="secondary">{source.name}</Badge>}
                        <Badge variant="outline">{PAY_TYPE_LABELS[job.pay_type] ?? job.pay_type}</Badge>
                        {source?.escrow && (
                          <Badge variant="outline" className="border-green-500/50 text-green-500">Escrow available</Badge>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {relativeTime(job.posted_at ?? job.first_seen_at)}
                        </span>
                      </div>

                      <CardDescription className="mt-2 line-clamp-3 whitespace-pre-line">
                        {job.body}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {(job.tags ?? []).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                            className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground hover:border-primary/50 transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={job.url} target="_blank" rel="noopener noreferrer nofollow">
                          View on {source?.name ?? "source"}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Sources */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Where these listings come from</h2>
            <Card className="border-border/50">
              <CardContent className="pt-6 space-y-3">
                {sources.map((source) => (
                  <div key={source.id} className="flex items-start justify-between gap-3 flex-wrap text-sm">
                    <div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {source.name}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {source.enabled
                          ? source.last_ok_at
                            ? `Last fetched ${relativeTime(source.last_ok_at)}`
                            : "Awaiting first fetch"
                          : source.last_error ?? "Temporarily unavailable"}
                      </p>
                    </div>
                    <Badge variant={source.enabled ? "outline" : "secondary"} className={source.enabled ? "border-green-500/50 text-green-500" : ""}>
                      {source.enabled ? "Live" : "Temporarily unavailable"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* Safety */}
          <Card className="bg-secondary/30">
            <CardContent className="py-8 space-y-3">
              <h2 className="text-lg font-bold">Before you apply</h2>
              <p className="text-sm text-muted-foreground">
                0xNull aggregates these listings from public boards and does not vet employers, hold funds or mediate disputes. Treat every listing as unverified. Agree terms in writing, prefer milestone payments or escrow and never send money or documents to secure work.
              </p>
              <p className="text-sm text-muted-foreground">
                Listings that advertise illegal work are filtered out automatically. If something slipped through, tell us and we will block it.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Work;
