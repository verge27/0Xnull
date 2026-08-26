import { Link } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { PRIVATE_NETWORK_MIRRORS } from '@/lib/privateNetworks';

interface PrivateAccessAddressesProps {
  /** Render compactly, for tight surfaces such as the footer. */
  compact?: boolean;
  /** Show the per-transport Predictions availability notices. */
  showPredictionsNotice?: boolean;
}

/**
 * Publishes both 0xNull private-network addresses with a copy control and a
 * link to the matching guide. Addresses come from the shared module only.
 */
export const PrivateAccessAddresses = ({
  compact = false,
  showPredictionsNotice = false,
}: PrivateAccessAddressesProps) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(address);
      setTimeout(() => setCopied((current) => (current === address ? null : current)), 2000);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {PRIVATE_NETWORK_MIRRORS.map((mirror) => (
        <div
          key={mirror.network}
          className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-left"
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-medium text-foreground">{mirror.label}</span>
            <Link
              to={mirror.guidePath}
              className="text-xs text-primary hover:text-foreground transition-colors"
            >
              {mirror.guideLabel} →
            </Link>
          </div>
          <div className="flex items-start gap-2">
            <a
              href={mirror.url}
              className="font-mono text-xs break-all text-muted-foreground hover:text-foreground transition-colors"
            >
              {mirror.address}
            </a>
            <button
              type="button"
              onClick={() => copy(mirror.address)}
              aria-label={`Copy the ${mirror.label} address`}
              className="shrink-0 rounded-md border border-border/60 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied === mirror.address ? (
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
          {showPredictionsNotice && (
            <p className="mt-2 text-xs text-muted-foreground">{mirror.predictionsNotice}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default PrivateAccessAddresses;
