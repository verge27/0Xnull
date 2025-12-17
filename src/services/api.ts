// 0xNull API Client - Adapts for clearnet (via proxy) and Tor (direct)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PROXY_URL = `${SUPABASE_URL}/functions/v1/0xnull-proxy`;
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

// Helper to make requests - adapts for Tor vs clearnet
async function proxyRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
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

  const res = await fetch(url, {
    ...options,
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
    throw new Error(data?.detail || data?.error || 'Request failed');
  }

  return data as T;
}

// Prediction market types
export interface PredictionBetRequest {
  market_id: string;
  side: 'YES' | 'NO';
  amount_usd: number;
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
}

export interface PoolInfo {
  market_id: string;
  pool_address: string;
  view_key: string;
  balance_xmr: number;
  unlocked_balance_xmr: number;
  verify_instructions: string;
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
    return proxyRequest<PredictionBetResponse>('/api/predictions/bet', {
      method: 'POST',
      body: JSON.stringify(request),
    });
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

  async getPredictionMarkets(): Promise<{ markets: PredictionMarket[] }> {
    return proxyRequest<{ markets: PredictionMarket[] }>('/api/predictions/markets');
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

  async getPoolInfo(marketId: string): Promise<PoolInfo> {
    return proxyRequest<PoolInfo>(`/api/predictions/pool/${marketId}`);
  },
};
