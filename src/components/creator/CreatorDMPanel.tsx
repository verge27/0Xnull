import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Send, 
  Loader2, 
  ArrowLeft, 
  Lock,
  Crown,
  MessageCircle,
  Coins
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CreatorProfile, creatorApi } from '@/services/creatorApi';
import { getCreatorSettings } from '@/hooks/useCreatorSettings';
import { PayPerMessageModal } from './PayPerMessageModal';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_from_creator: boolean;
}

interface CreatorDMPanelProps {
  creator: CreatorProfile;
  isSubscribed?: boolean;
  onClose?: () => void;
}

export const CreatorDMPanel = ({ creator, isSubscribed = false, onClose }: CreatorDMPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showPayPerMessage, setShowPayPerMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get creator's message settings
  const creatorSettings = getCreatorSettings(creator.id);
  const canPayPerMessage = creatorSettings.allowNonSubMessages && creatorSettings.messageFeeXmr > 0;

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      // Mock messages - in production would come from API
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessages([
        {
          id: '1',
          content: `Welcome! Thanks for subscribing. Feel free to message me anytime! 💕`,
          sender_id: creator.id,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          is_from_creator: true,
        },
      ]);
      setIsLoading(false);
    };

    if (isSubscribed) {
      loadMessages();
    }
  }, [creator.id, isSubscribed]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    // Optimistically add message
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender_id: 'user',
      created_at: new Date().toISOString(),
      is_from_creator: false,
    };
    setMessages(prev => [...prev, tempMessage]);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePayPerMessageSent = (message: string) => {
    // Add the message to the list after successful payment
    const newMsg: Message = {
      id: `paid-${Date.now()}`,
      content: message,
      sender_id: 'user',
      created_at: new Date().toISOString(),
      is_from_creator: false,
    };
    setMessages(prev => [...prev, newMsg]);
  };

  // Non-subscriber view with pay-per-message option
  if (!isSubscribed) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <Avatar className="w-10 h-10">
            {creator.avatar_url ? (
              <AvatarImage src={creatorApi.getMediaUrl(creator.avatar_url)} />
            ) : null}
            <AvatarFallback className="bg-[#FF6600]/20 text-[#FF6600]">
              {(creator.display_name || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{creator.display_name}</p>
            <p className="text-xs text-muted-foreground">Direct Messages</p>
          </div>
        </div>

        {/* Non-subscriber content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Lock className="w-12 h-12 text-[#FF6600] mb-4" />
          <h3 className="text-lg font-semibold mb-2">Subscribe to Message</h3>
          <p className="text-muted-foreground mb-4">
            Subscribe to {creator.display_name} to send unlimited direct messages
          </p>
          <Badge variant="outline" className="gap-1 mb-6">
            <Crown className="w-3 h-3" />
            Subscribers Only
          </Badge>

          {/* Pay-per-message option */}
          {canPayPerMessage && (
            <div className="w-full max-w-xs">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>
              
              <Button
                onClick={() => setShowPayPerMessage(true)}
                variant="outline"
                className="w-full gap-2 border-[#FF6600]/30 hover:bg-[#FF6600]/5"
              >
                <Coins className="w-4 h-4 text-[#FF6600]" />
                <span>Send a Message</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {creatorSettings.messageFeeXmr} XMR
                </Badge>
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Pay per message to start a conversation
              </p>
            </div>
          )}
        </div>

        {/* Pay-per-message modal */}
        <PayPerMessageModal
          creator={creator}
          messageFee={creatorSettings.messageFeeXmr}
          isOpen={showPayPerMessage}
          onClose={() => setShowPayPerMessage(false)}
          onMessageSent={handlePayPerMessageSent}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <Avatar className="w-10 h-10">
          {creator.avatar_url ? (
            <AvatarImage src={creatorApi.getMediaUrl(creator.avatar_url)} />
          ) : null}
          <AvatarFallback className="bg-[#FF6600]/20 text-[#FF6600]">
            {(creator.display_name || 'U').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{creator.display_name}</p>
          <p className="text-xs text-muted-foreground">
            Usually responds within a few hours
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No messages yet</p>
            <p className="text-sm">Start a conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.is_from_creator ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`flex items-end gap-2 max-w-[80%] ${msg.is_from_creator ? '' : 'flex-row-reverse'}`}>
                  {msg.is_from_creator && (
                    <Avatar className="w-8 h-8 shrink-0">
                      {creator.avatar_url ? (
                        <AvatarImage src={creatorApi.getMediaUrl(creator.avatar_url)} />
                      ) : null}
                      <AvatarFallback className="bg-[#FF6600]/20 text-[#FF6600] text-xs">
                        {(creator.display_name || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      msg.is_from_creator
                        ? 'bg-muted rounded-bl-sm'
                        : 'bg-[#FF6600] text-white rounded-br-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.is_from_creator ? 'text-muted-foreground' : 'text-white/70'}`}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="bg-[#FF6600] hover:bg-[#FF6600]/90"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
