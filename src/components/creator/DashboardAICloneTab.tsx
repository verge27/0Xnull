import { useState, useEffect } from 'react';
import { Loader2, Bot, Coins, Users, MessageCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { creatorApi } from '@/services/creatorApi';
import { toast } from 'sonner';

export const DashboardAICloneTab = () => {
  const [persona, setPersona] = useState('');
  const [fee, setFee] = useState('0.10');
  const [stats, setStats] = useState({ unique_fans: 0, messages_today: 0, total_earned: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await creatorApi.getChatPersona();
        setPersona(data.persona || '');
        setFee(data.fee_per_message_usd?.toFixed(2) || '0.10');
        setStats({
          unique_fans: data.unique_fans || 0,
          messages_today: data.messages_today || 0,
          total_earned: data.total_earned || 0,
        });
      } catch {
        // New creator, no persona yet
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await creatorApi.saveChatPersona(persona, parseFloat(fee));
      toast.success('AI clone settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.unique_fans}</p>
            <p className="text-xs text-muted-foreground">Unique Fans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <MessageCircle className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.messages_today}</p>
            <p className="text-xs text-muted-foreground">Messages Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <Coins className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-primary">${stats.total_earned.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Persona */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="w-5 h-5" />
            AI Clone Persona
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Personality Description</Label>
            <Textarea
              placeholder="Describe your AI clone's personality, tone, interests, and how it should interact with fans..."
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground mt-1">
              AI clone works while you sleep — fans can chat with your persona 24/7
            </p>
          </div>
          <div>
            <Label>Fee per Message (USD)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max="5.00"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Range: $0.01 – $5.00 per message
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Clone Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
