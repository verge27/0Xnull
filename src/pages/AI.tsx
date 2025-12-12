import { Bot, Sparkles, Lock, Zap, DollarSign, ExternalLink, Brain, Image, Video, Shield } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ChatWidget from '@/components/ChatWidget';
import aiBackground from '@/assets/ai-background.png';

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
    title: '480+ Models',
    description: 'Access premium, uncensored, image, and video AI models.',
  },
  {
    icon: Zap,
    title: 'Instant Access',
    description: 'No signup, no waiting. Start chatting immediately after payment.',
  },
];

const premiumModels = [
  { name: 'GPT-4 Turbo', provider: 'OpenAI', tag: 'Most Capable' },
  { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', tag: 'Best Analysis' },
  { name: 'Perplexity Sonar', provider: 'Perplexity', tag: 'Web Search' },
  { name: 'Gemini 2.0 Pro', provider: 'Google', tag: 'Multimodal' },
];

const uncensoredModels = [
  { name: 'Deepseek R1 Llama 70B', tag: 'Abliterated' },
  { name: 'Dolphin 72B', tag: 'Uncensored' },
  { name: 'Hermes 3 Large', tag: 'No Guardrails' },
  { name: 'Venice Uncensored Web', tag: 'Web Access' },
];

const imageModels = [
  { name: 'Nano Banana Pro Ultra', tag: 'Best Quality' },
  { name: 'Seedream 4.5 Sequential', tag: 'Photorealistic' },
  { name: 'Ideogram', tag: 'Text in Images' },
  { name: 'Lucid Origin', tag: 'Artistic' },
];

const videoModels = [
  { name: 'Kling 1.6 Pro', tag: 'Cinematic' },
  { name: 'Hunyuan Video', tag: 'Long Form' },
  { name: 'Minimax Video', tag: 'Fast Generation' },
  { name: 'Luma Dream Machine', tag: 'Creative' },
];

const AI = () => {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${aiBackground})`, zIndex: -2 }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-background/40 via-background/50 to-background/70" style={{ zIndex: -1 }} />
      
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

          {/* Premium Models */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle>Premium Models</CardTitle>
              </div>
              <CardDescription>Industry-leading AI from top providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {premiumModels.map((model) => (
                  <div key={model.name} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div>
                      <h4 className="font-medium text-sm">{model.name}</h4>
                      <p className="text-xs text-muted-foreground">{model.provider}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{model.tag}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Uncensored Models */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                <CardTitle>Uncensored Models</CardTitle>
              </div>
              <CardDescription>No guardrails, no filters - complete freedom</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {uncensoredModels.map((model) => (
                  <div key={model.name} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <h4 className="font-medium text-sm">{model.name}</h4>
                    <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-500">{model.tag}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Image Models */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-pink-500" />
                  <CardTitle className="text-lg">Image Generation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {imageModels.map((model) => (
                  <div key={model.name} className="flex items-center justify-between p-2 rounded border bg-card/50">
                    <span className="text-sm">{model.name}</span>
                    <Badge variant="outline" className="text-xs">{model.tag}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Video Models */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Video Generation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {videoModels.map((model) => (
                  <div key={model.name} className="flex items-center justify-between p-2 rounded border bg-card/50">
                    <span className="text-sm">{model.name}</span>
                    <Badge variant="outline" className="text-xs">{model.tag}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

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
                    Select from 480+ models: premium, uncensored, image, or video.
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
