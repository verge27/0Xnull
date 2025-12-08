// 0xNull API Client

const API_BASE = 'https://api.0xnull.io/api';

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

export const api = {
  async createToken(): Promise<string> {
    const res = await fetch(`${API_BASE}/token/create`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to create token');
    const data = await res.json();
    return data.token;
  },

  async getBalance(token: string): Promise<TokenInfo> {
    const res = await fetch(`${API_BASE}/token/info?token=${encodeURIComponent(token)}`);
    if (!res.ok) throw new Error('Failed to get balance');
    return res.json();
  },

  async topup(token: string, amountUsd: number): Promise<TopupResponse> {
    const res = await fetch(`${API_BASE}/token/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, amount_usd: amountUsd }),
    });
    if (!res.ok) throw new Error('Failed to create topup');
    return res.json();
  },

  async getVoices(): Promise<{ voices: Voice[] }> {
    const res = await fetch(`${API_BASE}/voice/voices`);
    if (!res.ok) throw new Error('Failed to get voices');
    return res.json();
  },

  async generateSpeech(
    text: string,
    voice: string,
    tier: string,
    token?: string
  ): Promise<GenerateResponse> {
    const res = await fetch(`${API_BASE}/voice/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, tier, token }),
    });
    if (res.status === 402) {
      throw new Error('INSUFFICIENT_BALANCE');
    }
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Generation failed');
    }
    return res.json();
  },

  async getClones(token: string): Promise<{ clones: Voice[] }> {
    const res = await fetch(`${API_BASE}/voice/clones?token=${encodeURIComponent(token)}`);
    if (!res.ok) return { clones: [] };
    return res.json();
  },

  async createClone(token: string, name: string, audioFile: File): Promise<{ clone_id: string; name: string }> {
    const formData = new FormData();
    formData.append('audio', audioFile);
    const res = await fetch(`${API_BASE}/voice/clone?token=${encodeURIComponent(token)}&name=${encodeURIComponent(name)}`, {
      method: 'POST',
      body: formData,
    });
    if (res.status === 402) {
      throw new Error('INSUFFICIENT_BALANCE');
    }
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Clone failed');
    }
    return res.json();
  },
};
