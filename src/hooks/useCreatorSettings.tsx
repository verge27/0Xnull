import { useState, useEffect, useCallback } from 'react';

export interface CreatorSettings {
  messageFeeXmr: number; // Fee in XMR for non-subscribers to message (default 0.01)
  allowNonSubMessages: boolean; // Whether to allow pay-per-message at all
}

const DEFAULT_SETTINGS: CreatorSettings = {
  messageFeeXmr: 0.01,
  allowNonSubMessages: true,
};

const STORAGE_KEY_PREFIX = 'creator_settings_';

export const useCreatorSettings = (creatorId: string | undefined) => {
  const [settings, setSettings] = useState<CreatorSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    if (!creatorId) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${creatorId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (err) {
      console.error('Failed to load creator settings:', err);
    }
    setIsLoading(false);
  }, [creatorId]);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: Partial<CreatorSettings>) => {
    if (!creatorId) return;

    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${creatorId}`, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save creator settings:', err);
    }
  }, [creatorId, settings]);

  const updateMessageFee = useCallback((fee: number) => {
    saveSettings({ messageFeeXmr: Math.max(0.001, fee) });
  }, [saveSettings]);

  const toggleNonSubMessages = useCallback((allow: boolean) => {
    saveSettings({ allowNonSubMessages: allow });
  }, [saveSettings]);

  return {
    settings,
    isLoading,
    updateMessageFee,
    toggleNonSubMessages,
    saveSettings,
  };
};

// Helper to get settings for a creator (read-only, for profile viewing)
export const getCreatorSettings = (creatorId: string): CreatorSettings => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${creatorId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.error('Failed to get creator settings:', err);
  }
  return DEFAULT_SETTINGS;
};
