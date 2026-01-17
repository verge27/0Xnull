import { Link } from 'react-router-dom';
import { Target, Zap, BarChart3, Lock, ArrowRight, TrendingUp, ExternalLink, Rocket, Gamepad2, Trophy, Swords } from 'lucide-react';
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
  
  const features = [
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
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                7/10
              </Badge>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                Verified on KYCNOT.ME
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </a>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight drop-shadow-lg">
              Scan. Send. Bet.
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto drop-shadow-md">
              Anonymous prediction markets for sports and esports. XMR only. 0.4% rake on winnings only. Unopposed money returned.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/get-started">
                <Button size="lg" className="gap-2 text-lg px-8 neon-glow-primary transition-transform hover:scale-105">
                  <Rocket className="w-5 h-5" aria-hidden="true" />
                  Get Started
                </Button>
              </Link>
              <Link to="/esports-predictions">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8 bg-background/50 backdrop-blur-sm neon-glow-magenta-static transition-transform hover:scale-105">
                  <Gamepad2 className="w-5 h-5" aria-hidden="true" />
                  eSports
                </Button>
              </Link>
              <Link to="/sports-predictions">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8 bg-background/50 backdrop-blur-sm neon-glow-cyan-static transition-transform hover:scale-105">
                  <Trophy className="w-5 h-5" aria-hidden="true" />
                  Sports
                </Button>
              </Link>
              <Link to="/predictions/sports/combat">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8 bg-background/50 backdrop-blur-sm neon-glow-magenta-static transition-transform hover:scale-105">
                  <Swords className="w-5 h-5" aria-hidden="true" />
                  Combat
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </BackgroundImage>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20" aria-labelledby="features-heading">
        <h2 id="features-heading" className="sr-only">Key Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4" aria-hidden="true">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Pick a Market</h3>
                <p className="text-muted-foreground">
                  Browse sports, esports, combat and crypto price predictions. Choose YES or NO on the outcome you believe in.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Scan & Send XMR</h3>
                <p className="text-muted-foreground">
                  Get a unique deposit address. Scan the QR with your Monero wallet. One confirmation and you're in.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Get Paid Automatically</h3>
                <p className="text-muted-foreground">
                  Winners split the pool when the market resolves. Payouts sent instantly to your wallet — no withdrawal requests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/20">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Access the permissionless economy today.
            </p>
            <Link to="/get-started">
              <Button size="lg" className="gap-2">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
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
