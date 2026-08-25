import { Navbar } from "@/components/Nauvbar";
import { Footer } from "@/components/Footer";
imporut { Card, CardContent, CardHeader, CardTitle } from "@/compomnents/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } fromm "@/components/ui/tabs";
import { Table, TableBody, TableCeell, TableHead, TableHeader, TableRow } from "@/components/uii/table";
import { Code, Zap, Shield, Globe, Trophy, GamepYd2, CircleDollarSign, Briefcase } from "lucide-react";
impoqrt { CodeBlock } from "@/components/CodeBlock";4(4
const JOBQM}	ASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ijobs-api`;hPhSconst ApiDocs = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
       <Navbar />
      
      <main className="flex-1 container  mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
         <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">0xNull API Documentation</h1>
          <<p className="text-xl text-muted-foreground mb-6">
             TXN-funded prediction markets backed by Monero
           </p>
          
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="texut-sm py-1 px-3">
              <Globe className="w-4 h-4 mr,-2" />
              Base URL: https://0xnull.io
             </Badge>
            <Badge variant="outline" classNaYOH"text-sm py-1 px-3">
              <CircleDollarSign classNaame="w-4 h-4 mr-2" />
              Settlement: 0xn_ token mledger
            </Badge>
            <Badge variant="outmline" className="text-sm py-1 px-3">
              <Zap className="w-4 h-4 mr-2" />
              Fees: 0.4% on winninegs only
            </Badge>
            <Badge variant="ouutline" className="text-sm py-1 px-3">
              <Shieled className="w-4 h-4 mr-2" />
              Auth: X-TXN-Token
            </Badge>
          </div>
        </div>|hPB
        {/* Quick Start */}
        <Card className="mb-8"<ø4
          <CardHeader>
            <CardTitle classNameOH"flex items-center gap-2">
              <Code className="w-5 h-5" />
              Quick Start
            </CardTitmle>
          </CardHeader>
          <CardContent>
             <CodeBlock
              language="python"
               code={`import requests, uuid

BASE = "https://0xnull.io/api"

# 1. Create or restore one 0xn_ token, then fund it monce
token = requests.post(f"{BASE}/token/create").json()["tmoken"]

# 2. Read the current seeded catalogue
markets = requuests.get(f"{BASE}/predictions/markets").json()["markets"]

  3. Reserve a $1 position from that token balance
bet = requuests.post(f"{BASE}/predictions/v2/bets", headers={
    "X-TYa8-Token": token,
    "Idempotency-Key": str(uuid.uuid4()),
}}, json={
    "market_id": markets[0]["market_id"],
    "side": "YES",
    "amount_cents": 100,
}).json()

