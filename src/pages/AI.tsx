import { Bot, Sparkles, Lock, Zap, DollarSign, ExternalLink, MessageCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ChatWidget from '@/components/ChatWidget';

const features = [
  {
    icon: DollarSign,
    title: 'Pay Per Prompt',
    description: 'No subscriptions. Pay only for what you use with cryptocurrency.',
  },
  {
    icon: Lock,
    title: 'Privacy First',
    description: 'No account required. No data retention. Completely anonymous access.',
  },
  {
    icon: Sparkles,
    title: 'Multiple Models',
    description: 'Access GPT-4, Claude, Llama, and other leading AI models.',
  },
  {
    icon: Zap,
    title: 'Instant Access',
    description: 'No signup, no waiting. Start chatting immediately after payment.',
  },
];

const models = [
  { name: 'GPT-4 Turbo', provider: 'OpenAI', capability: 'Most capable' },
  { name: 'Claude 3 Opus', provider: 'Anthropic', capability: 'Best for analysis' },
  { name: 'Llama 3 70B', provider: 'Meta', capability: 'Open source' },
  { name: 'Mixtral 8x7B', provider: 'Mistral', capability: 'Fast & efficient' },
];

const AI = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <Badge variant="outline" className="mb-4">
              <Lock className="h-3 w-3 mr-1" />
              No Account Required
            </Badge>
            <h1 className="text-4xl font-bold mb-3">Private AI Access</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Access the world's most powerful AI models anonymously. Pay with crypto, no signup required.
            </p>
            <div className="mt-6">
              <Button size="lg" asChild>
                <a href="https://nano-gpt.com/subscription/NfWFCFJi" target="_blank" rel="noopener noreferrer">
                  Try NanoGPT
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardContent className="pt-6">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Models */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle>Available Models</CardTitle>
              <CardDescription>Access leading AI models from top providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {models.map((model) => (
                  <div
                    key={model.name}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div>
                      <h4 className="font-medium">{model.name}</h4>
                      <p className="text-sm text-muted-foreground">{model.provider}</p>
                    </div>
                    <Badge variant="secondary">{model.capability}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* How it works */}
          <Card className="bg-secondary/30 mb-12">
            <CardContent className="py-8">
              <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
              <div className="grid sm:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-lg font-bold text-primary">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Choose a Model</h3>
                  <p className="text-sm text-muted-foreground">
                    Select from GPT-4, Claude, Llama, or other available models.
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-lg font-bold text-primary">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Pay with Crypto</h3>
                  <p className="text-sm text-muted-foreground">
                    Send Bitcoin, Monero, or Lightning. Credits added instantly.
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-lg font-bold text-primary">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Start Chatting</h3>
                  <p className="text-sm text-muted-foreground">
                    No signup needed. Your conversation stays private.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to try private AI?</h2>
            <p className="text-muted-foreground mb-6">
              Access cutting-edge AI without compromising your privacy.
            </p>
            <Button size="lg" asChild>
              <a href="https://nano-gpt.com/subscription/NfWFCFJi" target="_blank" rel="noopener noreferrer">
                Get Started with NanoGPT
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>
              Powered by{' '}
              <a href="https://nano-gpt.com/subscription/NfWFCFJi" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                NanoGPT
              </a>
            </p>
            <p className="mt-1">Anonymous AI access with cryptocurrency payments</p>
          </div>
        </div>
      </main>

      <Footer />
      
      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default AI;
