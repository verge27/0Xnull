import { Link } from 'react-router-dom';
import { Smartphone, ArrowLeftRight, Wallet, Briefcase, Server, Bot } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SiteAssistant } from '@/components/SiteAssistant';
import { useSEO } from '@/hooks/useSEO';
import { useVoucherFromUrl } from '@/hooks/useVoucher';

interface Panel {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const panels: Panel[] = [
  {
    to: '/phone',
    icon: <Smartphone className="w-8 h-8 text-primary" aria-hidden="true" />,
    title: 'Phone & eSIM',
    description: 'Anonymous numbers and data eSIMs. No KYC.',
  },
  {
    to: '/swaps',
    icon: <ArrowLeftRight className="w-8 h-8 text-primary" aria-hidden="true" />,
    title: 'Swaps',
    description: 'Non-custodial crypto swaps, settled in XMR.',
  },
  {
    to: '/onramp',
    icon: <Wallet className="w-8 h-8 text-primary" aria-hidden="true" />,
    title: 'Fiat On-ramp',
    description: 'Cash to XMR, no exchange account.',
  },
  {
    to: '/work',
    icon: <Briefcase className="w-8 h-8 text-primary" aria-hidden="true" />,
    title: 'Work',
    description: 'XMR-paying jobs, aggregated from every board.',
  },
  {
    to: '/vps',
    icon: <Server className="w-8 h-8 text-primary" aria-hidden="true" />,
    title: 'VPS',
    description: 'Anonymous servers, paid in crypto.',
  },
  {
    to: '/ai',
    icon: <Bot className="w-8 h-8 text-primary" aria-hidden="true" />,
    title: 'AI & Voice',
    description: 'Private AI chat and voice tools. No account.',
  },
];

const moreLinks = [
  { label: 'Predictions', to: '/predict' },
  { label: 'Marketplace', to: '/browse' },
  { label: 'On/Off-ramp guides', to: '/docs' },
  { label: 'Wallet', to: '/dashboard' },
  { label: 'Verify', to: '/verify' },
  { label: 'Philosophy', to: '/philosophy' },
  { label: 'Docs', to: '/docs' },
  { label: 'Buy', to: '/buy' },
  { label: 'Get Started', to: '/get-started' },
];

const Index = () => {
  useSEO({
    title: '0xNull | One token, every private service, no accounts',
    description: 'One anonymous token unlocks AI, a Monero marketplace, swaps, lending and prediction markets. No KYC, no accounts, priced per use.',
  });

  // Capture voucher/ref from URL params (e.g., ?ref=AWF0XDOTA)
  useVoucherFromUrl();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <section className="container mx-auto px-4 pt-16 pb-10 md:pt-24 md:pb-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-5 tracking-tight">0xNull</h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              One anonymous credential, funded in Monero and spent across every service. No accounts, no signup.
            </p>
          </div>
        </section>

        {/* Primary panel grid */}
        <section className="container mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {panels.map((panel) => (
              <Link
                key={panel.to}
                to={panel.to}
                className="group block rounded-lg border border-border/60 bg-card/50 backdrop-blur p-6 h-full transition-colors hover:border-primary/40 hover:bg-card/70"
              >
                <div className="flex flex-col h-full">
                  <div className="mb-4">{panel.icon}</div>
                  <h2 className="text-lg font-semibold mb-2">{panel.title}</h2>
                  <p className="text-sm text-muted-foreground mt-auto">{panel.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Secondary links */}
        <section className="container mx-auto px-4 pb-20">
          <div className="border-t border-border/30 pt-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">More</h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {moreLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <SiteAssistant />
    </div>
  );
};

export default Index;
