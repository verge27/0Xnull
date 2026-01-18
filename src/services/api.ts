// 0xNull API Client - Adapts for clearnet (via proxy) and Tor (direct)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PROXY_URL = `${SUPABASE_URL}/functions/v1/xnull-proxy`;
const ONION_API = 'http://onullluix4iaj77wbqf52dhdiey4kaucdoqfkaoolcwxvcdxz5j6duid.onion/api';

// Detect if we're running on Tor (.onion)
export const isTorBrowser = (): boolean => {
  return typeof window !== 'undefined' && window.location.hostname.endsWith('.onion');
};

// Get the appropriate API base URL
export const getApiBaseUrl = (): string => {
  if (isTorBrowser()) {
    return ONION_API;
  }
  return PROXY_URL;
};

export interface TokenInfo {
  token: string;
  balance_usd: number;
  balance_cents: number;
}

export interface TopupResponse {
  address: string;
  amount_xmr: number;
  amount_usd: number;
  xmr_price: number;
  expires_at: number;
}

export interface Voice {
  id: string;
  name: string;
  description: string;
  provider: string;
  is_custom?: boolean;
}

export interface GenerateResponse {
  audio: string; // base64
  format: string;
  characters: number;
  cost_cents: number;
  provider: string;
}

// Tier configuration
export const TIER_CONFIG = {
  free: { maxChars: 100, requiresToken: false },
  standard: { maxChars: 5000, requiresToken: true },
  ultra: { maxChars: 5000, requiresToken: true }
} as const;

// Sleep utility for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if a path is a wallet/deposit creation operation that should be retried
const isWalletOperation = (path: string): boolean => {
  return path.includes('/api/predictions/bet') || 
         path.includes('/api/multibets') || 
         path.includes('/api/token');
};

// Check if an error is retryable (wallet creation failures)
const isRetryableError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  return message.includes('failed to create deposit') ||
         message.includes('cannot connect to host') ||
         message.includes('temporarily unavailable') ||
         message.includes('502') ||
         message.includes('503') ||
         message.includes('service unavailable');
};

// Helper to make requests - adapts for Tor vs clearnet
// Includes automatic retry for wallet creation failures
async function proxyRequest<T>(path: string, options: RequestInit = {}, timeoutMs = 8000): Promise<T> {
  const shouldRetry = isWalletOperation(path);
  const maxRetries = shouldRetry ? 2 : 1; // 1 retry = 2 total attempts
  const retryDelayMs = 5000; // 5 seconds between retries

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await doProxyRequest<T>(path, options, timeoutMs);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      
      // Only retry if it's a retryable error and we have retries left
      if (attempt < maxRetries && isRetryableError(lastError)) {
        console.log(`Wallet operation failed (attempt ${attempt}/${maxRetries}), retrying in ${retryDelayMs/1000}s...`);
        await sleep(retryDelayMs);
        continue;
      }
      
      // Don't retry non-retryable errors or if we're out of retries
      throw lastError;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Request failed');
}

