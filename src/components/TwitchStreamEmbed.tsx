import { useState, useEffect, useCallback } from 'react';
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

const PARENT_DOMAIN = '0xnull.io';

export function TwitchStreamEmbed({ selectedGame }: TwitchStreamEmbedProps) {
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        {loading ? (
          <div className="aspect-video bg-muted/50 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error || !streamInfo?.channel ? (
          <div className="aspect-video bg-muted/30 flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground text-center">
              No live streams right now - check back during match times
            </p>
          </div>
        ) : (
          <div className="aspect-video">
            <iframe
              src={`https://player.twitch.tv/?channel=${streamInfo.channel}&parent=${PARENT_DOMAIN}&parent=lovable.app&parent=lovableproject.com&muted=true`}
              height="100%"
              width="100%"
              allowFullScreen
              className="border-0"
              title={`${streamInfo.channelName || streamInfo.channel} - Twitch Stream`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
