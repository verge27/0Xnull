import { Navbar } from "@/components/Navbar";
import { TOR_URL, I2P_URL } from '@/lib/privateNetworks';
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Code, Zap, Shield, Globe, Trophy, Gamepad2, CircleDollarSign, Briefcase } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";

const JOBS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/jobs-api`;

const ApiDocs = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">0xNull API Documentation</h1>
          <p className="text-xl text-muted-foreground mb-6">
            TXN-funded prediction markets backed by Monero
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="text-sm py-1 px-3">
              <Globe className="w-4 h-4 mr-2" />
              Base URL: https://0xnull.io
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              <CircleDollarSign className="w-4 h-4 mr-2" />
              Settlement: 0xn_ token ledger
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              <Zap className="w-4 h-4 mr-2" />
              Fees: 0.4% on winnings only
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              <Shield className="w-4 h-4 mr-2" />
              Auth: X-TXN-Token
            </Badge>
          </div>

          <Alert role="note">
            <AlertDescription>
              Predictions is not available to residents of Great Britain. Access from GB is blocked.
            </AlertDescription>
          </Alert>
        </div>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock
              language="python"
              code={`import requests, uuid

BASE = "https://0xnull.io/api"

# 1. Create or restore one 0xn_ token, then fund it once
token = requests.post(f"{BASE}/token/create").json()["token"]

# 2. Read the current seeded catalogue
markets = requests.get(f"{BASE}/predictions/markets").json()["markets"]

# 3. Reserve a $1 position from that token balance
bet = requests.post(f"{BASE}/predictions/v2/bets", headers={
    "X-TXN-Token": token,
    "Idempotency-Key": str(uuid.uuid4()),
}, json={
    "market_id": markets[0]["market_id"],
    "side": "YES",
    "amount_cents": 100,
}).json()

