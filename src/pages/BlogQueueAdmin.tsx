import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, RefreshCw, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { toast } from 'sonner';

interface QueueRow {
  id: string;
  day_index: number;
  product_key: string;
  title_hint: string;
  facts: string;
  status: string;
  error: string | null;
  post_id: string | null;
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'published':
      return 'default';
    case 'generated':
      return 'secondary';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function BlogQueueAdmin() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [autoPublish, setAutoPublish] = useState(false);

  const load = async () => {
    const [queue, settings] = await Promise.all([
      supabase
        .from('blog_queue')
        .select('id, day_index, product_key, title_hint, facts, status, error, post_id')
        .order('day_index', { ascending: true }),
      supabase.from('blog_settings').select('publish_mode').limit(1).maybeSingle(),
    ]);

    if (queue.error) {
      toast.error('Failed to load queue');
    } else {
      setRows(queue.data || []);
      setDrafts(Object.fromEntries((queue.data || []).map((r) => [r.id, r.facts])));
    }
    setAutoPublish(settings.data?.publish_mode === 'auto');
    setLoading(false);
  };

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/blog');
      return;
    }
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, adminLoading]);

  const saveFacts = async (row: QueueRow) => {
    setBusy(row.id);
    const { error } = await supabase
      .from('blog_queue')
      .update({ facts: drafts[row.id], updated_at: new Date().toISOString() })
      .eq('id', row.id);
    setBusy(null);
    if (error) toast.error('Failed to save facts');
    else {
      toast.success(`Day ${row.day_index} facts saved`);
      load();
    }
  };

  const regenerate = async (row: QueueRow) => {
    setBusy(row.id);
    const reset = await supabase
      .from('blog_queue')
      .update({ status: 'pending', error: null, updated_at: new Date().toISOString() })
      .eq('id', row.id);

    if (reset.error) {
      setBusy(null);
      toast.error('Failed to reset row');
      return;
    }

    const { data, error } = await supabase.functions.invoke('generate-daily-post', {
      body: { day_index: row.day_index, force: true },
    });
    setBusy(null);

    if (error) toast.error(`Generation failed: ${error.message}`);
    else toast.success(`Day ${row.day_index}: ${(data as { status?: string })?.status ?? 'done'}`);
    load();
  };

  const togglePublishMode = async (checked: boolean) => {
    const { data: current } = await supabase.from('blog_settings').select('id').limit(1).maybeSingle();
    if (!current) return;
    const { error } = await supabase
      .from('blog_settings')
      .update({ publish_mode: checked ? 'auto' : 'draft', updated_at: new Date().toISOString() })
      .eq('id', current.id);
    if (error) toast.error('Failed to update publish mode');
    else {
      setAutoPublish(checked);
      toast.success(checked ? 'Publishing automatically' : 'Saving as drafts');
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate('/blog')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to blog
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-semibold">Blog queue</h1>
          <div className="flex items-center gap-3">
            <Label htmlFor="publish-mode" className="text-sm text-muted-foreground">
              Publish automatically
            </Label>
            <Switch id="publish-mode" checked={autoPublish} onCheckedChange={togglePublishMode} />
          </div>
        </div>

        <div className="space-y-4">
          {rows.map((row) => (
            <Card key={row.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <CardTitle className="text-base">
                  Day {row.day_index} — {row.product_key}
                  <span className="block text-sm font-normal text-muted-foreground mt-1">
                    {row.title_hint}
                  </span>
                </CardTitle>
                <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {row.error && <p className="text-sm text-destructive">{row.error}</p>}
                <Textarea
                  aria-label={`Fact block for day ${row.day_index}`}
                  value={drafts[row.id] ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [row.id]: e.target.value }))}
                  rows={7}
                  className="font-mono text-xs"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === row.id || drafts[row.id] === row.facts}
                    onClick={() => saveFacts(row)}
                  >
                    <Save className="h-4 w-4 mr-2" /> Save facts
                  </Button>
                  <Button size="sm" disabled={busy === row.id} onClick={() => regenerate(row)}>
                    {busy === row.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
