// 0xNull Lending Protocol - Types, Constants & API Client

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PROXY_URL = `${SUPABASE_URL}/functions/v1/xnull-proxy`;

// ─── Types ──────────────────────────────────────────────

export interface LendingPool {
  asset: string;
  total_deposits: string;
  total_borrows: string;
  available_liquidity: string;
  utilization: string;
  supply_apy: string;
  borrow_apy: string;
  price_usd: string;
  source: string;
  aave_supply_apy?: string;
  aave_borrow_apy?: string;
}

export interface LendingPoolDetail {
  asset: string;
  total_deposits: string;
  total_borrows: string;
  total_reserves: string;
  available_liquidity: string;
  utilization: string;
  supply_apr: string;
  supply_apy: string;
  borrow_apr: string;
  borrow_apy: string;
  ltv: string;
  liquidation_threshold: string;
  liquidation_penalty: string;
  source: string;
  aave_supply_apy?: string;
  aave_borrow_apy?: string;
}

export interface LendingStatus {
  healthy: boolean;
  oracle_degraded?: boolean;
  circuit_breaker?: boolean;
  message?: string;
}

export interface SupplyPosition {
  id: string;
  asset: string;
  deposited: string;
  current_balance: string;
  interest_earned: string;
}

export interface BorrowPosition {
  id: string;
  collateral: string;
  borrowed: string;
  current_debt: string;
  health_factor: string;
  source: string;
}

export interface Portfolio {
  supplies: SupplyPosition[];
  borrows: BorrowPosition[];
}

export interface DepositRequest {
  status: string;
  deposit_id: string;
  asset: string;
  amount: string;
  deposit_address: string;
  token_contract?: string;
  chain?: string;
  expires: string;
  note: string;
}

export interface PendingDeposit {
  deposit_id: string;
  asset: string;
  amount: string;
  status: string;
  created_at?: string;
}

export interface WithdrawResponse {
  status: string;
  amount: string;
  asset: string;
  positions_closed: string[];
}

export interface BorrowResponse {
  status: string;
  position_id: string;
  collateral: string;
  borrowed: string;
  health_factor: string;
  source: string;
}

export interface RepayResponse {
  status: string;
  amount_repaid: string;
  fully_closed: boolean;
  collateral_released: boolean;
}

export interface OraclePrice {
  [asset: string]: string;
}

export interface RiskParam {
  asset: string;
  ltv: number;
  liquidation_threshold: number;
  liquidation_penalty: number;
  can_collateral: boolean;
  can_borrow: boolean;
}

// ─── Asset Metadata ─────────────────────────────────────

export interface AssetMeta {
  symbol: string;
  name: string;
  type: 'stablecoin' | 'volatile' | 'native';
  source: string;
  decimals: number;
  contract?: string;
}

