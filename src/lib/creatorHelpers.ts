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
    id: safeString(data.id, DEFAULT_CREATOR_PROFILE.id),
    pubkey: safeString(data.pubkey, DEFAULT_CREATOR_PROFILE.pubkey),
    display_name: safeString(data.display_name, DEFAULT_CREATOR_PROFILE.display_name),
    bio: safeStringOptional(data.bio),
    avatar_url: safeStringOptional(data.avatar_url),
    banner_url: safeStringOptional(data.banner_url),
    content_count: safeNumber(data.content_count, DEFAULT_CREATOR_PROFILE.content_count),
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

  const data = raw as Record<string, unknown>;

  return {
    id: safeString(data.id, DEFAULT_CONTENT_ITEM.id),
    creator_id: safeString(data.creator_id, DEFAULT_CONTENT_ITEM.creator_id),
    title: safeString(data.title, DEFAULT_CONTENT_ITEM.title),
    description: safeStringOptional(data.description),
    thumbnail_url: safeStringOptional(data.thumbnail_url),
    media_hash: safeStringOptional(data.media_hash),
    tier: safeTier(data.tier),
    price_xmr: safeNumberOptional(data.price_xmr),
    tags: safeStringArray(data.tags),
    view_count: safeNumber(data.view_count, DEFAULT_CONTENT_ITEM.view_count),
    unlock_count: safeNumber(data.unlock_count, DEFAULT_CONTENT_ITEM.unlock_count),
    earnings_xmr: safeNumber(data.earnings_xmr, DEFAULT_CONTENT_ITEM.earnings_xmr),
    created_at: safeString(data.created_at, DEFAULT_CONTENT_ITEM.created_at),
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
