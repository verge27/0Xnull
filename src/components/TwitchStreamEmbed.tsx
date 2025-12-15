import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tv, EyeOff, Eye, Users, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
}

export function TwitchStreamEmbed({ selectedGame }: TwitchStreamEmbedProps) {
  const [locationInfo, setLocationInfo] = useState<{
    hostname: string;
    host: string;
    origin: string;
  } | null>(null);
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // Also add host in case there's a port
      locationInfo.host,
    ];

    // Deduplicate and filter empty values
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
    fetchTopStream(selectedGame);
  }, [selectedGame, fetchTopStream]);

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
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Tv className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400">Live Stream</span>
            {streamInfo?.gameName && (
              <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-300">
                {streamInfo.gameName}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => fetchTopStream(selectedGame)}
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
        
        {streamInfo?.channel && (
          <div className="flex items-center justify-between mt-1">
            <a 
              href={`https://twitch.tv/${streamInfo.channel}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-purple-400 flex items-center gap-1 truncate max-w-[200px]"
            >
              {streamInfo.channelName || streamInfo.channel}
              <ExternalLink className="w-3 h-3" />
            </a>
            {streamInfo.viewerCount !== undefined && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                {streamInfo.viewerCount.toLocaleString()}
              </span>
            )}
          </div>
        )}
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
      </CardContent>
    </Card>
  );
}
