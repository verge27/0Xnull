import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HelpCircle, TrendingUp, Users, Shield, Zap } from 'lucide-react';

export default function HowBettingWorks() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <Badge variant="outline" className="text-primary border-primary">
              <HelpCircle className="w-3 h-3 mr-1" />
              Learn
            </Badge>
            <h1 className="text-4xl font-bold">How Parimutuel Betting Works</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Understanding the core mechanism behind 0xNull's prediction markets
            </p>
          </div>

          {/* Core Mechanism */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Core Mechanism: Parimutuel Betting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                0xNull uses a <strong className="text-foreground">parimutuel pool system</strong>, not fixed odds like traditional bookmakers. This means:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>All bets go into a shared pool</li>
                <li>Odds are determined by the ratio of money on each side</li>
                <li>Winners split the total pool proportionally to their stake</li>
                <li>The house takes a flat <strong className="text-foreground">0.4% fee</strong>, not a spread</li>
              </ul>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">1. Market Creation</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>A market is created: "Will Newcastle United win?"</li>
                  <li>Two pools exist: YES pool and NO pool</li>
                  <li>Both start at 0</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">2. Betting Phase</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Users bet XMR on YES or NO</li>
                  <li>The pools grow as bets come in</li>
                  <li>Implied odds update in real-time based on pool ratios</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">3. Resolution</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Oracle checks the result (The Odds API, CoinGecko, etc.)</li>
                  <li>Winning side splits the entire pool</li>
                  <li>0.4% fee is deducted</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Example 1 */}
          <Card>
            <CardHeader>
              <CardTitle>Example: $10 vs $100 Bet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Market:</strong> "Will Islam Makhachev win vs Tsarukyan?"
              </p>
              
              <div>
                <h4 className="font-semibold mb-2">Betting:</h4>
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>Alice bets $10 on YES (Makhachev wins)</li>
                  <li>Bob bets $100 on NO (Makhachev loses)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Pool State:</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pool</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-emerald-400">YES</TableCell>
                      <TableCell>$10</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-red-400">NO</TableCell>
                      <TableCell>$100</TableCell>
                    </TableRow>
                    <TableRow className="font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell>$110</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Implied Odds:</h4>
                <ul className="list-disc list-inside text-muted-foreground">
                  <li><span className="text-emerald-400">YES:</span> $110 / $10 = 11.0x (9.1% implied probability)</li>
                  <li><span className="text-red-400">NO:</span> $110 / $100 = 1.1x (90.9% implied probability)</li>
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <h4 className="font-semibold text-emerald-400 mb-2">Scenario A: Makhachev Wins (YES)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Total Pool: $110</li>
                    <li>Fee (0.4%): $0.44</li>
                    <li>Pool After Fee: $109.56</li>
                    <li className="text-emerald-400 font-semibold">Alice's Payout: $109.56</li>
                    <li className="text-emerald-400">Alice's Profit: +$99.56 (995.6% ROI)</li>
                    <li className="text-red-400">Bob's Loss: -$100</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold text-red-400 mb-2">Scenario B: Makhachev Loses (NO)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Total Pool: $110</li>
                    <li>Fee (0.4%): $0.44</li>
                    <li>Pool After Fee: $109.56</li>
                    <li className="text-red-400 font-semibold">Bob's Payout: $109.56</li>
                    <li className="text-red-400">Bob's Profit: +$9.56 (9.56% ROI)</li>
                    <li className="text-emerald-400">Alice's Loss: -$10</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example 2 - Multiple Bettors */}
          <Card>
            <CardHeader>
              <CardTitle>Complex Example: Multiple Bettors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Market:</strong> "Will BTC be above $95,000 on Dec 21?"
              </p>

              <div>
                <h4 className="font-semibold mb-2">Bets:</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bettor</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Alice</TableCell>
                      <TableCell className="text-emerald-400">YES</TableCell>
                      <TableCell>$50</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Bob</TableCell>
                      <TableCell className="text-emerald-400">YES</TableCell>
                      <TableCell>$150</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Charlie</TableCell>
                      <TableCell className="text-red-400">NO</TableCell>
                      <TableCell>$200</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Diana</TableCell>
                      <TableCell className="text-red-400">NO</TableCell>
                      <TableCell>$100</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Pool State:</h4>
                <ul className="list-disc list-inside text-muted-foreground">
                  <li><span className="text-emerald-400">YES:</span> $200 (Alice $50 + Bob $150)</li>
                  <li><span className="text-red-400">NO:</span> $300 (Charlie $200 + Diana $100)</li>
                  <li><strong className="text-foreground">Total:</strong> $500</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Implied Odds:</h4>
                <ul className="list-disc list-inside text-muted-foreground">
                  <li><span className="text-emerald-400">YES:</span> $500 / $200 = 2.5x (40% implied probability)</li>
                  <li><span className="text-red-400">NO:</span> $500 / $300 = 1.67x (60% implied probability)</li>
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <h4 className="font-semibold text-emerald-400 mb-2">If BTC is ABOVE $95,000 (YES wins)</h4>
                  <p className="text-sm text-muted-foreground mb-2">Pool After 0.4% Fee: $498</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bettor</TableHead>
                        <TableHead>Share</TableHead>
                        <TableHead>Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Alice</TableCell>
                        <TableCell>25%</TableCell>
                        <TableCell className="text-emerald-400">+$74.50</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Bob</TableCell>
                        <TableCell>75%</TableCell>
                        <TableCell className="text-emerald-400">+$223.50</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Charlie</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className="text-red-400">-$200</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Diana</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className="text-red-400">-$100</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold text-red-400 mb-2">If BTC is BELOW $95,000 (NO wins)</h4>
                  <p className="text-sm text-muted-foreground mb-2">Pool After 0.4% Fee: $498</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bettor</TableHead>
                        <TableHead>Share</TableHead>
                        <TableHead>Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Alice</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className="text-red-400">-$50</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Bob</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className="text-red-400">-$150</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Charlie</TableCell>
                        <TableCell>66.7%</TableCell>
                        <TableCell className="text-emerald-400">+$132</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Diana</TableCell>
                        <TableCell>33.3%</TableCell>
                        <TableCell className="text-emerald-400">+$66</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edge Case */}
          <Card>
            <CardHeader>
              <CardTitle>Edge Case: One-Sided Market</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">What if only one side has bets?</p>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Example:</strong> "Will Reynor beat Scarlett?"
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2">
                  <li>YES Pool: $500</li>
                  <li>NO Pool: $0</li>
                </ul>
              </div>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Resolution:</strong> If only one side has bets, all bettors get their money back (minus fee). No profit, no loss (essentially refunded). This is why markets need liquidity on both sides to be interesting.
              </p>
            </CardContent>
          </Card>

          {/* Why This System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Why This System?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Advantages over traditional bookmakers:</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Traditional Bookie</TableHead>
                    <TableHead>0xNull Parimutuel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-red-400">House sets odds (10-15% vig)</TableCell>
                    <TableCell className="text-emerald-400">Market sets odds (0.4% fee)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-red-400">House can refuse bets</TableCell>
                    <TableCell className="text-emerald-400">Permissionless</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-red-400">House profits from losers</TableCell>
                    <TableCell className="text-emerald-400">House only takes flat fee</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-red-400">Odds can be manipulated</TableCell>
                    <TableCell className="text-emerald-400">Odds reflect actual money</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-red-400">KYC required</TableCell>
                    <TableCell className="text-emerald-400">Anonymous (XMR)</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="text-muted-foreground mt-4">
                <strong className="text-foreground">The house doesn't care who wins.</strong> 0xNull makes 0.4% regardless of outcome. No incentive to manipulate.
              </p>
            </CardContent>
          </Card>

          {/* The Math */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                The Math Formula
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 font-mono text-center">
                winner_payout = (winner_stake / total_winning_pool) × (total_pool × 0.996)
              </div>
              <p className="text-muted-foreground">Where:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong className="text-foreground">winner_stake</strong> = how much you bet</li>
                <li><strong className="text-foreground">total_winning_pool</strong> = all bets on the winning side</li>
                <li><strong className="text-foreground">total_pool</strong> = all bets combined</li>
                <li><strong className="text-foreground">0.996</strong> = 1 - 0.4% fee</li>
              </ul>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concept</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Fee</TableCell>
                    <TableCell>0.4% flat</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Odds</TableCell>
                    <TableCell>Dynamic, based on pool ratios</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Settlement</TableCell>
                    <TableCell>XMR (Monero)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Resolution</TableCell>
                    <TableCell>Automated oracles</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Minimum bet</TableCell>
                    <TableCell>None</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Maximum bet</TableCell>
                    <TableCell>None</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>KYC</TableCell>
                    <TableCell>None</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="text-muted-foreground mt-4 text-center">
                The system is simple, transparent, and permissionless. <strong className="text-foreground">You're betting against other users, not the house.</strong>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
