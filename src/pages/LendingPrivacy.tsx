import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, ShieldCheck, ShieldAlert, ArrowRight, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

const PrivacyModelTable = () => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
          <th className="text-left py-3 px-3">Layer</th>
          <th className="text-left py-3 px-3">What it does</th>
          <th className="text-right py-3 px-3">Cost</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-border/50">
          <td className="py-3 px-3 font-medium">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Commingling
            </div>
          </td>
          <td className="py-3 px-3 text-muted-foreground">All users share one backend wallet + Aave pool. Breaks direct deposit→withdrawal links.</td>
          <td className="py-3 px-3 text-right"><Badge variant="outline" className="text-emerald-400 border-emerald-500/30">Free (always on)</Badge></td>
        </tr>
        <tr className="border-b border-border/50">
          <td className="py-3 px-3 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Railgun Shield (deposit)
            </div>
          </td>
          <td className="py-3 px-3 text-muted-foreground">Hides your source address when depositing. Analytics can't trace funds into 0xNull.</td>
          <td className="py-3 px-3 text-right font-mono text-xs">Gas only (~$0.15)</td>
        </tr>
        <tr className="border-b border-border/50">
          <td className="py-3 px-3 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Railgun Shield (withdrawal)
            </div>
          </td>
          <td className="py-3 px-3 text-muted-foreground">Hides the link between 0xNull and your destination. Analytics can't trace funds out.</td>
          <td className="py-3 px-3 text-right font-mono text-xs">0.25% + gas (~$0.15)</td>
        </tr>
      </tbody>
    </table>
  </div>
);

const FlowDiagram = () => (
  <div className="p-6 rounded-xl bg-secondary/30 border border-border/50">
    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 text-center">Privacy-enhanced deposit & withdrawal flow</p>
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {[
        { label: 'Your Wallet', solid: true },
        { label: 'Railgun Shield', dashed: true, highlight: true },
        { label: '0xNull Pool', solid: true },
        { label: 'Aave V3', solid: true },
        { label: '0xNull Pool', solid: true },
        { label: 'Railgun Shield', dashed: true, highlight: true },
        { label: 'Fresh Wallet', solid: true },
      ].map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`text-xs px-2.5 py-1.5 rounded-md font-medium ${
            step.highlight
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 border-dashed'
              : 'bg-muted text-muted-foreground border border-border'
          }`}>
            {step.highlight && '🛡️ '}{step.label}
          </div>
          {i < 6 && <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />}
        </div>
      ))}
    </div>
    <p className="text-[11px] text-muted-foreground text-center mt-3">Dashed steps are optional — choose based on your threat model</p>
  </div>
);

const LendingPrivacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/lending" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Markets
        </Link>

        <div className="space-y-10">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">How 0xNull Protects Your Privacy</h1>
            <p className="text-muted-foreground">Privacy is a spectrum, not a switch. Understand the layers so you can choose based on your threat model — not fear.</p>
          </div>

          {/* Flow Diagram */}
          <FlowDiagram />

          {/* Transaction Graph */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Eye className="w-5 h-5 text-muted-foreground" />
              What is a Transaction Graph?
            </h2>
            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>
                Every blockchain transaction creates a link between two addresses — a sender and a receiver. Over time, these links build into a <strong className="text-foreground">transaction graph</strong>: a map of who sent what to whom.
              </p>
              <p>
                Blockchain analytics companies like Chainalysis and Elliptic use these graphs to trace funds, identify wallet owners and build profiles. Even if you never attached your name to a wallet, patterns in your transaction graph — the timing, the amounts and the addresses you interact with — can be enough to de-anonymise you.
              </p>
              <Card className="bg-amber-500/5 border-amber-500/20">
                <CardContent className="py-3 text-xs text-amber-300">
                  <strong>Example:</strong> You buy ETH on a KYC exchange, send it to Wallet A, swap on Uniswap, bridge to Arbitrum and deposit into a lending protocol. An observer can follow every step. Your KYC identity is now linked to your DeFi activity.
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Compartmentalisation */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-muted-foreground" />
              What is Compartmentalisation?
            </h2>
            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>
                Compartmentalisation means breaking the chain of links so no single observer can see your full activity. 0xNull acts as a natural compartmentalisation layer:
              </p>
              <div className="space-y-2">
                {[
                  { title: 'Many users, one wallet', desc: 'All deposits from all users land in the same 0xNull backend wallet. Your deposit mixes with everyone else\'s.' },
                  { title: 'Funds deployed to Aave', desc: 'Your tokens don\'t sit in a wallet — they\'re supplied to Aave V3, pooled with billions in liquidity. Your specific tokens lose their identity entirely.' },
                  { title: 'Withdrawals come from the pool', desc: 'When you withdraw, the tokens come from Aave\'s pool, not from "your" original deposit. The on-chain link between your deposit and withdrawal is broken by the commingling.' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3 p-3 rounded-lg bg-secondary/30">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p>
                Even without Railgun shielding, 0xNull provides meaningful privacy simply by acting as an intermediary pool.
              </p>
            </div>
          </section>

          {/* When ZK Helps */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              When Does ZK Shielding Actually Help?
            </h2>
            <div className="text-sm text-muted-foreground space-y-4 leading-relaxed">
              <p>
                Zero-knowledge shielding (via Railgun) adds cryptographic privacy on top of the structural privacy above. But it's not always necessary.
              </p>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ZK shielding adds significant value when:
                </h3>
                <ul className="space-y-2">
                  {[
                    { title: 'Your deposit amount is unique', desc: 'If you deposit exactly 1.23456 WETH and later withdraw exactly 1.23456 WETH, an observer can probabilistically link those transactions even through commingling. Shielding hides the amount entering the system.' },
                    { title: 'You\'re the only active user', desc: 'If volume is low, the commingling pool is small and timing analysis becomes easier. Shielding adds noise.' },
                    { title: 'Your source wallet is KYC-linked', desc: 'If depositing from a wallet connected to a centralised exchange with identity verification, shielding prevents the exchange from seeing where your funds went.' },
                    { title: 'Your destination wallet is sensitive', desc: 'If withdrawing to a wallet you want completely unlinked from your other activity, a shielded withdrawal ensures no on-chain observer can connect it to 0xNull.' },
                  ].map((item) => (
                    <li key={item.title} className="flex gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  ZK shielding adds less value when:
                </h3>
                <ul className="space-y-2">
                  {[
                    { title: 'You\'re depositing from a fresh wallet', desc: 'If your source wallet has no history and no identity attached, the transaction graph is already cold.' },
                    { title: 'You\'re using common round amounts', desc: 'Depositing 0.1 ETH or 100 USDC is indistinguishable from hundreds of other transactions.' },
                    { title: 'Volume is high', desc: 'When many users are depositing and withdrawing similar amounts, the commingling effect is strong. Your transaction is lost in the crowd.' },
                    { title: 'You\'re withdrawing to the same wallet', desc: 'If you don\'t care about breaking the link (e.g. just earning yield), shielding costs extra gas for no practical benefit.' },
                  ].map((item) => (
                    <li key={item.title} className="flex gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Privacy Model Table */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold">The 0xNull Privacy Model</h2>
            <Card>
              <CardContent className="p-0">
                <PrivacyModelTable />
              </CardContent>
            </Card>
          </section>

          {/* Tornado Cash Distinction */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold">How is this different from Tornado Cash?</h2>
            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>
                It's a fair question. Both involve pooling funds and both can break transaction graph links. But the architecture, purpose and legal standing are fundamentally different.
              </p>
              <p>
                <strong className="text-foreground">Tornado Cash</strong> is a mixing service. Its sole function is anonymisation. You deposit a fixed denomination (0.1, 1, 10 or 100 ETH), it sits idle in a smart contract and you withdraw later with a ZK proof that hides the link. There is no yield, no lending, no productive use of capital. The protocol is an immutable smart contract with no operator — nobody can respond to legal process, freeze illicit funds or comply with anything. OFAC sanctioned it because obfuscation isn't a side effect — it's the entire product.
              </p>
              <p>
                <strong className="text-foreground">0xNull Lending</strong> is a yield protocol. The primary function is earning interest on deposits by deploying capital to Aave V3. Privacy is a structural byproduct of how lending pools work — your tokens get commingled with every other user's deposits, deployed into Aave's liquidity pools alongside billions in TVL and withdrawals come from the shared pool. This is the same commingling that happens in every bank, every money market fund, every lending protocol. It's not a mixer — it's how pooled finance works.
              </p>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="text-left py-3 px-3"></th>
                        <th className="text-left py-3 px-3">Tornado Cash</th>
                        <th className="text-left py-3 px-3">0xNull Lending</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Primary purpose', tc: 'Anonymisation', ox: 'Yield generation' },
                        { label: 'Funds are...', tc: 'Idle in a mixing contract', ox: 'Earning yield on Aave V3' },
                        { label: 'Denominations', tc: 'Fixed (0.1, 1, 10, 100 ETH) — designed for mixing', ox: 'Variable — deposit any amount' },
                        { label: 'Operator', tc: 'None (immutable contract)', ox: 'Operated by Margin Syndicate Ltd (UK)' },
                        { label: 'Compliance', tc: 'Impossible — no one controls the contract', ox: 'Accountable operator can respond to legal process' },
                        { label: 'ZK involvement', tc: 'Required — the product IS the ZK circuit', ox: 'Optional — base product works without ZK' },
                        { label: 'User intent', tc: 'Come for anonymity', ox: 'Come for APY' },
                      ].map((row) => (
                        <tr key={row.label} className="border-b border-border/50">
                          <td className="py-3 px-3 font-medium text-foreground">{row.label}</td>
                          <td className="py-3 px-3 text-muted-foreground">{row.tc}</td>
                          <td className="py-3 px-3 text-muted-foreground">{row.ox}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 text-center">
              <div className="flex items-center justify-center gap-8 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Tornado Cash</p>
                  <p className="font-semibold text-foreground">🧺 Laundromat</p>
                </div>
                <div className="text-muted-foreground text-lg">vs</div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">0xNull Lending</p>
                  <p className="font-semibold text-foreground">🏦 Bank savings account</p>
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>
                Your bank commingles deposits. Your money market fund pools capital. Aave itself commingles every supplier's tokens. Nobody calls these mixers. The commingling is a consequence of pooled finance, not a privacy tool.
              </p>
              <p>
                0xNull sits in the same category: a lending protocol where privacy is a property of the architecture, not the product.
              </p>
            </div>
          </section>

          {/* Smart Contract Migration */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Why isn't this a smart contract?</h2>
            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>
                This is the question we get from DeFi natives who expect everything to live on-chain. It deserves a direct answer.
              </p>
              <p>
                We could move the lending logic to a smart contract. Deposits, withdrawals, Aave V3 integration, interest accrual, fee deduction — all of this is composable and would work on-chain. The engineering is straightforward.
              </p>
              <p>
                But it would make the product <strong className="text-foreground">less private</strong>, not more.
              </p>
              <p>Here's why.</p>
              <p>
                A smart contract is a glass box. Every deposit and withdrawal emits an event with the caller's wallet address. The transaction graph that our current architecture breaks by design would be <strong className="text-foreground">reconstructed in the contract's event logs</strong>. Any observer could query the contract, see who deposited, who withdrew, match amounts and timing and rebuild exactly the links our commingling model is designed to sever.
              </p>
              <p>
                The centralised backend wallet acts as a <strong className="text-foreground">cut-out</strong> — a single point where all funds commingle without on-chain attribution. There are no events tying your address to your position. The chain sees transfers in and transfers out of one wallet. The link between depositor and withdrawer exists only in our database, not on a public ledger.
              </p>
              <p>
                To replicate this privacy on-chain, every interaction would need to happen inside a zero-knowledge shielded environment — deposit shielded, earn yield shielded, withdraw shielded. ZK proofs would be mandatory, not optional. This is technically possible using Railgun's shielded pool as a composable base layer, but it introduces significant constraints:
              </p>
            </div>

            {/* What a shielded smart contract would require */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                What a shielded smart contract would require
              </h3>
              <ul className="space-y-2">
                {[
                  'Mandatory ZK proofs on every transaction (30–60 second proving times)',
                  'Railgun\'s contract architecture would need to support composable yield strategies (deposit → Aave supply → withdraw from Aave → unshield) — this doesn\'t exist yet',
                  'Higher gas costs on every interaction, with no option to skip for users who don\'t need it',
                  'No XMR integration — Monero can\'t be touched from an EVM smart contract',
                  'No token-based authentication — every user needs a wallet, every position has an on-chain address',
                  'Immutable code — every edge case we handle operationally (RPC failovers, state reconciliation, manual corrections) becomes a potential protocol-breaking bug',
                ].map((item) => (
                  <li key={item} className="flex gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* What we'd gain */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                What we'd gain
              </h3>
              <ul className="space-y-2">
                {[
                  { title: 'Trustlessness', desc: 'Users don\'t need to trust 0xNull with custody' },
                  { title: 'Composability', desc: 'Other protocols could build on top' },
                  { title: 'Immutability', desc: 'Rules can\'t change' },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-sm text-muted-foreground leading-relaxed">
              <p><strong className="text-foreground">The tradeoff is real.</strong> Trustlessness vs privacy. Composability vs flexibility. Immutability vs the ability to fix things.</p>
            </div>

            {/* Migration Path Timeline */}
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4">The migration path</h3>
              <div className="space-y-0">
                {[
                  {
                    stage: 'Now',
                    color: 'primary',
                    title: 'Custodial architecture with structural privacy',
                    desc: 'The backend wallet commingles funds, deploys to Aave, handles payouts. ZK shielding optional for users who want cryptographic guarantees. This is the fastest path to a working product with strong privacy properties.',
                  },
                  {
                    stage: 'Next',
                    color: 'emerald',
                    title: 'Shielded smart contract integration',
                    desc: 'As Railgun\'s composable shielding matures and supports vault-style yield strategies, we can begin moving the Aave integration into a shielded smart contract where deposits and withdrawals happen entirely within the ZK-shielded environment. This eliminates custody risk while preserving privacy.',
                  },
                  {
                    stage: 'Eventually',
                    color: 'violet',
                    title: 'Fully on-chain shielded vault',
                    desc: 'A fully on-chain, shielded vault contract where all positions are managed inside Railgun\'s privacy set. No custodian, no backend database, no trust assumptions beyond the smart contract code and the ZK proof system. XMR integration would require a cross-chain bridge with its own trust model.',
                  },
                ].map((item, i) => (
                  <div key={item.stage} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        item.color === 'primary' ? 'bg-primary/20 text-primary border border-primary/30' :
                        item.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                      }`}>
                        {i + 1}
                      </div>
                      {i < 2 && <div className="w-px h-full bg-border/50 min-h-[2rem]" />}
                    </div>
                    <div className="pb-6">
                      <Badge variant="outline" className={`mb-1.5 text-[10px] ${
                        item.color === 'primary' ? 'text-primary border-primary/30' :
                        item.color === 'emerald' ? 'text-emerald-400 border-emerald-500/30' :
                        'text-violet-400 border-violet-500/30'
                      }`}>{item.stage}</Badge>
                      <p className="font-medium text-foreground text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-sm text-muted-foreground leading-relaxed">
              <p>We're not building the final form first. We're building what works now, what's private now and what gives us a clean upgrade path when the infrastructure catches up.</p>
            </div>

            {/* Key insight callout */}
            <div className="p-5 rounded-xl bg-primary/10 border border-primary/20 text-center">
              <p className="text-lg font-bold text-foreground leading-snug">
                A centralised architecture is currently more private than a decentralised one.
              </p>
              <p className="text-sm text-muted-foreground mt-2">We'd rather ship real privacy today than theoretical trustlessness that leaks your data on-chain.</p>
            </div>
          </section>

          {/* Closing */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Choose based on your threat model, not fear.</p>
            <p>Every user gets commingling for free. ZK shielding is available for those who need stronger guarantees. Most users earning yield with round amounts on fresh wallets don't need shielding — but it's there when you do.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LendingPrivacy;
