import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tv, Maximize, Eye, EyeOff, Radio } from 'lucide-react';

interface TrillerChannel {
  id: string;
  name: string;
  description: string;
}

const TRILLER_CHANNELS: TrillerChannel[] = [
  { id: '2p6mu', name: 'FITE 24/7', description: 'Boxing, MMA, Pro Wrestling' },
  { id: '2p5ug', name: 'Bare Knuckle TV', description: 'Bare Knuckle Fighting' },
  { id: '2p5v4', name: 'Top Rank Boxing', description: 'Classic Boxing Fights' },
  { id: '2p61g', name: 'IMPACT Wrestling', description: 'Pro Wrestling' },
];

export function TrillerTVEmbed() {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<TrillerChannel>(TRILLER_CHANNELS[0]);

  const handleFullscreen = () => {
    const iframe = document.getElementById('triller-iframe') as HTMLIFrameElement;
    if (iframe) {
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      }
    }
  };

  const handleChannelChange = (channelId: string) => {
    const channel = TRILLER_CHANNELS.find(c => c.id === channelId);
    if (channel) {
      setSelectedChannel(channel);
    }
  };

  if (!isVisible) {
    return (
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={() => setIsVisible(true)}
      >
        <Eye className="w-4 h-4 mr-2" />
        Show TrillerTV Stream
      </Button>
    );
  }

  return (
    <Card className="overflow-hidden border-red-500/30 bg-gradient-to-br from-background to-red-950/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Tv className="w-5 h-5 text-red-500" />
            TrillerTV
            <Badge variant="outline" className="ml-2 text-xs bg-red-600/20 text-red-400 border-red-500/30">
              LIVE
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedChannel.id} onValueChange={handleChannelChange}>
              <SelectTrigger className="w-[180px] h-8 text-sm">
                <Radio className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {TRILLER_CHANNELS.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    <div className="flex flex-col items-start">
                      <span>{channel.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleFullscreen}
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsVisible(false)}
              title="Hide stream"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {selectedChannel.name} • {selectedChannel.description}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative aspect-video bg-black">
          <iframe
            id="triller-iframe"
            key={selectedChannel.id}
            src={`https://www.trillertv.com/embed/v1/${selectedChannel.id}/?autoplay=false`}
            className="w-full h-full border-0"
            allowFullScreen
            scrolling="no"
            allow="encrypted-media *;"
          />
        </div>
      </CardContent>
    </Card>
  );
}
