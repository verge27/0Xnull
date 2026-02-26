import type { AaveRate, EarnPosition, EarnDepositRequest, EarnWithdrawRequest, EarnTxResponse } from '@/types/earn';

const API_BASE = "https://api.0xnull.io/api/lending";

export async function fetchAaveRates(): Promise<AaveRate[]> {
  const res = await fetch(`${API_BASE}/earn/rates`);
  if (!res.ok) throw new Error("Failed to fetch rates");
  return res.json();
}

export async function fetchAaveRatesDetailed(): Promise<AaveRate[]> {
  const res = await fetch(`${API_BASE}/earn/rates/detailed`);
  if (!res.ok) throw new Error("Failed to fetch detailed rates");
  return res.json();
}

export async function fetchEarnPositions(token: string): Promise<EarnPosition[]> {
  const res = await fetch(`${API_BASE}/earn/positions`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch positions");
  return res.json();
}

export async function submitEarnDeposit(req: EarnDepositRequest): Promise<EarnTxResponse> {
  const res = await fetch(`${API_BASE}/earn/deposit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${req.token}`
    },
    body: JSON.stringify({ asset: req.asset, amount: req.amount })
  });
  return res.json();
}

export async function submitEarnWithdraw(req: EarnWithdrawRequest): Promise<EarnTxResponse> {
  const res = await fetch(`${API_BASE}/earn/withdraw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${req.token}`
    },
    body: JSON.stringify({
      asset: req.asset,
      amount: req.amount,
      destination: req.destination,
      wallet_address: req.wallet_address
    })
  });
  return res.json();
}