# No market wallet is created; the stake is already reserved
print(bet["status"], bet["funding"])`}
            />
          </CardContent>
        </Card>

        {/* Core Concepts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Core Concepts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">How Betting Works</h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Create or find a market</strong> — Markets are prediction questions with YES/NO outcomes</li>
                <li><strong className="text-foreground">Fund one token</strong> — Reuse the same 0xn_ balance across markets</li>
                <li><strong className="text-foreground">Place a bet</strong> — The stake moves from available to reserved immediately</li>
                <li><strong className="text-foreground">Market resolves</strong> — Oracle determines outcome automatically</li>
                <li><strong className="text-foreground">Settlement posts</strong> — Winnings or refunds credit the same token automatically</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Fee Structure</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scenario</TableHead>
                    <TableHead>Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Winning bet</TableCell>
                    <TableCell>0.4% of winnings</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Losing bet</TableCell>
                    <TableCell>0% (you lose your stake)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>One-sided market (refund)</TableCell>
                    <TableCell>0%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Settlement</h3>
              <p className="text-muted-foreground">
                All bets settle in Monero (XMR). Each bet receives a unique subaddress for tracking.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Reference */}
        <Tabs defaultValue="predictions" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="sports">Sports</TabsTrigger>
            <TabsTrigger value="esports">Esports</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
          </TabsList>

          {/* Predictions API */}
          <TabsContent value="predictions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Prediction Markets API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* List Markets */}
                <div>
                  <h3 className="font-semibold mb-2">List Markets</h3>
                  <code className="bg-muted px-2 py-1 rounded text-sm">GET /api/predictions/markets</code>
                  <p className="text-sm text-muted-foreground mt-2 mb-3">
                    Parameters: <code className="bg-muted px-1 rounded">include_resolved</code> (bool, default: false)
                  </p>
                  <CodeBlock
                    language="json"
                    code={`{
  "markets": [
    {
      "market_id": "sports_event_id",
      "title": "Home Team wins vs Away Team",
      "oracle_type": "sports",
      "odds_sport_key": "soccer_epl",
      "commence_time": 1787688000,
      "resolved": 0,
      "outcome": null,
      "yes_pool_cents": 315,
      "no_pool_cents": 185,
      "treasury_yes_cents": 315,
      "treasury_no_cents": 185,
      "bookmaker_count": 8,
      "funding_model": "txn_balance"
    }
  ]
}`}
                  />
                </div>

                {/* Get Market Details */}
                <div>
                  <h3 className="font-semibold mb-2">Get Market Details</h3>
                  <code className="bg-muted px-2 py-1 rounded text-sm">GET /api/predictions/markets/{'{market_id}'}</code>
                  <CodeBlock
                    language="json"
                    className="mt-3"
                    code={`{
  "market_id": "sports_event_id",
  "title": "Home Team wins vs Away Team",
  "yes_pool_cents": 315,
  "no_pool_cents": 185,
  "funding_model": "txn_balance",
  "pool_address": null,
  "view_key": null
}`}
                  />
                </div>

                {/* Create Market */}
                <div>
                  <h3 className="font-semibold mb-2">Create Market</h3>
                  <code className="bg-muted px-2 py-1 rounded text-sm">POST /api/predictions/markets</code>
                  <CodeBlock
                    language="json"
                    className="mt-3"
                    code={`{
  "market_id": "unique_id",
  "title": "Market question",
  "description": "Optional details",
  "oracle_type": "price|sports|esports|cricket|manual",
  "oracle_asset": "BTC|event_id",
  "oracle_condition": "above|below|winner|team_name",
  "oracle_value": 100000,
  "resolution_time": 1735689600
}`}
                  />
                  
                  <h4 className="font-medium mt-4 mb-2">Oracle Types</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>price</TableCell>
                        <TableCell>BTC, ETH, XMR, etc.</TableCell>
                        <TableCell>above, below</TableCell>
                        <TableCell>Target price</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>sports</TableCell>
                        <TableCell>Odds API event_id</TableCell>
                        <TableCell>winner, team_name</TableCell>
                        <TableCell>—</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>esports</TableCell>
                        <TableCell>PandaScore match_id</TableCell>
                        <TableCell>winner, team_name</TableCell>
                        <TableCell>—</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>cricket</TableCell>
                        <TableCell>Odds API event_id</TableCell>
                        <TableCell>winner, team_name</TableCell>
                        <TableCell>—</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>manual</TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>—</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Delete Market */}
                <div>
                  <h3 className="font-semibold mb-2">Delete Market</h3>
                  <code className="bg-muted px-2 py-1 rounded text-sm">DELETE /api/predictions/markets/{'{market_id}'}</code>
                  <p className="text-sm text-muted-foreground mt-2">Only works if no bets have been placed.</p>
                </div>

                {/* Place Bet */}
                <div>
                  <h3 className="font-semibold mb-2">Place Bet</h3>
                  <code className="bg-muted px-2 py-1 rounded text-sm">POST /api/predictions/v2/bets</code>
                  <p className="mt-2 text-sm text-muted-foreground">Headers: <code className="bg-muted px-1 rounded">X-TXN-Token</code> and <code className="bg-muted px-1 rounded">Idempotency-Key</code></p>
                  <div className="grid md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Request:</p>
                      <CodeBlock
                        language="json"
                        code={`{
  "market_id": "sports_event_id",
  "side": "YES",
  "amount_cents": 100
}`}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Response:</p>
                      <CodeBlock
                        language="json"
                        code={`{
  "bet_id": "bet_a1b2c3d4",
  "market_id": "sports_event_id",
  "side": "YES",
  "amount_cents": 100,
  "amount_usd": 1.0,
  "payout_cents": null,
  "status": "reserved",
  "funding": "txn_balance"
}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Other Endpoints */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Other Endpoints</h3>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/predictions/v2/bets</code>
                      <span className="text-muted-foreground">— Token's positions and reserved balance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/predictions/v2/bets/{'{bet_id}'}</code>
                      <span className="text-muted-foreground">— One token-authorised position</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/predictions/v2/markets/{'{market_id}'}/pool</code>
                      <span className="text-muted-foreground">— Dollar liquidity; wallet and view key are null</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/predictions/v2/payouts</code>
                      <span className="text-muted-foreground">— Public account-free settlement history</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Multibets API */}
          <TabsContent value="multibets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Multibet API
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Place multiple bets in a single transaction. One deposit address, multiple market positions.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Create Multibet */}
                <div>
                  <h3 className="font-semibold mb-2">Create a Multibet Slip</h3>
                  <code className="bg-muted px-2 py-1 rounded text-sm">POST /api/multibets/create</code>
                  <CodeBlock
                    language="json"
                    className="mt-3"
                    code={`// Request
{
  "legs": [
    {
      "market_id": "sports_abc123_lakers",
      "side": "YES",
      "amount_usd": 10
    },
    {
      "market_id": "sports_def456_celtics",
      "side": "NO",
      "amount_usd": 15
    }
  ],
  "payout_address": "4..."  // Optional, can set later
}

// Response
{
  "slip_id": "slip_fe5aaed8ca0b2e1b",
  "xmr_address": "82TRJM2...",
  "total_amount_usd": 25.0,
  "total_amount_xmr": 0.054207593,
  "status": "awaiting_deposit",
  "legs": [
    {
      "leg_id": "leg_5bc748d95c3f1549",
      "market_id": "sports_abc123_lakers",
      "side": "YES",
      "amount_usd": 10.0,
      "amount_xmr": 0.021683037,
      "outcome": null,
      "payout_xmr": null
    }
  ],
  "view_key": "0cb6a1ba..."
}`}
                  />
                </div>

                {/* Check Status */}
                <div>
                  <h3 className="font-semibold mb-2">Check Slip Status</h3>
                  <code className="bg-muted px-2 py-1 rounded text-sm">GET /api/multibets/{'{slip_id}'}</code>
                  <p className="text-sm text-muted-foreground mt-2">
                    Returns the same structure as create, with updated status and outcomes.
                  </p>
                </div>

                {/* Status Values */}
                <div>
                  <h3 className="font-semibold mb-3">Status Values</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell><code>awaiting_deposit</code></TableCell>
                        <TableCell>Waiting for user to send XMR</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><code>confirmed</code></TableCell>
                        <TableCell>Deposit received, bets active</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><code>resolved</code></TableCell>
                        <TableCell>All markets resolved, payout ready</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><code>paid</code></TableCell>
                        <TableCell>Winnings sent to payout address</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Other Endpoints */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Other Endpoints</h3>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">POST /api/multibets/{'{slip_id}'}/payout-address</code>
                      <span className="text-muted-foreground">— Update payout address</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/multibets/</code>
                      <span className="text-muted-foreground">— List all slips (optional: ?status=confirmed&limit=50)</span>
                    </div>
                  </div>
                </div>

                {/* Limits */}
                <div>
                  <h3 className="font-semibold mb-3">Limits</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Constraint</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Min legs per slip</TableCell>
                        <TableCell>1</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Max legs per slip</TableCell>
                        <TableCell>20</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Min amount per leg</TableCell>
                        <TableCell>$0.50</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Same market both sides</TableCell>
                        <TableCell>Allowed (hedging)</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Key Difference */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Key Difference from Single Bets</h3>
                  <p className="text-sm text-muted-foreground">
                    With multibets, you get <strong>one deposit address</strong> for all legs instead of one per bet.
                    Send the total XMR amount once to confirm all bets in the slip.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Sports API
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Real-time odds from 40+ bookmakers across 70+ sports/leagues.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/sports/categories</code>
                    <span className="text-muted-foreground">— List all categories</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/sports/events?sport=premier_league</code>
                    <span className="text-muted-foreground">— Get events</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/sports/odds/{'{sport}'}?regions=uk,eu&markets=h2h</code>
                    <span className="text-muted-foreground">— Get odds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/sports/scores</code>
                    <span className="text-muted-foreground">— Get scores</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/sports/result/{'{event_id}'}</code>
                    <span className="text-muted-foreground">— Get event result</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Supported Sports</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-1">Soccer</h4>
                      <p className="text-xs">premier_league, la_liga, bundesliga, serie_a, ligue_1, champions_league, europa_league, world_cup, afcon, mls, liga_mx, brazil_serie_a</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-1">American</h4>
                      <p className="text-xs">nfl, nba, mlb, nhl, ncaaf, ncaab</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-1">Combat</h4>
                      <p className="text-xs">ufc, boxing</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-1">Cricket</h4>
                      <p className="text-xs">big_bash, ipl, psl, t20_international, test_match, odi</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-1">Tennis</h4>
                      <p className="text-xs">All ATP/WTA Grand Slams and Masters</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-1">Other</h4>
                      <p className="text-xs">nrl, six_nations, masters, pga_championship, the_open, us_open_golf</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Esports API */}
          <TabsContent value="esports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5" />
                  Esports API
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Live matches and results from 15 games.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/esports/games</code>
                    <span className="text-muted-foreground">— Supported games</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/esports/events?game=lol&status=upcoming</code>
                    <span className="text-muted-foreground">— Get events</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/esports/live</code>
                    <span className="text-muted-foreground">— Live matches</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/esports/results</code>
                    <span className="text-muted-foreground">— Recent results</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/esports/result/{'{event_id}'}?game=lol</code>
                    <span className="text-muted-foreground">— Match result</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/esports/tournaments</code>
                    <span className="text-muted-foreground">— Tournaments</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Supported Games</h3>
                  <div className="flex flex-wrap gap-2">
                    {['lol', 'csgo', 'dota2', 'valorant', 'starcraft-2', 'cod', 'rl', 'r6siege', 'ow', 'pubg', 'fifa', 'kog', 'lol-wild-rift', 'mlbb', 'starcraft-brood-war'].map(game => (
                      <Badge key={game} variant="secondary" className="text-xs">{game}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Jobs API */}
          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Jobs API
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Read-only feed of work paid in Monero, aggregated from public boards. No auth, no key, no rate limit beyond fair use. Same data as the <a href="/work" className="underline">/work</a> page.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Base URL</h3>
                  <code className="block bg-muted px-3 py-2 rounded text-xs break-all">{JOBS_BASE}</code>
                </div>

                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="bg-muted px-2 py-1 rounded text-xs">GET /jobs-api</code>
                    <span className="text-muted-foreground">— Listings, filtered and paginated</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="bg-muted px-2 py-1 rounded text-xs">GET /jobs-api/sources</code>
                    <span className="text-muted-foreground">— Boards we aggregate and their fetch health</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="bg-muted px-2 py-1 rounded text-xs">GET /jobs-api/stats</code>
                    <span className="text-muted-foreground">— Totals and last aggregation time</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Query parameters</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parameter</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell><code className="text-xs">q</code></TableCell>
                        <TableCell className="text-xs">string</TableCell>
                        <TableCell className="text-xs">Case-insensitive match on title or description</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><code className="text-xs">tag</code></TableCell>
                        <TableCell className="text-xs">string</TableCell>
                        <TableCell className="text-xs">Single tag, for example <code>rust</code> or <code>writing</code></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><code className="text-xs">source</code></TableCell>
                        <TableCell className="text-xs">string</TableCell>
                        <TableCell className="text-xs">Source id from <code>/jobs-api/sources</code></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><code className="text-xs">pay_type</code></TableCell>
                        <TableCell className="text-xs">enum</TableCell>
                        <TableCell className="text-xs"><code>hourly</code>, <code>fixed</code> or <code>unknown</code></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><code className="text-xs">sort</code></TableCell>
                        <TableCell className="text-xs">enum</TableCell>
                        <TableCell className="text-xs"><code>newest</code> (default), <code>pay_desc</code> or <code>pay_asc</code></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><code className="text-xs">since</code></TableCell>
                        <TableCell className="text-xs">ISO 8601</TableCell>
                        <TableCell className="text-xs">Only listings seen after this timestamp — use it to poll for new work</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><code className="text-xs">limit</code></TableCell>
                        <TableCell className="text-xs">integer</TableCell>
                        <TableCell className="text-xs">1 to 100, default 25</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><code className="text-xs">offset</code></TableCell>
                        <TableCell className="text-xs">integer</TableCell>
                        <TableCell className="text-xs">0 to 10000, default 0</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Example response</h3>
                  <CodeBlock
                    language="json"
                    code={`{
  "count": 1,
  "total": 23,
  "limit": 25,
  "offset": 0,
  "has_more": false,
  "generated_at": "2026-08-24T18:00:00.000Z",
  "disclaimer": "Listings are aggregated from third-party boards and are not vetted by 0xNull. No escrow, no dispute mediation.",
  "jobs": [
    {
      "id": "monero-jobs:1a2b3c",
      "source": "monero-jobs",
      "title": "Rust developer for wallet tooling",
      "description": "Part-time contract, paid weekly in XMR.",
      "url": "https://monero.jobs/jobs/1a2b3c",
      "pay_xmr": 0.35,
      "pay_type": "hourly",
      "tags": ["rust", "monero"],
      "posted_at": "2026-08-22T09:14:00.000Z",
      "first_seen_at": "2026-08-22T10:00:00.000Z",
      "last_seen_at": "2026-08-24T18:00:00.000Z"
    }
  ]
}`}
                  />
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Poll for new listings</h3>
                  <CodeBlock
                    language="python"
                    code={`import requests, time

BASE = "${JOBS_BASE}"
last_seen = None

while True:
    params = {"limit": 100, "sort": "newest"}
    if last_seen:
        params["since"] = last_seen
    data = requests.get(BASE, params=params, timeout=20).json()

    for job in data["jobs"]:
        pay = f"{job['pay_xmr']} XMR" if job["pay_xmr"] else "pay not stated"
        print(job["title"], "-", pay, "-", job["url"])

    last_seen = data["generated_at"]
    time.sleep(600)  # the index refreshes every 30 minutes`}
                  />
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground space-y-2">
                  <p className="font-semibold text-foreground">Terms of use</p>
                  <p>Listings are third-party content, cached for up to 5 minutes and refreshed every 30 minutes. They are unvetted: we hold no funds, run no escrow and mediate no disputes. Keep the <code>url</code> intact so applicants reach the original board, and cache responses rather than hammering the endpoint.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Integration Examples */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Integration Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Telegram Bot</h3>
              <CodeBlock
                language="python"
                code={`async def bet(update, context):
    sport, side, amount = context.args[0], context.args[1], float(context.args[2])
    
    events = requests.get(f"{BASE}/sports/events?sport={sport}").json()
    event = events["events"][0]
    
    market_id = f"{sport}_{event['event_id']}_{event['home_team']}"
    requests.post(f"{BASE}/predictions/markets", json={
        "market_id": market_id,
        "title": f"{event['home_team']} to win",
        "oracle_type": "sports",
        "oracle_asset": event["event_id"],
        "oracle_condition": event["home_team"],
        "resolution_time": event["commence_timestamp"] + 10800
    })
    
    bet = requests.post(f"{BASE}/predictions/bet", json={
        "market_id": market_id,
        "side": side,
        "amount_usd": amount,
        "payout_address": user_xmr_address
    }).json()
    
    await update.message.reply_text(f"Send {bet['amount_xmr']} XMR to {bet['deposit_address']}")`}
              />
            </div>

            <div>
              <h3 className="font-semibold mb-2">AI Agent</h3>
              <CodeBlock
                language="python"
                code={`class OxNullAgent:
    def __init__(self, payout_address: str):
        self.base = "https://0xnull.io/api"
        self.payout_address = payout_address
    
    def get_odds(self, sport: str):
        return requests.get(f"{self.base}/sports/odds/{sport}").json()
    
    def place_bet(self, market_id: str, side: str, amount_usd: float):
        return requests.post(f"{self.base}/predictions/bet", json={
            "market_id": market_id,
            "side": side,
            "amount_usd": amount_usd,
            "payout_address": self.payout_address
        }).json()`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Rate Limits & Errors */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rate Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Limit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Sports API</TableCell>
                    <TableCell>20,000/month</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Esports API</TableCell>
                    <TableCell>1,000/hour</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Predictions API</TableCell>
                    <TableCell>No limit</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Error Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Meaning</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>400</TableCell>
                    <TableCell>Bad request</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>404</TableCell>
                    <TableCell>Not found</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>503</TableCell>
                    <TableCell>Service unavailable</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Verification & Support */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Verification & Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Market verification</h3>
              <p className="text-muted-foreground text-sm">
                v2 markets expose dollar pool totals and retain the pricing method and odds snapshot used for treasury seeding. Markets without an adapter price are seeded at even odds with pricing_method "even_fallback". They do not create a Monero address or view key. Legacy on-chain payouts remain linked from the payout archive.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">Clearnet</h4>
                <code className="text-xs bg-muted px-2 py-1 rounded">https://0xnull.io</code>
              </div>
              <div>
                <h4 className="font-medium mb-1">Tor</h4>
                <code className="text-xs bg-muted px-2 py-1 rounded break-all">{TOR_URL}</code>
              </div>
              <div>
                <h4 className="font-medium mb-1">I2P</h4>
                <code className="text-xs bg-muted px-2 py-1 rounded break-all">{I2P_URL}</code>
              </div>
              <div>
                <h4 className="font-medium mb-1">Health Check</h4>
                <code className="text-xs bg-muted px-2 py-1 rounded">GET /health</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default ApiDocs;