export const ASSET_META: Record<string, AssetMeta> = {
  XMR:    { symbol: 'XMR',    name: 'Monero',        type: 'native',     source: 'xmr_pool',       decimals: 12 },
  USDC:   { symbol: 'USDC',   name: 'USD Coin',      type: 'stablecoin', source: 'aave_arbitrum',   decimals: 6,  contract: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
  USDT:   { symbol: 'USDT',   name: 'Tether',        type: 'stablecoin', source: 'aave_arbitrum',   decimals: 6,  contract: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' },
  DAI:    { symbol: 'DAI',    name: 'Dai',           type: 'stablecoin', source: 'aave_arbitrum',   decimals: 18, contract: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1' },
  LUSD:   { symbol: 'LUSD',   name: 'Liquity USD',   type: 'stablecoin', source: 'aave_arbitrum',   decimals: 18, contract: '0x93b346b6BC2548dA6A1E7d98E9a421B42541425b' },
  GHO:    { symbol: 'GHO',    name: 'GHO',           type: 'stablecoin', source: 'aave_arbitrum',   decimals: 18, contract: '0x7dfF72693f6A4149b17e7C6314655f6A9F7c8B33' },
  WETH:   { symbol: 'WETH',   name: 'Wrapped Ether', type: 'volatile',   source: 'aave_arbitrum',   decimals: 18, contract: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' },
  WBTC:   { symbol: 'WBTC',   name: 'Wrapped Bitcoin', type: 'volatile', source: 'aave_arbitrum',   decimals: 8,  contract: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f' },
  ARB:    { symbol: 'ARB',    name: 'Arbitrum',      type: 'volatile',   source: 'aave_arbitrum',   decimals: 18, contract: '0x912CE59144191C1204E64559FE8253a0e49E6548' },
  wstETH: { symbol: 'wstETH', name: 'Wrapped stETH', type: 'volatile',   source: 'aave_arbitrum',   decimals: 18, contract: '0x5979D7b546E38E9Ab8E801a5f020BBd3231e6aE7' },
};

export const RISK_PARAMS: Record<string, { ltv: number; liquidation_threshold: number; liquidation_penalty: number; can_collateral: boolean; can_borrow: boolean }> = {
  XMR:    { ltv: 0.55, liquidation_threshold: 0.70, liquidation_penalty: 0.08, can_collateral: false, can_borrow: true },
  USDC:   { ltv: 0.75, liquidation_threshold: 0.85, liquidation_penalty: 0.04, can_collateral: true,  can_borrow: true },
  USDT:   { ltv: 0.75, liquidation_threshold: 0.85, liquidation_penalty: 0.04, can_collateral: true,  can_borrow: true },
  DAI:    { ltv: 0.75, liquidation_threshold: 0.85, liquidation_penalty: 0.04, can_collateral: true,  can_borrow: true },
  LUSD:   { ltv: 0.75, liquidation_threshold: 0.85, liquidation_penalty: 0.04, can_collateral: true,  can_borrow: true },
  GHO:    { ltv: 0.70, liquidation_threshold: 0.80, liquidation_penalty: 0.05, can_collateral: true,  can_borrow: true },
  WETH:   { ltv: 0.80, liquidation_threshold: 0.85, liquidation_penalty: 0.05, can_collateral: true,  can_borrow: true },
  WBTC:   { ltv: 0.70, liquidation_threshold: 0.80, liquidation_penalty: 0.06, can_collateral: true,  can_borrow: true },
  ARB:    { ltv: 0.58, liquidation_threshold: 0.70, liquidation_penalty: 0.08, can_collateral: true,  can_borrow: true },
  wstETH: { ltv: 0.70, liquidation_threshold: 0.80, liquidation_penalty: 0.05, can_collateral: true,  can_borrow: true },
};

// ─── Cache helpers ──────────────────────────────────────

const CACHE_PREFIX = 'lending_cache_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes max staleness

function cacheKey(path: string): string {
  return `${CACHE_PREFIX}${path}`;
}

function writeCache(path: string, data: unknown): void {
  try {
    localStorage.setItem(cacheKey(path), JSON.stringify({ ts: Date.now(), data }));
  } catch { /* quota exceeded – ignore */ }
}

function readCache<T>(path: string): { data: T; stale: boolean } | null {
  try {
    const raw = localStorage.getItem(cacheKey(path));
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(cacheKey(path));
      return null;
    }
    return { data: data as T, stale: true };
  } catch {
    return null;
  }
}

// ─── API Client ─────────────────────────────────────────

export interface LendingResponse<T> {
  data: T;
  stale?: boolean;
}

async function lendingRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
  timeoutMs = 30000
): Promise<T> {
  const proxyUrl = new URL(PROXY_URL);
  proxyUrl.searchParams.set('path', `/api/lending${path}`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['X-0xNull-Token'] = token;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(proxyUrl.toString(), {
      ...options,
      signal: controller.signal,
      headers: { ...headers, ...(options.headers as Record<string, string> || {}) },
    });

    const text = await res.text();

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      if (!res.ok) throw new Error(text || `Request failed (${res.status})`);
      throw new Error('Invalid JSON response');
    }

    if (!res.ok) {
      const msg = data?.detail || data?.error || `Request failed (${res.status})`;
      if (res.status === 401) {
        throw new Error('Token not recognized by lending service. Try generating a new token from the Dashboard.');
      }
      throw new Error(msg);
    }

    // Cache successful GET responses (no token = public data)
    if (!token && (!options.method || options.method === 'GET')) {
      writeCache(path, data);
    }

    return data as T;
  } catch (e) {
    // On failure, try to serve cached data
    if (!token && (!options.method || options.method === 'GET')) {
      const cached = readCache<T>(path);
      if (cached) {
        console.warn(`Lending API failed, serving cached data for ${path}`);
        // Attach a _stale flag so consumers can detect it
        return Object.assign({}, cached.data, { _stale: true });
      }
    }

    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Public endpoints (no auth) ─────────────────────────

export const lendingApi = {
  getPools: () =>
    lendingRequest<{ pools: LendingPool[] }>('/pools'),

  getPool: (asset: string) =>
    lendingRequest<LendingPoolDetail>(`/pools/${asset}`),

  getStatus: () =>
    lendingRequest<LendingStatus>('/status'),

  getPrices: () =>
    lendingRequest<OraclePrice>('/prices'),

  getRates: () =>
    lendingRequest<Record<string, { supply_apy: string; borrow_apy: string }>>('/rates'),

  getRiskParams: () =>
    lendingRequest<{ params: RiskParam[] }>('/risk-params'),

  getLiquidatable: () =>
    lendingRequest<{ positions: any[] }>('/liquidatable'),

  // ─── Authenticated endpoints ─────────────────────────

  getPortfolio: (token: string) =>
    lendingRequest<Portfolio>('/portfolio', {}, token),

  requestDeposit: (token: string, asset: string, amount: string) =>
    lendingRequest<DepositRequest>('/deposit/request', {
      method: 'POST',
      body: JSON.stringify({ asset, amount }),
    }, token, 30000),

  getPendingDeposits: (token: string) =>
    lendingRequest<{ deposits: PendingDeposit[] }>('/deposit/pending', {}, token),

  withdraw: (token: string, asset: string, amount: string, destination_address?: string) =>
    lendingRequest<WithdrawResponse>('/withdraw', {
      method: 'POST',
      body: JSON.stringify({ asset, amount, ...(destination_address ? { destination_address } : {}) }),
    }, token),

  borrow: (token: string, collateral_asset: string, collateral_amount: string, borrow_asset: string, borrow_amount: string) =>
    lendingRequest<BorrowResponse>('/borrow', {
      method: 'POST',
      body: JSON.stringify({ collateral_asset, collateral_amount, borrow_asset, borrow_amount }),
    }, token, 30000),

  repay: (token: string, position_id: string, amount: string) =>
    lendingRequest<RepayResponse>('/repay', {
      method: 'POST',
      body: JSON.stringify({ position_id, amount }),
    }, token),

  requestRepay: (token: string, position_id: string, amount: string) =>
    lendingRequest<any>('/repay/request', {
      method: 'POST',
      body: JSON.stringify({ position_id, amount }),
    }, token),

  getPendingRepays: (token: string) =>
    lendingRequest<{ pending: any[] }>('/repay/pending', {}, token),
};

// ─── Helpers ────────────────────────────────────────────

/** Parse string amount to number, handling potential precision issues */
export function parseAmount(s: string): number {
  return parseFloat(s) || 0;
}

/** Format a number for display with appropriate decimal places */
export function formatAmount(n: number, decimals = 2): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(decimals);
}

/** Format USD amount */
export function formatUsd(n: number): string {
  return `$${formatAmount(n)}`;
}

const STABLECOINS = ['DAI', 'USDC', 'USDT', 'LUSD', 'GHO'];

/** Format a balance with asset-appropriate decimal places */
export function formatBalance(value: string | number, asset: string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  if (STABLECOINS.includes(asset) || asset === 'ARB') return num.toFixed(2);
  if (asset === 'WBTC') return num.toFixed(6);
  if (['WETH', 'wstETH'].includes(asset)) return num.toFixed(4);
  return num.toFixed(4); // XMR and others
}

/** Format interest earned for display */
export function formatInterest(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || Math.abs(num) < 0.0001) return '$0.00';
  if (Math.abs(num) < 1) return `$${num.toFixed(4)}`;
  return `$${num.toFixed(2)}`;
}

/** Calculate health factor */
export function calcHealthFactor(
  collateralUsd: number,
  liquidationThreshold: number,
  debtUsd: number
): number {
  if (debtUsd <= 0) return Infinity;
  return (collateralUsd * liquidationThreshold) / debtUsd;
}

/** Calculate liquidation price for single-collateral position */
export function calcLiquidationPrice(
  debtUsd: number,
  collateralAmount: number,
  liquidationThreshold: number
): number {
  if (collateralAmount <= 0 || liquidationThreshold <= 0) return 0;
  return debtUsd / (collateralAmount * liquidationThreshold);
}

/** Get health factor color class */
export function healthFactorColor(hf: number): string {
  if (hf >= 2.0) return 'text-green-400';
  if (hf >= 1.5) return 'text-amber-400';
  if (hf >= 1.2) return 'text-orange-400';
  return 'text-red-400';
}

/** Get utilization color class */
export function utilizationColor(pct: number): string {
  if (pct < 60) return 'bg-green-500';
  if (pct < 80) return 'bg-amber-500';
  return 'bg-red-500';
}

/** Source label */
export function sourceLabel(source: string): string {
  if (source === 'xmr_pool') return 'XMR Pool';
  return 'Aave V3';
}

/** Parse utilization string like "56.67%" to number */
export function parsePercent(s: string): number {
  return parseFloat(s.replace('%', '')) || 0;
}
