import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Send, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useToken } from '@/hooks/useToken';
import { TokenRequired } from '@/components/TokenManager';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = 'kokoro-chat-history';

const Kokoro = () => {
  useSEO();
  const { hasToken } = useToken();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !hasToken) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // TODO: Implement chat API
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Chat API not yet implemented.' }]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please try again.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    sessionStorage.removeItem(STORAGE_KEY);
    toast.success('Chat cleared');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-secondary/20">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Kokoro AI Companion
          </h1>
          <p className="text-muted-foreground text-lg mb-2">
            A caring AI companion for meaningful conversation.
          </p>
          <p className="text-sm text-muted-foreground/70">
            $0.02-0.05 per message • No logs
          </p>
        </div>

        <TokenRequired>
          {/* Chat Container */}
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardContent className="p-0">
              {/* Messages */}
              <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                    <div>
                      <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>Hey there! What's on your mind?</p>
                      <p className="text-sm mt-2 opacity-70">
                        I'm here to chat about anything.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary/50 text-foreground'
                          }`}
                        >
                          {msg.content ? (
                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                          ) : msg.role === 'assistant' && isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : (
                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="border-t border-border p-4">
                <div className="flex gap-2">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Say something..."
                    className="min-h-[60px] max-h-[120px] resize-none bg-secondary/30"
                    disabled={isLoading}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      size="icon"
                      className="h-10"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    {messages.length > 0 && (
                      <Button
                        onClick={clearChat}
                        variant="ghost"
                        size="icon"
                        className="h-10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TokenRequired>

        <p className="text-xs text-muted-foreground/60 mt-6 text-center max-w-md mx-auto">
          Conversations are processed through secure infrastructure. We do not store or review chat content.
        </p>
      </main>

      <Footer />
    </div>
  );
};

export default Kokoro;
