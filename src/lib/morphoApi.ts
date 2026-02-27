import type {
  MorphoVaultsResponse,
  MorphoPositionsResponse,
  MorphoDepositRequest,
  MorphoDepositResponse,
  MorphoWithdrawRequest,
  MorphoWithdrawResponse,
} from '@/types/morpho';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PROXY_URL = `${SUPABASE_URL}/functions/v1/xnull-proxy`;

/** Map exotic ticker symbols back to what the backend expects */
const ASSET_NORMALIZE: Record<string, string> = {
  'USD₮0': 'USDT',
};
function normalizeAsset(asset: string): string {
  return ASSET_NORMALIZE[asset] || asset;
}

function buildUrl(path: string): string {
  const url = new URL(PROXY_URL);
  url.searchParams.set('path', `/api/lending/morpho${path}`);
  return url.toString();
}

export async function fetchMorphoVaults(): Promise<MorphoVaultsResponse> {
  const res = await fetch(buildUrl('/vaults'), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch Morpho vaults');
  return res.json();
}

export async function fetchMorphoPositions(token: string): Promise<MorphoPositionsResponse> {
  const res = await fetch(buildUrl('/positions'), {
    headers: {
      'Content-Type': 'application/json',
      'X-0xNull-Token': token,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch Morpho positions');
  return res.json();
}

export async function submitMorphoDeposit(req: MorphoDepositRequest): Promise<MorphoDepositResponse> {
  const { token, ...body } = req;
  const res = await fetch(buildUrl('/deposit'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-0xNull-Token': token,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Deposit failed' }));
    throw new Error(err.detail || 'Deposit failed');
  }
  return res.json();
}

export async function submitMorphoWithdraw(req: MorphoWithdrawRequest): Promise<MorphoWithdrawResponse> {
  const { token, ...body } = req;
  const res = await fetch(buildUrl('/withdraw'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-0xNull-Token': token,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Withdraw failed' }));
    throw new Error(err.detail || 'Withdraw failed');
  }
  return res.json();
}
