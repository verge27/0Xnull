import { Shield, ExternalLink, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const vpnServices = [
  {
    name: "Cryptostorm",
    url: "https://kycnot.me/service/cryptostorm",
    description: "Privacy-hardened VPN service with token-based authentication and no logging",
    features: ["Guaranteed no KYC", "Verified service", "Strict no-log policy", "Token-based authentication", "No account creation needed", "Cryptocurrency payments", "Open-source tools", "Has Onion or I2P URLs"],
    rating: "Excellent Privacy"
  },
  {
    name: "Xeovo",
    url: "https://kycnot.me/service/xeovo",
    description: "Protect your privacy and bypass restrictions with Xeovo VPN and stealth proxies. Self-funded VPN company based in Finland. In operation since 2016.",
    features: ["Guaranteed no KYC", "Verified service", "Identity-free registration", "Strict no-log policy", "Accepts Monero payments", "Onion URL available", "Mature service since 2016"],
    rating: "Excellent Privacy"
  },
  {
    name: "Mullvad",
    url: "https://kycnot.me/service/mullvad",
    description: "Privacy-focused VPN with anonymous accounts and payment options including cash and cryptocurrency",
    features: ["Guaranteed no KYC", "Verified service", "Identity-free registration", "Strict no-log policy", "No personal data required", "Cash payment accepted", "Accepts Monero payments", "Open-source clients", "WireGuard & OpenVPN support", "Has Onion or I2P URLs", "Mature service"],
    rating: "Excellent Privacy"
  },
  {
    name: "NymVPN",
    url: "https://kycnot.me/service/nymvpn",
    description: "Next-generation mixnet VPN providing enhanced anonymity through multi-hop routing",
    features: ["No KYC mention", "Mixnet technology", "Multi-hop routing", "Cryptocurrency payments", "Enhanced metadata protection", "Open-source code", "Decentralised network"],
    rating: "Advanced Privacy"
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
                <Card key={index} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          {vpn.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{vpn.rating}</Badge>
                        <Button variant="outline" size="sm" asChild>
                          <a href={vpn.url} target="_blank" rel="noopener noreferrer">
                            View on KYCNOT.ME
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="mt-2">{vpn.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
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
