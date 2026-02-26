import type { AaveRate, EarnPosition, EarnTxResponse } from '@/types/earn';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PROXY_URL = `${SUPABASE_URL}/functions/v1/xnull-proxy`;

export async function fetchAaveRates(): Promise<AaveRate[]> {
  const res = await fetch(`${API_BASE}/earn/rates`);
  if (!res.ok) throw new Error("Failed to fetch rates");
  const data = await res.json();

  // Backend returns { rates: { USDC: {...}, DAI: {...} } } — transform to array
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
  const res = await fetch(`${API_BASE}/earn/positions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ railgun_wallet: token }),
  });
  if (!res.ok) throw new Error("Failed to fetch positions");
  const data = await res.json();
  return Array.isArray(data) ? data : data.positions || [];
}

export async function submitEarnDeposit(asset: string, amount: string, token: string): Promise<EarnTxResponse> {
  const res = await fetch(`${API_BASE}/earn/deposit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`${API_BASE}/earn/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
