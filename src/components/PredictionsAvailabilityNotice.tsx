import { ShieldAlert } from 'lucide-react';

export const PredictionsAvailabilityNotice = () => (
  <aside
    className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/35 bg-amber-500/10 p-4 text-sm"
    role="note"
    aria-label="Predictions availability"
  >
    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
    <div>
      <p className="font-medium text-foreground">
        Predictions is not available to residents of Great Britain. Access from GB is blocked.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        The restriction is enforced server-side on position and settlement actions using IP country data.{' '}
        <a
          href="https://db-ip.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          IP geolocation by DB-IP
        </a>
        .
      </p>
    </div>
  </aside>
);

export default PredictionsAvailabilityNotice;
