import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  By accessing or using Tari Market, you agree to be bound by these Terms of Service. 
                  If you do not agree, do not use this platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Platform Purpose</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  Tari Market is a privacy-focused marketplace for grey market goods, research chemicals, 
                  and items users prefer to purchase discreetly. This platform does NOT facilitate:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Illegal narcotics or controlled substances</li>
                  <li>Weapons or explosives</li>
                  <li>Stolen goods or data</li>
                  <li>Human trafficking or exploitation</li>
                  <li>Any services violating local laws</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. User Responsibilities</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Users are solely responsible for:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Ensuring purchases comply with their local jurisdiction</li>
                  <li>Verifying the legality of items in their country/region</li>
                  <li>Accurate representation of items when selling</li>
                  <li>Maintaining their own operational security</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Payments</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  All transactions are conducted in Monero (XMR) via Trocador AnonPay. 
                  Cryptocurrency transactions are final and non-reversible. Disputes must be 
                  resolved between buyers and sellers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  Tari Market acts as a facilitator between buyers and sellers. We are not responsible 
                  for the quality, legality, or delivery of items. Use this platform at your own risk.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Modifications</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  We reserve the right to modify these terms at any time. Continued use constitutes 
                  acceptance of updated terms.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
