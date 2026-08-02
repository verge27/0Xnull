import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ImageOff, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { checkPostImages, type ImageCheck, type OgImageReport } from '@/lib/checkBlogImages';
import type { OgImageSource } from '@/lib/blogOgImage';

interface OgImagePreflightProps {
  post: OgImageSource;
  /** Bubble the latest report up so the editor can warn on publish. */
  onReport?: (report: OgImageReport | null) => void;
}

const STATUS_META: Record<
  ImageCheck['status'],
  { icon: typeof CheckCircle2; label: string; className: string }
> = {
  ok: { icon: CheckCircle2, label: 'Reachable', className: 'text-primary' },
  'local-only': { icon: AlertTriangle, label: 'Not published', className: 'text-yellow-500' },
  unreachable: { icon: XCircle, label: 'Unreachable', className: 'text-destructive' },
  invalid: { icon: XCircle, label: 'Invalid URL', className: 'text-destructive' },
};

function CheckRow({ check, title }: { check: ImageCheck; title: string }) {
  const meta = STATUS_META[check.status];
  const Icon = meta.icon;

  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.className}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{title}</span>
          <Badge variant={check.status === 'ok' ? 'secondary' : 'outline'} className={meta.className}>
            {meta.label}
          </Badge>
          {check.width && check.height ? (
            <span className="text-xs text-muted-foreground">
              {check.width}×{check.height}
              {check.width < 1200 || check.height < 630 ? ' — smaller than the 1200×630 social target' : ''}
            </span>
          ) : null}
        </div>
        <p className="truncate font-mono text-xs text-muted-foreground" title={check.url || check.source}>
          {check.url || check.source}
        </p>
        {check.message ? <p className="text-xs text-muted-foreground">{check.message}</p> : null}
      </div>
    </div>
  );
}

/**
 * Editor-time validation of the resolved og:image plus every in-body image and
 * branded fallback, so broken social previews are caught before publishing.
 */
export function OgImagePreflight({ post, onReport }: OgImagePreflightProps) {
  const [report, setReport] = useState<OgImageReport | null>(null);
  const [checking, setChecking] = useState(false);
  const runId = useRef(0);

  const run = useCallback(async () => {
    const id = ++runId.current;
    setChecking(true);
    try {
      const result = await checkPostImages(post);
      if (runId.current !== id) return;
      setReport(result);
      onReport?.(result);
    } finally {
      if (runId.current === id) setChecking(false);
    }
  }, [post, onReport]);

  // Re-validate shortly after the relevant fields settle.
  useEffect(() => {
    const timer = setTimeout(() => {
      void run();
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.featured_image, post.content, post.category]);

  const problems = report?.problems.length ?? 0;
  const warnings = report?.warnings.length ?? 0;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ImageOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">Social image preflight</span>
          {problems > 0 ? (
            <Badge variant="destructive">{problems} broken</Badge>
          ) : warnings > 0 ? (
            <Badge variant="outline" className="text-yellow-500">
              {warnings} not live
            </Badge>
          ) : report ? (
            <Badge variant="secondary">All images reachable</Badge>
          ) : null}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => void run()} disabled={checking} className="gap-2">
          {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Recheck
        </Button>
      </div>

      {!report && checking ? (
        <p className="text-sm text-muted-foreground">Checking resolved og:image…</p>
      ) : null}

      {report ? (
        <div className="space-y-3">
          <CheckRow check={report.og} title={`og:image — ${report.og.tierLabel}`} />

          {report.body.length > 0 ? (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                In-body images ({report.body.length})
              </p>
              {report.body.map((check, i) => (
                <CheckRow key={`${check.url}-${i}`} check={check} title={`Image ${i + 1}`} />
              ))}
            </div>
          ) : null}

          {report.fallbacks.length > 0 ? (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Fallback thumbnails</p>
              {report.fallbacks.map((check, i) => (
                <CheckRow key={`${check.url}-${i}`} check={check} title={i === 0 ? 'Site default' : 'Category fallback'} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
