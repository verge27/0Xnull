import { RefreshCw, Server, Smartphone, Lock, Zap, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const services = [
  {
    title: 'Crypto Swaps',
    description: 'Swap any cryptocurrency to another. No KYC, no accounts, instant exchanges.',
    icon: RefreshCw,
    href: '/swaps',
    price: 'Variable rates',
    color: 'text-primary',
  },
  {
    title: 'Anonymous VPS',
    description: 'Deploy virtual private servers with crypto. No identity verification required.',
    icon: Server,
    href: '/vps',
    price: 'From $3/mo',
    color: 'text-blue-500',
  },
  {
    title: 'eSIM & Phone',
    description: 'Get phone numbers and data plans without ID. Works worldwide.',
    icon: Smartphone,
    href: '/phone',
    price: 'From $5',
    color: 'text-green-500',
  },
];

const features = [
  {
    icon: Lock,
    title: 'No KYC',
    description: 'All services work without identity verification.',
  },
  {
    icon: Zap,
    title: 'Instant Access',
    description: 'Pay with crypto and start using immediately.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'No logs, no tracking, no data collection.',
  },
];

export default function InfraHub() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Lock className="h-3 w-3 mr-1" />
              No KYC Required
            </Badge>
            <h1 className="text-4xl font-bold mb-3">Privacy Infrastructure</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Anonymous services for the permissionless economy. No identity verification, crypto payments only.
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
          <div className="grid md:grid-cols-3 gap-6">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Link key={service.title} to={service.href}>
                  <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer group">
                    <CardHeader>
                      <div className={`h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                        <Icon className={`h-6 w-6 ${service.color}`} />
                      </div>
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="secondary">{service.price}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>All services accept XMR, BTC, and other cryptocurrencies</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
