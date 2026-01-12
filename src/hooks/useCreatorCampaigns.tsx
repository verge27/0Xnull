import { useState, useCallback, useEffect } from 'react';

export type CampaignGoalType = 'subscribers' | 'tips' | 'messages';

export interface CampaignGoal {
  type: CampaignGoalType;
  target: number;
  current: number;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  goal: CampaignGoal;
  reward: string;
  isActive: boolean;
  isPinned: boolean;
  createdAt: string;
  completedAt?: string;
}

interface CampaignsStore {
  [creatorId: string]: Campaign[];
}

const STORAGE_KEY = 'creator_campaigns';

// Generate unique ID
const generateId = () => `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Load campaigns from localStorage
const loadCampaigns = (creatorId: string): Campaign[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: CampaignsStore = JSON.parse(stored);
      return data[creatorId] || [];
    }
  } catch (error) {
    console.error('[useCreatorCampaigns] Failed to load:', error);
  }
  return [];
};

// Save campaigns to localStorage
const saveCampaigns = (creatorId: string, campaigns: Campaign[]) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data: CampaignsStore = stored ? JSON.parse(stored) : {};
    data[creatorId] = campaigns;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[useCreatorCampaigns] Failed to save:', error);
  }
};

// Custom event for cross-tab updates
const CAMPAIGN_UPDATE_EVENT = 'creator_campaign_update';

export const triggerCampaignUpdate = (creatorId: string, goalType: CampaignGoalType, amount: number = 1) => {
  window.dispatchEvent(new CustomEvent(CAMPAIGN_UPDATE_EVENT, { 
    detail: { creatorId, goalType, amount } 
  }));
};

export const useCreatorCampaigns = (creatorId: string | undefined) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load campaigns
  useEffect(() => {
    if (!creatorId) {
      setIsLoading(false);
      return;
    }

    setCampaigns(loadCampaigns(creatorId));
    setIsLoading(false);
  }, [creatorId]);

  // Listen for campaign updates (tips, subscribers, messages)
  useEffect(() => {
    if (!creatorId) return;

    const handleUpdate = (e: Event) => {
      const { creatorId: targetId, goalType, amount } = (e as CustomEvent).detail;
      if (targetId !== creatorId) return;

      setCampaigns(prev => {
        const updated = prev.map(campaign => {
          if (!campaign.isActive || campaign.goal.type !== goalType) return campaign;
          
          const newCurrent = campaign.goal.current + amount;
          const isCompleted = newCurrent >= campaign.goal.target;
          
          return {
            ...campaign,
            goal: { ...campaign.goal, current: newCurrent },
            isActive: !isCompleted,
            completedAt: isCompleted ? new Date().toISOString() : undefined,
          };
        });
        
        saveCampaigns(creatorId, updated);
        return updated;
      });
    };

    window.addEventListener(CAMPAIGN_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(CAMPAIGN_UPDATE_EVENT, handleUpdate);
  }, [creatorId]);

  // Create a new campaign
  const createCampaign = useCallback((
    title: string,
    description: string,
    goalType: CampaignGoalType,
    target: number,
    reward: string
  ) => {
    if (!creatorId) return null;

    const campaign: Campaign = {
      id: generateId(),
      title,
      description,
      goal: { type: goalType, target, current: 0 },
      reward,
      isActive: true,
      isPinned: false,
      createdAt: new Date().toISOString(),
    };

    setCampaigns(prev => {
      const updated = [campaign, ...prev];
      saveCampaigns(creatorId, updated);
      return updated;
    });

    return campaign;
  }, [creatorId]);

  // Update campaign
  const updateCampaign = useCallback((id: string, updates: Partial<Omit<Campaign, 'id' | 'createdAt'>>) => {
    if (!creatorId) return;

    setCampaigns(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      saveCampaigns(creatorId, updated);
      return updated;
    });
  }, [creatorId]);

  // Delete campaign
  const deleteCampaign = useCallback((id: string) => {
    if (!creatorId) return;

    setCampaigns(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveCampaigns(creatorId, updated);
      return updated;
    });
  }, [creatorId]);

  // Toggle pin status
  const togglePin = useCallback((id: string) => {
    if (!creatorId) return;

    setCampaigns(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c);
      saveCampaigns(creatorId, updated);
      return updated;
    });
  }, [creatorId]);

  // Increment campaign progress manually
  const incrementProgress = useCallback((id: string, amount: number = 1) => {
    if (!creatorId) return;

    setCampaigns(prev => {
      const updated = prev.map(c => {
        if (c.id !== id || !c.isActive) return c;
        
        const newCurrent = c.goal.current + amount;
        const isCompleted = newCurrent >= c.goal.target;
        
        return {
          ...c,
          goal: { ...c.goal, current: newCurrent },
          isActive: !isCompleted,
          completedAt: isCompleted ? new Date().toISOString() : undefined,
        };
      });
      
      saveCampaigns(creatorId, updated);
      return updated;
    });
  }, [creatorId]);

  // Get active campaigns
  const activeCampaigns = campaigns.filter(c => c.isActive);
  
  // Get pinned campaigns
  const pinnedCampaigns = campaigns.filter(c => c.isPinned && c.isActive);
  
  // Get completed campaigns
  const completedCampaigns = campaigns.filter(c => !c.isActive && c.completedAt);

  return {
    campaigns,
    activeCampaigns,
    pinnedCampaigns,
    completedCampaigns,
    isLoading,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    togglePin,
    incrementProgress,
  };
};

// Read-only hook for viewing campaigns on profiles
export const getCreatorCampaigns = (creatorId: string): Campaign[] => {
  return loadCampaigns(creatorId);
};
