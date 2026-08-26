import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, Globe, Lock, Settings, ExternalLink, Download, HelpCircle, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { I2P_ADDRESS, I2P_URL, PRIVATE_NETWORK_MIRRORS } from '@/lib/privateNetworks';

const i2pMirror = PRIVATE_NETWORK_MIRRORS.find((m) => m.network === 'i2p')!;

const I2pGuide = () => {
  useSEO();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(I2P_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4">
            <Network className="w-3 h-3 mr-1" aria-hidden="true" />
            Privacy Guide
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Accessing 0xNull over I2P</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            I2P is a peer-to-peer privacy network. Traffic is routed between participating
            routers rather than sent directly to a public web server.
          </p>
        </div>

        {/* Address */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" aria-hidden="true" />
              Our I2P address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2 bg-muted/50 border border-border rounded-lg p-4">
              <code className="font-mono text-sm break-all flex-1">{I2P_URL}</code>
              <Button size="sm" variant="ghost" onClick={copyAddress} className="gap-1.5 shrink-0">
                {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              An address ending in .i2p requires a running I2P router on your machine. It will not
              normally open in Tor Browser or in an ordinary unconfigured browser, because those
              browsers have no route into the I2P network.
            </p>
            <p className="text-sm text-muted-foreground">{i2pMirror.predictionsNotice}</p>
          </CardContent>
        </Card>

        {/* Step 1 install */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" aria-hidden="true" />
              Step 1 — install an I2P router
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Two official implementations are available. Install one of them, not both.
            </p>
            <ul className="space-y-3 text-muted-foreground">
              <li>
                <span className="text-foreground font-medium">I2P (Java)</span> — the reference
                router, with installers for Windows, macOS, Linux and Android.{' '}
                <a
                  href="https://geti2p.net/en/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  geti2p.net/en/download
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              </li>
              <li>
                <span className="text-foreground font-medium">i2pd (C++)</span> — a lighter
                implementation, often preferred on servers and low-powered devices.{' '}
                <a
                  href="https://i2pd.website/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  i2pd.website
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>{' '}
                (
                <a
                  href="https://i2pd.readthedocs.io/en/latest/user-guide/install/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  installation docs
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
                )
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Step 2 bootstrap */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" aria-hidden="true" />
              Step 2 — let the router bootstrap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Start the router and leave it running. On first launch it has to find peers and build
              tunnels, which commonly takes several minutes. The Java router shows its progress in
              the console at{' '}
              <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">http://127.0.0.1:7657</code>;
              i2pd shows the same information in its web console at{' '}
              <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">http://127.0.0.1:7070</code>.
            </p>
            <p>
              Sites will fail to resolve until the router reports that it is integrated into the
              network, so wait for that before trying the address.
            </p>
          </CardContent>
        </Card>

        {/* Step 3 browser */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" aria-hidden="true" />
              Step 3 — point a browser profile at the local proxy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Create a separate browser profile that you use only for I2P.</li>
              <li>
                Set its HTTP proxy to{' '}
                <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">127.0.0.1:4444</code>,
                which is the router's default HTTP proxy port.
              </li>
              <li>Do not send .i2p requests through any other proxy or DNS resolver.</li>
              <li>Open the address above in that profile, then bookmark it.</li>
            </ol>
            <p className="text-sm text-muted-foreground">
              The official browser-configuration instructions cover each browser in detail:{' '}
              <a
                href="https://geti2p.net/en/about/browser-config"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                geti2p.net browser configuration
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
              .
            </p>
          </CardContent>
        </Card>

        {/* How it differs */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" aria-hidden="true" />
              How I2P differs from Tor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold" aria-hidden="true">•</span>
                <span>
                  I2P is peer-to-peer: your router carries traffic for other participants as well as
                  your own and addressing is internal to the network.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold" aria-hidden="true">•</span>
                <span>
                  Tor is designed around a browser bundle and also reaches the clearnet through exit
                  nodes. I2P is designed mainly for services hosted inside the network itself.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold" aria-hidden="true">•</span>
                <span>
                  The two networks are separate. A .i2p address will not open over Tor and a .onion
                  address will not open through the I2P proxy.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold" aria-hidden="true">•</span>
                <span>
                  Prefer Tor instead?{' '}
                  <Link to="/tor-guide" className="text-primary hover:underline">
                    Read the Tor guide →
                  </Link>
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" aria-hidden="true" />
              Frequently asked questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <h2 className="font-semibold text-foreground text-base">Why will the address not open in my normal browser?</h2>
              <p className="text-sm text-muted-foreground">
                A .i2p address is resolved inside the I2P network rather than by public DNS. Without
                a running router and a browser configured to use its HTTP proxy on 127.0.0.1:4444,
                the browser has no way to reach the destination and the request fails.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="font-semibold text-foreground text-base">Can I use Tor Browser for I2P?</h2>
              <p className="text-sm text-muted-foreground">
                Not by default. Tor Browser routes traffic through Tor, which does not carry I2P
                addressing. Use a separate browser profile configured for the I2P proxy and keep it
                distinct from your Tor Browser usage.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="font-semibold text-foreground text-base">The address loads slowly or times out. What should I check?</h2>
              <p className="text-sm text-muted-foreground">
                Confirm the router console reports that tunnels are built and that the router is
                integrated into the network. Newly started routers are slow until they have found
                enough peers. Also check the browser profile is using the HTTP proxy on port 4444
                and that no other extension is overriding proxy settings.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="font-semibold text-foreground text-base">Is everything on 0xNull available over I2P?</h2>
              <p className="text-sm text-muted-foreground">{i2pMirror.predictionsNotice}</p>
            </div>
          </CardContent>
        </Card>

        {/* Download CTA */}
        <div className="text-center">
          <a
            href="https://geti2p.net/en/download"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Download className="w-5 h-5" aria-hidden="true" />
            Download I2P
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default I2pGuide;
