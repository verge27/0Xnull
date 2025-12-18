import { Bot, Mic, Heart, MessageCircle, Lock, Zap, DollarSign, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const services = [
  {
    title: 'Voice Cloning',
    description: 'Clone any voice with AI. High-quality text-to-speech synthesis.',
    icon: Mic,
    href: '/voice',
    price: 'From $0.15',
    color: 'text-primary',
  },
  {
    title: 'AI Therapy',
    description: 'Anonymous AI therapist. Talk through anything without judgment.',
    icon: Heart,
    href: '/therapy',
    price: 'Free',
    color: 'text-pink-500',
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
              const CardWrapper = service.comingSoon ? 'div' : Link;
              const cardProps = service.comingSoon ? {} : { to: service.href };
              return (
                <CardWrapper key={service.title} {...cardProps as any}>
                  <Card className={`h-full transition-all ${service.comingSoon ? 'opacity-70' : 'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 cursor-pointer'} group relative`}>
                    {service.comingSoon && (
                      <Badge className="absolute top-3 right-3 bg-amber-500/90">Coming Soon</Badge>
                    )}
                    <CardHeader>
                      <div className={`h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-2 ${!service.comingSoon && 'group-hover:scale-110'} transition-transform`}>
                        <Icon className={`h-6 w-6 ${service.color}`} />
                      </div>
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="secondary">{service.price}</Badge>
                    </CardContent>
                  </Card>
                </CardWrapper>
              );
            })}
          </div>

          {/* NanoGPT Banner */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/30 border-primary/20">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Want access to 480+ AI models?</h3>
                  <p className="text-sm text-muted-foreground">
                    NanoGPT offers premium, uncensored, image, and video AI models with crypto payments.
                  </p>
                </div>
                <Button asChild>
                  <a href="https://nano-gpt.com/subscription/NfWFCFJi" target="_blank" rel="noopener noreferrer">
                    Try NanoGPT
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
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
