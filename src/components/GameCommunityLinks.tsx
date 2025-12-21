import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, MessageCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface CommunityLink {
  type: 'reddit' | 'forum';
  name: string;
  url: string;
}

interface GameCommunity {
  game: string;
  category?: 'esports' | 'sports' | 'crypto';
  label: string;
  icon: string;
  discordServerId?: string; // Discord server ID for widget embed
  discordInvite?: string; // Fallback invite link
  links: CommunityLink[];
}

const GAME_COMMUNITIES: GameCommunity[] = [
  // Esports
  {
    game: 'csgo',
    category: 'esports',
    label: 'Counter-Strike 2',
    icon: '🔫',
    discordServerId: '254077273427927040',
    discordInvite: 'https://discord.gg/counterstrike',
    links: [
      { type: 'reddit', name: 'r/GlobalOffensive', url: 'https://reddit.com/r/GlobalOffensive' },
    ],
  },
  {
    game: 'dota2',
    category: 'esports',
    label: 'Dota 2',
    icon: '🏰',
    discordServerId: '156076912663289857',
    discordInvite: 'https://discord.gg/dota2',
    links: [
      { type: 'reddit', name: 'r/DotA2', url: 'https://reddit.com/r/DotA2' },
    ],
  },
  {
    game: 'lol',
    category: 'esports',
    label: 'League of Legends',
    icon: '⚔️',
    discordServerId: '187652476080488449',
    discordInvite: 'https://discord.gg/leagueoflegends',
    links: [
      { type: 'reddit', name: 'r/leagueoflegends', url: 'https://reddit.com/r/leagueoflegends' },
    ],
  },
  {
    game: 'starcraft-2',
    category: 'esports',
    label: 'StarCraft II',
    icon: '🌌',
    discordServerId: '125440014904590336',
    discordInvite: 'https://discord.gg/starcraft',
    links: [
      { type: 'reddit', name: 'r/starcraft', url: 'https://reddit.com/r/starcraft' },
      { type: 'forum', name: 'Team Liquid', url: 'https://tl.net/forum/starcraft-2/' },
    ],
  },
  {
    game: 'valorant',
    category: 'esports',
    label: 'Valorant',
    icon: '🎯',
    discordServerId: '704231681309278228',
    discordInvite: 'https://discord.gg/valorant',
    links: [
      { type: 'reddit', name: 'r/VALORANT', url: 'https://reddit.com/r/VALORANT' },
    ],
  },
  // Sports
  {
    game: 'football',
    category: 'sports',
    label: 'Football/Soccer',
    icon: '⚽',
    discordServerId: '331601870066614273',
    discordInvite: 'https://discord.gg/soccer',
    links: [
      { type: 'reddit', name: 'r/soccer', url: 'https://reddit.com/r/soccer' },
    ],
  },
  {
    game: 'basketball',
    category: 'sports',
    label: 'Basketball',
    icon: '🏀',
    discordServerId: '187563629792813056',
    discordInvite: 'https://discord.gg/nba',
    links: [
      { type: 'reddit', name: 'r/nba', url: 'https://reddit.com/r/nba' },
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
    discordServerId: '478229448707145729',
    discordInvite: 'https://discord.gg/monero',
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
    ],
  },
];

const getLinkIcon = (type: CommunityLink['type']) => {
  switch (type) {
    case 'reddit':
      return <Users className="w-3.5 h-3.5" />;
    case 'forum':
      return <ExternalLink className="w-3.5 h-3.5" />;
  }
};

const getLinkColor = (type: CommunityLink['type']) => {
  switch (type) {
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

// Map alternative game keys to our community keys
const GAME_KEY_MAP: Record<string, string> = {
  'sc2': 'starcraft-2',
  'starcraft': 'starcraft-2',
  'cs2': 'csgo',
  'counterstrike': 'csgo',
  'league': 'lol',
  'dota': 'dota2',
};

export function GameCommunityLinks({ selectedGame, category }: GameCommunityLinksProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [discordOpen, setDiscordOpen] = useState(true);

  // Normalize selected game key
  const normalizedGame = selectedGame ? (GAME_KEY_MAP[selectedGame] || selectedGame) : selectedGame;

  // Filter communities based on category first, then selected game
  let displayCommunities = GAME_COMMUNITIES;
  
  if (category) {
    displayCommunities = displayCommunities.filter(c => c.category === category);
  }
  
  // Find community matching the selected game
  let discordCommunity: GameCommunity | undefined;
  
  if (normalizedGame && normalizedGame !== 'all') {
    const matchedCommunity = displayCommunities.find(
      c => c.game === normalizedGame || c.game.includes(normalizedGame) || normalizedGame.includes(c.game)
    );
    if (matchedCommunity) {
      discordCommunity = matchedCommunity;
      displayCommunities = [matchedCommunity];
    }
  }
  
  // If no specific game selected, use first community with Discord
  if (!discordCommunity) {
    discordCommunity = displayCommunities.find(c => c.discordServerId);
  }

  if (displayCommunities.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Discord Widget Embed */}
      {discordCommunity?.discordServerId && (
        <Collapsible open={discordOpen} onOpenChange={setDiscordOpen}>
          <Card className="bg-card/80 backdrop-blur-sm border-[#5865F2]/30">
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-2 cursor-pointer hover:bg-[#5865F2]/10 transition-colors rounded-t-lg">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#5865F2]" />
                    <span className="text-[#5865F2]">Discord</span>
                    <span className="text-xs text-muted-foreground">• {discordCommunity.label}</span>
                  </span>
                  {discordOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-0">
                <iframe
                  src={`https://discord.com/widget?id=${discordCommunity.discordServerId}&theme=dark`}
                  width="100%"
                  height="300"
                  frameBorder="0"
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                  className="rounded-lg"
                  title={`${discordCommunity.label} Discord`}
                />
                {discordCommunity.discordInvite && (
                  <a
                    href={discordCommunity.discordInvite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-1 text-xs text-[#5865F2] hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in Discord
                  </a>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Other Community Links */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Communities
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

              {/* Ecosystem hint */}
              <div className="pt-2 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground text-center">
                  Watch → Bet → Play → Discuss
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
