/**
 * Creator API client for 0xNull.io creator platform
 * Routes through edge function proxy to avoid CORS issues
 */

import {
  normalizeCreatorProfile,
  normalizeCreatorProfiles,
  normalizeCreatorStats,
  normalizeContentItem,
  normalizeContentItems,
} from '@/lib/creatorHelpers';

// Use the proxy edge function to avoid CORS
const getProxyUrl = (path: string) => {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'qjkojiamexufuxsrupjq';
  return `https://${projectId}.supabase.co/functions/v1/creator-proxy?path=${encodeURIComponent(path)}`;
};

// Types
export interface CreatorProfile {
  id: string;
  pubkey: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  content_count: number;
  subscriber_count: number;
  created_at: string;
}

export interface CreatorStats {
  total_earnings_xmr: number;
  total_views: number;
  total_unlocks: number;
}

export interface ContentItem {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  media_hash?: string;
  media_type?: string; // e.g. "video/mp4", "image/jpeg"
  tier: 'free' | 'paid';
  price_xmr?: number;
  tags: string[];
  view_count: number;
  unlock_count: number;
  earnings_xmr: number;
  created_at: string;
}

export interface UnlockResponse {
  payment_address: string;
  amount_xmr: number;
  expires_at: string;
}

export interface AuthChallenge {
  challenge: string;
  expires_at: string;
}

export interface AuthVerifyResponse {
  token: string; // 0xc_xxx format
  creator_id: string;
}

// Storage keys (per spec: creator_token, creator_pubkey)
const CREATOR_TOKEN_KEY = 'creator_token';
const CREATOR_PUBKEY_KEY = 'creator_pubkey';

class CreatorApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(CREATOR_TOKEN_KEY);
    }
  }

  // Token management
  setToken(token: string, pubkey: string): void {
    this.token = token;
    localStorage.setItem(CREATOR_TOKEN_KEY, token);
    localStorage.setItem(CREATOR_PUBKEY_KEY, pubkey);
  }

  getToken(): string | null {
    return this.token;
  }

  getPubkey(): string | null {
    return localStorage.getItem(CREATOR_PUBKEY_KEY);
  }

  clearSession(): void {
    this.token = null;
    localStorage.removeItem(CREATOR_TOKEN_KEY);
    localStorage.removeItem(CREATOR_PUBKEY_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Private request helper - routes through proxy
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const url = getProxyUrl(endpoint);
    const method = (options.method || 'GET').toUpperCase();

    console.log('[CreatorApi] request:start', { method, endpoint });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('[CreatorApi] request:response', {
      method,
      endpoint,
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[CreatorApi] request:errorBody', { method, endpoint, errorData });
      throw new Error(errorData.error || errorData.message || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  // ============ Public Endpoints ============

  async browseCreators(limit = 20, offset = 0): Promise<{ creators: CreatorProfile[]; total: number }> {
    // API sometimes returns { creators: [...], count } instead of { creators: [...], total }
    const raw = await this.request<{ creators?: unknown; total?: number; count?: number }>(`/browse?limit=${limit}&offset=${offset}`);
    const total = typeof raw?.total === 'number'
      ? raw.total
      : typeof raw?.count === 'number'
        ? raw.count
        : 0;

    return {
      creators: normalizeCreatorProfiles(raw?.creators),
      total,
    };
  }

  async searchContent(params: {
    q?: string;
    tags?: string[];
    tier?: 'free' | 'paid';
    page?: number;
    limit?: number;
  }): Promise<{ content: ContentItem[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.tags?.length) searchParams.set('tags', params.tags.join(','));
    if (params.tier) searchParams.set('tier', params.tier);
    searchParams.set('page', String(params.page || 1));
    searchParams.set('limit', String(params.limit || 20));
    
    const raw = await this.request<{ content?: unknown; total?: number }>(`/search?${searchParams.toString()}`);
    return {
      content: normalizeContentItems(raw?.content),
      total: typeof raw?.total === 'number' ? raw.total : 0,
    };
  }

  async getCreatorProfile(creatorId: string): Promise<CreatorProfile & { content?: ContentItem[] }> {
    const raw = await this.request<Record<string, unknown>>(`/profile/${creatorId}`);
    const profile = normalizeCreatorProfile(raw);
    
    // API embeds content array directly in profile response
    let embeddedContent: ContentItem[] = [];
    if (Array.isArray(raw?.content)) {
      embeddedContent = (raw.content as unknown[]).map((item) => {
        const normalized = normalizeContentItem(item);
        // Ensure creator_id is set from the profile
        if (!normalized.creator_id) {
          normalized.creator_id = creatorId;
        }
        return normalized;
      });
    }
    
    return { ...profile, content: embeddedContent };
  }

  async getContent(contentId: string): Promise<ContentItem & { is_unlocked: boolean }> {
    const raw = await this.request<Record<string, unknown>>(`/content/${contentId}`);

    // Some endpoints wrap the content item
    const payload = (raw?.content ?? raw?.item ?? raw?.data ?? raw) as Record<string, unknown>;
    const normalized = normalizeContentItem(payload);

    return {
      ...normalized,
      is_unlocked: raw?.is_unlocked === true,
    };
  }

  getMediaUrl(hashOrUrl: string): string {
    // Upstream may return a direct URL (or already-prefixed path). If so, use as-is.
    if (/^(https?:)?\/\//i.test(hashOrUrl) || hashOrUrl.startsWith('data:')) {
      return hashOrUrl;
    }

    // Some responses return "/api/creator/media/..."; keep it working.
    if (hashOrUrl.startsWith('/')) {
      return `https://api.0xnull.io${hashOrUrl}`;
    }

    // Otherwise treat it as a media hash.
    return `https://api.0xnull.io/api/creator/media/${hashOrUrl}`;
  }

  // ============ Auth Endpoints ============

  async checkWhitelist(pubkey: string): Promise<{ whitelisted: boolean; message?: string }> {
    try {
      const response = await fetch(getProxyUrl(`/whitelist/check?pubkey=${pubkey}`));
      if (response.ok) {
        return await response.json();
      }
      // If 404, endpoint might not exist - try alternative check via challenge
      if (response.status === 404) {
        // Fallback: try to get challenge - if it fails with 403, not whitelisted
        try {
          await this.getChallenge(pubkey);
          return { whitelisted: true };
        } catch (err) {
          const msg = err instanceof Error ? err.message : '';
          if (msg.includes('403') || msg.includes('forbidden') || msg.includes('whitelist')) {
            return { whitelisted: false, message: 'Public key not yet approved' };
          }
          throw err;
        }
      }
      if (response.status === 403) {
        return { whitelisted: false, message: 'Public key not yet approved' };
      }
      const data = await response.json().catch(() => ({}));
      return { whitelisted: false, message: data.error || 'Unable to verify status' };
    } catch (error) {
      throw error;
    }
  }

  async register(pubkey: string, displayName: string, bio?: string): Promise<{ creator_id: string }> {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify({
        pubkey,
        display_name: displayName,
        bio,
      }),
    });
  }

  async getChallenge(pubkey: string): Promise<AuthChallenge> {
    return this.request(`/auth/challenge?pubkey=${pubkey}`);
  }

  async verifySignature(pubkey: string, signature: string): Promise<AuthVerifyResponse> {
    return this.request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ pubkey, signature }),
    });
  }

  // ============ Creator Endpoints (Auth Required) ============

  async getMyProfile(): Promise<CreatorProfile & CreatorStats> {
    const raw = await this.request<Record<string, unknown>>('/profile/me');
    const profile = normalizeCreatorProfile(raw);
    const stats = normalizeCreatorStats(raw);
    return { ...profile, ...stats };
  }

  async updateMyProfile(updates: {
    display_name?: string;
    bio?: string;
    avatar_url?: string;
    banner_url?: string;
  }): Promise<CreatorProfile> {
    const raw = await this.request('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return normalizeCreatorProfile(raw);
  }

  /**
   * Upload a profile image (avatar or banner)
   * Returns the URL/hash to use in updateMyProfile
   * 
   * Tries multiple endpoint patterns as the API may use different paths:
   * 1. PUT /profile/me with multipart (profile update with image)
   * 2. POST /profile/avatar or /profile/banner (dedicated endpoints)
   * 3. As a fallback, upload as content and extract the media hash
   */
  async uploadProfileImage(file: File, type: 'avatar' | 'banner'): Promise<string> {
    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    console.log(`[CreatorApi] uploadProfileImage: uploading ${type}`);

    // Try approach 1: PUT /profile/me with multipart form data including the image
    try {
      const formData = new FormData();
      formData.append(type === 'avatar' ? 'avatar' : 'banner', file);
      // Also try alternative field names the API might expect
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch(getProxyUrl('/profile/me'), {
        method: 'PUT',
        headers,
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[CreatorApi] uploadProfileImage via profile/me:', data);
        // Check for returned URL in various formats
        const url = data[`${type}_url`] || data[`${type}_hash`] || data.url || data.hash || '';
        if (url) return url;
        // If no URL returned but success, the image is now attached - refresh will pick it up
        return '__attached__';
      }
      
      // If 405, try next approach
      if (response.status !== 405) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('[CreatorApi] uploadProfileImage via profile/me failed:', errorData);
      }
    } catch (err) {
      console.warn('[CreatorApi] uploadProfileImage via profile/me error:', err);
    }

    // Try approach 2: POST to /profile/avatar or /profile/banner
    try {
      const endpoint = type === 'avatar' ? '/profile/avatar' : '/profile/banner';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('image', file);
      formData.append(type, file);

      const response = await fetch(getProxyUrl(endpoint), {
        method: 'POST',
        headers,
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[CreatorApi] uploadProfileImage via ${endpoint}:`, data);
        return data.url || data.hash || data[`${type}_url`] || data[`${type}_hash`] || '__attached__';
      }
      
      if (response.status !== 404 && response.status !== 405) {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`[CreatorApi] uploadProfileImage via ${endpoint} failed:`, errorData);
      }
    } catch (err) {
      console.warn('[CreatorApi] uploadProfileImage via dedicated endpoint error:', err);
    }

    // Try approach 3: Upload via PATCH /profile/me
    try {
      const formData = new FormData();
      formData.append(type === 'avatar' ? 'avatar' : 'banner', file);
      formData.append('file', file);

      const response = await fetch(getProxyUrl('/profile/me'), {
        method: 'PATCH',
        headers,
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[CreatorApi] uploadProfileImage via PATCH profile/me:', data);
        return data[`${type}_url`] || data[`${type}_hash`] || data.url || data.hash || '__attached__';
      }
    } catch (err) {
      console.warn('[CreatorApi] uploadProfileImage via PATCH error:', err);
    }

    // All approaches failed
    throw new Error(
      `Profile ${type} upload is not supported by this API. Try uploading via the content upload and using that as your ${type}.`
    );
  }

  async getMyContent(page = 1, limit = 20): Promise<{ content: ContentItem[]; total: number }> {
    const raw = await this.request<{ content?: unknown; total?: number }>(`/my/content?page=${page}&limit=${limit}`);
    return {
      content: normalizeContentItems(raw?.content),
      total: typeof raw?.total === 'number' ? raw.total : 0,
    };
  }

  async uploadContent(formData: FormData): Promise<ContentItem> {
    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    // Don't set Content-Type for FormData - browser will set it with boundary

    console.log('[CreatorApi] uploadContent: starting upload');

    try {
      const response = await fetch(getProxyUrl('/content/upload'), {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('[CreatorApi] uploadContent: response status', response.status);

      if (!response.ok) {
        // Handle 413 Payload Too Large specifically
        if (response.status === 413) {
          throw new Error(
            'File too large for server. The server rejected this file due to size limits. Try compressing the file or uploading a smaller version.'
          );
        }

        const errorData = await response.json().catch(() => ({}));
        console.error('[CreatorApi] uploadContent: error', errorData);

        // Also check for 413-related error messages in the response
        const errorMsg = errorData.error || errorData.message || '';
        if (
          errorMsg.toLowerCase().includes('too large') ||
          errorMsg.toLowerCase().includes('entity too large')
        ) {
          throw new Error(
            'File too large for server. The server rejected this file due to size limits. Try compressing the file or uploading a smaller version.'
          );
        }

        throw new Error(errorMsg || `Upload failed: ${response.status}`);
      }

      const raw = await response.json();
      console.log('[CreatorApi] uploadContent: success', raw);

      // API sometimes wraps the item in { content: {...} } / { item: {...} }
      const payload = (raw?.content ?? raw?.item ?? raw?.data ?? raw) as unknown;
      return normalizeContentItem(payload);
    } catch (err) {
      console.error('[CreatorApi] uploadContent: exception', err);
      // Re-throw with better message if it's a network error that might be 413-related
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        throw new Error('Upload failed. This may be due to file size limits or network issues. Try a smaller file.');
      }
      throw err;
    }
  }

  async deleteContent(contentId: string): Promise<void> {
    await this.request(`/content/${contentId}`, {
      method: 'DELETE',
    });
  }

  // ============ User Endpoints (X-0xNull-Token) ============

  async unlockContent(contentId: string, userToken: string): Promise<UnlockResponse> {
    const response = await fetch(getProxyUrl(`/content/${contentId}/unlock`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-creator-token': userToken,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Unlock request failed');
    }

    return response.json();
  }

  async checkUnlockStatus(contentId: string, userToken: string): Promise<{ unlocked: boolean }> {
    const response = await fetch(getProxyUrl(`/content/${contentId}/status`), {
      headers: {
        'x-creator-token': userToken,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Status check failed');
    }

    return response.json();
  }
}

export const creatorApi = new CreatorApiClient();
