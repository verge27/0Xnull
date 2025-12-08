// 0xNull Backend API Client
// Configure this to your FastAPI backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.0xnull.com';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  new_balance_usd?: number;
}

interface TokenInfo {
  token: string;
  balance_usd: number;
  created_at: string;
}

interface TopupResponse {
  address: string;
  amount_xmr: number;
  amount_usd: number;
  expires_at: string;
}

interface VoiceGenerateResponse {
  audio_url: string;
  duration_seconds: number;
  characters_used: number;
  cost_usd: number;
  new_balance_usd: number;
}

interface VoiceCloneResponse {
  voice_id: string;
  name: string;
  cost_usd: number;
  new_balance_usd: number;
}

interface Voice {
  id: string;
  name: string;
  description: string;
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
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
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
    return this.request<TokenInfo>(`/api/token/info?token=${this.token}`);
  }

  async topupToken(amount_usd: number): Promise<ApiResponse<TopupResponse>> {
    if (!this.token) {
      return { error: 'No token set' };
    }
    return this.request<TopupResponse>('/api/token/topup', {
      method: 'POST',
      body: JSON.stringify({ token: this.token, amount_usd }),
    });
  }

  // Voice Services
  async getVoices(): Promise<ApiResponse<Voice[]>> {
    const tokenParam = this.token ? `?token=${this.token}` : '';
    return this.request<Voice[]>(`/api/voice/voices${tokenParam}`);
  }

  async generateVoice(
    text: string,
    voice_id: string,
    tier: 'standard' | 'ultra' = 'standard'
  ): Promise<ApiResponse<VoiceGenerateResponse>> {
    if (!this.token) {
      return { error: 'No token set' };
    }
    return this.request<VoiceGenerateResponse>('/api/voice/generate', {
      method: 'POST',
      body: JSON.stringify({ token: this.token, text, voice_id, tier }),
    });
  }

  async cloneVoice(
    audio_file: File,
    name: string
  ): Promise<ApiResponse<VoiceCloneResponse>> {
    if (!this.token) {
      return { error: 'No token set' };
    }
    
    const formData = new FormData();
    formData.append('token', this.token);
    formData.append('audio', audio_file);
    formData.append('name', name);

    const url = `${API_BASE_URL}/api/voice/clone`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.detail || data.error || 'Clone failed' };
      }
      return { data, new_balance_usd: data.new_balance_usd };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  // AI Chat Services
  async therapyChat(messages: ChatMessage[]): Promise<ApiResponse<ChatResponse>> {
    if (!this.token) {
      return { error: 'No token set' };
    }
    return this.request<ChatResponse>('/api/therapy/chat', {
      method: 'POST',
      body: JSON.stringify({ token: this.token, messages }),
    });
  }

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
    endpoint: '/api/therapy/chat' | '/api/kokoro/chat',
    messages: ChatMessage[]
  ): AsyncGenerator<string, void, unknown> {
    if (!this.token) {
      throw new Error('No token set');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
  VoiceGenerateResponse, 
  Voice, 
  ChatMessage, 
  ChatResponse,
  SwapRate,
  SwapCreateResponse,
  SwapStatus 
};
