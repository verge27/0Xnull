import { useState, useCallback, useEffect } from 'react';

const PINNED_POSTS_KEY = 'creator_pinned_posts';

interface PinnedPostsStore {
  [creatorId: string]: string[]; // Array of content IDs
}

/**
 * Hook to manage pinned posts for creators
 * Stores pinned post IDs in localStorage keyed by creator ID
 */
export function usePinnedPosts(creatorId: string | undefined) {
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  // Load pinned posts from localStorage
  useEffect(() => {
    if (!creatorId) return;
    
    try {
      const stored = localStorage.getItem(PINNED_POSTS_KEY);
      if (stored) {
        const data: PinnedPostsStore = JSON.parse(stored);
        const ids = data[creatorId] || [];
        setPinnedIds(new Set(ids));
      }
    } catch (error) {
      console.error('[usePinnedPosts] Failed to load pinned posts:', error);
    }
  }, [creatorId]);

  // Save pinned posts to localStorage
  const savePinnedIds = useCallback((ids: Set<string>) => {
    if (!creatorId) return;
    
    try {
      const stored = localStorage.getItem(PINNED_POSTS_KEY);
      const data: PinnedPostsStore = stored ? JSON.parse(stored) : {};
      data[creatorId] = [...ids];
      localStorage.setItem(PINNED_POSTS_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[usePinnedPosts] Failed to save pinned posts:', error);
    }
  }, [creatorId]);

  // Toggle pin status
  const togglePin = useCallback((contentId: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(contentId)) {
        next.delete(contentId);
      } else {
        // Limit to 3 pinned posts max
        if (next.size >= 3) {
          // Remove oldest (first) pin
          const oldest = next.values().next().value;
          if (oldest) next.delete(oldest);
        }
        next.add(contentId);
      }
      savePinnedIds(next);
      return next;
    });
  }, [savePinnedIds]);

  // Check if a post is pinned
  const isPinned = useCallback((contentId: string) => {
    return pinnedIds.has(contentId);
  }, [pinnedIds]);

  // Sort content with pinned items first
  const sortWithPinned = useCallback(<T extends { id: string }>(items: T[]): T[] => {
    const pinned: T[] = [];
    const unpinned: T[] = [];
    
    items.forEach(item => {
      if (pinnedIds.has(item.id)) {
        pinned.push(item);
      } else {
        unpinned.push(item);
      }
    });
    
    return [...pinned, ...unpinned];
  }, [pinnedIds]);

  // Mark content items with is_pinned flag
  const markPinned = useCallback(<T extends { id: string; is_pinned?: boolean }>(items: T[]): T[] => {
    return items.map(item => ({
      ...item,
      is_pinned: pinnedIds.has(item.id)
    }));
  }, [pinnedIds]);

  return {
    pinnedIds,
    togglePin,
    isPinned,
    sortWithPinned,
    markPinned,
    pinnedCount: pinnedIds.size
  };
}
