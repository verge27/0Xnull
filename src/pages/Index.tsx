import { Link } from 'react-router-dom';
import { Target, Zap, BarChart3, Lock, ArrowRight, ExternalLink, Rocket, RefreshCw, ShoppingBag, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SiteAssistant } from '@/components/SiteAssistant';
import { SEORichText } from '@/components/SEORichText';
import { useSEO } from '@/hooks/useSEO';
import { BackgroundImage } from '@/components/OptimizedImage';
import { useVoucherFromUrl } from '@/hooks/useVoucher';

// Responsive hero background images for different screen sizes
// Using 100vw sizing, browser selects based on viewport * DPR.
// NOTE: We include a 1536w candidate to prevent high-DPR phones from jumping straight to the 1920w asset.
const heroImages = {
  small: '/images/backgrounds/predictions-hero-background-640.webp',
  medium: '/images/backgrounds/predictions-hero-background-1024.webp',
  large: '/images/backgrounds/predictions-hero-background.webp',
  xl: '/images/backgrounds/predictions-hero-background-1536.webp',
};

const heroResponsiveSources = [
  { src: heroImages.small, width: 640 },
  { src: heroImages.medium, width: 1024 },
  { src: heroImages.xl, width: 1536 },
  { src: heroImages.large, width: 1920 },
];

