import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';

const CreatorPrivacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-[#FF6600]">0x</span>Null Creators - Privacy Policy
          </h1>
          <p className="text-muted-foreground">Last Updated: January 10, 2026</p>
        </div>

        <Card className="border-border/50">
          <CardContent className="prose prose-invert max-w-none p-6 md:p-8">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground mb-4">
                This Privacy Policy explains how we collect, use, and protect information when you use 0xNull Creators ("Platform," "Service").
              </p>
              <p className="text-muted-foreground">
                Our core principle is <strong className="text-[#FF6600]">privacy by default</strong> - we collect the minimum information necessary to operate the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">2.1 Information We DO NOT Collect</h3>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                <p className="text-muted-foreground mb-2">Unlike traditional platforms, we do NOT collect:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Names or legal identities</li>
                  <li>Email addresses</li>
                  <li>Phone numbers</li>
                  <li>Physical addresses</li>
                  <li>Government identification</li>
                  <li>Payment card information</li>
                  <li>Social security or national ID numbers</li>
                  <li>Biometric data</li>
                </ul>
              </div>

              <h3 className="text-lg font-medium mt-4 mb-2">2.2 Information We DO Collect</h3>
              
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">A. Cryptographic Identifiers</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Public keys (your ed25519 public key serves as your account identifier)</li>
                    <li>We NEVER have access to your private key</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">B. Content You Upload</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Media files (images, videos) you choose to upload</li>
                    <li>Content metadata (titles, descriptions, pricing)</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">C. Transaction Data</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Monero (XMR) payment addresses generated for transactions</li>
                    <li>Transaction amounts</li>
                    <li>Timestamps</li>
                    <li>We do NOT link transactions to real-world identities</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">D. Technical Data</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>IP addresses (retained for 24 hours for abuse prevention, then deleted)</li>
                    <li>Browser/device type (aggregated, not linked to accounts)</li>
                    <li>Access timestamps</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">E. Voluntary Information</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Display name (pseudonym of your choice)</li>
                    <li>Bio text</li>
                    <li>Any information you voluntarily include in content</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. How We Use Information</h2>
              <p className="text-muted-foreground mb-2">We use collected information solely to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Operate and maintain the Platform</li>
                <li>Process cryptocurrency transactions</li>
                <li>Prevent abuse and enforce Terms of Service</li>
                <li>Comply with legal obligations (e.g., responding to valid law enforcement requests)</li>
                <li>Improve the Service (using aggregated, anonymized data only)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Information Sharing</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">4.1 We Do NOT Sell Data</h3>
              <p className="text-muted-foreground mb-4">
                We do not sell, rent, or trade your information to third parties.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">4.2 Limited Sharing</h3>
              <p className="text-muted-foreground mb-2">We may share information only in these circumstances:</p>
              
              <div className="space-y-3 mt-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">A. Service Providers</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Hosting providers (who process data on our behalf under contract)</li>
                    <li>No service provider receives more data than necessary</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">B. Legal Requirements</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>When required by valid legal process (court order, subpoena)</li>
                    <li>To comply with applicable law</li>
                    <li>To protect our legal rights</li>
                    <li>In response to lawful requests from law enforcement</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">C. Safety</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>When necessary to prevent imminent harm to individuals</li>
                    <li>To report suspected child exploitation to NCMEC and law enforcement</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-lg font-medium mt-6 mb-2">4.3 Blockchain Transparency</h3>
              <p className="text-muted-foreground">
                Monero transactions are recorded on the Monero blockchain. While Monero provides strong privacy, you should understand that blockchain transactions are permanent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Data Retention</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium">Data Type</th>
                      <th className="text-left py-2 font-medium">Retention Period</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2">Public keys / Account data</td>
                      <td className="py-2">Until account termination</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2">Content</td>
                      <td className="py-2">Until deleted by creator or account termination</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2">Transaction records</td>
                      <td className="py-2">7 years (legal/tax compliance)</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2">IP addresses</td>
                      <td className="py-2">24 hours</td>
                    </tr>
                    <tr>
                      <td className="py-2">Server logs</td>
                      <td className="py-2">30 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Data Security</h2>
              <p className="text-muted-foreground mb-2">We implement security measures including:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                <li>Encryption in transit (TLS/HTTPS)</li>
                <li>Encryption at rest for stored data</li>
                <li>Access controls and authentication</li>
                <li>Regular security assessments</li>
                <li>Minimal data collection by design</li>
              </ul>
              <p className="text-muted-foreground">
                However, no system is 100% secure. You use the Platform at your own risk.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Your Rights</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">7.1 Access</h3>
              <p className="text-muted-foreground mb-4">
                You may request information about data we hold related to your public key.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">7.2 Deletion</h3>
              <p className="text-muted-foreground mb-4">
                Creators may delete their uploaded content at any time. Due to the cryptographic nature of accounts, complete "account deletion" is not applicable—simply stop using the Platform.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">7.3 Portability</h3>
              <p className="text-muted-foreground mb-4">
                You may request a copy of your uploaded content.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">7.4 Exercising Rights</h3>
              <p className="text-muted-foreground">
                Contact us at <a href="mailto:privacy@0xnull.io" className="text-[#FF6600] hover:underline">privacy@0xnull.io</a> with your public key to exercise these rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. International Users</h2>
              <p className="text-muted-foreground mb-4">
                By using the Platform, you consent to the transfer and processing of data in jurisdictions where our servers and service providers operate.
              </p>
              <p className="text-muted-foreground">
                For users in the EU/EEA, we process data under legitimate interests (operating the Platform) and contractual necessity. You have rights under GDPR including access, rectification, erasure, and complaint to your local data protection authority.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Children's Privacy</h2>
              <p className="text-muted-foreground">
                The Platform is strictly for adults 18 and over. We do not knowingly collect information from anyone under 18. If we discover we have collected information from a minor, we will delete it immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Cookies and Tracking</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">10.1 Minimal Cookies</h3>
              <p className="text-muted-foreground mb-2">We use only essential cookies for:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                <li>Session management</li>
                <li>Security (CSRF protection)</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">10.2 No Tracking</h3>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-muted-foreground mb-2">We do NOT use:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Analytics trackers</li>
                  <li>Advertising trackers</li>
                  <li>Social media pixels</li>
                  <li>Fingerprinting</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">11. Third-Party Links</h2>
              <p className="text-muted-foreground">
                The Platform may contain links to third-party websites. We are not responsible for their privacy practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">12. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy. Material changes will be announced on the Platform. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">13. Contact Us</h2>
              <p className="text-muted-foreground">
                For privacy inquiries: <a href="mailto:privacy@0xnull.io" className="text-[#FF6600] hover:underline">privacy@0xnull.io</a>
              </p>
            </section>

            <div className="border-t border-border pt-6 mt-8">
              <p className="text-center text-muted-foreground font-medium">
                By using 0xNull Creators, you acknowledge that you have read and understood this Privacy Policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default CreatorPrivacy;