// Core request implementation
async function doProxyRequest<T>(path: string, options: RequestInit = {}, timeoutMs = 8000): Promise<T> {
  const isOnion = isTorBrowser();

  let url: string;
  if (isOnion) {
    // Direct API call on Tor
    url = `${ONION_API}${path}`;
  } else {
    // Use Supabase proxy on clearnet
    const proxyUrl = new URL(PROXY_URL);
    proxyUrl.searchParams.set('path', path);
    url = proxyUrl.toString();
  }

  // Prevent infinite loading when the upstream API hangs
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Be robust to upstream non-JSON responses (common during 5xx incidents)
    let data: any;
    try {
      data = await res.clone().json();
    } catch {
      const text = await res.text();
      data = { error: text };
    }

    if (!res.ok) {
      // Handle betting closed specifically
      if (data?.betting_closed || data?.detail === 'Betting has closed for this market') {
        throw new Error('BETTING_CLOSED');
      }
      // Handle wallet/deposit address creation errors (will be retried by wrapper)
      if (data?.detail?.includes('Failed to create deposit address') || data?.detail?.includes('Cannot connect to host')) {
        throw new Error('Wallet creation temporarily unavailable');
      }
      // Handle 502/503 errors
      if (res.status === 502 || res.status === 503) {
        throw new Error(`Service temporarily unavailable (${res.status})`);
      }
      throw new Error(data?.detail || data?.error || 'Request failed');
    }

    return data as T;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Voucher types
export interface VoucherValidationResponse {
  valid: boolean;
  code: string;
  influencer?: string;
  user_benefit?: string;
  effective_fee?: string;
}

export interface VoucherStats {
  code: string;
  influencer: string;
  active: boolean;
  created_at?: number;
  stats: {
    unique_users: number;
    total_bets: number;
    total_volume_xmr: number;
    total_wins_xmr: number;
    total_influencer_earnings: number;
    total_user_rebates: number;
    pending_payout: number;
  };
}

export interface VoucherLeaderboardEntry {
  code: string;
  influencer: string;
  volume_xmr: number;
  earnings_xmr: number;
  users: number;
}

// Prediction market types
export interface PredictionBetRequest {
  market_id: string;
  side: 'YES' | 'NO';
  amount_usd: number;
  payout_address: string;
  voucher_code?: string;
}

export interface PredictionBetResponse {
  bet_id: string;
  market_id: string;
  side: 'YES' | 'NO';
  amount_usd: number;
  amount_xmr: number;
  xmr_price: number;
  deposit_address: string;
  view_key?: string;
  expires_at: string;
  status: string;
}

export interface PredictionBetStatus {
  bet_id: string;
  market_id: string;
  side: 'YES' | 'NO';
  amount_usd: number;
  amount_xmr: number;
  xmr_address: string;
  address_index: number;
  payout_address: string | null;
  payout_xmr?: number;
  payout_tx_hash?: string;
  payout_type?: 'refund_one_sided' | 'refund_all_losers' | 'winner_takes_pool';
  status: 'awaiting_deposit' | 'confirmed' | 'won' | 'lost' | 'paid';
  tx_hash: string | null;
  created_at: number;
  confirmed_at: number | null;
  resolved_at: number | null;
}

export interface PredictionMarket {
  market_id: string;
  title: string;
  description: string;
  oracle_type: string;
  oracle_asset: string;
  oracle_condition: string;
  oracle_value: number;
  resolution_time: number;
  resolved: number;
  outcome: 'YES' | 'NO' | null;
  yes_pool_xmr: number;
  no_pool_xmr: number;
  created_at: number;
  pool_address?: string;
  view_key?: string;
  // Betting cutoff fields
  commence_time?: number;
  betting_closes_at?: number;
  betting_open?: boolean;
}

export interface PoolInfo {
  market_id: string;
  exists: boolean;
  wallet_created: boolean;
  yes_pool_xmr: number;
  no_pool_xmr: number;
  pool_address: string | null;
  view_key: string | null;
  created_at: number;
}

export interface PayoutLeg {
  market_id: string;
  title: string;
  side: 'YES' | 'NO';
  outcome: 'won' | 'lost' | 'refund';
  payout_xmr: number;
}

export interface PayoutEntry {
  bet_id: string;
  market_id: string;
  title: string;
  description: string;
  side: 'YES' | 'NO' | 'MULTI';
  outcome: 'YES' | 'NO' | 'MULTI';
  stake_xmr: number;
  payout_xmr: number;
  // Per-bet type from API: 'win' or 'refund'
  type?: 'win' | 'refund';
  // Market-level payout type
  payout_type: 'winner_takes_pool' | 'refund_one_sided' | 'refund_all_losers' | 'refund_draw' | 'win' | 'refund' | 'multibet_win';
  payout_address: string;
  tx_hash: string;
  resolved_at: number;
  // Optional structured leg data for multibets
  legs?: PayoutLeg[];
  // Pool enrichment fields (added by proxy)
  was_unopposed?: boolean;
  yes_pool_xmr?: number;
  no_pool_xmr?: number;
}

// Multibet types
export interface MultibetLegRequest {
  market_id: string;
  side: 'YES' | 'NO';
  amount_usd: number;
}

export interface MultibetCreateRequest {
  legs: MultibetLegRequest[];
  payout_address?: string;
  voucher_code?: string;
}

export interface MultibetLeg {
  leg_id: string;
  market_id: string;
  side: 'YES' | 'NO';
  amount_usd: number;
  amount_xmr: number;
  outcome: 'YES' | 'NO' | null;
  payout_xmr: number | null;
}

export interface MultibetSlip {
  slip_id: string;
  xmr_address: string;
  total_amount_usd: number;
  total_amount_xmr: number;
  status: 'awaiting_deposit' | 'confirmed' | 'resolved' | 'paid';
  legs: MultibetLeg[];
  view_key: string;
  payout_address?: string;
  created_at?: number;
}

export interface MultibetListItem {
  slip_id: string;
  total_amount_usd: number;
  total_amount_xmr: number;
  status: 'awaiting_deposit' | 'confirmed' | 'resolved' | 'paid';
  created_at: number;
}

export interface CreateMarketRequest {
  market_id: string;
  title: string;
  description?: string;
  oracle_type: string;
  oracle_asset: string;
  oracle_condition: string;
  oracle_value: number;
  oracle_value_2?: number;
  resolution_time: number;
  betting_closes_at?: number;  // When betting should close (match start time)
  commence_time?: number;      // Match start time for display
}

export const api = {
  async createToken(): Promise<string> {
    const data = await proxyRequest<{ token: string }>('/api/token/create', { method: 'POST' });
    return data.token;
  },

  async getBalance(token: string): Promise<TokenInfo> {
    return proxyRequest<TokenInfo>(`/api/token/info?token=${encodeURIComponent(token)}`);
  },

  async topup(token: string, amountUsd: number): Promise<TopupResponse> {
    return proxyRequest<TopupResponse>('/api/token/topup', {
      method: 'POST',
      body: JSON.stringify({ token, amount_usd: amountUsd }),
    });
  },

  async getVoices(): Promise<{ voices: Voice[] }> {
    return proxyRequest<{ voices: Voice[] }>('/api/voice/voices');
  },

  async generateSpeech(
    text: string,
    voice: string,
    tier: string,
    token?: string
  ): Promise<GenerateResponse> {
    return proxyRequest<GenerateResponse>('/api/voice/generate', {
      method: 'POST',
      body: JSON.stringify({ text, voice, tier, token }),
    });
  },

  async getClones(token: string): Promise<{ clones: Voice[] }> {
    try {
      return await proxyRequest<{ clones: Voice[] }>(`/api/voice/clones?token=${encodeURIComponent(token)}`);
    } catch {
      return { clones: [] };
    }
  },

  async createClone(token: string, name: string, audioFile: File): Promise<{ clone_id: string; name: string }> {
    const isOnion = isTorBrowser();
    
    let url: string;
    if (isOnion) {
      url = `${ONION_API}/voice/clone`;
    } else {
      const proxyUrl = new URL(PROXY_URL);
      proxyUrl.searchParams.set('path', '/api/voice/clone');
      url = proxyUrl.toString();
    }
    
    const formData = new FormData();
    formData.append('token', token);
    formData.append('name', name);
    formData.append('description', '');
    formData.append('audio', audioFile);
    
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    
    if (res.status === 402) {
      throw new Error('INSUFFICIENT_BALANCE');
    }
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.error || 'Clone failed');
    }
    return data;
  },

  // Prediction market APIs - Use proxy for CORS
  async placePredictionBet(request: PredictionBetRequest): Promise<PredictionBetResponse> {
    // Longer timeout (90 seconds) for bet placement as it involves wallet operations
    return proxyRequest<PredictionBetResponse>('/api/predictions/bet', {
      method: 'POST',
      body: JSON.stringify(request),
    }, 90000);
  },

  async getPredictionBetStatus(betId: string): Promise<PredictionBetStatus> {
    return proxyRequest<PredictionBetStatus>(`/api/predictions/bet/${betId}/status`);
  },

  async submitPredictionPayoutAddress(betId: string, payoutAddress: string): Promise<{ success: boolean }> {
    return proxyRequest<{ success: boolean }>(`/api/predictions/bet/${betId}/payout-address`, {
      method: 'POST',
      body: JSON.stringify({ payout_address: payoutAddress }),
    });
  },

  async getPredictionMarkets(includeResolved = false): Promise<{ markets: PredictionMarket[] }> {
    const path = includeResolved 
      ? '/api/predictions/markets?include_resolved=true' 
      : '/api/predictions/markets';
    return proxyRequest<{ markets: PredictionMarket[] }>(path);
  },

  async getPredictionMarket(marketId: string): Promise<PredictionMarket & { bets: unknown[] }> {
    return proxyRequest<PredictionMarket & { bets: unknown[] }>(`/api/predictions/markets/${marketId}`);
  },

  async createMarket(request: CreateMarketRequest): Promise<{ market_id: string; status: string }> {
    return proxyRequest<{ market_id: string; status: string }>('/api/predictions/markets', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async deleteMarket(marketId: string): Promise<{ success: boolean }> {
    return proxyRequest<{ success: boolean }>(`/api/predictions/markets/${marketId}`, {
      method: 'DELETE',
    });
  },

  // Resolve a market manually (admin only)
  // DRAW outcome triggers automatic refunds for all bets
  async resolveMarket(marketId: string, outcome: 'YES' | 'NO' | 'DRAW'): Promise<{ success: boolean; message?: string }> {
    return proxyRequest<{ success: boolean; message?: string }>(`/api/predictions/markets/${marketId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ outcome }),
    }, 30000);
  },

  async getPoolInfo(marketId: string): Promise<PoolInfo> {
    return proxyRequest<PoolInfo>(`/api/predictions/pool/${marketId}`);
  },

  async getPredictionPayouts(): Promise<{ payouts: PayoutEntry[]; total: number }> {
    return proxyRequest<{ payouts: PayoutEntry[]; total: number }>('/api/predictions/payouts');
  },

  // Soft pool existence check: never throws / never propagates 5xx.
  // Uses the proxy's `soft_pool=1` mode to avoid surfacing upstream timeouts as runtime errors.
  async checkPool(marketId: string): Promise<PoolInfo> {
    const isOnion = isTorBrowser();

    let url: string;
    if (isOnion) {
      url = `${ONION_API}/predictions/pool/${marketId}`;
    } else {
      const proxyUrl = new URL(PROXY_URL);
      proxyUrl.searchParams.set('path', `/api/predictions/pool/${marketId}`);
      proxyUrl.searchParams.set('soft_pool', '1');
      url = proxyUrl.toString();
    }

    try {
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
      const data = await res.json().catch(() => ({}));

      // Proxy soft mode returns { exists, pool } while the direct endpoint returns the pool status itself.
      if (data?.pool && typeof data?.exists === 'boolean') return data.pool as PoolInfo;
      if (typeof data?.exists === 'boolean' && typeof data?.market_id === 'string') return data as PoolInfo;

      return { market_id: marketId, exists: false, wallet_created: false, yes_pool_xmr: 0, no_pool_xmr: 0, pool_address: null, view_key: null, created_at: 0 };
    } catch {
      return { market_id: marketId, exists: false, wallet_created: false, yes_pool_xmr: 0, no_pool_xmr: 0, pool_address: null, view_key: null, created_at: 0 };
    }
  },

  // Voucher APIs
  async validateVoucher(code: string): Promise<VoucherValidationResponse> {
    return proxyRequest<VoucherValidationResponse>(`/api/vouchers/validate/${encodeURIComponent(code.toUpperCase())}`);
  },

  async getVoucherStats(code: string): Promise<VoucherStats> {
    return proxyRequest<VoucherStats>(`/api/vouchers/stats/${encodeURIComponent(code.toUpperCase())}`);
  },

  async getVoucherLeaderboard(): Promise<{ leaderboard: VoucherLeaderboardEntry[] }> {
    return proxyRequest<{ leaderboard: VoucherLeaderboardEntry[] }>('/api/vouchers/leaderboard');
  },

  // Multibet APIs
  async createMultibet(legs: MultibetLegRequest[], payoutAddress?: string, voucherCode?: string): Promise<MultibetSlip> {
    return proxyRequest<MultibetSlip>('/api/multibets/create', {
      method: 'POST',
      body: JSON.stringify({
        legs,
        payout_address: payoutAddress,
        voucher_code: voucherCode,
      }),
    }, 90000);
  },

  async getMultibetSlip(slipId: string): Promise<MultibetSlip> {
    return proxyRequest<MultibetSlip>(`/api/multibets/${slipId}`);
  },

  async updateMultibetPayoutAddress(slipId: string, payoutAddress: string): Promise<{ status: string; payout_address: string }> {
    return proxyRequest<{ status: string; payout_address: string }>(`/api/multibets/${slipId}/payout-address`, {
      method: 'POST',
      body: JSON.stringify({ payout_address: payoutAddress }),
    });
  },

  async listMultibetSlips(status?: string, limit?: number): Promise<{ slips: MultibetListItem[]; count: number }> {
    let path = '/api/multibets/';
    const params: string[] = [];
    if (status) params.push(`status=${status}`);
    if (limit) params.push(`limit=${limit}`);
    if (params.length) path += `?${params.join('&')}`;
    return proxyRequest<{ slips: MultibetListItem[]; count: number }>(path);
  },
};
