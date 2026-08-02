import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Coins, ShieldCheck } from 'lucide-react';

interface ServicePriceBarProps {
  /** What the meter charges, e.g. "$0.15 per generation" */
  price: string;
  /** Why a cold visitor should trust this specific service */
  trust: ReactNode;
  /** Set when the service draws down a 0xn_ token balance */
  tokenMetered?: boolean;
  className?: string;
}

/**
 * Above-the-fold answer to the two questions every anonymous service has to
 * answer immediately: what does it cost, and why should I trust it.
 */
export const ServicePriceBar = ({ price, trust, tokenMetered = false, className = '' }: ServicePriceBarProps) => (
  <div
    className={`grid gap-4 sm:grid-cols-2 rounded-lg border border-border/60 bg-card/50 p-5 backdrop-blur ${className}`}
  >
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
        <Coins className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">What it costs</p>
        <p className="font-mono font-semibold">{price}</p>
        {tokenMetered && (
          <p className="text-xs text-muted-foreground mt-1">
            Metered against your{' '}
            <Link to="/docs#token" className="text-primary hover:underline">
              0xn_ token
            </Link>{' '}
            balance.
          </p>
        )}
      </div>
    </div>

    <div className="flex items-start gap-3">
      <div className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
        <ShieldCheck className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Why trust it</p>
        <p className="text-sm text-muted-foreground">{trust}</p>
      </div>
    </div>
  </div>
);
