import { Link } from 'react-router-dom';
import { Smartphone, ArrowLeftRight, Wallet, Briefcase, Server, Bot, TrendingUp } from 'lucide-react';
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

const primaryPanels: Panel[] = [
  {
    to: '/phone',
    icon: <Smartphone className="w-6 h-6 md:w-8 md:h-8 text-primary" aria-hidden="true" />,
    title: 'Phone & eSIM',
    description: 'Anonymous numbers and data eSIMs. No KYC.',
  },
  {
    to: '/vps',
    icon: <Server className="w-6 h-6 md:w-8 md:h-8 text-primary" aria-hidden="true" />,
    title: 'VPS',
    description: 'Anonymous servers, paid in crypto.',
  },
  {
    to: '/swaps',
    icon: <ArrowLeftRight className="w-6 h-6 md:w-8 md:h-8 text-primary" aria-hidden="true" />,
    title: 'Swaps',
    description: 'Non-custodial crypto swaps, settled in XMR.',
  },
  {
    to: '/ramp',
    icon: <Wallet className="w-6 h-6 md:w-8 md:h-8 text-primary" aria-hidden="true" />,
    title: 'Fiat On/Off Ramp',
    description: 'Buy or sell crypto on the route your country allows.',
  },
  {
    to: '/ai',
    icon: <Bot className="w-6 h-6 md:w-8 md:h-8 text-primary" aria-hidden="true" />,
    title: 'AI & Voice',
    description: 'Private AI chat and voice tools. No account.',
  },
  {
    to: '/lending',
    icon: <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-primary" aria-hidden="true" />,
    title: 'Lending',
    description: 'Earn on XMR and stablecoins. Passive yield.',
  },
];

const newPanel: Panel = {
  to: '/work',
  icon: <Briefcase className="w-6 h-6 md:w-8 md:h-8 text-primary" aria-hidden="true" />,
  title: 'Work',
  description: 'XMR-paying jobs, aggregated from every board.',
};


const moreLinks = [
  { label: 'Predictions', to: '/predict' },
  { label: 'Marketplace', to: '/browse' },
  { label: 'On/Off-ramp guides', to: '/docs' },
  { label: 'Wallet', to: '/dashboard' },
  { label: 'Verify', to: '/verify' },
  { label: 'Philosophy', to: '/philosophy' },
  { label: 'Docs', to: '/docs' },
  { label: 'Buy', to: '/buy' },
  { label: 'Cash out', to: '/cashout' },
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
        <section className="container mx-auto px-4 pt-8 pb-5 md:pt-14 md:pb-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight">0xNull</h1>
            <p className="text-sm md:text-lg text-muted-foreground">
              One anonymous credential, funded in Monero and spent across every service. No accounts, no signup.
            </p>
          </div>
        </section>

        {/* Primary panel grid */}
        <section className="container mx-auto px-4 pb-12">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
            {panels.map((panel) => (
              <Link
                key={panel.to}
                to={panel.to}
                className="group flex aspect-square sm:aspect-[4/3] lg:aspect-[2/1] flex-col items-center justify-center gap-1.5 rounded-2xl border border-border/60 bg-card/60 p-3 text-center backdrop-blur shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.25)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-card/80 hover:shadow-[0_10px_28px_-8px_hsl(var(--primary)/0.4)] active:translate-y-0 active:scale-[0.98] md:p-5"
              >
                <div className="shrink-0">{panel.icon}</div>
                <h2 className="text-sm md:text-base font-semibold leading-tight">{panel.title}</h2>
                <p className="text-[11px] md:text-sm text-muted-foreground leading-snug line-clamp-3">{panel.description}</p>
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
