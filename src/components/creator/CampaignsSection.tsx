import { useState } from 'react';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CampaignCard } from './CampaignCard';
import { getCreatorCampaigns, Campaign } from '@/hooks/useCreatorCampaigns';

interface CampaignsSectionProps {
  creatorId: string;
}

export const CampaignsSection = ({ creatorId }: CampaignsSectionProps) => {
  const [showCompleted, setShowCompleted] = useState(false);
  const campaigns = getCreatorCampaigns(creatorId);
  
  const activeCampaigns = campaigns.filter(c => c.isActive);
  const pinnedCampaigns = activeCampaigns.filter(c => c.isPinned);
  const unpinnedCampaigns = activeCampaigns.filter(c => !c.isPinned);
  const completedCampaigns = campaigns.filter(c => !c.isActive && c.completedAt);

  if (campaigns.length === 0) return null;

  // Sort: pinned first, then by creation date
  const sortedActive = [...pinnedCampaigns, ...unpinnedCampaigns];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="w-4 h-4 text-[#FF6600]" />
          Goals & Campaigns
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Active campaigns */}
        {sortedActive.length > 0 ? (
          sortedActive.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} compact />
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            No active campaigns
          </p>
        )}

        {/* Completed campaigns (collapsible) */}
        {completedCampaigns.length > 0 && (
          <Collapsible open={showCompleted} onOpenChange={setShowCompleted}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                {showCompleted ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Hide completed ({completedCampaigns.length})
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Show completed ({completedCampaigns.length})
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-2">
              {completedCampaigns.map(campaign => (
                <CampaignCard key={campaign.id} campaign={campaign} compact />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};
