import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Shield, AlertTriangle } from 'lucide-react';

const Creator2257 = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            18 U.S.C. § 2257 Exemption Statement
          </h1>
          <p className="text-muted-foreground">0xNull Creators - Record-Keeping Requirements Compliance Statement</p>
        </div>

        <Card className="border-border/50">
          <CardContent className="prose prose-invert max-w-none p-6 md:p-8">
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-6 h-6 text-[#FF6600]" />
                <h2 className="text-xl font-semibold">Exemption Status</h2>
              </div>
              <p className="text-muted-foreground">
                0xNull Creators operates as a platform that hosts user-generated content. As such, it qualifies for exemption from the record-keeping requirements of 18 U.S.C. § 2257 and 28 C.F.R. Part 75.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Basis for Exemption</h2>
              <p className="text-muted-foreground mb-4">
                Under 18 U.S.C. § 2257(h)(2)(B), the record-keeping requirements do not apply to:
              </p>
              <blockquote className="border-l-4 border-[#FF6600] pl-4 italic text-muted-foreground bg-muted/30 py-2 rounded-r">
                "Any person who does not produce, manufacture, publish, duplicate, reproduce, or reissue the matter"
              </blockquote>
              <p className="text-muted-foreground mt-4 mb-2">0xNull Creators is a hosting platform that:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Does NOT produce or create content</li>
                <li>Does NOT employ or contract performers</li>
                <li>Does NOT direct, film, or manufacture content</li>
                <li>Merely provides hosting infrastructure for third-party creators</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-semibold">Creator Responsibility</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                All content on this platform is uploaded by independent third-party creators who are solely responsible for:
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                  <li>Compliance with 18 U.S.C. § 2257 record-keeping requirements</li>
                  <li>Verifying and maintaining records of performer ages</li>
                  <li>Obtaining and maintaining consent documentation</li>
                  <li>Ensuring all depicted persons are 18 years of age or older</li>
                </ol>
              </div>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-semibold">Platform Measures</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                While exempt from 2257 record-keeping requirements, 0xNull Creators:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Requires all creators to confirm they are 18+ and that all depicted persons are 18+</li>
                <li>Maintains a zero-tolerance policy for child sexual abuse material (CSAM)</li>
                <li>Reports suspected CSAM to NCMEC and law enforcement</li>
                <li>Cooperates with law enforcement investigations</li>
                <li>Will remove content and terminate accounts that violate our Content Policy</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">No Custodian of Records</h2>
              <p className="text-muted-foreground mb-4">
                As an exempt hosting platform, 0xNull Creators does not maintain 2257 records and does not have a designated Custodian of Records for 2257 purposes.
              </p>
              <p className="text-muted-foreground">
                Creators who produce content subject to 2257 are responsible for maintaining their own compliant records.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Contact</h2>
              <p className="text-muted-foreground">
                For inquiries regarding this statement: <a href="mailto:legal@0xnull.io" className="text-[#FF6600] hover:underline">legal@0xnull.io</a>
              </p>
            </section>

            <div className="border-t border-border pt-6 mt-8">
              <p className="text-center text-sm text-muted-foreground italic">
                This statement was last updated on January 10, 2026.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Creator2257;