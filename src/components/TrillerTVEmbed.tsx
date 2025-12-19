import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tv, Maximize, Eye, EyeOff } from 'lucide-react';

const TRILLER_CHANNEL_ID = '2p6mu'; // FITE 24/7 channel

export function TrillerTVEmbed() {
  const [isVisible, setIsVisible] = useState(true);

  const handleFullscreen = () => {
    const iframe = document.getElementById('triller-iframe') as HTMLIFrameElement;
    if (iframe) {
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      }
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Tv className="w-5 h-5 text-red-500" />
            TrillerTV 24/7
            <Badge variant="outline" className="ml-2 text-xs bg-red-600/20 text-red-400 border-red-500/30">
              LIVE
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
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
          Boxing • MMA • Pro Wrestling • Bare Knuckle
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative aspect-video bg-black">
          <iframe
            id="triller-iframe"
            src={`https://www.trillertv.com/embed/v1/${TRILLER_CHANNEL_ID}/?autoplay=false`}
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
