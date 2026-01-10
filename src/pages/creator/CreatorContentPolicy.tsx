import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Check, X, Info } from 'lucide-react';

const CreatorContentPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-[#FF6600]">0x</span>Null Creators - Content Policy
          </h1>
          <p className="text-muted-foreground">Last Updated: January 10, 2026</p>
        </div>

        <Card className="border-border/50 mb-6">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">
              This Content Policy outlines what content is and is not permitted on 0xNull Creators. Violation of this policy may result in content removal, account termination, and reporting to law enforcement where applicable.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="prose prose-invert max-w-none p-6 md:p-8">
            {/* Permitted Content */}
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-semibold text-green-500">PERMITTED CONTENT</h2>
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Adult Content (18+)</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Explicit sexual content featuring consenting adults</li>
                    <li>Nudity and erotic content</li>
                    <li>Adult entertainment and performances</li>
                    <li>Sex education and informational content</li>
                    <li>Erotic fiction and stories</li>
                  </ul>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">AI-Generated & Digital Art</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>AI-generated imagery of <strong>fictional characters only</strong></li>
                    <li>Digital art and illustrations</li>
                    <li>3D renders of fictional subjects</li>
                    <li>Synthetic/generated content that does not depict real persons</li>
                  </ul>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">General Content</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Photography and videography</li>
                    <li>Art and illustrations</li>
                    <li>Music and audio content</li>
                    <li>Written content and documents</li>
                    <li>Educational materials</li>
                    <li>Entertainment content</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Absolutely Prohibited */}
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <X className="w-6 h-6 text-destructive" />
                <h2 className="text-xl font-semibold text-destructive">ABSOLUTELY PROHIBITED CONTENT</h2>
              </div>
              
              <div className="space-y-4">
                {/* CSAM */}
                <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <h3 className="text-lg font-medium text-destructive">1. Child Sexual Abuse Material (CSAM) — ZERO TOLERANCE</h3>
                  </div>
                  <p className="text-muted-foreground mb-3 font-medium">
                    ANY sexual or suggestive content involving minors is strictly prohibited.
                  </p>
                  <p className="text-muted-foreground mb-2">This includes:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                    <li>Real photographs or videos of minors</li>
                    <li>AI-generated imagery depicting minors</li>
                    <li>Drawn, animated, or CGI depictions of minors</li>
                    <li>Written content sexualizing minors</li>
                    <li>Content that sexualizes characters explicitly stated to be under 18</li>
                    <li>"Aged up" depictions of minor characters</li>
                  </ul>
                  <p className="text-muted-foreground mb-3">
                    <strong>Minors = anyone under 18 years of age, regardless of local age of consent laws.</strong>
                  </p>
                  <div className="bg-destructive/20 rounded p-3 mt-3">
                    <p className="text-sm text-destructive font-medium">
                      Consequence: Immediate permanent ban. Content preserved and reported to NCMEC and relevant local law enforcement.
                    </p>
                  </div>
                </div>

                {/* Non-Consensual */}
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-destructive mb-2">2. Non-Consensual Intimate Imagery</h3>
                  <p className="text-muted-foreground mb-2">Prohibited:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                    <li>Real intimate/sexual imagery shared without the depicted person's consent ("revenge porn")</li>
                    <li>Voyeuristic content (hidden cameras, upskirt, etc.)</li>
                    <li>Imagery from sexual assaults</li>
                    <li>Leaked private content</li>
                  </ul>
                  <p className="text-muted-foreground mb-3 font-medium">
                    Deepfakes of real, identifiable persons in sexual scenarios without their verified consent are prohibited.
                  </p>
                  <div className="bg-destructive/20 rounded p-3">
                    <p className="text-sm text-destructive">
                      Consequence: Immediate removal. Permanent ban. May be reported to law enforcement.
                    </p>
                  </div>
                </div>

                {/* Illegal Content */}
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-destructive mb-2">3. Illegal Content</h3>
                  <p className="text-muted-foreground mb-2">Prohibited:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                    <li>Content depicting actual violence, murder, or torture</li>
                    <li>Terrorist content or violent extremism</li>
                    <li>Human trafficking or exploitation</li>
                    <li>Drug trafficking or sales</li>
                    <li>Weapons sales (where illegal)</li>
                    <li>Fraud, scams, or phishing</li>
                    <li>Malware or harmful code</li>
                    <li>Any content illegal under applicable law</li>
                  </ul>
                  <div className="bg-destructive/20 rounded p-3">
                    <p className="text-sm text-destructive">
                      Consequence: Removal, ban, and law enforcement referral where applicable.
                    </p>
                  </div>
                </div>

                {/* IP Violations */}
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">4. Intellectual Property Violations</h3>
                  <p className="text-muted-foreground mb-2">Prohibited:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                    <li>Copyrighted content you don't have rights to distribute</li>
                    <li>Trademark violations</li>
                    <li>Pirated media (movies, music, software, etc.)</li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    Consequence: Removal upon valid DMCA notice. Repeat infringers banned.
                  </p>
                </div>
              </div>
            </section>

            {/* Restricted Content */}
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-semibold text-yellow-500">RESTRICTED CONTENT (Permitted with Conditions)</h2>
              </div>
              
              <div className="space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">AI-Generated Content / Deepfakes</h3>
                  <p className="text-muted-foreground mb-2"><strong>Permitted IF:</strong></p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                    <li>Depicts only fictional/synthetic persons OR</li>
                    <li>Depicts real persons who have given verified written consent OR</li>
                    <li>Is clearly non-sexual (e.g., face swap for comedy that doesn't harm reputation)</li>
                  </ul>
                  <p className="text-muted-foreground mb-2"><strong>Required:</strong></p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                    <li>Must be labeled as "AI-generated" or "Digitally created"</li>
                    <li>Must NOT depict minors in any context</li>
                    <li>Must NOT depict real persons in sexual content without consent</li>
                  </ul>
                  <p className="text-muted-foreground mb-2"><strong>Prohibited:</strong></p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Sexual deepfakes of real persons without consent</li>
                    <li>Any deepfake involving minors</li>
                    <li>Deepfakes intended to deceive, defraud, or defame</li>
                  </ul>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Extreme Fetish Content</h3>
                  <p className="text-muted-foreground mb-2"><strong>Permitted:</strong> Staged/consensual content involving:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                    <li>BDSM between consenting adults</li>
                    <li>Roleplay scenarios (age-play between adults, etc.)</li>
                    <li>Fetish content</li>
                  </ul>
                  <p className="text-muted-foreground mb-2"><strong>Required:</strong></p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                    <li>All participants must be verified adults</li>
                    <li>All acts must be consensual and staged</li>
                    <li>No actual harm may be depicted</li>
                  </ul>
                  <p className="text-muted-foreground mb-2"><strong>Prohibited:</strong></p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Actual violence or harm (not staged)</li>
                    <li>Content that could be mistaken for CSAM</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Creator Responsibilities */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">📋 Creator Responsibilities</h2>
              
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Age Verification</h3>
                  <p className="text-muted-foreground mb-2">Creators are responsible for:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Verifying all persons depicted in their content are 18+</li>
                    <li>Maintaining records of age verification and consent</li>
                    <li>Being able to provide proof of age/consent upon request</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Consent Documentation</h3>
                  <p className="text-muted-foreground mb-2">For content featuring other persons, creators must:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Obtain explicit consent for distribution</li>
                    <li>Maintain records of consent</li>
                    <li>Be able to provide documentation if requested</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Content Labeling</h3>
                  <p className="text-muted-foreground mb-2">Creators must accurately:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Label content as "Free" or "Paid"</li>
                    <li>Indicate if content is AI-generated</li>
                    <li>Not misrepresent content in titles/descriptions</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Legal Compliance</h3>
                  <p className="text-muted-foreground mb-2">Creators must ensure their content complies with:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Laws of their own jurisdiction</li>
                    <li>All applicable laws regarding adult content</li>
                    <li>These Terms and Policies</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Content Moderation */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">🔍 Content Moderation</h2>
              
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">How We Moderate</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Automated scanning for known CSAM (hash matching)</li>
                    <li>Review of reported content</li>
                    <li>Periodic manual review</li>
                    <li>Cooperation with law enforcement</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Reporting Content</h3>
                  <p className="text-muted-foreground mb-2">To report content that violates this policy:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Email: <a href="mailto:abuse@0xnull.io" className="text-[#FF6600] hover:underline">abuse@0xnull.io</a></li>
                    <li>Include: Content ID/URL, reason for report, any evidence</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Appeals</h3>
                  <p className="text-muted-foreground mb-2">If your content was removed and you believe this was in error:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Email: <a href="mailto:appeals@0xnull.io" className="text-[#FF6600] hover:underline">appeals@0xnull.io</a></li>
                    <li>Include: Your public key, content details, reason for appeal</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    Appeals are not available for CSAM-related removals.
                  </p>
                </div>
              </div>
            </section>

            {/* Enforcement Table */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">⚖️ Enforcement</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium">Violation</th>
                      <th className="text-left py-2 font-medium">First Offense</th>
                      <th className="text-left py-2 font-medium">Repeat Offense</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2 text-destructive">CSAM</td>
                      <td className="py-2">Permanent ban + law enforcement</td>
                      <td className="py-2">N/A</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 text-destructive">Non-consensual imagery</td>
                      <td className="py-2">Permanent ban</td>
                      <td className="py-2">N/A</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 text-destructive">Illegal content</td>
                      <td className="py-2">Permanent ban + law enforcement</td>
                      <td className="py-2">N/A</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2">Copyright (valid DMCA)</td>
                      <td className="py-2">Content removal</td>
                      <td className="py-2">Account termination</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2">Unlabeled AI content</td>
                      <td className="py-2">Warning + labeling required</td>
                      <td className="py-2">Content removal</td>
                    </tr>
                    <tr>
                      <td className="py-2">Minor policy violations</td>
                      <td className="py-2">Warning</td>
                      <td className="py-2">Content removal / ban</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">📞 Contact</h2>
              <ul className="list-none text-muted-foreground space-y-1">
                <li><strong>Abuse reports:</strong> <a href="mailto:abuse@0xnull.io" className="text-[#FF6600] hover:underline">abuse@0xnull.io</a></li>
                <li><strong>DMCA notices:</strong> <a href="mailto:dmca@0xnull.io" className="text-[#FF6600] hover:underline">dmca@0xnull.io</a></li>
                <li><strong>Appeals:</strong> <a href="mailto:appeals@0xnull.io" className="text-[#FF6600] hover:underline">appeals@0xnull.io</a></li>
                <li><strong>General inquiries:</strong> <a href="mailto:legal@0xnull.io" className="text-[#FF6600] hover:underline">legal@0xnull.io</a></li>
              </ul>
            </section>

            <div className="border-t border-border pt-6 mt-8">
              <p className="text-center text-muted-foreground font-medium">
                By uploading content to 0xNull Creators, you confirm that your content complies with this Content Policy and all applicable laws.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default CreatorContentPolicy;