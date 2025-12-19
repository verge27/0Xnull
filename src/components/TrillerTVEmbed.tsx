import { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tv, Maximize, Eye, EyeOff, Volume2, VolumeX, RefreshCw, Radio, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// TrillerTV channel
const TRILLER_CHANNEL = { id: '2p6mu', name: 'FITE 24/7', description: 'Boxing, MMA, Pro Wrestling' };

// PlutoTV channels
interface PlutoChannel {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface ProgramInfo {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  progress?: number;
}

interface ChannelEPG {
  name: string;
  currentProgram: ProgramInfo | null;
  nextProgram: { title: string; startTime: string } | null;
}

interface EPGData {
  channels: Record<string, ChannelEPG>;
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

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function TrillerTVEmbed() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [source, setSource] = useState<'triller' | 'pluto'>('triller');
  const [selectedPlutoChannel, setSelectedPlutoChannel] = useState<PlutoChannel | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [epgData, setEpgData] = useState<EPGData | null>(null);
  const [availableChannels, setAvailableChannels] = useState<Set<string>>(new Set());
  const [checkingChannels, setCheckingChannels] = useState(false);
  const [streamActive, setStreamActive] = useState(false);

  // Fetch EPG data for Pluto
  const fetchEPG = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('pluto-epg');
      if (fnError) throw fnError;
      setEpgData(data as EPGData);
    } catch (err) {
      console.error('Error fetching EPG:', err);
    }
  }, []);

  // Check if a Pluto channel stream is available
  const checkChannelAvailability = useCallback(async (channelId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!Hls.isSupported()) {
        resolve(false);
        return;
      }

      const hls = new Hls({
        enableWorker: false,
        maxBufferLength: 1,
        maxMaxBufferLength: 1,
      });

      const timeout = setTimeout(() => {
        hls.destroy();
        resolve(false);
      }, 5000);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        clearTimeout(timeout);
        hls.destroy();
        resolve(true);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          clearTimeout(timeout);
          hls.destroy();
          resolve(false);
        }
      });

      hls.loadSource(getPlutoStreamUrl(channelId));
    });
  }, []);

  // Check Pluto channels when switching to Pluto source
  useEffect(() => {
    if (source === 'pluto' && availableChannels.size === 0 && !checkingChannels) {
      const checkAllChannels = async () => {
        setCheckingChannels(true);
        const available = new Set<string>();
        
        const results = await Promise.all(
          PLUTO_CHANNELS.map(async (channel) => {
            const isAvailable = await checkChannelAvailability(channel.id);
            return { id: channel.id, available: isAvailable };
          })
        );

        results.forEach(({ id, available: isAvailable }) => {
          if (isAvailable) available.add(id);
        });

        setAvailableChannels(available);
        setCheckingChannels(false);

        // Auto-select first available channel
        if (available.size > 0 && !selectedPlutoChannel) {
          const firstAvailable = PLUTO_CHANNELS.find(c => available.has(c.id));
          if (firstAvailable) setSelectedPlutoChannel(firstAvailable);
        }
      };

      checkAllChannels();
      fetchEPG();
    }
  }, [source, availableChannels.size, checkingChannels, selectedPlutoChannel, checkChannelAvailability, fetchEPG]);

  // Load Pluto stream when channel is selected
  useEffect(() => {
    if (source !== 'pluto' || !selectedPlutoChannel || !isVisible) return;
    
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);
    setStreamActive(false);

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = getPlutoStreamUrl(selectedPlutoChannel.id);

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
        setStreamActive(true);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Stream unavailable');
          setLoading(false);
          setStreamActive(false);
          setAvailableChannels(prev => {
            const next = new Set(prev);
            next.delete(selectedPlutoChannel.id);
            return next;
          });
        }
      });
    } else {
      setError('HLS not supported');
      setLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [source, selectedPlutoChannel, isVisible]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  const handleFullscreen = () => {
    if (source === 'triller') {
      const iframe = document.getElementById('triller-iframe') as HTMLIFrameElement;
      if (iframe?.requestFullscreen) iframe.requestFullscreen();
    } else if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleSourceChange = (newSource: string) => {
    setSource(newSource as 'triller' | 'pluto');
    setError(null);
    setStreamActive(false);
  };

  const currentEPG = selectedPlutoChannel ? epgData?.channels?.[selectedPlutoChannel.id] : null;

  if (!isVisible) {
    return (
      <Button variant="outline" className="w-full" onClick={() => setIsVisible(true)}>
        <Eye className="w-4 h-4 mr-2" />
        Show Combat TV Stream
      </Button>
    );
  }

  return (
    <Card className="overflow-hidden border-red-500/30 bg-gradient-to-br from-background to-red-950/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Tv className="w-5 h-5 text-red-500" />
            Combat TV
            <Badge variant="outline" className="ml-2 text-xs bg-red-600/20 text-red-400 border-red-500/30">
              LIVE
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {source === 'pluto' && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMuted(!muted)}>
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleFullscreen} title="Fullscreen">
              <Maximize className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsVisible(false)} title="Hide">
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Source Tabs */}
        <Tabs value={source} onValueChange={handleSourceChange} className="mt-3">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="triller" className="text-xs">
              <Radio className="w-3 h-3 mr-1" />
              TrillerTV
            </TabsTrigger>
            <TabsTrigger value="pluto" className="text-xs">
              <Radio className="w-3 h-3 mr-1" />
              Pluto TV
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Pluto Channel Selector */}
        {source === 'pluto' && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {checkingChannels && (
              <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Checking streams...
              </Badge>
            )}
            {!checkingChannels && availableChannels.size > 0 && (
              <Badge variant="outline" className="text-xs border-green-500/50 text-green-400 mb-2">
                {availableChannels.size} channels live
              </Badge>
            )}
            {PLUTO_CHANNELS.map((channel) => {
              const channelEPG = epgData?.channels?.[channel.id];
              const isAvailable = availableChannels.has(channel.id);
              const isSelected = selectedPlutoChannel?.id === channel.id;
              
              return (
                <Button
                  key={channel.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className={`h-auto py-1.5 px-2 text-xs flex flex-col items-start gap-0.5 ${
                    isSelected 
                      ? 'bg-red-600 hover:bg-red-700 text-white border-red-500' 
                      : isAvailable
                        ? 'border-green-500/50 hover:border-green-500 hover:bg-green-500/10'
                        : 'border-red-500/20 opacity-50'
                  }`}
                  onClick={() => setSelectedPlutoChannel(channel)}
                  disabled={loading || checkingChannels}
                >
                  <span className="flex items-center gap-1">
                    <span>{channel.icon}</span>
                    <span className="font-medium">{channel.name}</span>
                    {!checkingChannels && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500/50'}`} />
                    )}
                  </span>
                  {channelEPG?.currentProgram && (
                    <span className={`text-[10px] truncate max-w-[100px] ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {channelEPG.currentProgram.title}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        )}

        {/* TrillerTV description */}
        {source === 'triller' && (
          <p className="text-xs text-muted-foreground mt-2">
            {TRILLER_CHANNEL.name} • {TRILLER_CHANNEL.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        {/* TrillerTV iframe */}
        {source === 'triller' && (
          <div className="relative aspect-video bg-black">
            <iframe
              id="triller-iframe"
              src={`https://www.trillertv.com/embed/v1/${TRILLER_CHANNEL.id}/?autoplay=false`}
              className="w-full h-full border-0"
              allowFullScreen
              scrolling="no"
              allow="encrypted-media *;"
            />
          </div>
        )}

        {/* Pluto TV video player */}
        {source === 'pluto' && (
          <>
            {!checkingChannels && availableChannels.size === 0 ? (
              <div className="p-4 text-center">
                <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No Pluto streams available right now</p>
                <p className="text-xs text-muted-foreground mt-1">Try TrillerTV or check back later</p>
              </div>
            ) : selectedPlutoChannel ? (
              <div className="aspect-video bg-black relative">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 animate-spin text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading {selectedPlutoChannel.name}...</p>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                    <div className="text-center p-4">
                      <p className="text-sm text-red-400 mb-2">{error}</p>
                      <Button size="sm" variant="outline" onClick={() => setSelectedPlutoChannel({ ...selectedPlutoChannel })}>
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}
                
                <video ref={videoRef} className="w-full h-full" playsInline muted={muted} autoPlay />
              </div>
            ) : (
              <div className="aspect-video bg-black flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Select a channel above</p>
              </div>
            )}

            {/* Now Playing Info */}
            {streamActive && currentEPG?.currentProgram && (
              <div className="px-4 py-3 border-t border-red-500/20 bg-background/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{selectedPlutoChannel?.icon}</span>
                  <span className="font-medium text-sm text-red-400">{selectedPlutoChannel?.name}</span>
                </div>
                <p className="font-semibold text-sm truncate">{currentEPG.currentProgram.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={currentEPG.currentProgram.progress} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground">
                    {formatTime(currentEPG.currentProgram.startTime)} - {formatTime(currentEPG.currentProgram.endTime)}
                  </span>
                </div>
                {currentEPG.nextProgram && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Up next: <span className="text-foreground">{currentEPG.nextProgram.title}</span>
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
