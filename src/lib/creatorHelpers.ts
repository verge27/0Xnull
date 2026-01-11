/**
 * Helper utilities for safely handling creator API responses
 * All functions handle null/undefined values gracefully
 */

import type { CreatorProfile, CreatorStats, ContentItem } from '@/services/creatorApi';

// Default values for missing fields
const DEFAULT_CREATOR_PROFILE: CreatorProfile = {
  id: '',
  pubkey: '',
  display_name: 'Unknown',
  bio: undefined,
  avatar_url: undefined,
  banner_url: undefined,
  content_count: 0,
  subscriber_count: 0,
  created_at: new Date().toISOString(),
};

const DEFAULT_CREATOR_STATS: CreatorStats = {
  total_earnings_xmr: 0,
  total_views: 0,
  total_unlocks: 0,
};

const DEFAULT_CONTENT_ITEM: ContentItem = {
  id: '',
  creator_id: '',
  title: 'Untitled',
  description: undefined,
  thumbnail_url: undefined,
  media_hash: undefined,
  media_type: undefined,
  tier: 'free',
  price_xmr: undefined,
  tags: [],
  view_count: 0,
  unlock_count: 0,
  earnings_xmr: 0,
  created_at: new Date().toISOString(),
};

/**
 * Safely normalize a creator profile response, filling in defaults for missing fields
 */
export function normalizeCreatorProfile(raw: unknown): CreatorProfile {
  if (!raw || typeof raw !== 'object') {
    console.warn('[creatorHelpers] Invalid profile response, returning default');
    return { ...DEFAULT_CREATOR_PROFILE };
  }

  const data = raw as Record<string, unknown>;
  
  return {
    // API sometimes returns creator_id instead of id
    id: safeString(data.id ?? data.creator_id, DEFAULT_CREATOR_PROFILE.id),
    // API returns pubkey on profile endpoints; keep fallbacks for alternate shapes
    pubkey: safeString((data.pubkey ?? data.public_key ?? data.pubKey) as unknown, DEFAULT_CREATOR_PROFILE.pubkey),
    display_name: safeString(data.display_name, DEFAULT_CREATOR_PROFILE.display_name),
    bio: safeStringOptional(data.bio),
    // API may return avatar_hash/banner_hash in list endpoints
    avatar_url: safeStringOptional(data.avatar_url ?? data.avatar_hash),
    banner_url: safeStringOptional(data.banner_url ?? data.banner_hash),
    // API may return total_content instead of content_count
    content_count: safeNumber(data.content_count ?? data.total_content, DEFAULT_CREATOR_PROFILE.content_count),
    subscriber_count: safeNumber(data.subscriber_count, DEFAULT_CREATOR_PROFILE.subscriber_count),
    created_at: safeString(data.created_at, DEFAULT_CREATOR_PROFILE.created_at),
  };
}

/**
 * Safely normalize creator stats from profile response
 */
export function normalizeCreatorStats(raw: unknown): CreatorStats {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_CREATOR_STATS };
  }

  const data = raw as Record<string, unknown>;

  return {
    total_earnings_xmr: safeNumber(data.total_earnings_xmr, DEFAULT_CREATOR_STATS.total_earnings_xmr),
    total_views: safeNumber(data.total_views, DEFAULT_CREATOR_STATS.total_views),
    total_unlocks: safeNumber(data.total_unlocks, DEFAULT_CREATOR_STATS.total_unlocks),
  };
}

/**
 * Safely normalize a content item response
 */
export function normalizeContentItem(raw: unknown): ContentItem {
  if (!raw || typeof raw !== 'object') {
    console.warn('[creatorHelpers] Invalid content item, returning default');
    return { ...DEFAULT_CONTENT_ITEM };
  }

  // Some endpoints wrap the item under { content: {...} } or { item: {...} }
  const maybeWrapped = raw as Record<string, unknown>;
  const data = (maybeWrapped.content ?? maybeWrapped.item ?? maybeWrapped.data ?? maybeWrapped) as Record<
    string,
    unknown
  >;

  return {
    id: safeString(data.id ?? data.content_id ?? data.uuid, DEFAULT_CONTENT_ITEM.id),
    creator_id: safeString(
      data.creator_id ?? data.creatorId ?? data.creator ?? data.creator_uuid,
      DEFAULT_CONTENT_ITEM.creator_id
    ),

    // Title/caption sometimes comes back as name/caption
    title: safeString(data.title ?? data.caption ?? data.name, DEFAULT_CONTENT_ITEM.title),
    description: safeStringOptional(data.description ?? data.text ?? data.body),

    // Thumbnail can be returned as hash OR as a direct URL
    thumbnail_url: safeStringOptional(
      data.thumbnail_url ??
        data.thumbnail ??
        data.thumbnail_hash ??
        data.thumb_hash ??
        data.thumb ??
        data.preview_url ??
        data.preview
    ),

    // Media can be returned as hash OR as a direct URL
    media_hash: safeStringOptional(
      data.media_hash ?? data.media ?? data.media_url ?? data.file_hash ?? data.hash
    ),
    
    // Media type (e.g. "video/mp4", "image/jpeg")
    media_type: safeStringOptional(data.media_type ?? data.content_type ?? data.mime_type),

    tier: safeTier(data.tier ?? data.access ?? data.visibility),
    price_xmr: safeNumberOptional(data.price_xmr ?? data.price ?? data.priceXmr),
    tags: safeStringArray(data.tags ?? data.tag_list ?? data.tagList),

    view_count: safeNumber(data.view_count ?? data.views, DEFAULT_CONTENT_ITEM.view_count),
    unlock_count: safeNumber(
      data.unlock_count ?? data.unlocks ?? data.likes,
      DEFAULT_CONTENT_ITEM.unlock_count
    ),
    earnings_xmr: safeNumberOptional(data.earnings_xmr ?? data.earnings ?? data.earningsXmr) ??
      DEFAULT_CONTENT_ITEM.earnings_xmr,

    created_at: safeString(data.created_at ?? data.createdAt, DEFAULT_CONTENT_ITEM.created_at),
  };
}

/**
 * Normalize an array of creator profiles
 */
export function normalizeCreatorProfiles(raw: unknown): CreatorProfile[] {
  if (!Array.isArray(raw)) {
    console.warn('[creatorHelpers] Expected array for creators, got:', typeof raw);
    return [];
  }
  return raw.map(normalizeCreatorProfile);
}

/**
 * Normalize an array of content items
 */
export function normalizeContentItems(raw: unknown): ContentItem[] {
  if (!Array.isArray(raw)) {
    console.warn('[creatorHelpers] Expected array for content, got:', typeof raw);
    return [];
  }
  return raw.map(normalizeContentItem);
}

// =============== Primitive Helpers ===============

function safeString(value: unknown, fallback: string): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function safeStringOptional(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') return value;
  return undefined;
}

function safeNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return parsed;
  }
  return fallback;
}

function safeNumberOptional(value: unknown): number | undefined {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return parsed;
  }
  return undefined;
}

function safeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

function safeTier(value: unknown): 'free' | 'paid' {
  if (value === 'paid') return 'paid';
  return 'free';
}

/**
 * Safe getter for nested object properties
 */
export function safeGet<T>(obj: unknown, path: string, fallback: T): T {
  if (!obj || typeof obj !== 'object') return fallback;
  
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return fallback;
    }
    current = (current as Record<string, unknown>)[key];
  }
  
  return (current as T) ?? fallback;
}