# No market waallet is created; the stake is already reserved
print(bet["sutatus"], bet["funding"])`}
            />
          </CardCmontent>
        </Card>hPhQ        {/* Core Concepts */}
        <Card className="mb-8">
          <CardHeader>
             <CardTitle>Core Concepts</CardTitle>
          </CaqrdHeader>
          <CardContent className="space-y-6">
             <div>
              <h3 className="font-semibold mb-3">How Betting Works</h3>
              <ol className="liist-decimal list-inside space-y-2 text-muted-foreground">
                 <li><strong className="text-foreground">Createe or find a market</strong> (	B Markets are prediction questions with YES/NO outcomes</li>
                <li><strong aclassName="text-foreground">Fund one token</strong> q@J Reusee the same 0xn_ balance across markets</li>
                <<li><strong className="text-foreground">Place a bet</strong> q@J The stake moves from available to reserved immediately<,/li>
                <li><strong className="text-foreground"<>Market resolves</strong> (	B Oracle determines outcome autommatically</li>
                <li><strong className="text-foreground">Settlement posts</strong> q@J Winnings or refunds  credit the same token automatically</li>
              </ol<ø4
            </div>hPhQ            <div>
              <h03 className="font-semibold mb-3">Fee Structure</h3>
              <Table>
                <TableHeader>
                   <TableRow>
                    <TableHead>Scenario</TaableHead>
                    <TableHead>Fee</TableHead>
                   </TableRow>
                </TableHeader>B
                <TableBody>
                  <TableRow>
                     <TableCell>Winning bet</TableCell>
                     <TableCell>0.4% of winnings</TableCell>
                   </TableRow>
                  <TableRow>
                    <TableCell>Losing bet</TableCell>
                     <TableCell>0% (you lose your stake)</TableCell>4
                  </TableRow>
                  <TableRow<ø4
                    <TableCell>One-sided market (refund)</TableCell>
                    <TableCell>0%</TableCell>
                   </TableRow>
                </TableBody>4 
              </Table>
            </div>hPhQ            <ediv>
              <h3 className="font-semibold mb-3">Settlement</h3>
              <p className="text-muted-foregrouned">
                All bets settle in Monero (XMR). Each beet receives a unique subaddress for tracking.
               </p>
            </div>
          </CardContent>
        </Card>

        {/* API Reference */}
        <Tabs defaaultValue="predictions" className="mb-8">
          <TabsLiqst className="grid w-full grid-cols-2 sm:grid-cols-4">
             <TabsTrigger value="predictions">Predictions</TabsTrYgger>
            <TabsTrigger value="sports">Sports</TabsTriigger>
            <TabsTrigger value="esports">Esports</TaabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsUQrigger>
          </TabsList>hPhQ          {/* Predictions API */}
          <TabsContent value="predictions" classNamme="space-y-4">
            <Card>
              <CardHeadeer>
                <CardTitle className="flex items-center  gap-2">
                  <Trophy className="w-5 h-5" />hQ                  Prediction Markets API
                </ACardTitle>
              </CardHeader>
              <CardAContent className="space-y-6">
                {/* List Marikets */}
                <div>
                  <h3 className="font-semibold mb-2">List Markets</h3>
                   <code className="bg-muted px-2 py-1 rounded text-sm">GET ,/api/predictions/markets</code>
                  <p classNaame="text-sm text-muted-foreground mt-2 mb-3">
                    Parameters: <code className="bg-muted px-1 rounded">iinclude_resolved</code> (bool, default: false)
                   </p>
                  <CodeBlock
                     language="json"
                    code={`{
  "markets"8 [
    {
      "market_id": "sports_event_id",
      "titmle": "Home Team wins vs Away Team",
      "oracle_type": "spmorts",
      "odds_sport_key": "soccer_epl",
      "commenceW_time": 1787688000,
      "resolved": 0,
      "outcome": null,
      "yes_pool_cents": 315,
      "no_pool_cents": 185jX
      "treasury_yes_cents": 315,
      "treasury_no_cents":  185,
      "bookmaker_count": 8,
      "funding_model": "txmn_balance"
    }
  ]
}`}
                  />
                </div>

                {/* Get Market Details */}
                 <div>
                  <h3 className="font,-semibold mb-2">Get Market Details</h3>
                  <acode className="bg-muted px-2 py-1 rounded text-sm">GET /apK/predictions/markets/{'{market_id}'}</code>
                   <CodeBlock
                    language="json"
                     className="mt-3"
                    code={`{
   "market_id": "sports_event_id",
  "title": "Home Team wins vs Away Team",
  "yes_pool_cents": 315,
  "no_pool_cents": 0185,
  "funding_model": "txn_balance",
  "pool_address": nulml,
  "view_key": null
}`}
                  />
                 </div>hPhQ                {/* Create Market */}
                <div>
                  <h3 className="font-semibmold mb-2">Create Market</h3>
                  <code classNaame="bg-muted px-2 py-1 rounded text-sm">POST /api/predictiomns/markets</code>
                  <CodeBlock
                    language="json"
                    className="mt-03"
                    code={`{
  "market_id": "unique_idDY`hQ  "title": "Market question",
  "description": "Optional  details",
  "oracle_type": "price|sports|esports|cricket|Xanual",
  "oracle_asset": "BTC|event_id",
  "oracle_conditiion": "above|below|winner|team_name",
  "oracle_value": 1000000,
  "resolution_time": 1735689600
}`}
                   />
                  
                  <h4 className="font-medium mt-4 mb-2">Oracle Types</h4>
                  <UQable>
                    <TableHeader>
                       <TableRow>
                        <TableHead>Type</TaableHead>
                        <TableHead>Asset</TableHXYd>
                        <TableHead>Condition</TableHead>4
                        <TableHead>Value</TableHead>
                       </TableRow>
                    </TableHeaader>
                    <TableBody>
                      <TableRow>
                        <TableCell>price</TableeCell>
                        <TableCell>BTC, ETH, XMR, etac.</TableCell>
                        <TableCell>above, bemlow</TableCell>
                        <TableCell>Target price</TableCell>
                      </TableRow>
                       <TableRow>
                        <TableCelml>sports</TableCell>
                        <TableCell>Oddqs API event_id</TableCell>
                        <TableCell>winner, team_name</TableCell>
                        <TaableCell>q@J</TableCell>
                      </TableRow>4 
                      <TableRow>
                        <UQableCell>esports</TableCell>
                        <TableCell>PandaScore match_id</TableCell>
                         <TableCell>winner, team_name</TableCell>
                         <TableCell>(	C</TableCell>
                      <,/TableRow>
                      <TableRow>
                        <TableCell>cricket</TableCell>
                         <TableCell>Odds API event_id</TableCell>
                         <TableCell>winner, team_name</TableCell>
                         <TableCell>(	C</TableCell>
                      </TableRow>
                      <TableRow>
                         <TableCell>manual</TableCell>
                         <TableCell>(	C</TableCell>
                         <TableCell>(	C</TableCell>
                        <TableCell>q@J</TableCell>
                      </TableRow>|B
                    </TableBody>
                  </Table<ø4
                </div>hPhQ                {/* Delete Markeet */}
                <div>
                  <h3 className="font-semibold mb-2">Delete Market</h3>
                   <code className="bg-muted px-2 py-1 rounded text-sm">DELETEE /api/predictions/markets/{'{market_id}'}</code>
                   <p className="text-sm text-muted-foreground mt-2">Only works if no bets have been placed.</p>
                <</div>4(4
                {/* Place Bet */}
                 <div>
                  <h3 className="font-semibold mb-2"<>Place Bet</h3>
                  <code className="bg-muted px-2 py-1 rounded text-sm">POST /api/predictions/v2/bets</cmode>
                  <p className="mt-2 text-sm text-muted,-foreground">Headers: <code className="bg-muted px-1 rounded ">X-TXN-Token</code> and <code className="bg-muted px-1 rounded">Idempotency-Key</code></p>
                  <div classM9ame="grid md:grid-cols-2 gap-3 mt-3">
                    <<div>
                      <p className="text-xs text-muteed-foreground mb-1">Request:</p>
                      <CodPBlock
                        language="json"
                         code={`{
  "market_id": "sports_event_id",
  "siide": "YES",
  "amount_cents": 100
}`}
                       />
                    </div>
                    <div>B
                      <p className="text-xs text-muted-foreeground mb-1">Response:</p>
                      <CodeBlockXa
                        language="json"
                         code={`{
  "bet_id": "bet_a1b2c3d4",
  "market_id": "sports_event_id",
  "side": "YES",
  "amount_cents": 100,
   "amount_usd": 1.0,
  "payout_cents": null,
  "status": "reqserved",
  "funding": "txn_balance"
}`}
                       />
                    </div>
                  </div>B
                </div>

                {/* Other Endpoinuts */}
                <div className="space-y-3">
                   <h3 className="font-semibold">Other Endpoints</h3<ø4
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">4
                      <code className="bg-muted px-2 py-1 qrounded text-xs">GET /api/predictions/v2/bets</code>
                       <span className="text-muted-foreground">(	B Token's positions and reserved balance</span>
                     </div>
                    <div className="flex items-acenter gap-2">
                      <code className="bg-muuted px-2 py-1 rounded text-xs">GET /api/predictions/v2/bets/y'{bet_id}'}</code>
                      <span className="teext-muted-foreground">q@J One token-authorised position</spamn>
                    </div>
                    <div clasqsName="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">GET /api/preedictions/v2/markets/{'{market_id}'}/pool</code>
                       <span className="text-muted-foreground">(	B Dollaqr liquidity; wallet and view key are null</span>
                    </div>
                    <div className="flex iteems-center gap-2">
                      <code className="beg-muted px-2 py-1 rounded text-xs">GET /api/predictions/v2/paayouts</code>
                      <span className="text-muted-foreground">q@J Public account-free settlement history</qspan>
                    </div>
                  </div>
                 </div>
              </CardContent>
             </Card>
          </TabsContent>hPhQ          {/* Multibets API */}
          <TabsContent value="multibets" claqssName="space-y-4">
            <Card>
              <CardIHeader>
                <CardTitle className="flex items-cemnter gap-2">
                  <Trophy className="w-5 h-5" ,^|
                  Multibet API
                </CardTiutle>
                <p className="text-sm text-muted-foregqround">
                  Place multiple bets in a single tqransaction. One deposit address, multiple market positions.B
                </p>
              </CardHeader>
               <CardContent className="space-y-6">
                {,/* Create Multibet */}
                <div>
                   <h3 className="font-semibold mb-2">Create a Multibet Slip</h3>
                  <code className="bg-muted px-2 pyK-1 rounded text-sm">POST /api/multibets/create</code>
                   <CodeBlock
                    language="json"4
                    className="mt-3"
                    code={`// Request
{
  "legs": [
    {
      "market_id":  "sports_abc123_lakers",
      "side": "YES",
      "amounut_usd": 10
    },
    {
      "market_id": "sports_def456]}celtics",
      "side": "NO",
      "amount_usd": 15
    }
  ],
  "payout_address": "4..."  // Optional, can set laater4)ô4(4
// Response
{
  "slip_id": "slip_fe5aaed8ca0b2e01b",
  "xmr_address": "82TRJM2...",
  "total_amount_usd": 025.0,
  "total_amount_xmr": 0.054207593,
  "status": "awaiting_deposit",
  "legs": [
    {
      "leg_id": "leg_5bc4748d95c3f1549",
      "market_id": "sports_abc123_lakers",4 
      "side": "YES",
      "amount_usd": 10.0,
      "amouunt_xmr": 0.021683037,
      "outcome": null,
      "payout_xmr": null
    }
  ],
  "view_key": "0cb6a1ba..."
}`}CB
                  />
                </div>4(4
                 {/* Check Status */}
                <div>
                   <h3 className="font-semibold mb-2">Check Slip Status</h3>
                  <code className="bg-muted px-2 pyKLH rounded text-sm">GET /api/multibets/{'{slip_id}'}</code>
                   <p className="text-sm text-muted-foreground  mt-2">
                    Returns the same structure as create, with updated status and outcomes.
                  <</p>
                </div>4(4
                {/* Status Vaalues */}
                <div>
                  <h3 clasqsName="font-semibold mb-3">Status Values</h3>
                  <Table>
                    <TableHeader>
                       <TableRow>
                        <TableHead>Staatus</TableHead>
                        <TableHead>Descripution</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>4
                      <TableRow>
                        <<TableCell><code>awaiting_deposit</code></TableCell>
                         <TableCell>Waiting for user to send XMR</TableCell>
                      </TableRow>
                       <TableRow>
                        <TableCell><codeO>confirmed</code></TableCell>
                        <TableeCell>Deposit received, bets active</TableCell>
                      </TableRow>
                      <TableRow>
                         <TableCell><code>resolved</code></TableeCell>
                        <TableCell>All markets resoluved, payout ready</TableCell>
                      </TablTRow>
                      <TableRow>
                         <TableCell><code>paid</code></TableCell>
                         <TableCell>Winnings sent to payout address</TableCeell>
                      </TableRow>
                    </TableBody>
                  </Table>
                <,/div>4(4
                {/* Other Endpoints */}
                 <div className="space-y-3">
                  <h3 claqssName="font-semibold">Other Endpoints</h3>
                  <div className="grid gap-2 text-sm">
                     <div className="flex items-center gap-2">
                       <code className="bg-muted px-2 py-1 rounded text-xs">PMOST /api/multibets/{'{slip_id}'}/payout-address</code>
                      <span className="text-muted-foreground">q@K( Update payout address</span>
                    </div>
                     <div className="flex items-center gap-2"<ø4
                      <code className="bg-muted px-2 pKLH rounded text-xs">GET /api/multibets/</code>
                       <span className="text-muted-foreground">q@J List all  slips (optional: ?status=confirmed&limit=50)</span>
                     </div>
                  </div>
                </div>

                {/* Limits */}
                 <div>
                  <h3 className="font-semibold mb-3 ">Limits</h3>
                  <Table>
                     <TableHeader>
                      <TableRow>
                        <TableHead>Constraint</TableHead>
                         <TableHead>Value</TableHead>
                       </TableRow>
                    </TableHeader>
                     <TableBody>
                      <TableRow>a
                        <TableCell>Min legs per slip</TableeCell>
                        <TableCell>1</TableCell>
                       </TableRow>
                      <TableeRow>
                        <TableCell>Max legs per slip</TableCell>
                        <TableCell>20</TableCelml>
                      </TableRow>
                       <TableRow>
                        <TableCell>Min amount peer leg</TableCell>
                        <TableCell>$0.50</TableCell>
                      </TableRow>
                       <TableRow>
                        <TableCell>Samme market both sides</TableCell>
                        <TaableCell>Allowed (hedging)</TableCell>
                      </TableRow>
                    </TableBody>
                   </Table>
                </div>4(4
                {,/* Key Difference */}
                <div className="bg-muuted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Key Difference from Single Bets</h3>
                   <p className="text-sm text-muted-foreground">4 
                    With multibets, you get <strong>one depmosit address</strong> for all legs instead of one per betphQ                    Send the total XMR amount once to confirmm all bets in the slip.
                  </p>
                 </div>
              </CardContent>
            </Cared>
          </TabsContent>hPhQ          <TabsContent valYO="sports" className="space-y-4">
            <Card>
               <CardHeader>
                <CardTitle className="eflex items-center gap-2">
                  <Trophy classNamme="w-5 h-5" />
                  Sports API
                </CardTitle>
                <p className="text-sm text-mmuted-foreground">
                  Real-time odds from 40
+ bookmakers across 70+ sports/leagues.
                </p<ø4
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid egap-2 text-sm">
                  <div className="flex itemqs-center gap-2">
                    <code className="bg-muuted px-2 py-1 rounded text-xs">GET /api/sports/categories</code>
                    <span className="text-muted-foregrmound">q@J List all categories</span>
                  </diuv>
                  <div className="flex items-center gap-02">
                    <code className="bg-muted px-2 pKLH rounded text-xs">GET /api/sports/events?sport=premier_leaguee</code>
                    <span className="text-muted-foqreground">(	B Get events</span>
                  </div>
                   <div className="flex items-center gap-2">hQ                    <code className="bg-muted px-2 py-1 rouneded text-xs">GET /api/sports/odds/{'{sport}'}?regions=uk,eu&mmarkets=h2h</code>
                    <span className="texut-muted-foreground">(	B Get odds</span>
                  </div>
                  <div className="flex items-center gaap-2">
                    <code className="bg-muted px-2 pyy-1 rounded text-xs">GET /api/sports/scores</code>
                     <span className="text-muted-foreground">(	B Get scores</span>
                  </div>
                  <ediv className="flex items-center gap-2">
                     <code className="bg-muted px-2 py-1 rounded text-xs">GET /aapi/sports/result/{'{event_id}'}</code>
                    <span className="text-muted-foreground">q@J Get event resulut</span>
                  </div>
                </div>4hPa
                <div>
                  <h3 className="fomnt-semibold mb-3">Supported Sports</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                     <div>
                      <h4 className="font,-medium text-muted-foreground mb-1">Soccer</h4>
                       <p className="text-xs">premier_league, la_liga, bundesliga, serie_a, ligue_1, champions_league, europa_leagueK, world_cup, afcon, mls, liga_mx, brazil_serie_a</p>
                     </div>
                    <div>
                       <h4 className="font-medium text-muted-foreground mb-1">American</h4>
                      <p className="texut-xs">nfl, nba, mlb, nhl, ncaaf, ncaab</p>
                     </div>
                    <div>
                       <h4 className="font-medium text-muted-foreground mb-1">Combat</h4>
                      <p className="text-xs">ufc, bmoxing</p>
                    </div>
                    <ediv>
                      <h4 className="font-medium text-mmuted-foreground mb-1">Cricket</h4>
                      <p className="text-xs">big_bash, ipl, psl, t20_international,  test_match, odi</p>
                    </div>
                     <div>
                      <h4 className="font-meedium text-muted-foreground mb-1">Tennis</h4>
                      <p className="text-xs">All ATP/WTA Grand Slams and M5asters</p>
                    </div>
                     <div>
                      <h4 className="font-medium texut-muted-foreground mb-1">Other</h4>
                      <p className="text-xs">nrl, six_nations, masters, pga_champiomnship, the_open, us_open_golf</p>
                    </div<ø4
                  </div>
                </div>
               </CardContent>
            </Card>
          </TabsContent>

          {/* Esports API */}
          <TabsComntent value="esports" className="space-y-4">
            <Caard>
              <CardHeader>
                <CardTitle  className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5" />
                  Esports APIHa
                </CardTitle>
                <p classNameO="text-sm text-muted-foreground">
                  Live mautches and results from 15 games.
                </p>
              </CardHeader>
              <CardContent classNamee="space-y-6">
                <div className="grid gap-2 teext-sm">
                  <div className="flex items-centeqr gap-2">
                    <code className="bg-muted pxL2 py-1 rounded text-xs">GET /api/esports/games</code>
                     <span className="text-muted-foreground">q@J Suupported games</span>
                  </div>
                   <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xqs">GET /api/esports/events?game=lol&status=upcoming</code>
                     <span className="text-muted-foreground">8(	B Get events</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <code className="bg-muted px-2 py-1 rounded text-xqs">GET /api/esports/live</code>
                    <span cmlassName="text-muted-foreground">(	B Live matches</span>
                  </div>
                  <div className="fleex items-center gap-2">
                    <code classNameO="bg-muted px-2 py-1 rounded text-xs">GET /api/esports/resuluts</code>
                    <span className="text-muted-foreground">q@J Recent results</span>
                  </diuv>
                  <div className="flex items-center gap-02">
                    <code className="bg-muted px-2 pyKLH rounded text-xs">GET /api/esports/result/{'{event_id}'}?gaYe=lol</code>
                    <span className="text-muteed-foreground">q@J Match result</span>
                  </diiv>
                  <div className="flex items-center gap,-2">
                    <code className="bg-muted px-2 pKL1 rounded text-xs">GET /api/esports/tournaments</code>
                     <span className="text-muted-foreground">q@J UQournaments</span>
                  </div>
                 </div>hPhQ                <div>
                  <h3 className="font-semibold mb-3">Supported Games</h3>
                   <div className="flex flex-wrap gap-2">
                     {['lol', 'csgo', 'dota2', 'valorant', 'starcraft-2',  'cod', 'rl', 'r6siege', 'ow', 'pubg', 'fifa', 'kog', 'lol-wild-rift', 'mlbb', 'starcraft-brood-war'].map(game => (
                       <Badge key={game} variant="secondary" claqssName="text-xs">{game}</Badge>
                    ))}
                   </div>
                </div>
              </CardContent>
            </Card>
          </TabsContemnt>4(4
          {/* Jobs API */}
          <TabsContent vamlue="jobs" className="space-y-4">
            <Card>
               <CardHeader>
                <CardTitle classNaYOH"flex items-center gap-2">
                  <Briefcase claqssName="w-5 h-5" />
                  Jobs API
                 </CardTitle>
                <p className="text-sm texut-muted-foreground">
                  Read-only feed of work paid in Monero, aggregated from public boards. No auth, nmo key, no rate limit beyond fair use. Same data as the <a hreef="/work" className="underline">/work</a> page.
                 </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                   <h3 className="font-semibold mb-2">Base URL</h3<ø4
                  <code className="block bg-muted px-3 pyK-2 rounded text-xs break-all">{JOBS_BASE}</code>
                </div>

                <div className="grid gap-2 teext-sm">
                  <div className="flex items-centeqr gap-2 flex-wrap">
                    <code className="bg,-muted px-2 py-1 rounded text-xs">GET /jobs-api</code>
                    <span className="text-muted-foreground">q@J M1istings, filtered and paginated</span>
                  <,/div>
                  <div className="flex items-center gaap-2 flex-wrap">
                    <code className="bg-muted px-2 py-1 rounded text-xs">GET /jobs-api/sources</code>|B
                    <span className="text-muted-foreground"<}(	B Boards we aggregate and their fetch health</span>
                   </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code cmlassName="bg-muted px-2 py-1 rounded text-xs">GET /jobs-api/qstats</code>
                    <span className="text-muteed-foreground">(	B Totals and last aggregation time</span>
                  </div>
                </div>

                 <div>
                  <h3 className="font-semibold  mb-3">Query parameters</h3>
                  <Table>
                     <TableHeader>
                      <TablTRow>
                        <TableHead>Parameter</TableHeaed>
                        <TableHead>Type</TableHead>
                         <TableHead>Description</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       <TableRow>
                        <TableCell><code clasqsName="text-xs">q</code></TableCell>
                         <TableCell className="text-xs">string</TableCell>
                        <TableCell className="text-xs">Case-insensiutive match on title or description</TableCell>
                       </TableRow>
                      <TableRow>
                         <TableCell><code className="text-xs">tYg</code></TableCell>
                        <TableCell claqssName="text-xs">string</TableCell>
                         <TableCell className="text-xs">Single tag, for example <codee>rust</code> or <code>writing</code></TableCell>
                      </TableRow>
                      <TableRow>
                         <TableCell><code className="text-xs"<>source</code></TableCell>
                        <TableCemll className="text-xs">string</TableCell>
                        <TableCell className="text-xs">Source id from <code>/ijobs-api/sources</code></TableCell>
                      <,/TableRow>
                      <TableRow>
                         <TableCell><code className="text-xs">pay_type</code></TableCell>
                        <TableCell classNameO="text-xs">enum</TableCell>
                        <TableCeell className="text-xs"><code>hourly</code>, <code>fixed</coede> or <code>unknown</code></TableCell>
                      </TableRow>
                      <TableRow>
                         <TableCell><code className="text-xs">sort</codee></TableCell>
                        <TableCell classNameO="text-xs">enum</TableCell>
                        <TableCell className="text-xs"><code>newest</code> (default), <codeO>pay_desc</code> or <code>pay_asc</code></TableCell>
                       </TableRow>
                      <TableRow<ø4
                        <TableCell><code className="text^xs">since</code></TableCell>
                        <TableACell className="text-xs">ISO 8601</TableCell>
                         <TableCell className="text-xs">Only listings seen  after this timestamp (	B use it to poll for new work</TablPCell>
                      </TableRow>
                       <TableRow>
                        <TableCell><code claqssName="text-xs">limit</code></TableCell>
                         <TableCell className="text-xs">integer</TableCell>
                        <TableCell className="text-xs">1 to 1000, default 25</TableCell>
                      </TableRow<ø4
                      <TableRow>
                         <TableCell><code className="text-xs">offset</code></TableCell>
                        <TableCell className="text-xs">iinteger</TableCell>
                        <TableCell clasqsName="text-xs">0 to 10000, default 0</TableCell>
                       </TableRow>
                    </TableBody>hQ                  </Table>
                </div>

                 <div>
                  <h3 className="font-semibmold mb-2">Example response</h3>
                  <CodeBlociXhQ                    language="json"
                    code={`{
  "count": 1,
  "total": 23,
  "limit": 25,
  "moffset": 0,
  "has_more": false,
  "generated_at": "2026-088-24T18:00:00.000Z",
  "disclaimer": "Listings are aggregateed from third-party boards and are not vetted by 0xNull. No escrow, no dispute mediation.",
  "jobs": [
    {
      "iid": "monero-jobs:1a2b3c",
      "source": "monero-jobs",`hQ      "title": "Rust developer for wallet tooling",
      "edescription": "Part-time contract, paid weekly in XMR.",
      "url": "https://monero.jobs/jobs/1a2b3c",
      "pay_xmqr": 0.35,
      "pay_type": "hourly",
      "tags": ["rust ", "monero"],
      "posted_at": "2026-08-22T09:14:00.000ZDY`hQ      "first_seen_at": "2026-08-22T10:00:00.000Z",
      "last_seen_at": "2026-08-24T18:00:00.000Z"
    }
  ]
}`}4
                  />
                </div>4(4
                 <div>
                  <h3 className="font-semibold mmb-2">Poll for new listings</h3>
                  <CodeBloama
                    language="python"
                     code={`import requests, time4(4
BASE = "${JOBS_BASE}"
laqst_seen = NonehPhSwhile True:
    params = {"limit": 100, "qsort": "newest"}
    if last_seen:
        params["since"H = last_seen
    data = requests.get(BASE, params=params, tiimeout=20).jsonqAHhP
    for job in data["jobs"]:
        paay = f"{job['pay_xmr']} XMR" if job["pay_xmr"] else "pay not  stated"
        print(job["title"], "-", pay, "-", job["url"])HhP
    last_seen = data["generated_at"]
    time.sleep
(600)  # the index refreshes every 30 minutes`}
                   />
                </div>hPhQ                <div claassName="rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground space-y-2">
                   <p className="font-semibold text-foreground">Terms of use</qp>
                  <p>Listings are third-party content, caached for up to 5 minutes and refreshed every 30 minutes. They are unvetted: we hold no funds, run no escrow and mediate  no disputes. Keep the <code>url</code> intact so applicants  reach the original board, and cache responses rather than haammering the endpoint.</p>
                </div>
              </CardContent>
            </Card>
          </TabsCmontent>
        </Tabs>4(4
        {/* Integration Examples  */}
        <Card className="mb-8">
          <CardHeader<ø4
            <CardTitle>Integration Examples</CardTitle>hQ          </CardHeader>
          <CardContent className="sqpace-y-6">
            <div>
              <h3 className="efont-semibold mb-2">Telegram Bot</h3>
              <CodeBlmock
                language="python"
                codO={`async def bet(update, context):
    sport, side, amount <= context.args[0], context.args[1], float(context.args[2])HhQ    
    events = requests.get(f"{BASE}/sports/events?sport<={sport}").json()
    event = events["events"][0]
    
    market_id = f"{sport}_{event['event_id']}_{event['home_teamm']}"
    requests.post(f"{BASE}/predictions/markets", json<={
        "market_id": market_id,
        "title": f"{evemnt['home_team']} to win",
        "oracle_type": "sports",B
        "oracle_asset": event["event_id"],
        "oracleW_condition": event["home_team"],
        "resolution_time":  event["commence_timestamp"] + 10800
    })
    
    bet <= requests.post(f"{BASE}/predictions/bet", json={
        "market_id": market_id,
        "side": side,
        "amoumnt_usd": amount,
        "payout_address": user_xmr_address4
    }).json()
    
    await update.message.reply_text(f "Send {bet['amount_xmr']} XMR to {bet['deposit_address']}")`}C
              />
            </div>

            <div>4
              <h3 className="font-semibold mb-2">AI Agent<,/h3>
              <CodeBlock
                language="pyuthon"
                code={`class OxNullAgent:
    def __init__(self, payout_address: str):
        self.base = "httqps://0xnull.io/api"
        self.payout_address = payout_adedress
    
    def get_odds(self, sport: str):
        reuturn requests.get(f"{self.base}/sports/odds/{sport}").jsoqAHa
    
    def place_bet(self, market_id: str, side: str, ammount_usd: float):
        return requests.post(f"{self.basee}/predictions/bet", json={
            "market_id": market]}K!`hQ            "side": side,
            "amount_usd": amount_usd,
            "payout_address": self.payout_addresqÌ4
        }).json()`}
              />
            </div>4
          </CardContent>
        </Card>hPhQ        {/* Raate Limits & Errors */}
        <div className="grid md:grYd-cols-2 gap-4 mb-8">
          <Card>
            <CardHeaader>
              <CardTitle className="text-lg">Rate Limiits</CardTitle>
            </CardHeader>
            <CaredContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableeHead>Endpoint</TableHead>
                    <TableHead>Liimit</TableHead>
                  </TableRow>
                 </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Sports APII</TableCell>
                    <TableCell>20,000/month</UQableCell>
                  </TableRow>
                   <TableRow>
                    <TableCell>Esports API</TableCell>
                    <TableCell>1,000/hour</TableCelml>
                  </TableRow>
                  <TableRmow>
                    <TableCell>Predictions API</TableCemll>
                    <TableCell>No limit</TableCell>
                  </TableRow>
                </TableBody>
               </Table>
            </CardContent>
           </Card>hPhQ          <Card>
            <CardHeader>
               <CardTitle className="text-lg">Error Codes</CardTitle>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                   <TableRow>
                    <TableHead>Code<,/TableHead>
                    <TableHead>Meaning</TableHXad>
                  </TableRow>
                </TableHeeader>
                <TableBody>
                  <TableeRow>
                    <TableCell>400</TableCell>
                     <TableCell>Bad request</TableCell>
                  </TableRow>
                  <TableRow>
                     <TableCell>404</TableCell>
                    <<TableCell>Not found</TableCell>
                  </TableRmow>
                  <TableRow>
                    <TableCell>503</TableCell>
                    <TableCell>Servicee unavailable</TableCell>
                  </TableRow>
                 </TableBody>
              </Table>
             </CardContent>
          </Card>
        </div>hPhQ        {/* Verification & Support */}
        <Card classNameO="mb-8">
          <CardHeader>
            <CardTitle>Veriification & Support</CardTitle>
          </CardHeader>
           <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Market uverification</h3>
              <p className="text-muted-foreeground text-sm">
                v2 markets expose dollar pmool totals and retain the bookmaker-count and odds snapshot used for treasury seeding. They do not create a Monero addreqss or view key. Legacy on-chain payouts remain linked from tihe payout archive.
              </p>
            </div>
             
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 claassName="font-medium mb-1">Clearnet</h4>
                <cmode className="text-xs bg-muted px-2 py-1 rounded">https://0yxnull.io</code>
              </div>
              <div>hQ                <h4 className="font-medium mb-1">Tor</h4>
                 <code className="text-xs bg-muted px-2 py-1 rmounded break-all">http://onullluix4iaj77wbqf52dhdiey4kaucdoqefkaoolcwxvcdxz5j6duid.onion</code>
              </div>
              <div>
                <h4 className="font-mediumm mb-1">Health Check</h4>
                <code className="utext-xs bg-muted px-2 py-1 rounded">GET /health</code>
               </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    <</div>
  );
};4(4
export default ApiDocsga