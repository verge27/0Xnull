import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tv, EyeOff, Eye, Volume2, VolumeX, Maximize, RefreshCw, ExternalLink, Radio } from 'lucide-react';

interface PlutoChannel {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const PLUTO_CHANNELS: PlutoChannel[] = [
  { id: '677d9adfa9a51b0008497fa0', name: 'UFC', icon: '🥊', description: '24/7 UFC Content' },
  { id: '5dcddf6f119c4b0009fa1d75', name: 'Fight', icon: '👊', description: 'MMA, Boxing, Kickboxing' },
  { id: '5e8ed391e738c20007348eb1', name: 'Bellator MMA', icon: '🥋', description: 'Bellator Fights' },
  { id: '5e8ef7b5aef2ef0007f952b8', name: 'GLORY Kickboxing', icon: '🦵', description: 'Kickboxing Action' },
  { id: '5e8ed2eaaef2ef0007f94b11', name: 'PFL MMA', icon: '🏆', description: 'PFL Fights' },
  { id: '5c50c7561cf5c7e3a3b0bd38', name: 'Top Rank Boxing', icon: '🏅', description: 'Classic Boxing' },
  { id: '58e55b14ad8e9c364d55f717', name: 'Flicks of Fury', icon: '🎬', description: 'Martial Arts Movies' },
  { id: '5e8eb6e8aef2ef0007f93fb6', name: 'Impact Wrestling', icon: '💪', description: 'Pro Wrestling' },
];

function getPlutoStreamUrl(channelId: string): string {
  return `https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/${channelId}/master.m3u8?deviceType=web&deviceMake=web&deviceModel=web&deviceVersion=1.0&appVersion=1.0&deviceDNT=0&serverSideAds=false`;
}

export function PlutoTVEmbed() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<PlutoChannel>(PLUTO_CHANNELS[0]);
  const [hidden, setHidden] = useState(false);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || hidden) return;

    setLoading(true);
    setError(null);

    const streamUrl = getPlutoStreamUrl(selectedChannel.id);

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 30,
      });

      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {
          // Autoplay blocked, user needs to interact
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('HLS fatal error:', data);
          setError('Stream unavailable - try another channel');
          setLoading(false);
          
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            // Try to recover
            setTimeout(() => {
              hls.startLoad();
            }, 3000);
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        setError('Stream unavailable');
        setLoading(false);
      });
    } else {
      setError('HLS not supported in this browser');
      setLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedChannel, hidden]);

  // Update muted state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleRefresh = () => {
    // Force reload by re-selecting the same channel
    const channel = selectedChannel;
    setSelectedChannel({ ...channel });
  };

  if (hidden) {
    return (
      <Card className="border-red-500/30 bg-gradient-to-br from-red-950/20 to-background">
        <CardContent className="py-4">
          <Button 
            variant="ghost" 
            className="w-full flex items-center gap-2 text-red-400"
            onClick={() => setHidden(false)}
          >
            <Eye className="w-4 h-4" />
            Show Live Combat TV
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-500/30 bg-gradient-to-br from-red-950/20 to-background overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-red-400">Live Combat TV</span>
            <Badge variant="outline" className="text-xs border-red-500/50 text-red-400">
              Pluto TV
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => setMuted(!muted)}
            >
              {muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={handleFullscreen}
            >
              <Maximize className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => setHidden(true)}
            >
              <EyeOff className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {/* Channel Selector */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {PLUTO_CHANNELS.map((channel) => (
            <Button
              key={channel.id}
              variant={selectedChannel.id === channel.id ? "default" : "outline"}
              size="sm"
              className={`h-7 text-xs px-2 transition-all ${
                selectedChannel.id === channel.id 
                  ? 'bg-red-600 hover:bg-red-700 text-white border-red-500' 
                  : 'border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10'
              }`}
              onClick={() => setSelectedChannel(channel)}
              disabled={loading}
            >
              <span className="mr-1">{channel.icon}</span>
              <span className="hidden sm:inline">{channel.name}</span>
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="aspect-video bg-black relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-red-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading {selectedChannel.name}...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="text-center p-4">
                <p className="text-sm text-red-400 mb-2">{error}</p>
                <Button size="sm" variant="outline" onClick={handleRefresh}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          <video
            ref={videoRef}
            className="w-full h-full"
            playsInline
            muted={muted}
            autoPlay
          />
        </div>
        
        {/* Channel Info Footer */}
        <div className="px-4 py-3 border-t border-red-500/20 bg-background/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedChannel.icon}</span>
              <div>
                <p className="font-medium text-sm text-red-400">{selectedChannel.name}</p>
                <p className="text-xs text-muted-foreground">{selectedChannel.description}</p>
              </div>
            </div>
            <a 
              href={`https://pluto.tv/live-tv/${selectedChannel.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              Watch on Pluto <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {muted ? 'Click the speaker icon to unmute' : 'Live 24/7 combat sports - Free on Pluto TV'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
