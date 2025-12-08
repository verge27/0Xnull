// 0xNull API Client - Uses Supabase proxy to avoid CORS

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PROXY_URL = `${SUPABASE_URL}/functions/v1/0xnull-proxy`;

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
    // Convert file to base64 using FileReader (handles large files)
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/mpeg;base64,")
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioFile);
    });
    
    return proxyRequest<{ clone_id: string; name: string }>('/api/voice/clone', {
      method: 'POST',
      body: JSON.stringify({
        req: { token, name },
        audio: {
          filename: audioFile.name,
          content: base64,
          content_type: audioFile.type
        }
      }),
    });
  },
};
