import { Link } from 'react-router-dom';
import { Key, Coins, ShieldCheck, Globe, FileSignature, Github, Scale, Lock, Copy } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSEO } from '@/hooks/useSEO';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TOR_ADDRESS } from '@/components/TrustGrid';
import { toast } from 'sonner';

const Section = ({ id, icon: Icon, title, children }: { id: string; icon: typeof Key; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-24 border-t border-border/40 pt-10">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h2 className="text-2xl font-bold">{title}</h2>
    </div>
    <div className="space-y-4 text-muted-foreground leading-relaxed">{children}</div>
  </section>
);

export default function Docs() {
  useSEO({
    title: 'Docs | Token mechanics, escrow and trust — 0xNull',
    description: 'How the 0xn_ token works, how prediction market stakes resolve, how marketplace escrow is anchored, plus the warrant canary, onion mirror and open-source components.',
  });

  const copyOnion = () => {
    navigator.clipboard.writeText(TOR_ADDRESS);
    toast.success('Onion address copied');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-4">Documentation</Badge>
          <h1 className="text-4xl font-bold mb-3">How this actually works</h1>
          <p className="text-xl text-muted-foreground mb-10">
            One token, every private service, no accounts ever. Everything below describes the
            mechanism rather than asking you to take our word for it.
          </p>

          <nav aria-label="On this page" className="mb-12 rounded-lg border border-border/60 bg-card/50 p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">On this page</p>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm">
              {[
                ['#token', 'Token mechanics'],
                ['#pricing', 'Pricing and metering'],
                ['#markets', 'Market resolution'],
                ['#escrow', 'Escrow and dead man\'s switch'],
                ['#canary', 'Warrant canary'],
                ['#onion', 'Onion mirror'],
                ['#crypto', 'Client-side encryption'],
                ['#source', 'Open source components'],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="text-primary hover:underline">{label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-12">
            <Section id="token" icon={Key} title="Token mechanics">
              <p>
                A 0xNull token looks like <code className="font-mono text-foreground">0xn_</code> followed by
                64 hex characters. It is issued instantly, server-side, with no personal detail attached
                and no proof-of-work step. There is no username bound to it and no directory that maps it
                to a person.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-foreground">Issuance.</strong> Requesting one is rate-limited, not gated. You get the string and nothing else.</li>
                <li><strong className="text-foreground">Balance.</strong> Each token holds a USD-denominated balance funded by sending Monero to the address it generates. Balances credit after one blockchain confirmation.</li>
                <li><strong className="text-foreground">Metering.</strong> Usage is deducted from the token, and rate limits are enforced per token rather than per IP — so using Tor or a shared exit does not throttle you.</li>
                <li><strong className="text-foreground">Loss.</strong> The token is a bearer credential. Lose it and the balance is unrecoverable, because there is nothing on our side that could prove it was ever yours. Save it before you fund it.</li>
                <li><strong className="text-foreground">Refill.</strong> Fund the same token again at any time from the dashboard. Balances do not expire.</li>
              </ul>
              <p>
                <Link to="/dashboard" className="text-primary hover:underline">Open the token dashboard →</Link>
              </p>
            </Section>

            <Section id="pricing" icon={Coins} title="Pricing and metering">
              <p>
                Anonymous metering only works if the meter is legible, so every service publishes its unit
                price on its own page and in the catalog on the homepage. There are no subscriptions on
                token-metered services and no minimum spend.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Prediction markets take <strong className="text-foreground">0.4%</strong> of winnings. Losses and refunds are never charged.</li>
                <li>Lending applies a <strong className="text-foreground">0.05%</strong> spread to the supply rate. Borrow rates are passed through unchanged.</li>
                <li>Swaps quote the provider rate with no 0xNull markup added.</li>
                <li>AI services are per-generation or per-message, deducted from the token at the moment of use.</li>
              </ul>
            </Section>

            <Section id="markets" icon={Scale} title="Market resolution">
              <p>
                Every v2 prediction market is a two-sided dollar ledger. Treasury liquidity seeds each eligible market from combined bookmaker odds where an adapter price exists, at even odds otherwise, and rotates back into the pool as markets settle; user stakes then
                reserve from their existing 0xn_ token and move the live pool ratio.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-foreground">Who holds stakes.</strong> The central ledger marks stake dollars reserved against the user's token. No market wallet, address or view key is created.</li>
                <li><strong className="text-foreground">Who resolves.</strong> Resolution runs on a scheduled backend job against the oracle named in the market's resolution criteria. The frontend is strictly read-only and cannot resolve a market.</li>
                <li><strong className="text-foreground">Payout rules.</strong> Winners recover their stake and split the losing pool proportionally after the 0.4% fee on distributed winnings. Draws, void events and one-sided pools refund in full.</li>
                <li><strong className="text-foreground">Verification.</strong> Public settlement history excludes token identifiers. Legacy XMR payouts retain their transaction links; v2 creates an on-chain transaction only when a user withdraws.</li>
              </ul>
              <p>
                <Link to="/how-betting-works" className="text-primary hover:underline">Full betting mechanics →</Link>
              </p>
            </Section>

            <Section id="escrow" icon={ShieldCheck} title="Escrow and the dead man's switch">
              <p>
                The hard problem for an anonymous marketplace is not payment, it is what happens when one
                party disappears — including us. Marketplace funds are held in escrow between order
                creation and delivery confirmation, and that escrow carries a timed release.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>If the buyer confirms delivery, escrow releases to the seller immediately.</li>
                <li>If neither party acts, the timer expires and the escrow resolves without needing an operator to press a button.</li>
                <li>The switch is what makes operator disappearance survivable rather than terminal: an inactive operator cannot hold funds hostage past the timer.</li>
              </ul>
              <p>
                This is the strongest trust primitive we have, and it is deliberately mechanical. Nothing
                about it depends on us being reachable.
              </p>
            </Section>

            <Section id="canary" icon={FileSignature} title="Warrant canary">
              <p>
                We publish a dated statement about what we have and have not been compelled to do. It is
                refreshed on a fixed schedule and PGP-signed, so a stale or missing canary is itself the
                signal — check the date, not just the text.
              </p>
              <p>
                <Link to="/canary" className="text-primary hover:underline">Read the current canary →</Link>
              </p>
            </Section>

            <Section id="onion" icon={Globe} title="Private-network mirrors">
              <p>
                0xNull is reachable as a Tor onion service and as an I2P service. Same tokens, same
                balances, with no clearnet hop in the path. A .i2p address needs a running I2P
                router, and a .onion address needs Tor.
              </p>
              <p>
                Predictions is not available over the Tor onion service.
              </p>
              <p>
                Predictions is not available over the I2P service.
              </p>
              <PrivateAccessAddresses />
            </Section>


            <Section id="crypto" icon={Lock} title="Client-side encryption">
              <p>
                Shipping addresses and marketplace messages are encrypted in your browser with PGP before
                they are sent. The server stores ciphertext it has no key for, so a database seizure yields
                nothing readable. Private keys are held in session storage and never transmitted.
              </p>
            </Section>

            <Section id="source" icon={Github} title="Open source components">
              <p>
                We do not ask you to trust binaries you cannot inspect. The privacy stack we build on is
                public and auditable, and we link the upstream projects rather than reimplementing them
                behind a curtain.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><a className="text-primary hover:underline" href="https://github.com/monero-project/monero" target="_blank" rel="noopener noreferrer">Monero</a> — the settlement layer for every balance on the platform.</li>
                <li><a className="text-primary hover:underline" href="https://github.com/openpgpjs/openpgpjs" target="_blank" rel="noopener noreferrer">OpenPGP.js</a> — the client-side encryption used for orders and messages.</li>
                <li><a className="text-primary hover:underline" href="https://gitlab.torproject.org/tpo/core/tor" target="_blank" rel="noopener noreferrer">Tor</a> — the hidden service that serves the onion mirror.</li>
                <li><Link className="text-primary hover:underline" to="/free-software">Free software directory</Link> — the wider set of no-telemetry tools we recommend and use.</li>
              </ul>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
