import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tv, EyeOff, Eye, Users, ExternalLink, RefreshCw, Info, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GAME_DOWNLOAD_URLS } from '@/hooks/useEsportsEvents';

interface StreamInfo {
  channel: string | null;
  channelName?: string;
  title?: string;
  viewerCount?: number;
  gameName?: string;
  thumbnailUrl?: string;
}

interface TwitchStreamEmbedProps {
  selectedGame: string;
  onActiveGameChange?: (gameSlug: string | null) => void;
}

const GAME_FILTERS = [
  { key: 'all', label: 'All', icon: '🎮' },
  // MOBA
  { key: 'lol', label: 'LoL', icon: '⚔️' },
  { key: 'dota2', label: 'Dota 2', icon: '🛡️' },
  { key: 'mlbb', label: 'MLBB', icon: '📲' },
  { key: 'lol-wild-rift', label: 'Wild Rift', icon: '📱' },
  { key: 'kog', label: 'King of Glory', icon: '👑' },
  // FPS
  { key: 'csgo', label: 'CS2', icon: '🔫' },
  { key: 'valorant', label: 'Valorant', icon: '🎯' },
  { key: 'ow', label: 'Overwatch', icon: '🦸' },
  { key: 'cod', label: 'CoD', icon: '💥' },
  { key: 'r6siege', label: 'R6 Siege', icon: '🛡️' },
  { key: 'pubg', label: 'PUBG', icon: '🪂' },
  // Sports
  { key: 'rl', label: 'Rocket League', icon: '🚗' },
  { key: 'fifa', label: 'EA FC', icon: '⚽' },
  // Strategy
  { key: 'starcraft-2', label: 'SC2', icon: '🌌' },
  { key: 'starcraft-brood-war', label: 'SC:BW', icon: '👾' },
];

// Map Twitch game names to our slug keys for download URLs
const GAME_NAME_TO_SLUG: Record<string, string> = {
  'League of Legends': 'lol',
  'Counter-Strike 2': 'csgo',
  'Counter-Strike': 'csgo',
  'CS:GO': 'csgo',
  'Dota 2': 'dota2',
  'VALORANT': 'valorant',
  'Valorant': 'valorant',
  'Overwatch 2': 'ow',
  'Overwatch': 'ow',
  'Rocket League': 'rl',
  'Call of Duty': 'cod',
  'Call of Duty: Modern Warfare III': 'cod',
  'Call of Duty: Warzone': 'cod',
  'Rainbow Six Siege': 'r6siege',
  "Tom Clancy's Rainbow Six Siege": 'r6siege',
  'StarCraft II': 'starcraft-2',
  'StarCraft 2': 'starcraft-2',
  'StarCraft: Brood War': 'starcraft-brood-war',
  'PUBG: BATTLEGROUNDS': 'pubg',
  'EA Sports FC 24': 'fifa',
  'EA Sports FC 25': 'fifa',
  'FIFA 24': 'fifa',
  'Mobile Legends: Bang Bang': 'mlbb',
  'Wild Rift': 'lol-wild-rift',
  'Honor of Kings': 'kog',
  'Arena of Valor': 'kog',
  'Apex Legends': 'apex',
};

