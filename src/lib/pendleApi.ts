import type {
  PendleMarket,
  PendleComparison,
  PendlePosition,
  PendleDepositRequest,
  PendleDepositResponse,
  PendleWithdrawRequest,
  PendleWithdrawResponse,
} from '@/types/pendle';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PROXY_URL = `${SUPABASE_URL}/functions/v1/xnull-proxy`;

function buildUrl(path: string): string {
  const url = new URL(PROXY_URL);
  url.searchParams.set('path', `/api/lending/pendle${path}`);
  return url.toString();
}

export async function fetchPendleMarkets(): Promise<{ markets: PendleMarket[]; count: number }> {
  const res = await fetch(buildUrl('/markets'), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch Pendle markets');
  return res.json();
}

export async function fetchPendleCompare(): Promise<{
  comparisons: PendleComparison[];
  count: number;
  summary: { best_pendle_advantage: PendleComparison | null };
}> {
  const res = await fetch(buildUrl('/compare'), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch comparison');
  return res.json();
}

export async function fetchBestMarket(depositToken: string): Promise<PendleMarket> {
  const res = await fetch(buildUrl(`/best/${depositToken}`), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`No market for ${depositToken}`);
  return res.json();
}

export async function fetchPendlePositions(token: string): Promise<{ positions: PendlePosition[]; count: number }> {
  const res = await fetch(buildUrl(`/positions?token=${encodeURIComponent(token)}`), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch positions');
  return res.json();
}

export async function submitPendleDeposit(req: PendleDepositRequest): Promise<PendleDepositResponse> {
  const res = await fetch(buildUrl('/deposit'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Deposit failed' }));
    throw new Error(err.detail || 'Deposit failed');
  }
  return res.json();
}

export async function submitPendleWithdraw(req: PendleWithdrawRequest): Promise<PendleWithdrawResponse> {
  const res = await fetch(buildUrl('/withdraw'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Withdraw failed' }));
    throw new Error(err.detail || 'Withdraw failed');
  }
  return res.json();
}
