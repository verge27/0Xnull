import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle, Lock, Eye, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
const safetyBackground = '/images/backgrounds/safety-background.webp';

const HarmReduction = () => {
  useSEO();
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background image - using img for better optimization */}
      <div className="fixed inset-0" style={{ zIndex: -2 }}>
        <img 
          src={safetyBackground} 
          alt="" 
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover"
          fetchPriority="high"
        />
      </div>
      <div className="fixed inset-0 bg-gradient-to-b from-background/40 via-background/50 to-background/70" style={{ zIndex: -1 }} />
      
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            What is <span className="text-gradient">0xNull Marketplace</span>?
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A privacy-focused marketplace for grey market goods, embarrassing purchases, and items you'd rather keep private — <strong>not</strong> for illegal activity.
          </p>
        </div>

        {/* What We're For */}
        <Card className="mb-8 border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              What 0xNull Marketplace Is For
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Grey Market Goods</h4>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  <li>• Research peptides & nootropics</li>
                  <li>• Privacy tools & services</li>
                  <li>• Crypto-native products</li>
                  <li>• Import/export restricted items</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Privacy-Preferred Purchases</h4>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  <li>• Adult products & lingerie</li>
                  <li>• Health & wellness items</li>
                  <li>• Anything you'd rather not appear on bank statements</li>
                  <li>• Gifts you want to keep secret</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert className="mb-8 border-destructive/50">
          <XCircle className="h-4 w-4 text-destructive" />
          <AlertTitle>What We're NOT</AlertTitle>
          <AlertDescription>
            0xNull Marketplace is not a darknet marketplace. We don't facilitate illegal drugs, weapons, stolen data or any illegal services. 
            If that's what you're looking for, this isn't the place.
          </AlertDescription>
        </Alert>

        {/* Tabs for Dark Web Education */}
        <Tabs defaultValue="overview" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="links">Verified Links</TabsTrigger>
            <TabsTrigger value="scams">Spotting Scams</TabsTrigger>
            <TabsTrigger value="opsec">OpSec</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Dark Web Harm Reduction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Whether you're curious about the dark web or already navigate it, understanding safety fundamentals 
                  can protect you from scams, phishing and worse. This guide is educational — not an endorsement of illegal activity.
                </p>
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">General Principles</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• If it seems too good to be true, it is</li>
                    <li>• Assume everything is compromised until proven otherwise</li>
                    <li>• Verify before you trust — use community feedback</li>
                    <li>• The paranoid survive</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-primary" />
                  Verified Starting Points
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-b border-border pb-4">
                  <h4 className="font-semibold text-lg">dark.fail</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    The gold standard for verified .onion links. PGP-verified, real-time uptime monitoring. Set it as your Tor homepage.
                  </p>
                  <div className="bg-secondary/50 p-3 rounded-lg font-mono text-xs space-y-1">
                    <div><span className="text-muted-foreground">Clearnet:</span> https://dark.fail</div>
                    <div><span className="text-muted-foreground">Onion:</span> darkfailenbsdla5mal2mxn2uz66od5vtzd5qozslagrfzachha3f3id.onion</div>
                  </div>
                </div>

                <div className="border-b border-border pb-4">
                  <h4 className="font-semibold text-lg">Dread</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    The Reddit of the dark web. Verify marketplace legitimacy, read vendor reviews, check for scam reports before using any service.
                  </p>
                  <div className="bg-secondary/50 p-3 rounded-lg font-mono text-xs">
                    <div><span className="text-muted-foreground">Onion:</span> dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-lg">Ahmia</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Search engine for .onion sites. Filters out abuse material. Good for discovery.
                  </p>
                  <div className="bg-secondary/50 p-3 rounded-lg font-mono text-xs space-y-1">
                    <div><span className="text-muted-foreground">Clearnet:</span> https://ahmia.fi</div>
                    <div><span className="text-muted-foreground">Onion:</span> juhanurmihxlp77nkq76byazcldy2hlmovfu2epvl5ankdibsot4csyd.onion</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scams" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Red Flags — How to Spot Scams & LE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      title: "Too clean, too fast",
                      desc: "Most legitimate marketplaces are under constant DDOS. If a site loads perfectly with slick design, be suspicious."
                    },
                    {
                      title: "Pre-stamped credit cards don't exist",
                      desc: "Anyone selling them is scamming you. Period."
                    },
                    {
                      title: "New vendors with perfect reviews",
                      desc: "Fake. Established vendors have transaction history with mixed feedback."
                    },
                    {
                      title: "Phishing links everywhere",
                      desc: "Always verify .onion addresses through dark.fail or Dread. Never trust links from random sources."
                    },
                    {
                      title: "Exit scams",
                      desc: "Marketplaces disappear with escrow funds. Don't leave large balances sitting."
                    }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opsec" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Operational Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {[
                    "Tails OS on a USB — not your daily machine",
                    "Tor Browser only — never access via clearnet",
                    "Disable JavaScript",
                    "PGP verify all communications and marketplace links",
                    "Never reuse usernames or passwords across sites",
                    "Monero over Bitcoin — no transparent blockchain trail",
                    "Don't access personal accounts (email, social) on the same session"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-secondary/50 p-3 rounded-lg">
                      <Eye className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default HarmReduction;
