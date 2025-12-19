import { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { EyeOff, Eye, Volume2, VolumeX, Maximize, RefreshCw, ExternalLink, Radio, Clock, Calendar, AlertCircle, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  upcomingPrograms: ProgramInfo[];
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

function getTimeUntil(isoString: string): string {
  const now = Date.now();
  const target = new Date(isoString).getTime();
  const diff = target - now;
  
  if (diff <= 0) return 'Now';
  
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `in ${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `in ${hours}h ${remainingMins}m`;
}

export function PlutoTVEmbed() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<PlutoChannel | null>(null);
  const [hidden, setHidden] = useState(false);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [epgData, setEpgData] = useState<EPGData | null>(null);
  const [epgLoading, setEpgLoading] = useState(false);
  const [availableChannels, setAvailableChannels] = useState<Set<string>>(new Set());
  const [checkingChannels, setCheckingChannels] = useState(true);
  const [streamActive, setStreamActive] = useState(false);
  const checkedChannelsRef = useRef<Set<string>>(new Set());

  // Fetch EPG data
  const fetchEPG = useCallback(async () => {
    setEpgLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('pluto-epg');
      if (fnError) throw fnError;
      setEpgData(data as EPGData);
    } catch (err) {
      console.error('Error fetching EPG:', err);
    } finally {
      setEpgLoading(false);
    }
  }, []);

  // Check if a channel stream is available
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

  // Check all channels for availability on mount
  useEffect(() => {
    const checkAllChannels = async () => {
      setCheckingChannels(true);
      const available = new Set<string>();
      
      // Check channels in parallel (but limit concurrency)
      const results = await Promise.all(
        PLUTO_CHANNELS.map(async (channel) => {
          const isAvailable = await checkChannelAvailability(channel.id);
          return { id: channel.id, available: isAvailable };
        })
      );

      results.forEach(({ id, available: isAvailable }) => {
        if (isAvailable) {
          available.add(id);
        }
      });

      setAvailableChannels(available);
      setCheckingChannels(false);

      // Auto-select first available channel
      if (available.size > 0) {
        const firstAvailable = PLUTO_CHANNELS.find(c => available.has(c.id));
        if (firstAvailable) {
          setSelectedChannel(firstAvailable);
        }
      }
    };

    checkAllChannels();
    fetchEPG();
    
    const epgInterval = setInterval(fetchEPG, 5 * 60 * 1000);
    // Re-check availability every 10 minutes
    const availabilityInterval = setInterval(checkAllChannels, 10 * 60 * 1000);
    
    return () => {
      clearInterval(epgInterval);
      clearInterval(availabilityInterval);
    };
  }, [checkChannelAvailability, fetchEPG]);

  // Get current channel's EPG info
  const currentEPG = selectedChannel ? epgData?.channels?.[selectedChannel.id] : null;

  // Load stream when channel is selected
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hidden || !selectedChannel) return;

    setLoading(true);
    setError(null);
    setStreamActive(false);

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
        setStreamActive(true);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('HLS fatal error:', data);
          setError('Stream unavailable');
          setLoading(false);
          setStreamActive(false);
          
          // Mark this channel as unavailable
          setAvailableChannels(prev => {
            const next = new Set(prev);
            next.delete(selectedChannel.id);
            return next;
          });
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        setStreamActive(true);
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        setError('Stream unavailable');
        setLoading(false);
        setStreamActive(false);
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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  const handleFullscreen = () => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleRefresh = async () => {
    if (selectedChannel) {
      setSelectedChannel({ ...selectedChannel });
    }
    fetchEPG();
  };

  const handleSelectChannel = (channel: PlutoChannel) => {
    setSelectedChannel(channel);
  };

  const noStreamsAvailable = !checkingChannels && availableChannels.size === 0;
  const showPlayer = selectedChannel && !noStreamsAvailable;

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
            {checkingChannels && (
              <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                Checking streams...
              </Badge>
            )}
            {!checkingChannels && availableChannels.size > 0 && (
              <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
                {availableChannels.size} live
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            {showPlayer && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMuted(!muted)}>
                  {muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleFullscreen}>
                  <Maximize className="w-3 h-3" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefresh} disabled={loading || checkingChannels}>
              <RefreshCw className={`w-3 h-3 ${(loading || checkingChannels) ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setHidden(true)}>
              <EyeOff className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {/* Channel Selector with availability indicators */}
        {!noStreamsAvailable && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {PLUTO_CHANNELS.map((channel) => {
              const channelEPG = epgData?.channels?.[channel.id];
              const isAvailable = availableChannels.has(channel.id);
              const isSelected = selectedChannel?.id === channel.id;
              
              return (
                <Button
                  key={channel.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className={`h-auto py-1.5 px-2 text-xs flex flex-col items-start gap-0.5 transition-all ${
                    isSelected 
                      ? 'bg-red-600 hover:bg-red-700 text-white border-red-500' 
                      : isAvailable
                        ? 'border-green-500/50 hover:border-green-500 hover:bg-green-500/10'
                        : 'border-red-500/20 opacity-50 hover:opacity-70'
                  }`}
                  onClick={() => handleSelectChannel(channel)}
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
                    <span className={`text-[10px] truncate max-w-[100px] ${
                      isSelected ? 'text-white/80' : 'text-muted-foreground'
                    }`}>
                      {channelEPG.currentProgram.title}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Show player if stream available */}
        {showPlayer && (
          <div className="aspect-video bg-black relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading {selectedChannel?.name}...</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="text-center p-4">
                  <p className="text-sm text-red-400 mb-2">{error}</p>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={handleRefresh}>Try Again</Button>
                    {availableChannels.size > 0 && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const available = PLUTO_CHANNELS.find(c => availableChannels.has(c.id) && c.id !== selectedChannel?.id);
                          if (available) handleSelectChannel(available);
                        }}
                      >
                        Try Another
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <video ref={videoRef} className="w-full h-full" playsInline muted={muted} autoPlay />
          </div>
        )}

        {/* Show EPG grid when no streams available */}
        {noStreamsAvailable && (
          <div className="p-4">
            <div className="flex items-center gap-2 text-yellow-400 mb-4">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">No live streams currently available</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Check the schedule below to see when streams will be available. You can also try refreshing later.
            </p>
          </div>
        )}
        
        {/* Now Playing Info - only show if player is active */}
        {showPlayer && streamActive && (
          <div className="px-4 py-3 border-t border-red-500/20 bg-background/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{selectedChannel?.icon}</span>
                  <span className="font-medium text-sm text-red-400">{selectedChannel?.name}</span>
                </div>
                
                {currentEPG?.currentProgram ? (
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold text-sm truncate">{currentEPG.currentProgram.title}</p>
                      {currentEPG.currentProgram.description && (
                        <p className="text-xs text-muted-foreground truncate">{currentEPG.currentProgram.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={currentEPG.currentProgram.progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTime(currentEPG.currentProgram.startTime)} - {formatTime(currentEPG.currentProgram.endTime)}
                      </span>
                    </div>
                    {currentEPG.nextProgram && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Up next: <span className="text-foreground">{currentEPG.nextProgram.title}</span>
                        <span className="text-red-400">{getTimeUntil(currentEPG.nextProgram.startTime)}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{selectedChannel?.description}</p>
                )}
              </div>
              
              <a 
                href={`https://pluto.tv/live-tv/${selectedChannel?.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 shrink-0"
              >
                Pluto <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            {muted && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> Click speaker to unmute
              </p>
            )}
          </div>
        )}

        {/* EPG Grid - always visible when no streams, or as toggle when streams available */}
        {epgData && (noStreamsAvailable || showPlayer) && (
          <div className={`border-t border-red-500/20 ${noStreamsAvailable ? '' : ''}`}>
            {/* EPG Header */}
            <div className="px-4 py-2 bg-red-500/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">TV Guide</span>
              </div>
              {epgLoading && <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />}
            </div>
            
            <ScrollArea className="w-full">
              <div className="min-w-[600px]">
                {/* Header */}
                <div className="grid grid-cols-[140px_1fr] border-b border-red-500/20 bg-red-500/5">
                  <div className="p-2 text-xs font-medium text-muted-foreground border-r border-red-500/20">
                    Channel
                  </div>
                  <div className="p-2 text-xs font-medium text-muted-foreground">
                    Schedule
                  </div>
                </div>
                
                {/* Channel Rows */}
                {PLUTO_CHANNELS.map((channel) => {
                  const channelEPG = epgData.channels?.[channel.id];
                  const isAvailable = availableChannels.has(channel.id);
                  const programs = [
                    channelEPG?.currentProgram,
                    ...(channelEPG?.upcomingPrograms || [])
                  ].filter(Boolean).slice(0, 5);

                  return (
                    <div 
                      key={channel.id}
                      className={`grid grid-cols-[140px_1fr] border-b border-red-500/10 hover:bg-red-500/5 transition-colors ${
                        selectedChannel?.id === channel.id ? 'bg-red-500/10' : ''
                      }`}
                    >
                      <button
                        className="p-2 text-left border-r border-red-500/10 hover:bg-red-500/10 transition-colors"
                        onClick={() => handleSelectChannel(channel)}
                        disabled={!isAvailable && !checkingChannels}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{channel.icon}</span>
                          <span className="text-xs font-medium truncate">{channel.name}</span>
                          {!checkingChannels && (
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isAvailable ? 'bg-green-500' : 'bg-red-500/50'}`} />
                          )}
                        </div>
                        {isAvailable && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-green-400">
                            <Play className="w-2.5 h-2.5" />
                            <span>Watch now</span>
                          </div>
                        )}
                      </button>
                      <div className="flex overflow-x-auto">
                        {programs.length > 0 ? (
                          programs.map((program, idx) => {
                            const isNowPlaying = idx === 0 && channelEPG?.currentProgram;
                            return (
                              <div
                                key={idx}
                                className={`flex-1 min-w-[140px] max-w-[200px] p-2 border-r border-red-500/5 ${
                                  isNowPlaying ? 'bg-red-500/10' : ''
                                }`}
                              >
                                <div className="flex items-center gap-1 mb-0.5">
                                  {isNowPlaying && (
                                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 border-red-500/50 text-red-400">
                                      LIVE
                                    </Badge>
                                  )}
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatTime(program!.startTime)}
                                  </span>
                                </div>
                                <p className="text-xs font-medium truncate">{program!.title}</p>
                                {program!.description && (
                                  <p className="text-[10px] text-muted-foreground truncate">{program!.description}</p>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-2 text-xs text-muted-foreground">
                            No schedule data
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
