import { Shield, ExternalLink, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const vpnServices = [
  {
    name: "LNVPN",
    url: "https://lnvpn.net/?ref=0xnull",
    description: "Token-style VPN access via Lightning Network and Monero. No account required — mirrors 0xNull's privacy-first model. Also offers eSIM and burner numbers.",
    kycLevel: 0,
    kycNote: "Explicit never",
    acceptsXmr: true,
    xmrNote: null,
    accountType: "None required",
    whyItFits: "Already our partner. Token-style access mirrors 0xNull's model. LN + XMR, $0.50/day, includes eSIM/burner numbers.",
    features: ["Zero KYC ever", "Token-based access", "Lightning Network", "Accepts Monero", "eSIM available", "Burner numbers", "From $0.50/day"],
    rating: "Partner Pick",
    isPartner: true
  },
  {
    name: "Mullvad",
    url: "https://mullvad.net",
    description: "The gold standard in privacy VPNs. Police raid in Sweden found zero user data. 16 years operational with DAITA anti-fingerprinting and Tor collaboration.",
    kycLevel: 1,
    kycNote: null,
    acceptsXmr: true,
    xmrNote: "10% discount",
    accountType: "Numbered only",
    whyItFits: "Gold standard. Police raid in Sweden found nothing. 16 years operational, DAITA anti-fingerprinting, Tor collab.",
    features: ["Numbered accounts only", "10% XMR discount", "Proven no-logs (raided)", "DAITA anti-fingerprinting", "Tor integration", "WireGuard & OpenVPN", "16+ years operational"],
    rating: "Gold Standard"
  },
  {
    name: "Cryptostorm",
    url: "https://cryptostorm.is",
    description: "Philosophically closest to 0xNull's model. Hash a token code, download config, connect. No email, no account, no identifiers whatsoever.",
    kycLevel: 1,
    kycNote: null,
    acceptsXmr: true,
    xmrNote: null,
    accountType: "None — token-based",
    whyItFits: "Philosophically closest to 0xNull's model. Hash a code, download config, connect. No email, no account, no identifiers. Tor/I2P.",
    features: ["Token-based auth", "No account creation", "Hash your own token", "Accepts Monero", "Tor/I2P support", "Open-source tools", "Zero identifiers"],
    rating: "Cypherpunk Choice"
  },
  {
    name: "IVPN",
    url: "https://ivpn.net",
    description: "Open source, independently audited, and fully transparent. Anonymous signup with no personal data required. Slightly pricier but rock-solid reputation.",
    kycLevel: 0,
    kycNote: "Explicit never",
    acceptsXmr: true,
    xmrNote: "+ Lightning",
    accountType: "Anonymous signup",
    whyItFits: "Open source, audited, transparent. Slightly pricier but rock-solid reputation.",
    features: ["Zero KYC ever", "Anonymous signup", "Accepts XMR + Lightning", "Open source", "Independent audits", "Transparent operations", "WireGuard support"],
    rating: "Audited & Trusted"
  }
];

const VpnResources = () => {
  useSEO();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-3">Privacy-First VPN Resources</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
              KYC-free VPN services for privacy-conscious users
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">Focus: No-KYC VPN providers with cryptocurrency support</Badge>
              <Badge variant="outline">Source: Verified through KYCNOT.ME</Badge>
            </div>
          </div>

          {/* Introduction */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle>Why Privacy-First VPNs Matter</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                For privacy-conscious individuals, maintaining operational security requires VPN services that don't compromise user privacy through KYC requirements or invasive data collection.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Key Requirements:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      No personal information or KYC required
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Cryptocurrency payment options
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      No traffic logging policies
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Strong encryption protocols
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Transparent operational practices
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Use Cases:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Protecting personal browsing from monitoring
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Accessing geo-restricted content
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Enhanced security on public networks
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Privacy-preserving research and browsing
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* VPN Services */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Recommended VPN Services</h2>
            <div className="grid gap-6">
              {vpnServices.map((vpn, index) => (
                <Card key={index} className={`hover:border-primary/50 transition-colors ${vpn.isPartner ? 'border-primary/30 bg-primary/5' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          {vpn.name}
                          {vpn.isPartner && <Badge className="bg-primary text-primary-foreground">Partner</Badge>}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">{vpn.rating}</Badge>
                        <Button variant="outline" size="sm" asChild>
                          <a href={vpn.url} target="_blank" rel="noopener noreferrer">
                            Visit {vpn.name}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="mt-2">{vpn.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                      <div className="p-2 rounded bg-secondary/50">
                        <div className="text-muted-foreground text-xs">KYC Level</div>
                        <div className="font-semibold flex items-center gap-1">
                          {vpn.kycLevel === 0 ? (
                            <span className="text-primary">None</span>
                          ) : (
                            <span className="text-muted-foreground">Minimal</span>
                          )}
                          {vpn.kycNote && <span className="text-xs text-muted-foreground">({vpn.kycNote})</span>}
                        </div>
                      </div>
                      <div className="p-2 rounded bg-secondary/50">
                        <div className="text-muted-foreground text-xs">Accepts XMR</div>
                        <div className="font-semibold text-primary">
                          ✓ Yes {vpn.xmrNote && <span className="text-xs text-muted-foreground">({vpn.xmrNote})</span>}
                        </div>
                      </div>
                      <div className="p-2 rounded bg-secondary/50 col-span-2">
                        <div className="text-muted-foreground text-xs">Account</div>
                        <div className="font-semibold">{vpn.accountType}</div>
                      </div>
                    </div>
                    
                    {/* Why it fits */}
                    <div className="p-3 rounded bg-primary/5 border border-primary/20 mb-4">
                      <div className="text-xs text-primary font-medium mb-1">Why it fits 0xNull:</div>
                      <p className="text-sm text-muted-foreground">{vpn.whyItFits}</p>
                    </div>
                    
                    <h4 className="text-sm font-semibold mb-3">Key Features:</h4>
                    <div className="flex flex-wrap gap-2">
                      {vpn.features.map((feature, featureIndex) => (
                        <Badge key={featureIndex} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Additional Resources */}
          <Card className="bg-secondary/30">
            <CardContent className="py-8">
              <h3 className="text-lg font-bold mb-4">Additional Resources</h3>
              <div className="p-4 rounded-lg border bg-background/50">
                <h4 className="font-semibold mb-2">KYCNOT.ME</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Comprehensive directory of KYC-free services including VPNs, exchanges, wallets and more.
                </p>
                <Button variant="outline" asChild>
                  <a href="https://kycnot.me" target="_blank" rel="noopener noreferrer">
                    Visit KYCNOT.ME
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-6">
                Note: Always conduct your own due diligence when selecting VPN services. This list represents services that meet basic privacy criteria but does not constitute an endorsement or guarantee of service quality.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VpnResources;
