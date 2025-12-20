import { Link } from 'react-router-dom';
import { Target, Zap, BarChart3, Lock, ArrowRight, TrendingUp, ExternalLink, Rocket, Gamepad2, Trophy, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SiteAssistant } from '@/components/SiteAssistant';
import predictionsBackground from '@/assets/predictions-hero-background.png';

const Index = () => {
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
      title: '0.4% Rake Only',
      description: 'Lowest fees in the industry. No house edge — you bet against other users.'
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
      
      {/* Hero Section with Background */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={predictionsBackground} 
            alt="" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" />
        </div>
        
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
              Anonymous prediction markets for sports and esports. XMR only. 0.4% rake. Winners always get paid.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/get-started">
                <Button size="lg" className="gap-2 text-lg px-8 shadow-lg animate-neon-pulse">
                  <Rocket className="w-5 h-5" />
                  Get Started
                </Button>
              </Link>
              <Link to="/esports-predictions">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8 shadow-lg bg-background/50 backdrop-blur-sm animate-neon-glow-magenta">
                  <Gamepad2 className="w-5 h-5" />
                  eSports
                </Button>
              </Link>
              <Link to="/sports-predictions">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8 shadow-lg bg-background/50 backdrop-blur-sm animate-neon-glow-cyan" style={{ animationDelay: '0.5s' }}>
                  <Trophy className="w-5 h-5" />
                  Sports
                </Button>
              </Link>
              <Link to="/predictions/sports/combat">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8 shadow-lg bg-background/50 backdrop-blur-sm animate-neon-glow-magenta" style={{ animationDelay: '1s' }}>
                  <Swords className="w-5 h-5" />
                  Combat
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
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
                <h3 className="text-xl font-semibold mb-2">Pick a Market</h3>
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
                <h3 className="text-xl font-semibold mb-2">Scan & Send XMR</h3>
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
                <h3 className="text-xl font-semibold mb-2">Get Paid Automatically</h3>
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

      <Footer />
      <SiteAssistant />
    </div>
  );
};

export default Index;
