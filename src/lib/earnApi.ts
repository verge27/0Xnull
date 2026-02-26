import type { AaveRate, EarnPosition, EarnTxResponse } from '@/types/earn';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PROXY_URL = `${SUPABASE_URL}/functions/v1/xnull-proxy`;

function buildUrl(path: string): string {
  const url = new URL(PROXY_URL);
  url.searchParams.set('path', `/api/lending/earn${path}`);
  return url.toString();
}

export async function fetchAaveRates(): Promise<AaveRate[]> {
  const res = await fetch(buildUrl('/rates'), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error("Failed to fetch rates");
  const data = await res.json();

  const ratesDict: Record<string, any> = data.rates || data;
  return Object.entries(ratesDict).map(([symbol, r]: [string, any]) => ({
    asset: symbol,
    symbol,
    supply_apy: (r.supply_apy ?? r.supplyApy ?? 0) / 100,
    variable_borrow_apy: (r.borrow_apy ?? r.variable_borrow_apy ?? 0) / 100,
    liquidity: r.total_supplied ?? r.liquidity ?? '0',
    liquidity_formatted: r.available_liquidity ?? r.liquidity_formatted ?? '0',
    atoken_address: r.aToken ?? r.atoken_address ?? '',
    underlying_address: r.underlying ?? r.underlying_address ?? '',
    decimals: r.decimals ?? 18,
  }));
}

export async function fetchEarnPositions(token: string): Promise<EarnPosition[]> {
  // The positions endpoint requires a valid Railgun wallet address (starts with 0zk).
  // If the user only has a 0xNull token (0xn_...), skip the call — they have no earn positions.
  if (!token.startsWith('0zk')) {
    return [];
  }
  const res = await fetch(buildUrl('/positions'), {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ railgun_wallet: token }),
  });
  if (!res.ok) throw new Error("Failed to fetch positions");
  const data = await res.json();
  return Array.isArray(data) ? data : data.positions || [];
}

export async function submitEarnDeposit(asset: string, amount: string, token: string): Promise<EarnTxResponse> {
  const res = await fetch(buildUrl('/deposit'), {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: asset, amount, railgun_wallet: token }),
  });
  return res.json();
}

export async function submitEarnWithdraw(
  asset: string,
  amount: string,
  token: string,
  destination: "reshield" | "wallet",
  walletAddress?: string,
): Promise<EarnTxResponse> {
  const res = await fetch(buildUrl('/withdraw'), {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: asset,
      amount,
      railgun_wallet: token,
      destination: destination === "wallet" ? "external" : "reshield",
      ...(destination === "wallet" && walletAddress ? { external_address: walletAddress } : {}),
    }),
  });
  return res.json();
}

export interface DirectDepositResponse {
  deposit_address: string;
  token_contract: string;
  chain: string;
  note: string;
}

export async function requestDirectDeposit(asset: string, amount: string, token: string): Promise<DirectDepositResponse> {
  const res = await fetch(buildUrl('/deposit/direct'), {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'X-0xNull-Token': token,
    },
    body: JSON.stringify({ asset, amount }),
  });
  if (!res.ok) throw new Error("Failed to request deposit address");
  return res.json();
}

export interface DirectDepositPending {
  deposit_id: string;
  asset: string;
  amount: string;
  status: string;
  confirmations?: number;
  confirmations_required?: number;
  txid?: string;
}

export async function fetchDirectDepositPending(token: string): Promise<DirectDepositPending[]> {
  const res = await fetch(buildUrl('/deposit/direct/pending'), {
    headers: {
      'Content-Type': 'application/json',
      'X-0xNull-Token': token,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch pending deposits");
  const data = await res.json();
  return Array.isArray(data) ? data : data.deposits || [];
}
