import { 
  Users, 
  DollarSign, 
  MessageSquare, 
  Gift, 
  Pin,
  Trophy,
  Flame
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Campaign, CampaignGoalType } from '@/hooks/useCreatorCampaigns';
import { cn } from '@/lib/utils';

interface CampaignCardProps {
  campaign: Campaign;
  compact?: boolean;
}

const goalIcons: Record<CampaignGoalType, typeof Users> = {
  subscribers: Users,
  tips: DollarSign,
  messages: MessageSquare,
};

const goalLabels: Record<CampaignGoalType, string> = {
  subscribers: 'Subscribers',
  tips: 'XMR in Tips',
  messages: 'Paid Messages',
};

export const CampaignCard = ({ campaign, compact = false }: CampaignCardProps) => {
  const Icon = goalIcons[campaign.goal.type];
  const progress = Math.min((campaign.goal.current / campaign.goal.target) * 100, 100);
  const isCompleted = !campaign.isActive && campaign.completedAt;
  const isAlmostDone = progress >= 80 && progress < 100;

  if (compact) {
    return (
      <div className={cn(
        "p-3 rounded-lg border transition-colors",
        isCompleted ? "bg-green-500/10 border-green-500/20" : "bg-muted/50 border-border"
      )}>
        <div className="flex items-center gap-2 mb-2">
          {campaign.isPinned && <Pin className="w-3 h-3 text-[#FF6600]" />}
          <span className="text-sm font-medium truncate">{campaign.title}</span>
          {isCompleted && <Trophy className="w-3 h-3 text-green-500" />}
          {isAlmostDone && <Flame className="w-3 h-3 text-orange-500 animate-pulse" />}
        </div>
        <Progress value={progress} className="h-1.5 mb-1" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Icon className="w-3 h-3" />
            {campaign.goal.current}/{campaign.goal.target}
          </span>
          <span className="flex items-center gap-1">
            <Gift className="w-3 h-3" />
            {campaign.reward}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      isCompleted && "ring-2 ring-green-500/50",
      isAlmostDone && "ring-2 ring-orange-500/50 animate-pulse"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {campaign.isPinned && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Pin className="w-3 h-3" />
                Pinned
              </Badge>
            )}
            {isCompleted && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
                <Trophy className="w-3 h-3" />
                Completed!
              </Badge>
            )}
            {isAlmostDone && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 gap-1">
                <Flame className="w-3 h-3" />
                Almost there!
              </Badge>
            )}
          </div>
        </div>

        <h3 className="font-semibold text-lg mb-1">{campaign.title}</h3>
        {campaign.description && (
          <p className="text-sm text-muted-foreground mb-4">{campaign.description}</p>
        )}

        {/* Progress */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Icon className="w-4 h-4" />
              {goalLabels[campaign.goal.type]}
            </span>
            <span className="font-mono font-medium">
              {campaign.goal.type === 'tips' ? (
                <>{campaign.goal.current.toFixed(3)} / {campaign.goal.target} XMR</>
              ) : (
                <>{campaign.goal.current} / {campaign.goal.target}</>
              )}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {progress.toFixed(0)}% complete
          </p>
        </div>

        {/* Reward */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#FF6600]/10 border border-[#FF6600]/20">
          <Gift className="w-5 h-5 text-[#FF6600] shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Reward</p>
            <p className="text-sm font-medium">{campaign.reward}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
