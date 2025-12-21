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
  category?: 'esports' | 'sports' | 'crypto';
  label: string;
  icon: string;
  links: CommunityLink[];
}

const GAME_COMMUNITIES: GameCommunity[] = [
  // Esports
  {
    game: 'csgo',
    category: 'esports',
    label: 'Counter-Strike 2',
    icon: '🔫',
    links: [
      { type: 'discord', name: 'Discord', url: 'https://discord.gg/counterstrike' },
      { type: 'reddit', name: 'r/GlobalOffensive', url: 'https://reddit.com/r/GlobalOffensive' },
    ],
  },
  {
    game: 'dota2',
    category: 'esports',
    label: 'Dota 2',
    icon: '🏰',
    links: [
      { type: 'discord', name: 'Discord', url: 'https://discord.gg/dota2' },
      { type: 'reddit', name: 'r/DotA2', url: 'https://reddit.com/r/DotA2' },
    ],
  },
  {
    game: 'lol',
    category: 'esports',
    label: 'League of Legends',
    icon: '⚔️',
    links: [
      { type: 'discord', name: 'Discord', url: 'https://discord.gg/leagueoflegends' },
      { type: 'reddit', name: 'r/leagueoflegends', url: 'https://reddit.com/r/leagueoflegends' },
    ],
  },
  {
    game: 'starcraft-2',
    category: 'esports',
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
    category: 'esports',
    label: 'Valorant',
    icon: '🎯',
    links: [
      { type: 'discord', name: 'Discord', url: 'https://discord.gg/valorant' },
      { type: 'reddit', name: 'r/VALORANT', url: 'https://reddit.com/r/VALORANT' },
    ],
  },
  // Sports
  {
    game: 'football',
    category: 'sports',
    label: 'Football/Soccer',
    icon: '⚽',
    links: [
      { type: 'reddit', name: 'r/soccer', url: 'https://reddit.com/r/soccer' },
      { type: 'reddit', name: 'r/football', url: 'https://reddit.com/r/football' },
    ],
  },
  {
    game: 'basketball',
    category: 'sports',
    label: 'Basketball',
    icon: '🏀',
    links: [
      { type: 'reddit', name: 'r/nba', url: 'https://reddit.com/r/nba' },
      { type: 'reddit', name: 'r/basketball', url: 'https://reddit.com/r/basketball' },
    ],
  },
  {
    game: 'mma',
    category: 'sports',
    label: 'MMA/UFC',
    icon: '🥊',
    links: [
      { type: 'reddit', name: 'r/MMA', url: 'https://reddit.com/r/MMA' },
      { type: 'reddit', name: 'r/ufc', url: 'https://reddit.com/r/ufc' },
    ],
  },
  {
    game: 'tennis',
    category: 'sports',
    label: 'Tennis',
    icon: '🎾',
    links: [
      { type: 'reddit', name: 'r/tennis', url: 'https://reddit.com/r/tennis' },
    ],
  },
  // Crypto
  {
    game: 'bitcoin',
    category: 'crypto',
    label: 'Bitcoin',
    icon: '₿',
    links: [
      { type: 'reddit', name: 'r/Bitcoin', url: 'https://reddit.com/r/Bitcoin' },
      { type: 'reddit', name: 'r/CryptoCurrency', url: 'https://reddit.com/r/CryptoCurrency' },
    ],
  },
  {
    game: 'monero',
    category: 'crypto',
    label: 'Monero',
    icon: '🔒',
    links: [
      { type: 'reddit', name: 'r/Monero', url: 'https://reddit.com/r/Monero' },
      { type: 'forum', name: 'Monero.town', url: 'https://monero.town' },
    ],
  },
  {
    game: 'trading',
    category: 'crypto',
    label: 'Trading',
    icon: '📈',
    links: [
      { type: 'reddit', name: 'r/CryptoMarkets', url: 'https://reddit.com/r/CryptoMarkets' },
      { type: 'reddit', name: 'r/BitcoinMarkets', url: 'https://reddit.com/r/BitcoinMarkets' },
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
  category?: 'esports' | 'sports' | 'crypto';
}

export function GameCommunityLinks({ selectedGame, category }: GameCommunityLinksProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Filter communities based on category first, then selected game
  let displayCommunities = GAME_COMMUNITIES;
  
  if (category) {
    displayCommunities = displayCommunities.filter(c => c.category === category);
  }
  
  if (selectedGame && selectedGame !== 'all') {
    const filtered = displayCommunities.filter(c => c.game === selectedGame || c.game.includes(selectedGame));
    if (filtered.length > 0) {
      displayCommunities = filtered;
    }
  }

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