export function TwitchStreamEmbed({ selectedGame: initialGame, onActiveGameChange }: TwitchStreamEmbedProps) {
  const [locationInfo, setLocationInfo] = useState<{
    hostname: string;
    host: string;
    origin: string;
  } | null>(null);
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(initialGame || 'all');

  // Report active game to parent when stream info changes
  useEffect(() => {
    if (onActiveGameChange) {
      if (streamInfo?.gameName) {
        const gameSlug = GAME_NAME_TO_SLUG[streamInfo.gameName] || null;
        onActiveGameChange(gameSlug);
      } else {
        onActiveGameChange(null);
      }
    }
  }, [streamInfo?.gameName, onActiveGameChange]);

  // Capture location info on mount
  useEffect(() => {
    setLocationInfo({
      hostname: window.location.hostname,
      host: window.location.host,
      origin: window.location.origin,
    });
  }, []);

  // Build iframe src with broad parent allowlist
  const iframeSrc = useMemo(() => {
    if (!locationInfo || !streamInfo?.channel) return null;

    const parentDomains = [
      '0xnull.io',
      'www.0xnull.io',
      'localhost',
      'lovable.dev',
      'lovableproject.com',
      'lovable.app',
      locationInfo.hostname,
      locationInfo.host,
    ];

    const uniqueParents = [...new Set(parentDomains.filter(Boolean))];
    const parentParams = uniqueParents.map(p => `parent=${p}`).join('&');

    return `https://player.twitch.tv/?channel=${streamInfo.channel}&${parentParams}&muted=true`;
  }, [locationInfo, streamInfo?.channel]);

  // Debug logging
  useEffect(() => {
    if (locationInfo && streamInfo?.channel && iframeSrc) {
      console.log('Twitch Debug:', {
        hostname: locationInfo.hostname,
        host: locationInfo.host,
        origin: locationInfo.origin,
        channel: streamInfo.channel,
        iframeSrc: iframeSrc
      });
    }
  }, [locationInfo, streamInfo?.channel, iframeSrc]);

  const fetchTopStream = useCallback(async (game: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const gameParam = game === 'all' ? 'lol' : game;
      const { data, error: fnError } = await supabase.functions.invoke('twitch-top-stream', {
        body: { game: gameParam },
      });

      if (fnError) {
        throw fnError;
      }
      
      setStreamInfo(data as StreamInfo);
    } catch (err) {
      console.error('Error fetching Twitch stream:', err);
      setError('Could not load stream');
      setStreamInfo({ channel: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopStream(activeFilter);
  }, [activeFilter, fetchTopStream]);

  const handleFilterChange = (gameKey: string) => {
    if (gameKey !== activeFilter) {
      setActiveFilter(gameKey);
    }
  };

  if (hidden) {
    return (
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-950/20 to-background">
        <CardContent className="py-4">
          <Button 
            variant="ghost" 
            className="w-full flex items-center gap-2 text-purple-400"
            onClick={() => setHidden(false)}
          >
            <Eye className="w-4 h-4" />
            Show Live Stream
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-purple-950/20 to-background overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Tv className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400">Live Stream</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-xs">Live stream auto-selected based on current esports events. Use the game filters to switch between games.</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => fetchTopStream(activeFilter)}
              disabled={loading}
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setHidden(true)}
            >
              <EyeOff className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {/* Game Filter Buttons */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {GAME_FILTERS.map((filter) => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? "default" : "outline"}
              size="sm"
              className={`h-7 text-xs px-2.5 transition-all ${
                activeFilter === filter.key 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500' 
                  : 'border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/10'
              }`}
              onClick={() => handleFilterChange(filter.key)}
              disabled={loading}
            >
              <span className="mr-1">{filter.icon}</span>
              <span className="hidden sm:inline">{filter.label}</span>
              <span className="sm:hidden">{filter.key === 'all' ? 'All' : filter.icon}</span>
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {loading || !locationInfo ? (
          <div className="aspect-video bg-muted/50 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error || !streamInfo?.channel || !iframeSrc ? (
          <div className="aspect-video bg-muted/30 flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground text-center">
              No live streams right now - check back during match times
            </p>
          </div>
        ) : (
          <div className="aspect-video">
            <iframe
              src={iframeSrc}
              height="100%"
              width="100%"
              allowFullScreen
              allow="autoplay; fullscreen; encrypted-media"
              frameBorder={0}
              className="border-0"
              title={`${streamInfo.channelName || streamInfo.channel} - Twitch Stream`}
            />
          </div>
        )}
        
        {/* Stream Info Footer */}
        {streamInfo?.channel && !loading && !error && (
          <div className="px-4 py-3 border-t border-purple-500/20 bg-background/50">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <a 
                  href={`https://twitch.tv/${streamInfo.channel}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                >
                  {streamInfo.channelName || streamInfo.channel}
                  <ExternalLink className="w-3 h-3" />
                </a>
                {streamInfo.gameName && (
                  <>
                    <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-400">
                      {streamInfo.gameName}
                    </Badge>
                    {(() => {
                      const slug = GAME_NAME_TO_SLUG[streamInfo.gameName];
                      const downloadUrl = slug ? GAME_DOWNLOAD_URLS[slug] : null;
                      if (!downloadUrl) return null;
                      return (
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          Play
                        </a>
                      );
                    })()}
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {streamInfo.viewerCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {streamInfo.viewerCount.toLocaleString()} viewers
                  </span>
                )}
                <a 
                  href={`https://twitch.tv/${streamInfo.channel}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                >
                  Watch on Twitch →
                </a>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Stream auto-selected based on viewer count. Switch games above to find other streams.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}