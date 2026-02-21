import { Bot, Mic, MessageCircle, Lock, Zap, DollarSign, ExternalLink, Brain, Shield, Server, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KeypairGenerator } from '@/components/KeypairGenerator';

const services = [
  {
    title: 'NanoGPT',
    description: '200+ AI models including uncensored & frontier. No KYC, no prompt logging, pay with crypto.',
    icon: Brain,
    href: 'https://nano-gpt.com/r/NfWFCFJi',
    price: 'From $8/mo',
    color: 'text-primary',
    external: true,
  },
  {
    title: 'Voice Cloning',
    description: 'Clone any voice with AI. High-quality text-to-speech synthesis.',
    icon: Mic,
    href: '/voice',
    price: 'From $0.15',
    color: 'text-primary',
  },
  {
    title: 'Kokoro Companion',
    description: 'AI companion for conversation and connection. No logs, no judgment.',
    icon: MessageCircle,
    href: '/kokoro',
    price: 'From $0.02',
    color: 'text-purple-500',
    comingSoon: true,
  },
];

const features = [
  {
    icon: Lock,
    title: 'No Accounts',
    description: 'No signup required. Completely anonymous access.',
  },
  {
    icon: DollarSign,
    title: 'Pay Per Use',
    description: 'No subscriptions. Pay only for what you use.',
  },
  {
    icon: Zap,
    title: 'No Logs',
    description: 'Conversations are never stored or tracked.',
  },
];

export default function AIHub() {
  useSEO();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <Badge variant="outline" className="mb-4">
              <Lock className="h-3 w-3 mr-1" />
              No Account Required
            </Badge>
            <h1 className="text-4xl font-bold mb-3">AI Services</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The anti-Character.ai. No accounts, no logs, pay with XMR.
            </p>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-3 gap-4 mb-12">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="bg-secondary/30">
                  <CardContent className="pt-6 text-center">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {services.map((service) => {
              const Icon = service.icon;
              const isExternal = 'external' in service && service.external;
              const isComingSoon = 'comingSoon' in service && service.comingSoon;
              
              const cardContent = (
                <Card className={`h-full transition-all ${isComingSoon ? 'opacity-70' : 'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 cursor-pointer'} group relative`}>
                  {isComingSoon && (
                    <Badge className="absolute top-3 right-3 bg-amber-500/90">Coming Soon</Badge>
                  )}
                  <CardHeader>
                    <div className={`h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-2 ${!isComingSoon && 'group-hover:scale-110'} transition-transform`}>
                      <Icon className={`h-6 w-6 ${service.color}`} />
                    </div>
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">{service.price}</Badge>
                  </CardContent>
                </Card>
              );

              if (isComingSoon) return <div key={service.title}>{cardContent}</div>;
              if (isExternal) return <a key={service.title} href={service.href} target="_blank" rel="noopener noreferrer">{cardContent}</a>;
              return <Link key={service.title} to={service.href}>{cardContent}</Link>;
            })}
          </div>

          {/* Keypair Generator */}
          <div className="mb-8">
            <KeypairGenerator />
          </div>

          {/* NanoGPT Featured Section */}
          <Card className="bg-gradient-to-br from-primary/15 via-primary/5 to-secondary/20 border-primary/30 overflow-hidden">
            <CardContent className="py-8 px-6 md:px-8">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">NanoGPT</h3>
                    <p className="text-sm text-muted-foreground">The anti-FraudGPT. Legitimate, cheaper, better.</p>
                  </div>
                </div>

                <p className="text-muted-foreground">
                  200+ AI models — including GPT-5.2, Claude, Gemini, and deep uncensored open-source catalogues.
                  No KYC, no prompt logging, TEE-verified privacy. Pay with XMR, ETH, BTC, or fiat. From $8/month or pay-per-prompt.
                </p>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-primary shrink-0" />
                    <span>No prompt logging</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="h-4 w-4 text-primary shrink-0" />
                    <span>TEE verified privacy</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Server className="h-4 w-4 text-primary shrink-0" />
                    <span>200+ models</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <a href="https://nano-gpt.com/r/NfWFCFJi" target="_blank" rel="noopener noreferrer">
                      Try NanoGPT
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                  <Button variant="outline" asChild size="lg">
                    <a href="https://nano-gpt.com/r/NfWFCFJi" target="_blank" rel="noopener noreferrer">
                      View All Models
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Info */}
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>All AI services accept XMR and other cryptocurrencies</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
