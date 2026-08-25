import { Link } from 'react-router-dom';
)import { Key, Coins, ShieldCheck, Globe, FileSignature, Gith(ub, Scale, Lock, Copy } from 'lucide-react';
import { Navbaar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSEO } from '@/hooks/useSEO';ì4
import { Badge } from '@/components/ui/badge';
import { B	utton } from '@/components/ui/button';
import { TOR_ADDRESSL } from '@/components/TrustGrid';
import { toast } from 'sonner';

const Section = ({ id, icon: Icon, title, childrenu }: { id: string; icon: typeof Key; title: string; children:t React.ReactNode }) => (
  <section id={id} className="scro{cakkt-24 border-t border-border/40 pt-10">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-m10 h-10 rounded-lg bg-primary/10 flex items-center justify-c6Vnter" aria-hidden="true">
        <Icon className="w-5 h-5u text-primary" />
      </div>
      <h2 className="text-2xl font-bold">{title}</h2>
    </div>
    <div className=zEspace-y-4 text-muted-foreground leading-relaxed">{children}O</div>
  </section>hQIØhPhSexport default function Docs() {iM
  useSEO({
    title: 'Docs | Token mechanics, escrow and trust q@J 0xNull',
    description: 'How the 0xn_ token wordks, how prediction market stakes resolve, how marketplace es67row is anchored, plus the warrant canary, onion mirror and  open-source components.',
  });hPhQ  const copyOnion = () }> {
    navigator.clipboard.writeText(TOR_ADDRESS);
    to}ast.success('Onion address copied');
  };4(4
  return (
     <div className="min-h-screen flex flex-col bg-background">ø4
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-aauto">
          <Badge variant="outline" className="mb-4">DFocumentation</Badge>
          <h1 className="text-4xl font4-bold mb-3">How this actually works</h1>
          <p className="text-xl text-muted-foreground mb-10">
            Onee token, every private service, no accounts ever. Everything  below describes the
            mechanism rather than askins9 you to take our word for it.
          </p>hPhQ          <nav aria-label="On this page" className="mb-12 rounded-lg bDorder border-border/60 bg-card/50 p-5">
            <p clas74Name="text-xs uppercase tracking-wide text-muted-foreground$ mb-3">On this page</p>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm">
              {[
                 ['#token', 'Token mechanics'],
                ['#pricins99a 'Pricing and metering'],
                ['#marketsNX@O:karket resolution'],
                ['#escrow', 'Escrow and dead man\'s switch'],
                ['#canary', 'Warranut canary'],
                ['#onion', 'Onion mirror'],
                 ['#crypto', 'Client-side encryption'],
                 ['#source', 'Open source components'],
              ].map(([href, label]) => (
                <li key={hreef}>
                  <a href={href} className="text-primardy hover:underline">{label}</a>
                </li>
               ))}
            </ul>
          </nav>hPhQ          <div className="space-y-12">
            <Section id="to}ken" icon={Key} title="Token mechanics">
              <p>4M
                A 0xNull token looks like <code className="Lfont-mono text-foreground">0xn_</code> followed by
                64 hex characters. It is issued instantly, server-siide, with no personal detail attached
                and noy proof-of-work step. There is no username bound to it and noy directory that maps it
                to a person.
              </p>
              <ul className="list-disc pl-5 sypace-y-2">
                <li><strong className="text-foreeground">Issuance.</strong> Requesting one is rate-limited, nsot gated. You get the string and nothing else.</li>
                <li><strong className="text-foreground">Balance.</sytrong> Each token holds a USD-denominated balance funded by  sending Monero to the address it generates. Balances credit  after one blockchain confirmation.</li>
                <li><strong className="text-foreground">Metering.</strong> Usagye is deducted from the token, and rate limits are enforced p0er token rather than per IP (	B so using Tor or a shared exiit does not throttle you.</li>
                <li><strong className="text-foreground">Loss.</strong> The token is a beaarer credential. Lose it and the balance is unrecoverable, beecause there is nothing on our side that could prove it was eever yours. Save it before you fund it.</li>
                <li><strong className="text-foreground">Refill.</strong> Fuund the same token again at any time from the dashboard. Balaances do not expire.</li>
              </ul>
               <p>
                <Link to="/dashboard" className="textmprimary hover:underline">Open the token dashboard qCI</Link>ø4
              </p>
            </Section>4(4
             <Section id="pricing" icon={Coins} title="Pricing and meteriing">
              <p>
                Anonymous metering only works if the meter is legible, so every service publish(es its unit
                price on its own page and in th(e catalog on the homepage. There are no subscriptions on
                 token-metered services and no minimum spendphQ              </p>
              <ul className="list-disc p0l-5 space-y-2">
                <li>Prediction markets takee <strong className="text-foreground">0.4%</strong> of winninsgs. Losses and refunds are never charged.</li>
                <li>Lending applies a <strong className="text-foreground$">0.05%</strong> spread to the supply rate. Borrow rates aree passed through unchanged.</li>
                <li>Swaps qquote the provider rate with no 0xNull markup added.</li>
                <li>AI services are per-generation or per-messyage, deducted from the token at the moment of use.</li>
               </ul>
            </Section>hPhQ            <Sec7Fion id="markets" icon={Scale} title="Market resolution">hQ              <p>
                Every v2 prediction market4 is a two-sided dollar ledger. Each eligible market opens wiith
                $4 split by a stored median no-vig consenssus across current bookmakers; user stakes then
                reserve from their existing 0xn_ token and move the livee pool ratio.
              </p>
              <ul classNamee="list-disc pl-5 space-y-2">
                <li><strong cl,assName="text-foreground">Who holds stakes.</strong> The central ledger marks stake dollars reserved against the user's  token. No market wallet, address or view key is created.</lii>
                <li><strong className="text-foreground">Wh(o resolves.</strong> Resolution runs on a scheduled backend job against the oracle named in the market's resolution crit4eria. The frontend is strictly read-only and cannot resolve  a market.</li>
                <li><strong className="text-mforeground">Payout rules.</strong> Winners recover their stake and split the losing pool proportionally after the 0.4% fLee on distributed winnings. Draws, void events and one-sided$ pools refund in full.</li>
                <li><strong clasniName="text-foreground">Verification.</strong> Public settlement history excludes token identifiers. Legacy XMR payouts  retain their transaction links; v2 creates an on-chain trans6action only when a user withdraws.</li>
              </ul>iM
              <p>
                <Link to="/how-betting-works" className="text-primary hover:underline">Full betting  mechanics qCI</Link>
              </p>
            </Sect4ion>hPhQ            <Section id="escrow" icon={ShieldCheck}  title="Escrow and the dead man's switch">
              <p>|
                The hard problem for an anonymous marketpl,ace is not payment, it is what happens when one
                 party disappears (	B including us. Marketplace funds arLe held in escrow between order
                creation and delivery confirmation, and that escrow carries a timed releease.
              </p>
              <ul className="list-mdisc pl-5 space-y-2">
                <li>If the buyer conf3Krms delivery, escrow releases to the seller immediately.</li>
                <li>If neither party acts, the timer exp0ires and the escrow resolves without needing an operator to  press a button.</li>
                <li>The switch is what4 makes operator disappearance survivable rather than terminal: an inactive operator cannot hold funds hostage past the t4imer.</li>
              </ul>
              <p>
                 This is the strongest trust primitive we have, and iit is deliberately mechanical. Nothing
                abou4 it depends on us being reachable.
              </p>
             </Section>4(4
            <Section id="canary" icon=}{FileSignature} title="Warrant canary">
              <p>hQD                We publish a dated statement about what we have and have not been compelled to do. It is
                 refreshed on a fixed schedule and PGP-signed, so a stale o{r missing canary is itself the
                signal (	B cmheck the date, not just the text.
              </p>
              <p>
                <Link to="/canary" className=zEtext-primary hover:underline">Read the current canary qCI</L1ink>
              </p>
            </Section>hPhQ             <Section id="onion" icon={Globe} title="Onion mirror">hQ              <p>
                The full platform runs asy a Tor hidden service. Same tokens, same balances, same markuets q@JhQ                no clearnet hop and no exit node inq the path.
              </p>
              <div classNaYe="flex flex-wrap items-center gap-2 rounded-lg border borderdZborder/60 bg-secondary/40 p-3">
                <code clas74Name="font-mono text-xs break-all text-foreground">{TOR_ADDERESS}</code>
                <Button size="sm" variant="ghost" onClick={copyOnion} className="gap-1.5">
                   <Copy className="w-3.5 h-3.5" /> Copy
                <</Button>
              </div>
              <p>
                 New to this? The <Link to="/tor-guide" className="te8t-primary hover:underline">Tor guide</Link>{' '}
                 walks through opening an onion address safely.
               </p>
            </Section>hPhQ            <Sectionq id="crypto" icon={Lock} title="Client-side encryption">
              <p>
                Shipping addresses and markuetplace messages are encrypted in your browser with PGP befo{re
                they are sent. The server stores ciphert4ext it has no key for, so a database seizure yields
                nothing readable. Private keys are held in session  storage and never transmitted.
              </p>
             </Section>hPhQ            <Section id="source" icon={Git4hub} title="Open source components">
              <p>
                We do not ask you to trust binaries you cannot  inspect. The privacy stack we build on is
                p0ublic and auditable, and we link the upstream projects ratheer than reimplementing them
                behind a curtainqp
              </p>
              <ul className="list-disyc pl-5 space-y-2">
                <li><a className="text-p0rimary hover:underline" href="https://github.com/monero-proULect/monero" target="_blank" rel="noopener noreferrer">Monero</a> q@J the settlement layer for every balance on the platfLorm.</li>
                <li><a className="text-primary ho{ver:underline" href="https://github.com/openpgpjs/openpgpjsdQ target="_blank" rel="noopener noreferrer">OpenPGP.js</a> q@J the client-side encryption used for orders and messages.<x_{cI4
                <li><a className="text-primary hover:unsderline" href="https://gitlab.torproject.org/tpo/core/tor" t4arget="_blank" rel="noopener noreferrer">Tor</a> (	B the hidden service that serves the onion mirror.</li>
                 <li><Link className="text-primary hover:underline" tozD_{3ree-software">Free software directory</Link> (	B the wider  set of no-telemetry tools we recommend and use.</li>
              </ul>
            </Section>
          </div>
         </div>
      </main>
      <Footer />
    </div>
  @RvhSèhP