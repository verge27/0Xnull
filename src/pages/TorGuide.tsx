import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Globe, Lock, Eye, ExternalLink, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const TorGuide = () => {
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

        {/* For Users in Restricted Countries */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              For Users in Restricted Countries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              If Tor is blocked in your country (China, Iran, Russia, etc.):
            </p>
            
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
