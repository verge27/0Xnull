import { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, AlertCircle, Play, Pause, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { creatorApi, CreatorProfile } from '@/services/creatorApi';
import { useToken } from '@/hooks/useToken';
import { toast } from 'sonner';

interface CreatorVoiceTabProps {
  creator: CreatorProfile;
}

interface VoiceClip {
  id: string;
  text: string;
  audioUrl: string;
  cost_usd: number;
}

export const CreatorVoiceTab = ({ creator }: CreatorVoiceTabProps) => {
  const { token, balance, refreshBalance } = useToken();
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceInfo, setVoiceInfo] = useState<{ available: boolean; cost_per_message_usd?: number } | null>(null);
  const [clips, setClips] = useState<VoiceClip[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const info = await creatorApi.getVoiceInfo(creator.id);
        setVoiceInfo(info);
      } catch {
        setVoiceInfo({ available: false });
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [creator.id]);

  const handleGenerate = async () => {
    if (!text.trim() || isGenerating || !token) return;
    setIsGenerating(true);

    try {
      const response = await creatorApi.generateVoiceMessage(creator.id, text.trim(), token);
      const audioUrl = `data:audio/${response.format || 'mp3'};base64,${response.audio}`;
      
      setClips(prev => [{
        id: `clip-${Date.now()}`,
        text: text.trim(),
        audioUrl,
        cost_usd: response.cost_usd,
      }, ...prev]);

      setText('');
      refreshBalance();
      toast.success('Voice message generated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Voice generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = (clipId: string, audioUrl: string) => {
    if (playingId === clipId) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => toast.error('Failed to play audio'));
    setPlayingId(clipId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!voiceInfo?.available) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">Voice Not Available</h3>
          <p className="text-sm text-muted-foreground">
            {creator.display_name} hasn't set up voice generation yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Mic className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="font-medium mb-2">Token Required</h3>
          <p className="text-sm text-muted-foreground">
            You need a 0xNull token to generate voice messages.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Generate section */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Generate Voice Message</span>
            </div>
            {voiceInfo.cost_per_message_usd && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Coins className="w-3 h-3" />
                ${voiceInfo.cost_per_message_usd.toFixed(2)}/msg
              </Badge>
            )}
          </div>
          <Textarea
            placeholder={`Type something for ${creator.display_name}'s voice to say...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {text.length}/500 • Balance: ${balance.toFixed(2)}
            </span>
            <Button
              onClick={handleGenerate}
              disabled={!text.trim() || isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              Generate Voice
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated clips */}
      {clips.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Generated Clips</h3>
          {clips.map((clip) => (
            <Card key={clip.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-10 w-10"
                  onClick={() => togglePlay(clip.id, clip.audioUrl)}
                >
                  {playingId === clip.id ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{clip.text}</p>
                  <p className="text-xs text-muted-foreground">
                    Cost: ${clip.cost_usd.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
