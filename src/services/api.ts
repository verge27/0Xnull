// 0xNull Direct API Client
// Calls the 0xNull API directly without proxy

const API_BASE = 'https://api.0xnull.io/api';

export interface TokenInfo {
  token: string;
  balance_usd: number;
  balance_cents: number;
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

// Token Management
export const createToken = async (): Promise<TokenInfo> => {
  const res = await fetch(`${API_BASE}/token/create`, { method: 'POST' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create token');
  }
  return res.json();
};

export const getBalance = async (token: string): Promise<{ balance_cents: number }> => {
  const res = await fetch(`${API_BASE}/token/balance?token=${token}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to get balance');
  }
  return res.json();
};

export const getTokenInfo = async (token: string): Promise<TokenInfo> => {
  const res = await fetch(`${API_BASE}/token/info?token=${token}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Invalid token');
  }
  return res.json();
};

export const topupToken = async (token: string, amountUsd: number): Promise<TopupResponse> => {
  const res = await fetch(`${API_BASE}/token/topup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, amount_usd: amountUsd })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create deposit');
  }
  return res.json();
};

// Voice
export const getVoices = async (): Promise<{ voices: Voice[]; provider?: string }> => {
  const res = await fetch(`${API_BASE}/voice/voices`);
  if (!res.ok) {
    throw new Error('Failed to get voices');
  }
  return res.json();
};

export const getPricing = async (): Promise<PricingInfo> => {
  const res = await fetch(`${API_BASE}/voice/pricing`);
  if (!res.ok) {
    throw new Error('Failed to get pricing');
  }
  return res.json();
};

export const generateSpeech = async (
  text: string, 
  voice: string, 
  tier: string, 
  token?: string
): Promise<VoiceGenerateResponse> => {
  const body: Record<string, unknown> = { text, voice, tier };
  if (token) body.token = token;
  
  const res = await fetch(`${API_BASE}/voice/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if (res.status === 402) {
    throw new Error('Insufficient balance');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || data.error || 'Failed to generate speech');
  }
  return res.json();
};

export const getClones = async (token: string): Promise<{ clones: Voice[] }> => {
  const res = await fetch(`${API_BASE}/voice/clones?token=${token}`);
  if (!res.ok) {
    throw new Error('Failed to get clones');
  }
  return res.json();
};

export const createClone = async (
  token: string, 
  name: string, 
  audioFile: File
): Promise<VoiceCloneResponse> => {
  const formData = new FormData();
  formData.append('token', token);
  formData.append('name', name);
  formData.append('audio', audioFile);
  
  const res = await fetch(`${API_BASE}/voice/clone`, { 
    method: 'POST', 
    body: formData 
  });
  
  if (res.status === 402) {
    throw new Error('Insufficient balance - need $2.00');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || data.error || 'Failed to clone voice');
  }
  return res.json();
};
