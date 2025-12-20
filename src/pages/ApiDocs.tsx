import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Code, Zap, Shield, Globe, Trophy, Gamepad2, CircleDollarSign } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";

const ApiDocs = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">0xNull API Documentation</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Permissionless prediction markets with Monero settlement
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="text-sm py-1 px-3">
              <Globe className="w-4 h-4 mr-2" />
              Base URL: https://0xnull.io
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              <CircleDollarSign className="w-4 h-4 mr-2" />
              Settlement: Monero (XMR)
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              <Zap className="w-4 h-4 mr-2" />
              Fees: 0.4% on winnings only
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              <Shield className="w-4 h-4 mr-2" />
              Auth: None — permissionless
            </Badge>
          </div>
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
              code={`import requests

BASE = "https://0xnull.io/api"

# 1. Get upcoming sports events
events = requests.get(f"{BASE}/sports/events?sport=premier_league").json()

# 2. Get odds with best price aggregation
odds = requests.get(f"{BASE}/sports/odds/premier_league").json()

# 3. Create a prediction market
market = requests.post(f"{BASE}/predictions/markets", json={
    "market_id": "epl_liverpool_win_2024",
    "title": "Liverpool to win vs Man City",
    "oracle_type": "sports",
    "oracle_asset": "event_id_here",
    "oracle_condition": "Liverpool",
    "resolution_time": 1703462400
}).json()

# 4. Place a bet
bet = requests.post(f"{BASE}/predictions/bet", json={
    "market_id": "epl_liverpool_win_2024",
    "side": "YES",
    "amount_usd": 100,
    "payout_address": "4..."  # Your XMR address
}).json()

# Returns deposit address — send XMR to confirm bet
print(bet["deposit_address"])
print(bet["amount_xmr"])`}
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
                <li><strong className="text-foreground">Place a bet</strong> — You get a unique XMR deposit address</li>
                <li><strong className="text-foreground">Send XMR</strong> — Your bet is confirmed when deposit is received</li>
                <li><strong className="text-foreground">Market resolves</strong> — Oracle determines outcome automatically</li>
                <li><strong className="text-foreground">Payouts processed</strong> — Winners split losers' pool proportionally</li>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="sports">Sports</TabsTrigger>
            <TabsTrigger value="esports">Esports</TabsTrigger>
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
      "market_id": "btc_100k_dec2024",
      "title": "BTC above $100k by Dec 31",
      "description": "Will Bitcoin exceed $100,000 USD?",
      "oracle_type": "price",
      "oracle_asset": "BTC",
      "oracle_condition": "above",
      "oracle_value": 100000,
      "resolution_time": 1735689600,
      "resolved": 0,
      "outcome": null,
      "yes_pool_xmr": 2.5,
      "no_pool_xmr": 1.8,
      "created_at": 1703462400
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
  "market_id": "btc_100k_dec2024",
  "title": "BTC above $100k by Dec 31",
  "yes_pool_xmr": 2.5,
  "no_pool_xmr": 1.8,
  "pool_address": "4...",
  "view_key": "...",
  "bets": [
    {
      "side": "YES",
      "amount_xmr": 0.5,
      "status": "confirmed",
      "created_at": 1703462400
    }
  ]
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
                  <code className="bg-muted px-2 py-1 rounded text-sm">POST /api/predictions/bet</code>
                  <div className="grid md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Request:</p>
                      <CodeBlock
                        language="json"
                        code={`{
  "market_id": "btc_100k_dec2024",
  "side": "YES",
  "amount_usd": 100,
  "payout_address": "4..."
}`}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Response:</p>
                      <CodeBlock
                        language="json"
                        code={`{
  "bet_id": "bet_a1b2c3d4",
  "market_id": "btc_100k_dec2024",
  "side": "YES",
  "amount_usd": 100,
  "amount_xmr": 0.625,
  "xmr_price": 160.0,
  "deposit_address": "8...",
  "address_index": 5,
  "view_key": "...",
  "expires_at": "2024-12-25T12:00:00Z",
  "status": "awaiting_deposit"
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
                      <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/predictions/bet/{'{bet_id}'}/status</code>
                      <span className="text-muted-foreground">— Status: awaiting_deposit, confirmed, paid</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">POST /api/predictions/bet/{'{bet_id}'}/payout-address</code>
                      <span className="text-muted-foreground">— Update payout address</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/predictions/pool/{'{market_id}'}</code>
                      <span className="text-muted-foreground">— Pool balances + view key</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">POST /api/predictions/scan-deposits</code>
                      <span className="text-muted-foreground">— Scan wallets for deposits</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">POST /api/predictions/markets/{'{market_id}'}/resolve</code>
                      <span className="text-muted-foreground">— Resolve market (optional: outcome=YES|NO)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">POST /api/predictions/markets/{'{market_id}'}/process-payouts</code>
                      <span className="text-muted-foreground">— Distribute funds to winners</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">POST /api/predictions/resolve-due</code>
                      <span className="text-muted-foreground">— Auto-resolve due markets</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/predictions/payouts</code>
                      <span className="text-muted-foreground">— Payout history</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sports API */}
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
              <h3 className="font-semibold mb-2">Pool Verification</h3>
              <p className="text-muted-foreground text-sm">
                Every pool exposes its view key. Import address + view key into any Monero wallet to verify deposits independently.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">Clearnet</h4>
                <code className="text-xs bg-muted px-2 py-1 rounded">https://0xnull.io</code>
              </div>
              <div>
                <h4 className="font-medium mb-1">Tor</h4>
                <code className="text-xs bg-muted px-2 py-1 rounded break-all">http://onullluix4iaj77wbqf52dhdiey4kaucdoqfkaoolcwxvcdxz5j6duid.onion</code>
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
