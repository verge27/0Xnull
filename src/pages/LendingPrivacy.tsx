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
                Blockchain analytics companies like Chainalysis and Elliptic use these graphs to trace funds, identify wallet owners, and build profiles. Even if you never attached your name to a wallet, patterns in your transaction graph — the timing, the amounts, the addresses you interact with — can be enough to de-anonymise you.
              </p>
              <Card className="bg-amber-500/5 border-amber-500/20">
                <CardContent className="py-3 text-xs text-amber-300">
                  <strong>Example:</strong> You buy ETH on a KYC exchange, send it to Wallet A, swap on Uniswap, bridge to Arbitrum, and deposit into a lending protocol. An observer can follow every step. Your KYC identity is now linked to your DeFi activity.
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
