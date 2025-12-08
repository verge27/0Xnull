// 0xNull API Client
// Uses Supabase Edge Function proxy to avoid CORS issues

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PROXY_URL = `${SUPABASE_URL}/functions/v1/0xnull-proxy`;

export interface TokenInfo {
  token: string;
  balance_usd: number;
  balance_cents?: number;
  message?: string;
}

export interface TopupResponse {
  address: string;
  amount_xmr: number;
  deposit_id?: string;
}

export interface VoiceGenerateResponse {
  audio: string; // base64 encoded
  format: 'mp3' | 'wav';
  cost_cents: number;
  duration_seconds?: number;
  characters_used?: number;
}

export interface VoiceCloneResponse {
  clone_id: string;
  name: string;
  status: string;
  cost_usd?: number;
}

export interface Voice {
  id: string;
  name: string;
  description: string;
  provider?: string;
  is_custom?: boolean;
}

export interface PricingInfo {
  free: { max_chars: number; cost_per_1k: number };
  standard: { max_chars: number; cost_per_1k: number };
  ultra: { max_chars: number; cost_per_1k: number };
  clone_cost_usd: number;
}

// Tier configuration
export const TIER_CONFIG = {
  free: { maxChars: 100, requiresToken: false },
  standard: { maxChars: 5000, requiresToken: true },
  ultra: { maxChars: 5000, requiresToken: true }
} as const;

// Helper to make requests through the proxy
async function proxyRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const proxyUrl = new URL(PROXY_URL);
  proxyUrl.searchParams.set('path', path);
  
  const res = await fetch(proxyUrl.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.detail || data.error || 'Request failed');
  }
  
  return data;
}

// Token Management
export const createToken = async (): Promise<TokenInfo> => {
  return proxyRequest<TokenInfo>('/api/token/create', { method: 'POST' });
};

export const getBalance = async (token: string): Promise<{ balance_cents: number }> => {
  return proxyRequest<{ balance_cents: number }>(`/api/token/balance?token=${token}`);
};

export const getTokenInfo = async (token: string): Promise<TokenInfo> => {
  return proxyRequest<TokenInfo>(`/api/token/info?token=${token}`);
};

export const topupToken = async (token: string, amountUsd: number): Promise<TopupResponse> => {
  return proxyRequest<TopupResponse>('/api/token/topup', {
    method: 'POST',
    body: JSON.stringify({ token, amount_usd: amountUsd })
  });
};

// Voice
export const getVoices = async (): Promise<{ voices: Voice[]; provider?: string }> => {
  return proxyRequest<{ voices: Voice[]; provider?: string }>('/api/voice/voices');
};

export const getPricing = async (): Promise<PricingInfo> => {
  return proxyRequest<PricingInfo>('/api/voice/pricing');
};

export const generateSpeech = async (
  text: string, 
  voice: string, 
  tier: string, 
  token?: string
): Promise<VoiceGenerateResponse> => {
  const body: Record<string, unknown> = { text, voice, tier };
  if (token) body.token = token;
  
  return proxyRequest<VoiceGenerateResponse>('/api/voice/generate', {
    method: 'POST',
    body: JSON.stringify(body)
  });
};

export const getClones = async (token: string): Promise<{ clones: Voice[] }> => {
  return proxyRequest<{ clones: Voice[] }>(`/api/voice/clones?token=${token}`);
};

export const createClone = async (
  token: string, 
  name: string, 
  audioFile: File
): Promise<VoiceCloneResponse> => {
  const proxyUrl = new URL(PROXY_URL);
  proxyUrl.searchParams.set('path', '/api/voice/clone');
  
  const formData = new FormData();
  formData.append('token', token);
  formData.append('name', name);
  formData.append('audio', audioFile);
  
  const res = await fetch(proxyUrl.toString(), { 
    method: 'POST', 
    body: formData 
  });
  
  if (res.status === 402) {
    throw new Error('Insufficient balance - need $2.00');
  }
  
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.error || 'Failed to clone voice');
  }
  return data;
};
