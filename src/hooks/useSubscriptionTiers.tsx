import { useState, useEffect, useCallback } from 'react';

export interface SubscriptionTier {
  id: string;
  name: string;
  priceXmr: number;
  benefits: string[];
  color: string; // Tailwind color class suffix (e.g., 'orange', 'purple', 'yellow')
  badge?: string; // Optional badge text (e.g., 'Popular', 'Best Value')
}

export interface CreatorTiersConfig {
  tiers: SubscriptionTier[];
  enableTiers: boolean;
}

const DEFAULT_TIERS: SubscriptionTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    priceXmr: 0.01,
    benefits: [
      'Access to basic paid content',
      'Support the creator',
      'Ad-free experience',
    ],
    color: 'blue',
  },
  {
    id: 'premium',
    name: 'Premium',
    priceXmr: 0.03,
    benefits: [
      'All Basic benefits',
      'Full access to premium content',
      'Direct messaging with creator',
      'Early access to new content',
    ],
    color: 'orange',
    badge: 'Popular',
  },
  {
    id: 'vip',
    name: 'VIP',
    priceXmr: 0.1,
    benefits: [
      'All Premium benefits',
      'Exclusive VIP-only content',
      'Priority replies to messages',
      'Custom content requests',
      'Behind-the-scenes access',
      'Shoutouts & recognition',
    ],
    color: 'purple',
    badge: 'Best Value',
  },
];

const DEFAULT_CONFIG: CreatorTiersConfig = {
  tiers: DEFAULT_TIERS,
  enableTiers: true,
};

const STORAGE_KEY_PREFIX = 'creator_tiers_';

export const useSubscriptionTiers = (creatorId: string | undefined) => {
  const [config, setConfig] = useState<CreatorTiersConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Load tiers from localStorage
  useEffect(() => {
    if (!creatorId) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${creatorId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      }
    } catch (err) {
      console.error('Failed to load subscription tiers:', err);
    }
    setIsLoading(false);
  }, [creatorId]);

  // Save config to localStorage
  const saveConfig = useCallback((newConfig: CreatorTiersConfig) => {
    if (!creatorId) return;

    setConfig(newConfig);
    
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${creatorId}`, JSON.stringify(newConfig));
    } catch (err) {
      console.error('Failed to save subscription tiers:', err);
    }
  }, [creatorId]);

  // Update a specific tier
  const updateTier = useCallback((tierId: string, updates: Partial<SubscriptionTier>) => {
    const newTiers = config.tiers.map(tier =>
      tier.id === tierId ? { ...tier, ...updates } : tier
    );
    saveConfig({ ...config, tiers: newTiers });
  }, [config, saveConfig]);

  // Add a new tier
  const addTier = useCallback((tier: SubscriptionTier) => {
    const newTiers = [...config.tiers, tier];
    saveConfig({ ...config, tiers: newTiers });
  }, [config, saveConfig]);

  // Remove a tier
  const removeTier = useCallback((tierId: string) => {
    const newTiers = config.tiers.filter(t => t.id !== tierId);
    saveConfig({ ...config, tiers: newTiers });
  }, [config, saveConfig]);

  // Reorder tiers
  const reorderTiers = useCallback((newOrder: SubscriptionTier[]) => {
    saveConfig({ ...config, tiers: newOrder });
  }, [config, saveConfig]);

  // Toggle tiers feature
  const toggleTiers = useCallback((enabled: boolean) => {
    saveConfig({ ...config, enableTiers: enabled });
  }, [config, saveConfig]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    saveConfig(DEFAULT_CONFIG);
  }, [saveConfig]);

  return {
    config,
    tiers: config.tiers,
    enableTiers: config.enableTiers,
    isLoading,
    updateTier,
    addTier,
    removeTier,
    reorderTiers,
    toggleTiers,
    resetToDefaults,
    saveConfig,
  };
};

// Helper to get tiers for a creator (read-only)
export const getCreatorTiers = (creatorId: string): CreatorTiersConfig => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${creatorId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (err) {
    console.error('Failed to get creator tiers:', err);
  }
  return DEFAULT_CONFIG;
};

// Tier color mappings
export const TIER_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/30',
    gradient: 'from-blue-500/20 to-blue-500/5',
  },
  orange: {
    bg: 'bg-[#FF6600]/10',
    text: 'text-[#FF6600]',
    border: 'border-[#FF6600]/30',
    gradient: 'from-[#FF6600]/20 to-[#FF6600]/5',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    border: 'border-purple-500/30',
    gradient: 'from-purple-500/20 to-purple-500/5',
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500',
    border: 'border-yellow-500/30',
    gradient: 'from-yellow-500/20 to-yellow-500/5',
  },
  green: {
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    border: 'border-green-500/30',
    gradient: 'from-green-500/20 to-green-500/5',
  },
  pink: {
    bg: 'bg-pink-500/10',
    text: 'text-pink-500',
    border: 'border-pink-500/30',
    gradient: 'from-pink-500/20 to-pink-500/5',
  },
};
