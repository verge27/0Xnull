import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Send, Loader2, Bot, AlertCircle, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { creatorApi, CreatorProfile, ChatMessageItem } from '@/services/creatorApi';
import { useToken } from '@/hooks/useToken';
import { toast } from 'sonner';

interface CreatorChatTabProps {
  creator: CreatorProfile;
}

export const CreatorChatTab = ({ creator }: CreatorChatTabProps) => {
  const { token, balance, refreshBalance } = useToken();
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [chatInfo, setChatInfo] = useState<{ has_clone: boolean; fee_per_message_usd?: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check clone availability and load history
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const info = await creatorApi.getChatInfo(creator.id);
        setChatInfo(info);

        if (info.has_clone && token) {
          try {
            const history = await creatorApi.getChatHistory(creator.id, token);
            setMessages(history.messages || []);
          } catch {
            // No history yet
          }
        }
      } catch {
        setChatInfo({ has_clone: false });
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [creator.id, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isSending || !token) return;

    const messageText = input.trim();
    setInput('');
    setIsSending(true);

    // Optimistic user message
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    }]);

    try {
      const response = await creatorApi.sendChatMessage(creator.id, messageText, token);
      
      // Add assistant reply
      setMessages(prev => [...prev, {
        id: `reply-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        created_at: new Date().toISOString(),
        cost_usd: response.cost_usd,
      }]);

      refreshBalance();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message');
      // Remove optimistic message
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, token, creator.id, refreshBalance]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!chatInfo?.has_clone) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">AI Clone Not Available</h3>
          <p className="text-sm text-muted-foreground">
            {creator.display_name} hasn't set up an AI clone yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Bot className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="font-medium mb-2">Token Required</h3>
          <p className="text-sm text-muted-foreground">
            You need a 0xNull token to chat. Visit your dashboard to create one.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">AI Clone of {creator.display_name}</span>
        </div>
        {chatInfo.fee_per_message_usd && (
          <Badge variant="outline" className="gap-1 text-xs">
            <Coins className="w-3 h-3" />
            ${chatInfo.fee_per_message_usd.toFixed(2)}/msg
          </Badge>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">
            Start a conversation with {creator.display_name}'s AI clone
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted rounded-bl-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs ${msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </span>
                    {msg.cost_usd && (
                      <span className="text-xs text-muted-foreground">
                        ${msg.cost_usd.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t bg-muted/20">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            size="icon"
            className="shrink-0"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Balance: ${balance.toFixed(2)} • AI clone works while {creator.display_name} sleeps
        </p>
      </div>
    </div>
  );
};
