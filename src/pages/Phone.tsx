import { Phone as PhoneIcon, MessageSquare, Wifi, Shield, ExternalLink, Zap, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import esimBackground from '@/assets/esim-background.png';

const AFFILIATE_BASE = "https://lnvpn.net";
const REF = "?ref=syndicate";

const features = [
  { icon: "🔒", title: "No KYC", description: "No identity verification. No email. No account. Just pay and use." },
  { icon: "⚡", title: "Instant Activation", description: "Services activate immediately after payment confirmation" },
  { icon: "🌍", title: "Global Coverage", description: "Phone numbers and eSIMs for dozens of countries" },
  { icon: "💰", title: "Crypto Only", description: "Lightning, Bitcoin, Monero, USDT/USDC accepted" }
];

const services = [
  {
    icon: MessageSquare,
    title: "Disposable Numbers",
    badge: "One-Time Use",
    description: "Get a phone number for 20 minutes to receive SMS verification codes. Perfect for one-time signups where you don't want to expose your real number.",
    features: ["20-minute validity window", "Choose specific service (Telegram, WhatsApp, etc.)", "Automatic refund if SMS not received", "Multiple countries available"],
    pricing: [{ label: "Per verification", value: "~$0.50 - $2.00", note: "Varies by service/country" }],
    ctaText: "Get Disposable Number",
    ctaUrl: `${AFFILIATE_BASE}/phone-numbers${REF}`
  },
  {
    icon: PhoneIcon,
    title: "Rental Numbers",
    badge: "3 Months",
    description: "Rent a phone number for 3 months. Receive SMS from any sender - services, banks, friends. Access via unique code, no app needed.",
    features: ["3-month rental period", "Receive SMS from any source", "Works with WhatsApp, Signal, Telegram", "Web-based inbox (unique code access)", "UK, US and other countries"],
    pricing: [{ label: "UK Number (3 months)", value: "~$12.00" }, { label: "US Number (3 months)", value: "~$15.00" }],
    ctaText: "Rent Phone Number",
    ctaUrl: `${AFFILIATE_BASE}/phone-numbers${REF}`
  },
  {
    icon: Wifi,
    title: "Data eSIM",
    badge: "Global",
    description: "Prepaid data eSIMs for travel or privacy. Install via QR code, no physical SIM needed. Data-only (no voice/SMS number included).",
    features: ["Instant QR code delivery", "Hotspot/tethering supported", "Global coverage (100+ countries)", "Top up anytime", "No account required"],
    pricing: [{ label: "Starting from", value: "$0.99" }, { label: "Data packages", value: "1GB - 100GB" }],
    ctaText: "Get eSIM",
    ctaUrl: `${AFFILIATE_BASE}/esim${REF}`
  },
  {
    icon: Shield,
    title: "No-Log VPN",
    badge: "WireGuard",
    description: "Privacy-focused VPN using WireGuard. Keys generated in your browser, no account needed. Multiple server locations.",
    features: ["WireGuard protocol", "Browser-based key generation", "Strict no-log policy", "Multiple countries", "Flexible durations"],
    pricing: [{ label: "1 Hour", value: "$0.10" }, { label: "1 Day", value: "$0.50" }, { label: "1 Month", value: "$4.00" }],
    ctaText: "Get VPN Access",
    ctaUrl: `${AFFILIATE_BASE}/vpn${REF}`
  }
];

const useCases = [
  { icon: "📧", title: "Service Signups", description: "Register for services without exposing your real phone number. Avoid spam and protect your privacy." },
  { icon: "✈️", title: "Travel Connectivity", description: "Stay connected abroad with data eSIMs. No roaming charges, no local SIM hassle." },
  { icon: "🔐", title: "Secure Messaging", description: "Create Signal, WhatsApp or Telegram accounts with anonymous numbers." },
  { icon: "🧪", title: "Testing & Development", description: "QA testing that requires phone verification. Dev environments needing SMS." },
  { icon: "🏢", title: "Business Separation", description: "Keep business and personal communications separate without multiple contracts." },
  { icon: "🛡️", title: "General Privacy", description: "Reduce your digital footprint. Keep your real number off marketing databases." }
];

const Phone = () => {
  useSEO();
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${esimBackground})`, zIndex: -2 }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-background/40 via-background/50 to-background/70" style={{ zIndex: -1 }} />
      
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Zap className="h-3 w-3 mr-1" />
              Monero & Lightning Accepted
            </Badge>
            <h1 className="text-4xl font-bold mb-3">Anonymous Phone & eSIM</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
              Disposable phone numbers for verification. Data eSIMs for global connectivity. No KYC, no accounts, pay with crypto.
            </p>
            <p className="text-sm text-muted-foreground">
              Powered by{" "}
              <a href={`${AFFILIATE_BASE}${REF}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                LNVPN
              </a>
              {" • Privacy-first since day one"}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {features.map((feature, idx) => (
              <Card key={idx} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Services */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-2">Choose Your Service</h2>
            <p className="text-muted-foreground text-center mb-8">All services are provided via LNVPN's privacy-focused infrastructure</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <Card key={idx} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="secondary">{service.badge}</Badge>
                      </div>
                      <CardTitle className="mt-4">{service.title}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {service.features.map((feature, i) => (
                          <li key={i} className="flex items-start text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      <div className="border-t pt-4 space-y-2">
                        {service.pricing.map((price, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{price.label}</span>
                              <span className="font-semibold">{price.value}</span>
                            </div>
                            {'note' in price && price.note && (
                              <p className="text-xs text-muted-foreground">{price.note}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <Button className="w-full" asChild>
                        <a href={service.ctaUrl} target="_blank" rel="noopener noreferrer">
                          <Zap className="h-4 w-4 mr-2" />
                          {service.ctaText}
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Use Cases */}
          <Card className="bg-secondary/30 mb-12">
            <CardHeader>
              <CardTitle className="text-center">Common Use Cases</CardTitle>
              <CardDescription className="text-center">How clients use these services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {useCases.map((useCase, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-background/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{useCase.icon}</span>
                      <h3 className="font-semibold">{useCase.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{useCase.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <div className="text-center mb-12">
            <h3 className="text-lg font-semibold mb-4">Accepted Payment Methods</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="outline" className="text-sm py-2 px-4">⚡ Lightning</Badge>
              <Badge variant="outline" className="text-sm py-2 px-4">₿ Bitcoin</Badge>
              <Badge variant="outline" className="text-sm py-2 px-4">ɱ Monero</Badge>
              <Badge variant="outline" className="text-sm py-2 px-4">₮ USDT/USDC</Badge>
            </div>
          </div>

          {/* Important Notes */}
          <Card className="mb-12 border-orange-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-500">
                <AlertTriangle className="h-5 w-5" />
                Important Limitations
              </CardTitle>
              <CardDescription>Please be aware of these limitations before purchasing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span><strong>Google Verification:</strong> Disposable numbers often don't work for Google account verification due to recycled/VoIP detection.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span><strong>eSIMs are data-only:</strong> No phone number or SMS capability included - use VoIP apps for calls/texts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span><strong>No refunds on rental numbers:</strong> Once purchased, rental numbers cannot be refunded even if a specific service blocks them.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span><strong>Service-specific blocks:</strong> Some services actively block virtual numbers. Test with disposable first.</span>
                </li>
              </ul>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Tips for Success
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• For Telegram/Signal/WhatsApp: Rental numbers work best</li>
                  <li>• For one-time verifications: Use disposable numbers (auto-refund if SMS fails)</li>
                  <li>• Enable JavaScript for payment gateway to load</li>
                  <li>• Save your rental number access code securely</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* SIM Hosting */}
          <Card className="bg-secondary/30">
            <CardContent className="py-8">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-start gap-3 mb-6">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Need to Keep Your Existing SIM Active Abroad?</h2>
                    <Badge variant="outline">Different Service</Badge>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6">
                  The services above (LNVPN) provide virtual phone numbers and data eSIMs. 
                  If you need to keep your existing physical SIM card active whilst travelling or living abroad, that's a different use case: <strong>SIM hosting</strong>.
                </p>

                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold">How SIM Hosting Works</h3>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>You mail your physical SIM card to the hosting provider's secure facility</li>
                    <li>They insert it into a modem in a data centre (in your SIM's home country)</li>
                    <li>Your SIM stays "active" on the network - no roaming, no foreign usage flags</li>
                    <li>You access SMS and calls via web portal or forwarded to email</li>
                    <li>If your plan includes data, you can tunnel through it (acts like you're at home)</li>
                  </ol>
                </div>

                <div className="p-4 rounded-lg border bg-background/50">
                  <h4 className="font-semibold mb-2">Recommended Provider: LTESocks</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    LTESocks specialises in SIM hosting for travellers and expats who need to maintain their home mobile presence.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-primary" />
                      Accepts crypto (BTC, USDT, ETH, LTC)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-primary" />
                      SMS forwarding to email/web
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-primary" />
                      Mobile internet via your SIM's tariff
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-primary" />
                      Data centre redundancy
                    </li>
                  </ul>
                  <Button variant="outline" asChild>
                    <a href="https://ltesocks.com" target="_blank" rel="noopener noreferrer">
                      Visit LTESocks SIM Hosting
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground mt-4">
                  This is a recommendation only. We have no affiliate relationship with LTESocks and receive no compensation for referrals.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Phone;
