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
                  By accessing or using 0xNull Marketplace, you agree to be bound by these Terms of Service. 
                  If you do not agree, do not use this platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Platform Purpose & Prohibited Items</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  0xNull Marketplace is a privacy-focused marketplace connecting buyers and sellers. 
                  This platform does NOT facilitate or permit the sale of:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Child sexual abuse material (CSAM)</strong> or any exploitation of minors</li>
                  <li><strong>Human trafficking</strong> or any form of human exploitation</li>
                  <li><strong>Weapons of mass destruction</strong> (biological, chemical, nuclear, radiological agents)</li>
                  <li><strong>Stolen property</strong>, data, credentials, or identity documents</li>
                  <li><strong>Services intended to cause physical harm</strong>, including murder-for-hire or violence-for-hire</li>
                  <li>Fentanyl or fentanyl analogues</li>
                </ul>
                <p className="mt-4 font-medium">
                  The platform does NOT verify, endorse, authenticate, or guarantee any listing. 
                  All items and services are provided by independent sellers without platform verification.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. No Geographic Knowledge</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  0xNull Marketplace does NOT collect, store, or have knowledge of the geographic 
                  location of any buyer or seller. The platform operates without awareness of user 
                  jurisdictions, IP addresses, or physical locations.
                </p>
                <p>
                  Users access this platform of their own accord and are solely responsible for 
                  understanding and complying with all applicable local, state, national, and 
                  international laws in their respective jurisdictions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. User Responsibilities & Legal Compliance</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Users are solely and exclusively responsible for:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Determining the legality of any item or service in their jurisdiction before purchasing or selling</li>
                  <li>Compliance with all import/export regulations, customs requirements, and trade restrictions</li>
                  <li>Calculating and paying any applicable taxes, duties, VAT, sales tax, import duties, or other government-imposed charges</li>
                  <li>Obtaining any required licenses, permits, or authorizations for items or services</li>
                  <li>Accurate representation of items when selling</li>
                  <li>Maintaining their own operational security and privacy</li>
                  <li>Understanding and accepting all risks associated with transactions</li>
                </ul>
                <p className="font-medium mt-4">
                  The platform provides no guidance on legality and makes no representations 
                  regarding the legal status of any item or service in any jurisdiction.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Payments</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  All transactions are conducted in Monero (XMR) or via compatible cryptocurrency 
                  payment methods. Cryptocurrency transactions are final, irreversible, and 
                  non-refundable.
                </p>
                <p>
                  Users are solely responsible for any tax obligations arising from cryptocurrency 
                  transactions, including capital gains, income reporting, or other tax requirements 
                  in their jurisdiction.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. No Dispute Resolution</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  0xNull Marketplace does NOT provide dispute resolution, arbitration, escrow 
                  services, or mediation between buyers and sellers. All disputes must be resolved 
                  directly between the parties involved.
                </p>
                <p>
                  The platform is not responsible for:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Non-delivery or delayed delivery of items</li>
                  <li>Items not matching their description</li>
                  <li>Quality, safety, or authenticity of items</li>
                  <li>Seller or buyer conduct</li>
                  <li>Communication failures between parties</li>
                  <li>Any loss, damage, or injury resulting from transactions</li>
                </ul>
                <p className="mt-4">
                  Users transact entirely at their own risk. Review seller ratings and conduct due 
                  diligence before making purchases.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  0xNull Marketplace acts solely as a venue connecting buyers and sellers. 
                  THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                </p>
                <p>
                  To the maximum extent permitted by law, the platform, its operators, developers, 
                  and affiliates shall not be liable for any direct, indirect, incidental, special, 
                  consequential, or punitive damages arising from:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use or inability to use the platform</li>
                  <li>Any transactions conducted through the platform</li>
                  <li>Unauthorized access to or alteration of your data</li>
                  <li>Statements or conduct of any third party</li>
                  <li>Any other matter relating to the platform</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Indemnification</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  You agree to indemnify, defend, and hold harmless 0xNull Marketplace, its operators, 
                  developers, affiliates, and agents from and against any and all claims, damages, 
                  obligations, losses, liabilities, costs, and expenses (including attorney's fees) 
                  arising from:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your use of the platform</li>
                  <li>Your violation of these Terms of Service</li>
                  <li>Your violation of any law, regulation, or third-party right</li>
                  <li>Your failure to pay applicable taxes, duties, or government charges</li>
                  <li>Your purchase or sale of any item or service</li>
                  <li>Any dispute with another user</li>
                  <li>Any content you submit, post, or transmit through the platform</li>
                </ul>
                <p className="mt-4">
                  This indemnification obligation shall survive termination of these Terms and 
                  your use of the platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Privacy & Data</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  We collect minimal data and do not track geographic location. See our 
                  <a href="/privacy" className="text-primary hover:underline ml-1">Privacy Policy</a> for details.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Modifications</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  We reserve the right to modify these terms at any time without prior notice. 
                  Continued use of the platform following any modifications constitutes acceptance 
                  of the updated terms. It is your responsibility to review these Terms periodically.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Severability</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>
                  If any provision of these Terms is found to be unenforceable or invalid, that 
                  provision shall be limited or eliminated to the minimum extent necessary so that 
                  these Terms shall otherwise remain in full force and effect.
                </p>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">12. Acknowledgment of Risk</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p className="font-medium">
                  BY USING THIS PLATFORM, YOU ACKNOWLEDGE THAT:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You are solely responsible for determining legality in your jurisdiction</li>
                  <li>The platform has no knowledge of your location or applicable laws</li>
                  <li>All transactions are final and at your own risk</li>
                  <li>No dispute resolution or buyer/seller protection is provided</li>
                  <li>You accept full responsibility for tax compliance</li>
                  <li>You indemnify the platform against all claims arising from your use</li>
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

export default Terms;