const Index = () => {
  useSEO({
    title: '0xNull | Anonymous Prediction Markets & Crypto Marketplace',
    description: 'Discover 0xNull Marketplace, a privacy-first anonymous prediction markets and cryptocurrency marketplace. Access digital goods, services, and prediction markets with Monero and other crypto | no KYC, no tracking.',
  });
  
  // Capture voucher/ref from URL params (e.g., ?ref=AWF0XDOTA)
  useVoucherFromUrl();
  
  const offerings = [
    {
      icon: BarChart3,
      title: 'Prediction Markets',
      description: 'Sports, esports, combat, crypto. Bet yes or no. XMR in, XMR out. No account.',
      href: '/predictions',
    },
    {
      icon: ShoppingBag,
      title: 'Marketplace',
      description: 'Buy and sell products and services anonymously. Pay with crypto, ship anywhere.',
      href: '/browse',
    },
    {
      icon: RefreshCw,
      title: 'Swaps',
      description: 'Swap 300+ coins privately. No registration. No history. Just rates.',
      href: '/swaps',
    },
    {
      icon: TrendingUp,
      title: 'Lending',
      description: 'Deposit, earn yield via Aave, withdraw. No KYC. No identity. Optional ZK shielding.',
      href: '/lending',
    },
  ];

  const pillars = [
    {
      icon: Target,
      title: 'No Account Needed',
      description: 'Scan QR, send XMR, you\'re in. No signup, no email, no identity.'
    },
    {
      icon: Zap,
      title: 'Instant Payouts',
      description: 'Winners paid automatically when markets resolve. No withdrawal requests.'
    },
    {
      icon: BarChart3,
      title: '0.4% Rake on Winnings',
      description: 'No fee on losses or no-contest. Unopposed bets refunded in full.'
    },
    {
      icon: Lock,
      title: 'Fully Private',
      description: 'XMR only. No blockchain trail. No KYC. Ever.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
      
      {/* Hero Section with Background */}
      <BackgroundImage
        src={heroImages.small}
        responsiveSources={heroResponsiveSources}
        sizes="100vw"
        priority={true}
        className="relative overflow-hidden"
        overlayClassName="bg-gradient-to-b from-background/70 via-background/60 to-background"
      >
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* KYCNOT.ME Badge */}
            <a 
              href="https://kycnot.me/service/0xnull"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-background/60 backdrop-blur-sm border border-primary/20 hover:bg-background/80 transition-colors group"
            >
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                7/10
              </span>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                Verified on KYCNOT.ME
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </a>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight drop-shadow-lg">
              Join the Quiet Riot.
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto drop-shadow-md">
              No name. No account. No compromise. Just your token.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/lending">
                <button className="inline-flex items-center gap-2 text-lg px-8 h-11 rounded-md bg-primary text-primary-foreground font-medium neon-glow-primary transition-transform hover:scale-105 hover:bg-primary/90">
                  <TrendingUp className="w-5 h-5" aria-hidden="true" />
                  Lending
                </button>
              </Link>
              <Link to="/predictions">
                <button className="inline-flex items-center gap-2 text-lg px-8 h-11 rounded-md border border-input bg-background/50 backdrop-blur-sm text-foreground font-medium neon-glow-cyan-static transition-transform hover:scale-105 hover:bg-accent">
                  <BarChart3 className="w-5 h-5" aria-hidden="true" />
                  Predictions
                </button>
              </Link>
              <Link to="/browse">
                <button className="inline-flex items-center gap-2 text-lg px-8 h-11 rounded-md border border-input bg-background/50 backdrop-blur-sm text-foreground font-medium neon-glow-magenta-static transition-transform hover:scale-105 hover:bg-accent">
                  <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                  Marketplace
                </button>
              </Link>
              <Link to="/swaps">
                <button className="inline-flex items-center gap-2 text-lg px-8 h-11 rounded-md border border-input bg-background/50 backdrop-blur-sm text-foreground font-medium neon-glow-cyan-static transition-transform hover:scale-105 hover:bg-accent">
                  <RefreshCw className="w-5 h-5" aria-hidden="true" />
                  Swaps
                </button>
              </Link>
              <Link to="/get-started">
                <button className="inline-flex items-center gap-2 text-lg px-8 h-11 rounded-md border border-input bg-background/50 backdrop-blur-sm text-foreground font-medium neon-glow-magenta-static transition-transform hover:scale-105 hover:bg-accent">
                  <Rocket className="w-5 h-5" aria-hidden="true" />
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </BackgroundImage>

      {/* Offerings Section */}
      <section className="container mx-auto px-4 py-20" aria-labelledby="offerings-heading">
        <h2 id="offerings-heading" className="text-3xl md:text-4xl font-bold text-center mb-4">
          One token. Everything.
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Prediction markets, private swaps, anonymous lending, and a censorship-resistant marketplace — all under one roof, all XMR-native.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {offerings.map((offering) => {
            const Icon = offering.icon;
            return (
              <Link key={offering.title} to={offering.href} className="group">
                <div className="h-full border border-border/50 bg-card/50 backdrop-blur rounded-lg p-6 transition-all hover:border-primary/40 hover:bg-card/80">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors" aria-hidden="true">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{offering.title}</h3>
                  <p className="text-muted-foreground text-sm">{offering.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Features / Pillars Section */}
      <section className="container mx-auto px-4 py-20 border-t border-border/30" aria-labelledby="features-heading">
        <h2 id="features-heading" className="sr-only">Key Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <div key={index} className="border border-border/50 bg-card/50 backdrop-blur rounded-lg p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4" aria-hidden="true">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{pillar.title}</h3>
                <p className="text-muted-foreground text-sm">{pillar.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 rounded-lg">
          <div className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Access the permissionless economy today.
            </p>
            <Link to="/get-started">
              <button className="inline-flex items-center gap-2 text-base px-6 h-11 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* SEO Rich Text Section */}
      <SEORichText 
        title="0xNull Marketplace | Anonymous Crypto Marketplace & Prediction Markets"
        content="<p>0xNull Marketplace is a privacy-first, anonymous cryptocurrency marketplace built for users who want full financial privacy and access to no-KYC prediction markets. Designed around anonymity and censorship resistance, 0xNull lets users interact, trade, and make predictions without accounts, identity verification, or personal data exposure.</p><p>At its core, 0xNull combines an anonymous marketplace with privacy-preserving prediction markets covering sports, esports, and crypto. All predictions are made without KYC requirements and settled using privacy-focused cryptocurrencies like Monero, ensuring transactions remain confidential and untraceable.</p><p>Unlike traditional platforms, 0xNull does not track users, collect personal information, or rely on centralized intermediaries. Payments and interactions are crypto-native, allowing users to participate freely in markets, access digital goods and services, or explore prediction opportunities while maintaining full control over their privacy.</p><p>Beyond prediction markets, the 0xNull ecosystem includes anonymous services such as VPS hosting, crypto swaps, and digital utilities—each aligned with the same privacy-first principles. Whether you're placing a prediction, purchasing a service, or swapping assets, anonymity remains the default.</p><p>Explore the 0xNull Marketplace to access no-KYC prediction markets and anonymous crypto services—built for users who value privacy above all else.</p>"
      />
      </main>

      <Footer />
      <SiteAssistant />
    </div>
  );
};

export default Index;
