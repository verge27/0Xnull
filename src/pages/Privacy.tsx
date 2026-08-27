import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Privacy = () => {
  useSEO();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Our Commitment to Privacy</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  0xNull Marketplace is built on the principle of privacy-first commerce. We collect the 
                  absolute minimum data necessary to provide and protect the service. We do not use Google
                  Analytics, Google Tag Manager, advertising pixels, or behavioural analytics.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data We Collect</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p><strong>What we DO collect:</strong></p>
                <ul className="list-disc list-inside space-y-1 mb-4">
                  <li>Account credentials (hashed, not stored in plaintext)</li>
                  <li>Listing data you voluntarily provide</li>
                  <li>Order information necessary for fulfillment</li>
                </ul>
                <p><strong>What we DON'T collect:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Real names or government IDs</li>
                  <li>Physical addresses (shipping handled directly between parties)</li>
                  <li>Analytics cookies, advertising identifiers, or browser fingerprints</li>
                  <li>Persistent identifiers for page-view or journey tracking</li>
                  <li>Payment information beyond XMR wallet addresses</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monero Payments</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  We exclusively use Monero (XMR) because it provides:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Unlinkable transactions via ring signatures</li>
                  <li>Hidden amounts via RingCT</li>
                  <li>No transparent blockchain trail</li>
                </ul>
                <p className="mt-3">
                  Your financial activity cannot be traced through transaction analysis.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Third Parties</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  We use service providers only where needed to host the site, provide requested features,
                  process payments, and protect the service. Trocador AnonPay processes payment requests sent
                  to it. We do not use third-party analytics or advertising networks, and we do not sell user
                  information.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operational Records</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  Security, fraud-prevention, transaction, and error records are limited to what is necessary
                  to deliver and protect the service. Ramp diagnostics contain no browser or session identifier.
                  Voucher reporting records completed transaction events without a user token or page-view trail.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Law Enforcement</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  We cannot provide data we don't collect. In the event of legal requests, 
                  our response is limited by the minimal data we retain. We encourage users 
                  to maintain their own operational security.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Delete your account and associated data</li>
                  <li>Export your listing data</li>
                  <li>Operate pseudonymously</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
