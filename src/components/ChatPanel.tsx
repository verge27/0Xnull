import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { MessageSquare, ChevronDown, ChevronUp, ExternalLink, GripHorizontal } from 'lucide-react';
import type { StreamInfo } from '@/components/TwitchStreamEmbed';

// Discord icon as inline SVG since lucide doesn't have it
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

// Reddit icon
const RedditIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
);

interface DiscordCommunity {
  label: string;
  discordServerId: string;
  discordInvite?: string;
}

interface RedditCommunity {
  name: string;
  url: string;
}

interface ChatPanelProps {
  streamInfo: StreamInfo | null;
  discordCommunity?: DiscordCommunity | null;
  redditCommunity?: RedditCommunity | null;
}

type ChatSource = 'twitch' | 'discord';

const MIN_HEIGHT = 250;
const MAX_HEIGHT = 600;
const DEFAULT_HEIGHT = 400;

export function ChatPanel({ streamInfo, discordCommunity, redditCommunity }: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeSource, setActiveSource] = useState<ChatSource>('twitch');
  const [locationInfo, setLocationInfo] = useState<{ hostname: string; host: string } | null>(null);
  const [delayComplete, setDelayComplete] = useState(false);
  const [discordLoaded, setDiscordLoaded] = useState(false);
  const [discordError, setDiscordError] = useState(false);
  const [chatHeight, setChatHeight] = useState(DEFAULT_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Capture location info on mount
  useEffect(() => {
    setLocationInfo({
      hostname: window.location.hostname,
      host: window.location.host,
    });
  }, []);

  // Reset delay and load states when source changes
  useEffect(() => {
    setDelayComplete(false);
    const delayTimer = window.setTimeout(() => setDelayComplete(true), 10000);
    return () => window.clearTimeout(delayTimer);
  }, [streamInfo?.channel, discordCommunity?.discordServerId, activeSource]);

  // Reset discord load state when server changes
  useEffect(() => {
    setDiscordLoaded(false);
    setDiscordError(false);
  }, [discordCommunity?.discordServerId]);

  // Timeout for discord load - if not loaded in 8 seconds after delay, assume error
  useEffect(() => {
    if (activeSource !== 'discord' || !delayComplete || discordLoaded) return;
    
    const timeout = window.setTimeout(() => {
      if (!discordLoaded) {
        setDiscordError(true);
      }
    }, 8000);
    
    return () => window.clearTimeout(timeout);
  }, [activeSource, delayComplete, discordLoaded]);

  // Handle resize drag
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = e.clientY - containerRect.top;
      setChatHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, newHeight)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Build Twitch chat iframe src
  const twitchChatSrc = useMemo(() => {
    if (!locationInfo || !streamInfo?.channel) return null;

    const parentDomains = [
      '0xnull.io', 'www.0xnull.io', 'localhost',
      'lovable.dev', 'lovableproject.com', 'lovable.app',
      locationInfo.hostname, locationInfo.host,
    ];

    const uniqueParents = [...new Set(parentDomains.filter(Boolean))];
    const parentParams = uniqueParents.map(p => `parent=${p}`).join('&');

    return `https://www.twitch.tv/embed/${streamInfo.channel}/chat?${parentParams}&darkpopout`;
  }, [locationInfo, streamInfo?.channel]);

  // Build Discord widget src
  const discordSrc = useMemo(() => {
    if (!discordCommunity?.discordServerId) return null;
    return `https://discord.com/widget?id=${discordCommunity.discordServerId}&theme=dark`;
  }, [discordCommunity?.discordServerId]);

  const handleDiscordLoad = useCallback(() => {
    setDiscordLoaded(true);
    setDiscordError(false);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Don't render if no stream
  if (!streamInfo?.channel) return null;

  const hasTwitch = !!twitchChatSrc;
  const hasDiscord = !!discordSrc && !discordError;

  return (
    <div className="space-y-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="bg-card/80 border-purple-500/30">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-purple-500/10 transition-colors rounded-t-lg">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400">Live Chat</span>
                </span>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-2">
              {/* Toggle buttons */}
              <div className="flex gap-1">
                <Button
                  variant={activeSource === 'twitch' ? 'default' : 'outline'}
                  size="sm"
                  className={`flex-1 h-7 text-xs ${
                    activeSource === 'twitch' 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'border-purple-500/30 hover:border-purple-500/60'
                  }`}
                  onClick={() => setActiveSource('twitch')}
                  disabled={!hasTwitch}
                >
                  <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                  </svg>
                  Twitch
                </Button>
                <Button
                  variant={activeSource === 'discord' ? 'default' : 'outline'}
                  size="sm"
                  className={`flex-1 h-7 text-xs ${
                    activeSource === 'discord' 
                      ? 'bg-[#5865F2] hover:bg-[#4752C4] text-white' 
                      : 'border-[#5865F2]/30 hover:border-[#5865F2]/60'
                  }`}
                  onClick={() => setActiveSource('discord')}
                  disabled={!hasDiscord}
                >
                  <DiscordIcon className="w-3.5 h-3.5 mr-1" />
                  Discord
                </Button>
              </div>

              {/* Chat content - resizable */}
              <div 
                ref={containerRef}
                className="relative"
                style={{ height: chatHeight }}
              >
                {activeSource === 'twitch' && (
                  <>
                    {twitchChatSrc && delayComplete ? (
                      <iframe
                        src={twitchChatSrc}
                        width="100%"
                        height={chatHeight}
                        frameBorder="0"
                        className="rounded-lg pointer-events-auto"
                        title={`${streamInfo.channelName || streamInfo.channel} - Twitch Chat`}
                      />
                    ) : twitchChatSrc && !delayComplete ? (
                      <div 
                        className="rounded-lg border border-border/50 bg-muted/20 p-4 text-sm text-center flex items-center justify-center"
                        style={{ height: chatHeight }}
                      >
                        <p className="text-muted-foreground">Loading Twitch chat...</p>
                      </div>
                    ) : null}
                  </>
                )}

                {activeSource === 'discord' && (
                  <>
                    {discordSrc && delayComplete && !discordError ? (
                      <iframe
                        src={discordSrc}
                        width="100%"
                        height={chatHeight}
                        frameBorder="0"
                        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                        className="rounded-lg pointer-events-auto"
                        title={`${discordCommunity?.label} Discord`}
                        onLoad={handleDiscordLoad}
                      />
                    ) : discordSrc && !delayComplete ? (
                      <div 
                        className="rounded-lg border border-border/50 bg-muted/20 p-4 text-sm text-center flex items-center justify-center"
                        style={{ height: chatHeight }}
                      >
                        <p className="text-muted-foreground">Loading Discord community...</p>
                      </div>
                    ) : discordError ? (
                      <div 
                        className="rounded-lg border border-border/50 bg-muted/20 p-4 text-sm flex flex-col items-center justify-center"
                        style={{ height: chatHeight }}
                      >
                        <p className="text-foreground">Discord embed unavailable</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Server widget may be disabled
                        </p>
                      </div>
                    ) : null}
                  </>
                )}

                {/* Resize handle */}
                <div
                  onMouseDown={handleResizeStart}
                  className={`absolute bottom-0 left-0 right-0 h-3 flex items-center justify-center cursor-ns-resize bg-gradient-to-t from-card/80 to-transparent hover:from-purple-500/20 transition-colors ${
                    isResizing ? 'from-purple-500/30' : ''
                  }`}
                >
                  <GripHorizontal className="w-4 h-4 text-muted-foreground/50" />
                </div>
              </div>

              {/* External links */}
              <div className="flex gap-2 justify-center">
                {activeSource === 'twitch' && streamInfo.channel && (
                  <a
                    href={`https://www.twitch.tv/popout/${streamInfo.channel}/chat`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-purple-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in New Window
                  </a>
                )}
                {activeSource === 'discord' && discordCommunity?.discordInvite && (
                  <a
                    href={discordCommunity.discordInvite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-[#5865F2] hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in Discord
                  </a>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Reddit community link - prominent below chat */}
      {redditCommunity && (
        <a
          href={redditCommunity.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FF4500]/10 border border-[#FF4500]/30 hover:bg-[#FF4500]/20 transition-colors"
        >
          <RedditIcon className="w-4 h-4 text-[#FF4500]" />
          <span className="text-sm font-medium text-[#FF4500]">{redditCommunity.name}</span>
          <ExternalLink className="w-3 h-3 text-[#FF4500]/70 ml-auto" />
        </a>
      )}
    </div>
  );
}
