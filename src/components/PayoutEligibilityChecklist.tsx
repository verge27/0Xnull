import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Globe, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ALL_KNOWN_COUNTRIES,
  ELIGIBLE_REGIONS,
  EXCLUDED_MARKETS,
  checkCountryEligibility,
} from '@/lib/payoutEligibility';

const STATUS_STYLES = {
  eligible: 'border-primary/40 bg-primary/10 text-primary',
  excluded: 'border-destructive/40 bg-destructive/10 text-destructive',
  unknown: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
} as const;

export const PayoutEligibilityChecklist = () => {
  const [query, setQuery] = useState('');

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_KNOWN_COUNTRIES.filter(c => c.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  const result = useMemo(() => checkCountryEligibility(query), [query]);
  const exactMatch = suggestions.length === 1 || ALL_KNOWN_COUNTRIES.some(c => c.toLowerCase() === query.trim().toLowerCase());

  return (
    <div className="space-y-6 text-sm">
      <div className="space-y-2">
        <Label htmlFor="payout-country">Check your country</Label>
        <Input
          id="payout-country"
          placeholder="Start typing a country, e.g. Brazil"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoComplete="off"
        />
        {!!suggestions.length && !exactMatch && (
          <div className="flex flex-wrap gap-1">
            {suggestions.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setQuery(s)}
                className="text-xs rounded-full border px-2 py-1 hover:bg-secondary"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {result && (
          <div className={`rounded-lg border p-3 flex gap-2 items-start ${STATUS_STYLES[result.status]}`}>
            {result.status === 'eligible' && <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />}
            {result.status === 'excluded' && <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
            {result.status === 'unknown' && <HelpCircle className="h-4 w-4 mt-0.5 shrink-0" />}
            <div>
              <p className="font-medium">
                {result.country}
                {result.status === 'eligible' && ' — likely eligible'}
                {result.status === 'excluded' && ' — not supported'}
                {result.status === 'unknown' && ' — unconfirmed'}
              </p>
              <p className="text-xs opacity-90">{result.detail}</p>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          Eligible regions
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {ELIGIBLE_REGIONS.map(r => (
            <div key={r.region} className="rounded-lg border bg-secondary/30 p-3">
              <p className="font-medium mb-1">{r.region}</p>
              <p className="text-muted-foreground text-xs">{r.countries.join(', ')}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          Excluded markets
        </h3>
        <div className="space-y-1">
          {EXCLUDED_MARKETS.map(m => (
            <div key={m.market} className="flex items-start justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
              <span className="text-xs font-medium">{m.market}</span>
              <Badge variant="outline" className="text-[10px] shrink-0 border-destructive/40 text-destructive">
                {m.reason}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
