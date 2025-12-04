import { Phone as PhoneIcon, MessageSquare, Wifi, Shield, ExternalLink, Zap } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const services = [
  {
    title: 'Disposable Phone Numbers',
    description: 'One-time use numbers for SMS verification. Perfect for anonymous signups.',
    icon: MessageSquare,
    url: 'https://lnvpn.net/phone-numbers',
    features: ['Instant activation', 'Multiple countries', 'Single use'],
    price: 'From ~$1',
  },
  {
    title: 'Rental Phone Numbers',
    description: 'Keep a number for days or weeks. Receive unlimited SMS.',
    icon: PhoneIcon,
    url: 'https://lnvpn.net/rent-phone-numbers',
    features: ['Extended duration', 'Unlimited messages', 'Privacy focused'],
    price: 'From ~$5/week',
  },
  {
    title: 'Data eSIMs',
    description: 'Global mobile data without revealing your identity. Works in 100+ countries.',
    icon: Wifi,
    url: 'https://lnvpn.net/esims',
    features: ['Global coverage', 'No registration', 'Instant delivery'],
    price: 'From ~$3',
  },
  {
    title: 'VPN Service',
    description: 'Anonymous VPN access with WireGuard. Pay with Bitcoin or Lightning.',
    icon: Shield,
    url: 'https://lnvpn.net',
    features: ['WireGuard protocol', 'No logs', 'Fast speeds'],
    price: 'From ~$2/month',
  },
];

const Phone = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Zap className="h-3 w-3 mr-1" />
              Bitcoin & Lightning Accepted
            </Badge>
            <h1 className="text-4xl font-bold mb-3">Phone & eSIM Services</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Anonymous phone numbers and mobile data. No KYC, no registration, pay with crypto.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.title} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary">{service.price}</Badge>
                    </div>
                    <CardTitle className="mt-4">{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center text-sm text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" asChild>
                      <a href={service.url} target="_blank" rel="noopener noreferrer">
                        Get Started
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Info Section */}
          <Card className="bg-secondary/30">
            <CardContent className="py-8">
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-4">Why Use Anonymous Phone Services?</h2>
                <div className="grid sm:grid-cols-3 gap-6 text-left mt-6">
                  <div>
                    <h3 className="font-semibold mb-2">Privacy Protection</h3>
                    <p className="text-sm text-muted-foreground">
                      Keep your real phone number private. Use disposable numbers for signups and verifications.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">No Identity Required</h3>
                    <p className="text-sm text-muted-foreground">
                      No KYC, no ID verification. Pay with Bitcoin or Lightning and get instant access.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Global Access</h3>
                    <p className="text-sm text-muted-foreground">
                      Numbers from multiple countries. eSIMs work in 100+ destinations worldwide.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Services provided by{' '}
              <a href="https://lnvpn.net" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                LNVPN
              </a>
            </p>
            <p className="mt-1">All payments via Bitcoin Lightning Network for instant activation</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Phone;
