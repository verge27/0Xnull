import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Globe, Lock, Eye, ExternalLink, Download, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const TorGuide = () => {
  useSEO();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4">
            <Shield className="w-3 h-3 mr-1" />
            Privacy Guide
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Accessing 0xNull Privately</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Protect your browsing with Tor for complete anonymity
          </p>
        </div>

        {/* Direct .onion Access */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Direct .onion Access
              <Badge className="ml-2">Recommended</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
              <li>
                Download Tor Browser from{' '}
                <a 
                  href="https://www.torproject.org/download/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  torproject.org
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Open Tor Browser</li>
              <li>Navigate to our .onion address:</li>
            </ol>
            
            <div className="bg-muted/50 border border-border rounded-lg p-4 font-mono text-sm break-all">
              http://onullluix4iaj77wbqf52dhdiey4kaucdoqfkaoolcwxvcdxz5j6duid.onion
            </div>
            
            <p className="text-muted-foreground">Bookmark it - you're done!</p>
          </CardContent>
        </Card>

        {/* Clearnet via Tor */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Clearnet via Tor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Open Tor Browser</li>
              <li>
                Go to{' '}
                <span className="text-foreground font-medium">https://0xnull.io</span>
              </li>
              <li>Works normally, just slower</li>
            </ol>
          </CardContent>
        </Card>

        {/* If Tor Doesn't Work */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              If Tor Doesn't Work Where You Live
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                Use Tor Bridges:
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                <li>Open Tor Browser → Settings → Connection → Bridges</li>
                <li>Select "Request a bridge" or use built-in bridges</li>
                <li>
                  Recommended: <span className="text-foreground font-medium">obfs4</span> (looks like random noise) or{' '}
                  <span className="text-foreground font-medium">Snowflake</span> (looks like video calls)
                </li>
              </ol>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                Alternative: VPN + Tor
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                <li>Connect to VPN first</li>
                <li>Then open Tor Browser</li>
                <li>Access 0xNull via .onion or clearnet</li>
              </ol>
              <p className="text-sm text-muted-foreground ml-4">
                Need a VPN?{' '}
                <Link to="/vpn-resources" className="text-primary hover:underline">
                  Check our VPN recommendations →
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Why Use Tor */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Why Use Tor?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <span>Your ISP cannot see you're accessing 0xNull</span>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <span>No IP address logged on our end</span>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <span>Combined with XMR payments = complete financial privacy</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Never access personal accounts in the same Tor session</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Don't resize the browser window (prevents fingerprinting)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="font-medium text-foreground">
                  For maximum privacy: Tor + XMR + no account = untraceable
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">What do I do if an onion link will not open?</h4>
              <p className="text-sm text-muted-foreground">
                First make sure you are using Tor Browser and not a regular browser. Check that the address ends in .onion and is typed correctly. If the site still fails to load, try requesting a new circuit in Tor Browser (click the lock icon in the address bar and choose "New Circuit for this Site"). Some services are intermittent, so waiting a few minutes and retrying often helps. If you are on a censored network, configure a bridge under Settings → Connection → Bridges.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">How do I verify I am really in Tor Browser?</h4>
              <p className="text-sm text-muted-foreground">
                The window title should say "Tor Browser". The address bar shows a small Tor icon next to the lock and a separate .onion circuit indicator. You can also visit{' '}
                <a
                  href="https://check.torproject.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  check.torproject.org
                  <ExternalLink className="w-3 h-3" />
                </a>{' '}
                which will confirm whether your traffic is routing through the Tor network. If you see a standard browser interface, you are not protected by Tor.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Can I use a normal browser with a Tor proxy or VPN instead?</h4>
              <p className="text-sm text-muted-foreground">
                A normal browser cannot open .onion links even with a VPN. Tor Browser is required because it includes the built-in Tor client and anti-fingerprinting protections. A VPN hides your traffic from your ISP but does not provide the onion-routing or browser-level hardening that makes Tor links work safely.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Download CTA */}
        <div className="text-center">
          <a
            href="https://www.torproject.org/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download Tor Browser
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TorGuide;
