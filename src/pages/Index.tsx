import { Link } from 'react-router-dom';
import { Key, ArrowRight, ExternalLink, Rocket, FileText } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SiteAssistant } from '@/components/SiteAssistant';
import { SEORichText } from '@/components/SEORichText';
import { useSEO } from '@/hooks/useSEO';
import { BackgroundImage } from '@/components/OptimizedImage';
import { useVoucherFromUrl } from '@/hooks/useVoucher';
import { RelatedGuides } from '@/components/RelatedGuides';
import { ServiceCatalog } from '@/components/ServiceCatalog';
import { OnboardingStrip } from '@/components/OnboardingStrip';
import { TrustGrid } from '@/components/TrustGrid';


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

const tokenFacts = [
  {
    label: 'Issued instantly',
    body: 'A 0xn_ token is a 64-character bearer string. No email, no password, no recovery question.',
  },
  {
    label: 'Funded in Monero',
    body: 'Send XMR to the address the token generates. The balance shows in USD after one confirmation.',
  },
  {
    label: 'Metered per use',
    body: 'Every service draws down the same balance. Rate limits attach to the token, not your IP.',
  },
  {
    label: 'Lose it, lose access',
    body: 'There is nothing on our side that could prove the token was yours. Save it before you fund it.',
  },
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
        
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
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
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight drop-shadow-lg">
              <span aria-hidden="true">Join the Quiet Riot</span>
              <span className="sr-only">0xNull — one anonymous token for every private service</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto drop-shadow-md">
              0xNull is one anonymous credential — a <span className="font-mono text-foreground">0xn_</span> token — funded in Monero and spent across every service. No accounts, no signup.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/dashboard">
                <button className="inline-flex items-center gap-2 text-lg px-8 h-11 rounded-md bg-primary text-primary-foreground font-medium neon-glow-primary transition-transform hover:scale-105 hover:bg-primary/90">
                  <Key className="w-5 h-5" aria-hidden="true" />
                  Get a token
                </button>
              </Link>
              <a href="#catalog">
                <button className="inline-flex items-center gap-2 text-lg px-8 h-11 rounded-md border border-input bg-background/50 backdrop-blur-sm text-foreground font-medium neon-glow-cyan-static transition-transform hover:scale-105 hover:bg-accent">
                  <Rocket className="w-5 h-5" aria-hidden="true" />
                  See what it unlocks
                </button>
              </a>
              <Link to="/docs">
                <button className="inline-flex items-center gap-2 text-lg px-8 h-11 rounded-md border border-input bg-background/50 backdrop-blur-sm text-foreground font-medium neon-glow-magenta-static transition-transform hover:scale-105 hover:bg-accent">
                  <FileText className="w-5 h-5" aria-hidden="true" />
                  How it works
                </button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              <Link to="/buy" className="hover:text-foreground transition-colors underline underline-offset-4 decoration-muted-foreground/40">
                No Monero yet? Buy it without an ID →
              </Link>
            </p>
          </div>
        </div>
      </BackgroundImage>

      {/* Token explainer */}
      <section className="container mx-auto px-4 py-20" aria-labelledby="token-heading">
        <div className="max-w-2xl mb-10">
          <h2 id="token-heading" className="text-3xl md:text-4xl font-bold mb-4">
            Issued instantly, funded in XMR, spent everywhere
          </h2>
          <p className="text-muted-foreground">
            The token is the product. Everything else is something it unlocks. Whoever holds the string holds the balance, and nobody — including us — can connect it to a person.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tokenFacts.map((fact) => (
            <div key={fact.label} className="rounded-lg border border-border/60 bg-card/50 backdrop-blur p-6">
              <h3 className="font-semibold mb-2">{fact.label}</h3>
              <p className="text-sm text-muted-foreground">{fact.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm">
          <Link to="/docs#token" className="text-primary hover:underline">
            Full token mechanics: issuance, balances, refills and rate limits →
          </Link>
        </p>
      </section>

      {/* Onboarding strip */}
      <section className="container mx-auto px-4 py-20 border-t border-border/30" aria-labelledby="onboarding-heading">
        <div className="max-w-2xl mb-10">
          <h2 id="onboarding-heading" className="text-3xl md:text-4xl font-bold mb-4">
            Three steps from landing to using
          </h2>
          <p className="text-muted-foreground">
            No form stands between you and the first service. This is the whole path.
          </p>
        </div>
        <OnboardingStrip />
      </section>

      {/* Service catalog */}
      <section id="catalog" className="container mx-auto px-4 py-20 border-t border-border/30 scroll-mt-20" aria-labelledby="catalog-heading">
        <div className="max-w-2xl mb-10">
          <h2 id="catalog-heading" className="text-3xl md:text-4xl font-bold mb-4">
            Service catalog
          </h2>
          <p className="text-muted-foreground">
            What each service does, what it costs and whether it is live. Anonymous metering only works
            if the meter is legible, so the prices sit here rather than behind a quote form.
          </p>
        </div>
        <ServiceCatalog />
      </section>

      {/* Trust */}
      <section className="container mx-auto px-4 py-20 border-t border-border/30" aria-labelledby="trust-heading">
        <div className="max-w-2xl mb-10">
          <h2 id="trust-heading" className="text-3xl md:text-4xl font-bold mb-4">
            Why trust an operator you cannot name
          </h2>
          <p className="text-muted-foreground">
            You should not have to. Each of these replaces a promise with a mechanism you can check.
          </p>
        </div>
        <TrustGrid />
      </section>

      {/* Guides Section */}
      <RelatedGuides
        className="container mx-auto px-4 py-20 border-t border-border/30"
        headingId="guides-heading"
        heading="Start with a guide"
        intro="Practical walkthroughs for the two things people ask us about most: betting on esports privately and renting a server nobody can trace back to you."
      />


      {/* CTA Section */}

      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 rounded-lg">
          <div className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get your token
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Issued instantly, funded in Monero, spent anywhere on the catalog.
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
        content="<p>0xNull Marketplace is a privacy-first, anonymous cryptocurrency marketplace built for users who want full financial privacy and access to no-KYC prediction markets. Designed around anonymity and censorship resistance, 0xNull lets users interact, trade and make predictions without accounts, identity verification or personal data exposure.</p><p>At its core, 0xNull combines an anonymous marketplace with privacy-preserving prediction markets covering sports, esports and crypto. All predictions are made without KYC requirements and settled using privacy-focused cryptocurrencies like Monero, ensuring transactions remain confidential and untraceable.</p><p>Unlike traditional platforms, 0xNull does not track users, collect personal information or rely on centralized intermediaries. Payments and interactions are crypto-native, allowing users to participate freely in markets, access digital goods and services or explore prediction opportunities while maintaining full control over their privacy.</p><p>Beyond prediction markets, the 0xNull ecosystem includes anonymous services such as VPS hosting, crypto swaps and digital utilities—each aligned with the same privacy-first principles. Whether you're placing a prediction, purchasing a service or swapping assets, anonymity remains the default.</p><p>Explore the 0xNull Marketplace to access no-KYC prediction markets and anonymous crypto services—built for users who value privacy above all else.</p>"
      />
      </main>

      <Footer />
      <SiteAssistant />
    </div>
  );
};

export default Index;
