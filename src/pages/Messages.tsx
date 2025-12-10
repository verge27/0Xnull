import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle, Loader2, Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { usePrivateKeyAuth } from '@/hooks/usePrivateKeyAuth';
import { useMessages, useConversation } from '@/hooks/useMessages';
import { usePGP } from '@/hooks/usePGP';
import { PGPPassphraseDialog } from '@/components/PGPPassphraseDialog';

const Messages = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showPGPDialog, setShowPGPDialog] = useState(false);
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { privateKeyUser } = usePrivateKeyAuth();
  const { conversations, loading: convLoading, isAuthenticated } = useMessages();
  const { messages, loading: msgLoading, sendMessage, sendEncryptedMessage, currentUserId, getRecipientIds } = useConversation(conversationId);
  const { isUnlocked, isPGPEncrypted, decryptMessage, restoreSession, checkHasKeys } = usePGP();

  const activeConversation = conversationId 
    ? conversations.find(c => c.id === conversationId)
    : conversations[0];

  // Try to restore PGP session on mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Redirect to first conversation if none selected
  useEffect(() => {
    if (!conversationId && conversations.length > 0) {
      navigate(`/messages/${conversations[0].id}`, { replace: true });
    }
  }, [conversationId, conversations, navigate]);

  // Decrypt encrypted messages when unlocked
  useEffect(() => {
    if (!isUnlocked) return;

    const decryptMessages = async () => {
      const newDecrypted: Record<string, string> = {};
      
      for (const msg of messages) {
        if (isPGPEncrypted(msg.content) && !decryptedMessages[msg.id]) {
          const decrypted = await decryptMessage(msg.content);
          if (decrypted) {
            newDecrypted[msg.id] = decrypted;
          }
        }
      }

      if (Object.keys(newDecrypted).length > 0) {
        setDecryptedMessages(prev => ({ ...prev, ...newDecrypted }));
      }
    };

    decryptMessages();
  }, [messages, isUnlocked, isPGPEncrypted, decryptMessage, decryptedMessages]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Sign in to view messages</h1>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to send and receive messages.
          </p>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    if (!messageText.trim() || !activeConversation || sending) return;
    
    // Check if we should send encrypted
    if (!isUnlocked) {
      // Check if user has keys set up
      const hasKeys = await checkHasKeys();
      if (hasKeys || !hasKeys) {
        // Prompt to unlock/create keys for encryption
        setShowPGPDialog(true);
        return;
      }
    }

    setSending(true);
    
    // Get recipient info for encryption
    const recipientIds = getRecipientIds();
    const success = await sendEncryptedMessage(
      messageText,
      recipientIds?.recipientUserId,
      recipientIds?.recipientPkUserId
    );
    
    setSending(false);
    
    if (success) {
      setMessageText('');
    } else {
      toast.error('Failed to send message');
    }
  };

  const getDisplayContent = (msg: typeof messages[0]) => {
    // Check if message is encrypted
    if (isPGPEncrypted(msg.content)) {
      // Check if we have decrypted version
      if (decryptedMessages[msg.id]) {
        return decryptedMessages[msg.id];
      }
      // Not decrypted yet
      return null;
    }
    // Plain text message
    return msg.content;
  };

  const getOtherParticipant = (participants: typeof activeConversation.participants) => {
    const other = participants.find(p => 
      p.user_id !== user?.id && 
      p.private_key_user_id !== privateKeyUser?.id
    );
    return other?.profile?.display_name || other?.pk_user?.display_name || 'Unknown';
  };

  const getSenderName = (msg: typeof messages[0]) => {
    return msg.sender_profile?.display_name || msg.sender_pk_user?.display_name || 'Unknown';
  };

  const isSentByMe = (msg: typeof messages[0]) => {
    if (user && msg.sender_user_id === user.id) return true;
    if (privateKeyUser && msg.sender_private_key_user_id === privateKeyUser.id) return true;
    return false;
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Messages</h1>

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          {/* Conversation List */}
          <Card className="lg:col-span-1 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-y-auto h-full">
                {convLoading ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : conversations.length > 0 ? (
                  conversations.map(conv => {
                    const otherName = getOtherParticipant(conv.participants);
                    const isActive = conv.id === activeConversation?.id;

                    return (
                      <Link
                        key={conv.id}
                        to={`/messages/${conv.id}`}
                        className={`flex gap-3 p-4 border-b border-border hover:bg-muted/50 transition-colors ${
                          isActive ? 'bg-muted' : ''
                        }`}
                      >
                        <Avatar>
                          <AvatarFallback>{otherName[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold truncate">{otherName}</span>
                            {conv.unread_count > 0 && (
                              <Badge variant="default" className="ml-2">{conv.unread_count}</Badge>
                            )}
                          </div>
                          {conv.listing && (
                            <p className="text-xs text-muted-foreground truncate mb-1">
                              Re: {conv.listing.title}
                            </p>
                          )}
                          {conv.last_message && (
                            <>
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.last_message.content}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: true })}
                              </p>
                            </>
                          )}
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="p-12 text-center">
                    <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No conversations yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Start a conversation by contacting a seller on a listing.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Conversation */}
          <Card className="lg:col-span-2 overflow-hidden flex flex-col">
            {activeConversation ? (
              <>
                {/* Header */}
                <div className="border-b border-border p-4 flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {getOtherParticipant(activeConversation.participants)[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">
                        {getOtherParticipant(activeConversation.participants)}
                      </h2>
                      {getRecipientIds()?.recipientHasPGP ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                          <Shield className="w-2.5 h-2.5" />
                          PGP
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                          No PGP
                        </span>
                      )}
                    </div>
                    {activeConversation.listing && (
                      <Link 
                        to={`/listing/${activeConversation.listing_id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        {activeConversation.listing.title}
                      </Link>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {msgLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map(msg => {
                      const isSent = isSentByMe(msg);
                      const displayContent = getDisplayContent(msg);
                      const isEncrypted = isPGPEncrypted(msg.content);
                      
                      return (
                        <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-lg p-3 ${
                            isSent 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            {!isSent && (
                              <p className="text-xs font-medium mb-1">{getSenderName(msg)}</p>
                            )}
                            {displayContent ? (
                              <div className="flex items-start gap-2">
                                {isEncrypted && (
                                  <Lock className={`w-3 h-3 mt-0.5 flex-shrink-0 ${isSent ? 'text-primary-foreground/70' : 'text-green-500'}`} />
                                )}
                                <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
                              </div>
                            ) : isEncrypted ? (
                              <button
                                onClick={() => setShowPGPDialog(true)}
                                className={`flex items-center gap-2 text-sm ${isSent ? 'text-primary-foreground/80' : 'text-muted-foreground'} hover:underline`}
                              >
                                <Lock className="w-3 h-3" />
                                <span>Encrypted message - click to unlock</span>
                              </button>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            )}
                            <p className={`text-xs mt-1 ${
                              isSent ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>No messages yet. Send the first message!</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-border p-4">
                  {isUnlocked && (
                    <div className="flex items-center gap-1.5 text-xs text-green-500 mb-2">
                      <Shield className="w-3 h-3" />
                      <span>End-to-end encrypted</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder={isUnlocked ? "Type an encrypted message..." : "Type a message..."}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      disabled={sending}
                    />
                    <Button onClick={handleSend} disabled={!messageText.trim() || sending}>
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {conversations.length > 0 
                      ? 'Select a conversation to start messaging'
                      : 'No conversations yet'
                    }
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <PGPPassphraseDialog 
        open={showPGPDialog}
        onOpenChange={setShowPGPDialog}
        onUnlocked={() => {
          // Re-decrypt messages after unlocking
          setDecryptedMessages({});
        }}
      />
    </div>
  );
};

export default Messages;
