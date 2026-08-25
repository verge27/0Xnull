import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tv, EyeOff, Eye, Users, ExternalLink, RefreshCw, Info, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GAME_DOWNLOAD_URLS } from '@/hooks/useEsportsEvents';

export interface StreamInfo {
  channel: string | null;
  channelName?: string;
  title?: string;
  viewerCount?: number;
  gameName?: string;
  thumbnailUrl?: string;
  unavailable?: boolean;
  reason?: string;
}

// Channel used when Twitch metadata cannot be fetched (auth/API failure).
// The player itself still works without our API credentials.
const FALLBACK_CHANNEL = 'awfdota';


interface TwitchStreamEmbedProps {
  selectedGame: string;
  onActiveGameChange?: (gameSlug: string | null) => void;
  onStreamChange?: (streamInfo: StreamInfo | null) => void;
  onGameFilterChange?: (gameKey: string) => void;
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

export function TwitchStreamEmbed({ selectedGame: initialGame, onActiveGameChange, onStreamChange, onGameFilterChange }: TwitchStreamEmbedProps) {
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

  // Report active game and stream info to parent when stream info changes
  useEffect(() => {
    if (onActiveGameChange) {
      if (streamInfo?.gameName) {
        const gameSlug = GAME_NAME_TO_SLUG[streamInfo.gameName] || null;
        onActiveGameChange(gameSlug);
      } else {
        onActiveGameChange(null);
      }
    }
    if (onStreamChange) {
      onStreamChange(streamInfo);
    }
  }, [streamInfo, onActiveGameChange, onStreamChange]);

  // Capture location info on mount
  useEffect(() => {
    setLocationInfo({
      hostname: window.location.hostname,
      host: window.location.host,
      origin: window.location.origin,
    });
  }, []);

  // Metadata failed (auth error, API outage, network) — we still render the player.
  const metadataFailed = Boolean(error || streamInfo?.unavailable);

  // Channel to render: live metadata channel, else the configured fallback.
  const channelToRender = streamInfo?.channel ?? (metadataFailed ? FALLBACK_CHANNEL : null);

  // Build iframe src with broad parent allowlist
  const iframeSrc = useMemo(() => {
    if (!locationInfo || !channelToRender) return null;

    const parentDomains = [
      '0xnull.io',
      'www.0xnull.io',
      'localhost',
      'lovable.dev',
      'lovableproject.com',
      'lovable.app',
      locationInfo.hostname,
      // Twitch rejects parents containing a port or protocol — hostname only.
      locationInfo.host.split(':')[0],

    ];

    const uniqueParents = [...new Set(parentDomains.filter(Boolean))];
    const parentParams = uniqueParents.map(p => `parent=${p}`).join('&');

    return `https://player.twitch.tv/?channel=${channelToRender}&${parentParams}&muted=true`;
  }, [locationInfo, channelToRender]);

  // Debug logging
  useEffect(() => {
    if (locationInfo && channelToRender && iframeSrc) {
      console.log('Twitch Debug:', {
        hostname: locationInfo.hostname,
        host: locationInfo.host,
        origin: locationInfo.origin,
        channel: channelToRender,
        fallback: !streamInfo?.channel,
        iframeSrc,
      });
    }
  }, [locationInfo, channelToRender, streamInfo?.channel, iframeSrc]);

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
      setStreamInfo({ channel: null, unavailable: true, reason: 'fetch_failed' });
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
      // Notify parent when user clicks a game filter
      onGameFilterChange?.(gameKey);
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
        {metadataFailed && !loading && (
          <div className="px-4 py-2 border-b border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs text-amber-300">
              Live metadata unavailable — showing the default channel.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-amber-300 hover:text-amber-200"
              onClick={() => fetchTopStream(activeFilter)}
            >
              Retry
            </Button>
          </div>
        )}
        {loading || !locationInfo ? (
          <div className="aspect-video bg-muted/50 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !iframeSrc ? (
          <div className="aspect-video bg-muted/30 flex flex-col items-center justify-center gap-3 p-4">
            <p className="text-sm text-muted-foreground text-center">
              No live streams right now - check back during match times
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => fetchTopStream(activeFilter)}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
              <a
                href={`https://twitch.tv/${FALLBACK_CHANNEL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:text-purple-300 hover:underline"
              >
                Watch on Twitch →
              </a>
            </div>
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
              title={`${streamInfo?.channelName || channelToRender} - Twitch Stream`}
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

        {/* Fallback footer when metadata is unavailable but the player renders */}
        {!streamInfo?.channel && channelToRender && !loading && (
          <div className="px-4 py-3 border-t border-purple-500/20 bg-background/50 flex items-center justify-between flex-wrap gap-2">
            <a
              href={`https://twitch.tv/${channelToRender}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              {channelToRender}
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-xs text-muted-foreground">
              If the channel is offline, the player shows Twitch's offline screen.
            </span>
          </div>
        )}

      </CardContent>
    </Card>
  );
}