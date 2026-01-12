import { useState, useEffect, useCallback } from 'react';
import { getCreatorTiers, SubscriptionTier } from './useSubscriptionTiers';

export interface ContentTierAccess {
  contentId: string;
  requiredTierId: string | null; // null = free/all subscribers, tier id = specific tier required
  minTierPrice: number; // Minimum tier price required (0 = free)
}

interface ContentTierStore {
  [creatorId: string]: {
    [contentId: string]: ContentTierAccess;
  };
}

const STORAGE_KEY = 'creator_content_tiers';

// Load content tier access from localStorage
const loadContentTiers = (creatorId: string): Record<string, ContentTierAccess> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: ContentTierStore = JSON.parse(stored);
      return data[creatorId] || {};
    }
  } catch (error) {
    console.error('[useContentTierAccess] Failed to load:', error);
  }
  return {};
};

// Save content tier access to localStorage
const saveContentTiers = (creatorId: string, tiers: Record<string, ContentTierAccess>) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data: ContentTierStore = stored ? JSON.parse(stored) : {};
    data[creatorId] = tiers;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[useContentTierAccess] Failed to save:', error);
  }
};

export const useContentTierAccess = (creatorId: string | undefined) => {
  const [contentTiers, setContentTiers] = useState<Record<string, ContentTierAccess>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!creatorId) {
      setIsLoading(false);
      return;
    }

    setContentTiers(loadContentTiers(creatorId));
    setIsLoading(false);
  }, [creatorId]);

  // Set tier access for a content item
  const setContentTierAccess = useCallback((
    contentId: string,
    requiredTierId: string | null,
    minTierPrice: number = 0
  ) => {
    if (!creatorId) return;

    const newTiers = {
      ...contentTiers,
      [contentId]: { contentId, requiredTierId, minTierPrice },
    };
    setContentTiers(newTiers);
    saveContentTiers(creatorId, newTiers);
  }, [creatorId, contentTiers]);

  // Remove tier access restriction for content
  const removeContentTierAccess = useCallback((contentId: string) => {
    if (!creatorId) return;

    const newTiers = { ...contentTiers };
    delete newTiers[contentId];
    setContentTiers(newTiers);
    saveContentTiers(creatorId, newTiers);
  }, [creatorId, contentTiers]);

  // Get tier access for a specific content
  const getContentTierAccess = useCallback((contentId: string): ContentTierAccess | null => {
    return contentTiers[contentId] || null;
  }, [contentTiers]);

  return {
    contentTiers,
    isLoading,
    setContentTierAccess,
    removeContentTierAccess,
    getContentTierAccess,
  };
};

// Read-only helper for viewing content tiers
export const getContentTierAccessForCreator = (creatorId: string): Record<string, ContentTierAccess> => {
  return loadContentTiers(creatorId);
};

// Check if a user has access to content based on their subscription tier
export const checkTierAccess = (
  creatorId: string,
  contentId: string,
  userSubscribedTierId: string | null, // null if not subscribed
  userSubscribedTierPrice: number = 0
): { hasAccess: boolean; requiredTier: SubscriptionTier | null } => {
  const contentTiers = loadContentTiers(creatorId);
  const access = contentTiers[contentId];

  // No tier restriction = accessible to all subscribers
  if (!access || access.requiredTierId === null) {
    return { hasAccess: userSubscribedTierId !== null, requiredTier: null };
  }

  // Get the creator's tiers to find the required one
  const tiersConfig = getCreatorTiers(creatorId);
  const requiredTier = tiersConfig.tiers.find(t => t.id === access.requiredTierId);

  if (!requiredTier) {
    // Tier no longer exists, allow access
    return { hasAccess: userSubscribedTierId !== null, requiredTier: null };
  }

  // Check if user's tier price meets the minimum requirement
  const hasAccess = userSubscribedTierPrice >= requiredTier.priceXmr;

  return { hasAccess, requiredTier: hasAccess ? null : requiredTier };
};
