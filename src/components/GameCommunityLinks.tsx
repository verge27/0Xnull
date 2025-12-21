import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, MessageCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface CommunityLink {
  type: 'discord' | 'reddit' | 'forum';
  name: string;
  url: string;
}

interface GameCommunity {
  game: string;
  label: string;
  icon: string;
  links: CommunityLink[];
}

const GAME_COMMUNITIES: GameCommunity[] = [
  {
    game: 'csgo',
    label: 'Counter-Strike 2',
    icon: '🔫',
    links: [
      { type: 'discord', name: 'Discord', url: 'https://discord.gg/counterstrike' },
      { type: 'reddit', name: 'r/GlobalOffensive', url: 'https://reddit.com/r/GlobalOffensive' },
    ],
  },
  {
    game: 'dota2',
    label: 'Dota 2',
    icon: '🏰',
    links: [
      { type: 'discord', name: 'Discord', url: 'https://discord.gg/dota2' },
      { type: 'reddit', name: 'r/DotA2', url: 'https://reddit.com/r/DotA2' },
    ],
  },
  {
    game: 'lol',
    label: 'League of Legends',
    icon: '⚔️',
    links: [
      { type: 'discord', name: 'Discord', url: 'https://discord.gg/leagueoflegends' },
      { type: 'reddit', name: 'r/leagueoflegends', url: 'https://reddit.com/r/leagueoflegends' },
    ],
  },
  {
    game: 'starcraft-2',
    label: 'StarCraft II',
    icon: '🌌',
    links: [
      { type: 'discord', name: 'Discord', url: 'https://discord.gg/starcraft' },
      { type: 'reddit', name: 'r/starcraft', url: 'https://reddit.com/r/starcraft' },
      { type: 'forum', name: 'Team Liquid', url: 'https://tl.net/forum/starcraft-2/' },
    ],
  },
  {
    game: 'valorant',
    label: 'Valorant',
    icon: '🎯',
    links: [
      { type: 'discord', name: 'Discord', url: 'https://discord.gg/valorant' },
      { type: 'reddit', name: 'r/VALORANT', url: 'https://reddit.com/r/VALORANT' },
    ],
  },
];

const getLinkIcon = (type: CommunityLink['type']) => {
  switch (type) {
    case 'discord':
      return <MessageCircle className="w-3.5 h-3.5" />;
    case 'reddit':
      return <Users className="w-3.5 h-3.5" />;
    case 'forum':
      return <ExternalLink className="w-3.5 h-3.5" />;
  }
};

const getLinkColor = (type: CommunityLink['type']) => {
  switch (type) {
    case 'discord':
      return 'bg-[#5865F2]/20 text-[#5865F2] hover:bg-[#5865F2]/30 border-[#5865F2]/30';
    case 'reddit':
      return 'bg-[#FF4500]/20 text-[#FF4500] hover:bg-[#FF4500]/30 border-[#FF4500]/30';
    case 'forum':
      return 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30';
  }
};

interface GameCommunityLinksProps {
  selectedGame?: string;
}

export function GameCommunityLinks({ selectedGame }: GameCommunityLinksProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Filter communities based on selected game
  const displayCommunities = selectedGame && selectedGame !== 'all'
    ? GAME_COMMUNITIES.filter(c => c.game === selectedGame || c.game.includes(selectedGame))
    : GAME_COMMUNITIES;

  if (displayCommunities.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Community
              </span>
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {displayCommunities.map((community) => (
              <div key={community.game} className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{community.icon}</span>
                  <span className="font-medium">{community.label}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {community.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge
                        variant="outline"
                        className={`text-xs cursor-pointer transition-colors ${getLinkColor(link.type)}`}
                      >
                        {getLinkIcon(link.type)}
                        <span className="ml-1">{link.name}</span>
                      </Badge>
                    </a>
                  ))}
                </div>
              </div>
            ))}

            {/* Discord Widget hint */}
            <div className="pt-2 border-t border-border/50">
              <p className="text-[10px] text-muted-foreground text-center">
                Join the discussion • Watch → Bet → Play → Discuss
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
