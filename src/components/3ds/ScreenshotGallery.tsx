import { useState } from 'react';
import { X, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ScreenshotGalleryProps {
  screenshots: Record<string, string>;
}

const labelMap: Record<string, string> = {
  payment_state: 'Payment Page',
  post_bin_entry: 'Post BIN Entry',
  atc_failure: 'ATC Failure',
  exception: 'Exception',
};

export const ScreenshotGallery = ({ screenshots }: ScreenshotGalleryProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const entries = Object.entries(screenshots).filter(([, v]) => !!v);

  if (entries.length === 0) return null;

  const getSrc = (val: string) =>
    val.startsWith('data:') || val.startsWith('http') ? val : `data:image/png;base64,${val}`;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {entries.map(([key, val]) => (
          <button
            key={key}
            onClick={() => setSelected(key)}
            className="group relative rounded-lg border border-border overflow-hidden bg-secondary/30 hover:border-primary/50 transition-colors"
          >
            <img
              src={getSrc(val)}
              alt={labelMap[key] || key}
              className="w-full aspect-video object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="w-5 h-5 text-foreground" />
            </div>
            <span className="absolute bottom-0 left-0 right-0 text-[10px] font-mono text-center py-1 bg-background/80 text-muted-foreground">
              {labelMap[key] || key}
            </span>
          </button>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-4xl p-2 bg-background border-border">
          {selected && screenshots[selected] && (
            <img
              src={getSrc(screenshots[selected])}
              alt={labelMap[selected] || selected}
              className="w-full rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
