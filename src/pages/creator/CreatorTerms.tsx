import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';

const CreatorTerms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-[#FF6600]">0x</span>Null Creators - Terms of Service
          </h1>
          <p className="text-muted-foreground">Last Updated: January 10, 2026</p>
        </div>

        <Card className="border-border/50">
          <CardContent className="prose prose-invert max-w-none p-6 md:p-8">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Agreement to Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing or using 0xNull Creators ("the Platform," "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Platform.
              </p>
              <p className="text-muted-foreground">
                The Platform is operated by Margin Syndicate Limited ("Company," "we," "us," "our"), a company registered in the United Kingdom.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Eligibility</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">2.1 Age Requirement</h3>
              <p className="text-muted-foreground mb-4">
                You must be at least 18 years old to use this Platform. By using the Platform, you represent and warrant that you are at least 18 years of age.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">2.2 Creator Approval</h3>
              <p className="text-muted-foreground mb-4">
                Creator accounts require administrative approval. We reserve the sole right to approve or deny any creator application without explanation.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">2.3 Prohibited Users</h3>
              <p className="text-muted-foreground mb-2">You may not use the Platform if you:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Are under 18 years of age</li>
                <li>Have been previously banned from the Platform</li>
                <li>Are prohibited by applicable law from using the Platform</li>
                <li>Are located in a jurisdiction where the Platform's services are illegal</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Platform Description</h2>
              <p className="text-muted-foreground mb-2">0xNull Creators is a privacy-focused content hosting platform that:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Allows approved creators to upload and monetize digital content</li>
                <li>Accepts Monero (XMR) cryptocurrency for payments</li>
                <li>Uses cryptographic authentication (no email/password accounts)</li>
                <li>Does not collect personally identifiable information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. User Responsibilities</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">4.1 Account Security</h3>
              <p className="text-muted-foreground mb-2">You are solely responsible for:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Safeguarding your private key (cryptographic credentials)</li>
                <li>All activity that occurs under your account</li>
                <li>Any loss of access due to lost private keys (we cannot recover them)</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">4.2 Accurate Information</h3>
              <p className="text-muted-foreground mb-4">
                Creators must provide accurate information when registering. Misrepresentation may result in account termination.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">4.3 Legal Compliance</h3>
              <p className="text-muted-foreground">
                You are responsible for ensuring your use of the Platform complies with all applicable laws in your jurisdiction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Content Guidelines</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">5.1 Permitted Content</h3>
              <p className="text-muted-foreground mb-2">The Platform permits adult content, including but not limited to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Explicit sexual content involving consenting adults</li>
                <li>Artistic nudity</li>
                <li>AI-generated or digitally manipulated imagery of fictional characters</li>
                <li>Educational adult content</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">5.2 Absolutely Prohibited Content</h3>
              <p className="text-muted-foreground mb-4">
                The following content is <strong className="text-destructive">strictly prohibited</strong> and will result in immediate termination and reporting to law enforcement where applicable:
              </p>

              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-destructive mb-2">A. Child Sexual Abuse Material (CSAM)</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Any sexual or suggestive content involving minors (persons under 18)</li>
                  <li>This includes real, AI-generated, drawn, animated, or any other depiction</li>
                  <li>Zero tolerance. Immediate ban and report to NCMEC/law enforcement.</li>
                </ul>
              </div>

              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-destructive mb-2">B. Non-Consensual Content</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Real intimate imagery of identifiable persons shared without their consent ("revenge porn")</li>
                  <li>Hidden camera/voyeur content of real persons</li>
                  <li>Content depicting actual sexual assault or rape</li>
                </ul>
              </div>

              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-destructive mb-2">C. Illegal Content</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Content depicting actual violence, murder, or serious bodily harm</li>
                  <li>Content promoting terrorism or violent extremism</li>
                  <li>Content facilitating human trafficking</li>
                  <li>Content that violates applicable law</li>
                </ul>
              </div>

              <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
                <h4 className="font-medium mb-2">D. Other Prohibited Content</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Malware or content designed to harm users' devices</li>
                  <li>Phishing or fraudulent content</li>
                  <li>Content infringing intellectual property rights (see Section 7)</li>
                </ul>
              </div>

              <h3 className="text-lg font-medium mt-4 mb-2">5.3 Deepfakes and AI-Generated Content</h3>
              <p className="text-muted-foreground mb-2">AI-generated or manipulated imagery is permitted ONLY when:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                <li>It does not depict any real, identifiable person without their verified consent</li>
                <li>It does not depict minors in any sexual or suggestive context</li>
                <li>It is clearly labeled as AI-generated or fictional</li>
                <li>The subject matter is entirely fictional/synthetic</li>
              </ul>
              <p className="text-muted-foreground font-medium">
                Deepfakes depicting real, identifiable persons in sexual content without verified consent are prohibited.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">5.4 Content Responsibility</h3>
              <p className="text-muted-foreground mb-2">Creators are solely responsible for:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Ensuring they have all necessary rights to content they upload</li>
                <li>Ensuring all persons depicted are adults who have consented</li>
                <li>Maintaining records of age verification and consent (we may request these)</li>
                <li>Compliance with all applicable laws regarding the content</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Payments and Fees</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">6.1 Payment Method</h3>
              <p className="text-muted-foreground mb-4">
                The Platform uses Monero (XMR) cryptocurrency exclusively. We do not process fiat currency.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">6.2 Platform Fees</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                <li>Free content: No fees</li>
                <li>Paid content: Platform fee on successful transactions</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">6.3 Creator Payouts</h3>
              <p className="text-muted-foreground mb-4">
                Creators may withdraw earned XMR to their personal wallet at any time, subject to minimum withdrawal amounts.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">6.4 No Refunds</h3>
              <p className="text-muted-foreground mb-4">
                Due to the nature of cryptocurrency transactions and digital content delivery, all sales are final. No refunds will be provided.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">6.5 Tax Responsibility</h3>
              <p className="text-muted-foreground">
                You are solely responsible for reporting and paying any taxes due on income earned through the Platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Intellectual Property and DMCA</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">7.1 Your Content</h3>
              <p className="text-muted-foreground mb-4">
                You retain ownership of content you upload. By uploading, you grant us a non-exclusive, worldwide license to host, display, and distribute your content through the Platform.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">7.2 Copyright Infringement</h3>
              <p className="text-muted-foreground mb-2">
                We respect intellectual property rights. If you believe content infringes your copyright, submit a DMCA takedown notice to:
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <p className="font-medium">DMCA Agent:</p>
                <p className="text-muted-foreground">Email: dmca@0xnull.io</p>
              </div>
              <p className="text-muted-foreground mb-2">Your notice must include:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Identification of the copyrighted work</li>
                <li>Identification of the infringing material with sufficient detail to locate it</li>
                <li>Your contact information</li>
                <li>A statement of good faith belief that the use is unauthorized</li>
                <li>A statement under penalty of perjury that the information is accurate</li>
                <li>Your physical or electronic signature</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">7.3 Counter-Notification</h3>
              <p className="text-muted-foreground mb-4">
                If you believe your content was wrongly removed, you may submit a counter-notification with the required information under the DMCA.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">7.4 Repeat Infringers</h3>
              <p className="text-muted-foreground">
                We will terminate accounts of repeat copyright infringers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Privacy</h2>
              <p className="text-muted-foreground">
                Our collection and use of information is governed by our Privacy Policy, incorporated herein by reference.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Disclaimers</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">9.1 "As Is" Service</h3>
              <p className="text-muted-foreground mb-4 uppercase text-sm">
                THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">9.2 No Guarantee</h3>
              <p className="text-muted-foreground mb-2">We do not guarantee:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                <li>Continuous, uninterrupted access to the Platform</li>
                <li>That the Platform will be error-free</li>
                <li>That any content will remain available</li>
                <li>Any specific level of earnings for creators</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">9.3 Third-Party Content</h3>
              <p className="text-muted-foreground">
                We are not responsible for content uploaded by users. We do not pre-screen content but may remove content that violates these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4 uppercase text-sm">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE COMPANY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
              </p>
              <p className="text-muted-foreground uppercase text-sm">
                OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM YOUR USE OF THE PLATFORM SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE PAST 12 MONTHS, IF ANY.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">11. Indemnification</h2>
              <p className="text-muted-foreground mb-2">
                You agree to indemnify and hold harmless the Company, its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Your use of the Platform</li>
                <li>Your content</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">12. Account Termination</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">12.1 By You</h3>
              <p className="text-muted-foreground mb-4">
                You may stop using the Platform at any time. There is no account deletion process due to the cryptographic nature of accounts.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">12.2 By Us</h3>
              <p className="text-muted-foreground mb-2">
                We may suspend or terminate your access at any time, for any reason, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                <li>Violation of these Terms</li>
                <li>Illegal activity</li>
                <li>Extended inactivity</li>
                <li>At our sole discretion</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">12.3 Effect of Termination</h3>
              <p className="text-muted-foreground mb-2">Upon termination:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Your right to use the Platform ceases immediately</li>
                <li>We may delete your content</li>
                <li>Pending payouts may be forfeited if termination is due to Terms violation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">13. Dispute Resolution</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">13.1 Governing Law</h3>
              <p className="text-muted-foreground mb-4">
                These Terms are governed by the laws of England and Wales.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">13.2 Jurisdiction</h3>
              <p className="text-muted-foreground mb-4">
                Any disputes shall be resolved in the courts of England and Wales.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">13.3 Informal Resolution</h3>
              <p className="text-muted-foreground">
                Before filing any legal claim, you agree to attempt informal resolution by contacting us at legal@0xnull.io.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">14. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the modified Terms. Material changes will be announced on the Platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">15. Severability</h2>
              <p className="text-muted-foreground">
                If any provision of these Terms is found unenforceable, the remaining provisions will continue in effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">16. Entire Agreement</h2>
              <p className="text-muted-foreground">
                These Terms, together with the Privacy Policy and Content Policy, constitute the entire agreement between you and the Company regarding the Platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">17. Contact</h2>
              <p className="text-muted-foreground mb-2">For questions about these Terms:</p>
              <ul className="list-none text-muted-foreground space-y-1">
                <li>Email: <a href="mailto:legal@0xnull.io" className="text-[#FF6600] hover:underline">legal@0xnull.io</a></li>
                <li>For DMCA: <a href="mailto:dmca@0xnull.io" className="text-[#FF6600] hover:underline">dmca@0xnull.io</a></li>
                <li>For abuse reports: <a href="mailto:abuse@0xnull.io" className="text-[#FF6600] hover:underline">abuse@0xnull.io</a></li>
              </ul>
            </section>

            <div className="border-t border-border pt-6 mt-8">
              <p className="text-center text-muted-foreground font-medium">
                By using 0xNull Creators, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default CreatorTerms;