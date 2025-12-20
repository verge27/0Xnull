// 0xNull Backend API Client
// Use Supabase Edge Function as proxy to avoid CORS issues
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PROXY_URL = `${SUPABASE_URL}/functions/v1/xnull-proxy`;
interface ApiResponse<T> {
  data?: T;
  error?: string;
  new_balance_usd?: number;
}

interface TokenInfo {
  token: string;
  balance_usd: number;
  balance_cents?: number;
  created_at?: string;
}

interface TopupResponse {
  xmr_address: string;
  xmr_amount: number;
  deposit_id: string;
  qr_code?: string;
}

interface DepositStatus {
  confirmed: boolean;
  amount_usd?: number;
}

interface VoiceGenerateResponse {
  audio: string; // base64 encoded
  format: 'mp3' | 'wav';
  cost_cents: number;
  duration_seconds?: number;
  characters_used?: number;
}

interface VoiceCloneResponse {
  clone_id: string;
  name: string;
  status: string;
  cost_usd?: number;
}

interface Voice {
  id: string;
  name: string;
  description: string;
  provider?: string;
  is_custom?: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  message: string;
  cost_usd: number;
  new_balance_usd: number;
}

interface SwapRate {
  provider: string;
  rate: number;
  amount_to: string;
  eta_minutes: number;
}

interface SwapCreateResponse {
  swap_id: string;
  deposit_address: string;
  deposit_amount: string;
  receive_amount: string;
  expires_at: string;
}

interface SwapStatus {
  swap_id: string;
  status: 'pending' | 'confirming' | 'exchanging' | 'sending' | 'completed' | 'failed';
  deposit_amount: string;
  receive_amount: string;
  receive_address: string;
}

// Tier configuration
export const TIER_CONFIG = {
  free: { maxChars: 100, requiresToken: false },
  standard: { maxChars: 5000, requiresToken: true },
  ultra: { maxChars: 5000, requiresToken: true }
} as const;

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('0xnull_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('0xnull_token', token);
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('0xnull_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Build proxy URL with path parameter
    const proxyUrl = new URL(PROXY_URL);
    proxyUrl.searchParams.set('path', endpoint);
    
    try {
      const response = await fetch(proxyUrl.toString(), {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          return { error: 'Insufficient balance' };
        }
        return { error: data.detail || data.error || 'Request failed' };
      }

      return { data, new_balance_usd: data.new_balance_usd };
    } catch (error) {
      console.error('API request error:', error);
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  // Token Management
  async createToken(): Promise<ApiResponse<TokenInfo>> {
    return this.request<TokenInfo>('/api/token/create', {
      method: 'POST',
    });
  }

  async getTokenInfo(): Promise<ApiResponse<TokenInfo>> {
    if (!this.token) {
      return { error: 'No token set' };
    }
    const result = await this.request<{ balance_cents: number }>(`/api/token/balance?token=${this.token}`);
    if (result.data) {
      return {
        data: {
          token: this.token,
          balance_usd: result.data.balance_cents / 100,
          balance_cents: result.data.balance_cents
        }
      };
    }
    return { error: result.error };
  }

  async createDeposit(amount_usd: number): Promise<ApiResponse<TopupResponse>> {
    if (!this.token) {
      return { error: 'No token set' };
    }
    return this.request<TopupResponse>('/api/token/deposit', {
      method: 'POST',
      body: JSON.stringify({ token: this.token, amount_usd }),
    });
  }

  async getDepositStatus(deposit_id: string): Promise<ApiResponse<DepositStatus>> {
    return this.request<DepositStatus>(`/api/token/deposit/${deposit_id}/status`);
  }

  // Voice Services
  async getVoices(): Promise<ApiResponse<Voice[]>> {
    const result = await this.request<{ voices: Voice[] }>('/api/voice/voices');
    if (result.data?.voices) {
      return { data: result.data.voices };
    }
    return { error: result.error };
  }

  async generateVoice(
    text: string,
    voice_id: string,
    tier: 'free' | 'standard' | 'ultra' = 'standard'
  ): Promise<ApiResponse<VoiceGenerateResponse>> {
    const body: Record<string, unknown> = {
      text,
      voice: voice_id,
      tier
    };
    
    // Only include token for paid tiers
    if (tier !== 'free' && this.token) {
      body.token = this.token;
    }

    return this.request<VoiceGenerateResponse>('/api/voice/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async cloneVoice(
    audio_file: File,
    name: string
  ): Promise<ApiResponse<VoiceCloneResponse>> {
    if (!this.token) {
      return { error: 'No token set' };
    }
    
    // For file uploads, we need to use the proxy differently
    // Build proxy URL for voice clone
    const proxyUrl = new URL(PROXY_URL);
    proxyUrl.searchParams.set('path', '/api/voice/clone');
    
    const formData = new FormData();
    formData.append('token', this.token);
    formData.append('audio', audio_file);
    formData.append('name', name);

    try {
      const response = await fetch(proxyUrl.toString(), {
        method: 'POST',
        body: formData,
      });

      if (response.status === 402) {
        return { error: 'Insufficient balance - need $2.00' };
      }

      const data = await response.json();
      if (!response.ok) {
        return { error: data.detail || data.error || 'Clone failed' };
      }
      return { data, new_balance_usd: data.new_balance_usd };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async getClones(): Promise<ApiResponse<Voice[]>> {
    if (!this.token) {
      return { error: 'No token set' };
    }
    return this.request<Voice[]>(`/api/voice/clones?token=${this.token}`);
  }

  // AI Chat Services
  async kokoroChat(messages: ChatMessage[]): Promise<ApiResponse<ChatResponse>> {
    if (!this.token) {
      return { error: 'No token set' };
    }
    return this.request<ChatResponse>('/api/kokoro/chat', {
      method: 'POST',
      body: JSON.stringify({ token: this.token, messages }),
    });
  }

  // Streaming chat (for real-time responses)
  async *streamChat(
    endpoint: '/api/kokoro/chat',
    messages: ChatMessage[]
  ): AsyncGenerator<string, void, unknown> {
    if (!this.token) {
      throw new Error('No token set');
    }

    const proxyUrl = new URL(PROXY_URL);
    proxyUrl.searchParams.set('path', endpoint);

    const response = await fetch(proxyUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: this.token, messages, stream: true }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Stream failed');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }

  // Swap Services
  async getSwapRate(
    from_coin: string,
    to_coin: string,
    amount: string
  ): Promise<ApiResponse<SwapRate[]>> {
    const params = new URLSearchParams({ from_coin, to_coin, amount });
    return this.request<SwapRate[]>(`/api/swap/rate?${params}`);
  }

  async createSwap(
    from_coin: string,
    to_coin: string,
    amount: string,
    receive_address: string,
    provider?: string
  ): Promise<ApiResponse<SwapCreateResponse>> {
    return this.request<SwapCreateResponse>('/api/swap/create', {
      method: 'POST',
      body: JSON.stringify({ from_coin, to_coin, amount, receive_address, provider }),
    });
  }

  async getSwapStatus(swap_id: string): Promise<ApiResponse<SwapStatus>> {
    return this.request<SwapStatus>(`/api/swap/status/${swap_id}`);
  }
}

export const api = new ApiClient();
export type { 
  TokenInfo, 
  TopupResponse,
  DepositStatus,
  VoiceGenerateResponse, 
  Voice, 
  ChatMessage, 
  ChatResponse,
  SwapRate,
  SwapCreateResponse,
  SwapStatus 
};
