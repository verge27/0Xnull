import { useState, useEffect } from 'react';
import { Loader2, Mic, Coins, MessageCircle, Link2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { creatorApi } from '@/services/creatorApi';

export const DashboardVoiceTab = () => {
  const [voiceData, setVoiceData] = useState<{ voice_id?: string; status: string; total_earned: number; total_messages: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await creatorApi.getMyVoice();
        setVoiceData(data);
      } catch {
        setVoiceData({ status: 'not_configured', total_earned: 0, total_messages: 0 });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <MessageCircle className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{voiceData?.total_messages || 0}</p>
            <p className="text-xs text-muted-foreground">Total Messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <Coins className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-primary">${(voiceData?.total_earned || 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Voice Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mic className="w-5 h-5" />
            Voice Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Status:</span>
            <Badge variant={voiceData?.status === 'active' ? 'default' : 'secondary'}>
              {voiceData?.status || 'Not Configured'}
            </Badge>
          </div>
          <div>
            <Label>ElevenLabs Voice ID</Label>
            <div className="flex items-center gap-2 mt-1">
              <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                value={voiceData?.voice_id || ''}
                readOnly
                placeholder="Not linked"
                className="font-mono text-xs"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Contact support to link your ElevenLabs voice ID.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
