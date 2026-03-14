import { CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScreenshotGallery } from './ScreenshotGallery';

interface EvidencePanelProps {
  positiveIndicators: string[];
  negativeIndicators: string[];
  stateLog: string[];
  screenshots: Record<string, string>;
  paymentPageReached: boolean;
  authWallDetected: boolean;
  binTriggerPsp: string | null;
  binTriggerCardPrefix: string | null;
}

const stateLogColor = (entry: string): string => {
  if (entry.includes('[ENTRY]')) return 'text-muted-foreground';
  if (entry.includes('[PRODUCT_DISCOVERY]') || entry.includes('[ADD_TO_CART]')) return 'text-blue-400';
  if (entry.includes('[NAVIGATE_CHECKOUT]')) return 'text-amber-400';
  if (entry.includes('[PAYMENT_PAGE]')) return 'text-emerald-400';
  if (entry.includes('[ANALYSIS]')) return 'text-purple-400';
  if (entry.includes('[FAILED]')) return 'text-destructive';
  return 'text-muted-foreground';
};

const Section = ({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) => (
  <Collapsible defaultOpen={defaultOpen}>
    <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-sm font-medium">
      {title}
      <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent className="px-4 py-3">
      {children}
    </CollapsibleContent>
  </Collapsible>
);

export const EvidencePanel = ({
  positiveIndicators,
  negativeIndicators,
  stateLog,
  screenshots,
  paymentPageReached,
  authWallDetected,
  binTriggerPsp,
  binTriggerCardPrefix,
}: EvidencePanelProps) => {
  return (
    <div className="space-y-3">
      {/* Positive Indicators */}
      {positiveIndicators.length > 0 && (
        <Section title={`Positive Indicators (${positiveIndicators.length})`} defaultOpen>
          <ul className="space-y-1.5">
            {positiveIndicators.map((ind, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{ind}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Negative Indicators */}
      {negativeIndicators.length > 0 && (
        <Section title={`Negative Indicators (${negativeIndicators.length})`} defaultOpen>
          <ul className="space-y-1.5">
            {negativeIndicators.map((ind, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{ind}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* State Log */}
      {stateLog.length > 0 && (
        <Section title={`State Log (${stateLog.length} entries)`}>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {stateLog.map((entry, i) => (
              <p key={i} className={`text-xs font-mono ${stateLogColor(entry)}`}>
                {entry}
              </p>
            ))}
          </div>
        </Section>
      )}

      {/* Screenshots */}
      {Object.keys(screenshots).length > 0 && (
        <Section title="Screenshots" defaultOpen>
          <ScreenshotGallery screenshots={screenshots} />
        </Section>
      )}

      {/* Metadata */}
      <Section title="Scan Metadata">
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <span className="text-muted-foreground">payment_page_reached</span>
          <span className={paymentPageReached ? 'text-emerald-400' : 'text-red-400'}>
            {String(paymentPageReached)}
          </span>
          <span className="text-muted-foreground">auth_wall_detected</span>
          <span className={authWallDetected ? 'text-amber-400' : 'text-muted-foreground'}>
            {String(authWallDetected)}
          </span>
          {binTriggerPsp && (
            <>
              <span className="text-muted-foreground">bin_trigger_psp</span>
              <span className="text-foreground">{binTriggerPsp}</span>
            </>
          )}
          {binTriggerCardPrefix && (
            <>
              <span className="text-muted-foreground">bin_trigger_card_prefix</span>
              <span className="text-foreground">{binTriggerCardPrefix}</span>
            </>
          )}
        </div>
        {authWallDetected && (
          <p className="text-xs text-amber-400 mt-2">
            ⚠ This merchant requires account creation to reach payment. Results may be incomplete.
          </p>
        )}
      </Section>
    </div>
  );
};
