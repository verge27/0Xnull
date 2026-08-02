import { FileSignature, AlertTriangle, Calendar, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSEO } from '@/hooks/useSEO';
import { Badge } from '@/components/ui/badge';

const statements = [
  'We have not been served with any subpoena, warrant or court order for user data.',
  'We have not been served with any national security letter or similar instrument.',
  'We have not been compelled to modify our systems to weaken privacy for any party.',
  'We have not handed over any encryption key or token balance to a third party.',
  'No 0xNull operator account has been compromised to our knowledge.',
];

export default function Canary() {
  useSEO({
    title: 'Warrant canary — 0xNull',
    description: 'Dated statement of what 0xNull has and has not been compelled to do, refreshed on a fixed schedule and PGP-signed.',
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-4">
            <FileSignature className="w-3 h-3 mr-1" /> Warrant canary
          </Badge>
          <h1 className="text-4xl font-bold mb-3">Warrant canary</h1>
          <p className="text-xl text-muted-foreground mb-8">
            The value of this page is its date. If the statements below stop being refreshed, treat the
            silence as the message.
          </p>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-5 mb-8 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">How to read this</p>
              <p>
                A canary states what has <em>not</em> happened. It is refreshed on a fixed schedule and
                signed. A missing refresh, a removed statement or a broken signature all mean the same
                thing: stop assuming the removed line still holds.
              </p>
            </div>
          </div>

          <section className="rounded-lg border border-border/60 bg-card/50 p-6 mb-8">
            <div className="flex flex-wrap items-center gap-4 pb-4 mb-4 border-b border-border/40 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-4 h-4" aria-hidden="true" /> Refreshed on a fixed schedule
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <FileSignature className="w-4 h-4" aria-hidden="true" /> PGP-signed
              </span>
            </div>
            <h2 className="text-lg font-semibold mb-4">As of the latest refresh</h2>
            <ul className="space-y-3">
              {statements.map((s) => (
                <li key={s} className="flex gap-3 text-muted-foreground">
                  <span className="font-mono text-primary shrink-0">—</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-border/60 bg-card/50 p-6 mb-8">
            <h2 className="text-lg font-semibold mb-3">Verifying the signature</h2>
            <p className="text-muted-foreground mb-4">
              Each refresh is published as a PGP-signed message alongside this page. Verify it against the
              0xNull public key before relying on it — an unsigned canary proves nothing about who wrote it.
            </p>
            <p className="text-sm text-muted-foreground">
              The same key signs release announcements, so a signature that verifies here verifies those too.
            </p>
          </section>

          <section className="rounded-lg border border-border/60 bg-card/50 p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" aria-hidden="true" /> Mirrors
            </h2>
            <p className="text-muted-foreground">
              This canary is served identically on the clearnet site and the{' '}
              <Link to="/docs#onion" className="text-primary hover:underline">onion mirror</Link>. If the two
              ever disagree, trust neither and assume the clearnet host is compromised.
            </p>
          </section>

          <p className="mt-8 text-sm text-muted-foreground">
            More on how the platform is built to survive our own disappearance:{' '}
            <Link to="/docs#escrow" className="text-primary hover:underline">escrow and the dead man's switch</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
