import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MessageSquare, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface TwitchChatEmbedProps {
  channel: string | null;
  channelName?: string;
}

export function TwitchChatEmbed({ channel, channelName }: TwitchChatEmbedProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [locationInfo, setLocationInfo] = useState<{
    hostname: string;
    host: string;
  } | null>(null);
  const [delayComplete, setDelayComplete] = useState(false);

  // Capture location info on mount
  useEffect(() => {
    setLocationInfo({
      hostname: window.location.hostname,
      host: window.location.host,
    });
  }, []);

  // 10 second delay before loading chat embed (matches Discord behavior)
  useEffect(() => {
    setDelayComplete(false);
    const delayTimer = window.setTimeout(() => setDelayComplete(true), 10000);
    return () => window.clearTimeout(delayTimer);
  }, [channel]);

  // Build iframe src with parent domains
  const iframeSrc = useMemo(() => {
    if (!locationInfo || !channel) return null;

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

    return `https://www.twitch.tv/embed/${channel}/chat?${parentParams}&darkpopout`;
  }, [locationInfo, channel]);

  if (!channel) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-card/80 backdrop-blur-sm border-purple-500/30">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-purple-500/10 transition-colors rounded-t-lg">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400">Twitch Chat</span>
                <span className="text-xs text-muted-foreground">• {channelName || channel}</span>
              </span>
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {iframeSrc && delayComplete ? (
              <iframe
                src={iframeSrc}
                width="100%"
                height="300"
                frameBorder="0"
                className="rounded-lg"
                title={`${channelName || channel} - Twitch Chat`}
              />
            ) : iframeSrc && !delayComplete ? (
              <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-sm text-center h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading Twitch chat...</p>
              </div>
            ) : null}

            <a
              href={`https://www.twitch.tv/popout/${channel}/chat`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1 text-xs text-purple-400 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Open Chat in New Window
            </a>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
