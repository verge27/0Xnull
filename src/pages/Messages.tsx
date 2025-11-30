import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { getConversations, getMessages, sendMessage, getListing } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle } from 'lucide-react';
import { DEMO_USERS } from '@/lib/data';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

const Messages = () => {
  const { conversationId } = useParams();
  const [messageText, setMessageText] = useState('');
  const { user } = useAuth();
  const conversations = getConversations();
  const activeConversation = conversationId 
    ? conversations.find(c => c.id === conversationId)
    : conversations[0];
  const messages = activeConversation ? getMessages(activeConversation.id) : [];

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view messages</h1>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (!messageText.trim() || !activeConversation || !user) return;
    
    sendMessage(activeConversation.id, user.id, messageText);
    setMessageText('');
    toast.success('Message sent');
  };

  const getOtherParticipant = (participantIds: string[]) => {
    const otherId = participantIds.find(id => id !== user.id);
    return DEMO_USERS.find(u => u.id === otherId);
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
                {conversations.length > 0 ? (
                  conversations.map(conv => {
                    const otherUser = getOtherParticipant(conv.participants);
                    const listing = conv.listingId ? getListing(conv.listingId) : null;
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
                          <AvatarImage src={otherUser?.avatar} />
                          <AvatarFallback>{otherUser?.displayName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold truncate">{otherUser?.displayName}</span>
                            {conv.unreadCount > 0 && (
                              <Badge variant="default" className="ml-2">{conv.unreadCount}</Badge>
                            )}
                          </div>
                          {listing && (
                            <p className="text-xs text-muted-foreground truncate mb-1">
                              Re: {listing.title}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="p-12 text-center">
                    <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No conversations yet</p>
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
                    <AvatarImage src={getOtherParticipant(activeConversation.participants)?.avatar} />
                    <AvatarFallback>
                      {getOtherParticipant(activeConversation.participants)?.displayName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="font-semibold">
                      {getOtherParticipant(activeConversation.participants)?.displayName}
                    </h2>
                    {activeConversation.listingId && (
                      <Link 
                        to={`/listing/${activeConversation.listingId}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View Listing
                      </Link>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => {
                    const isSent = msg.senderId === user.id;
                    return (
                      <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-lg p-3 ${
                          isSent 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            isSent ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input */}
                <div className="border-t border-border p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button onClick={handleSend} disabled={!messageText.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;
