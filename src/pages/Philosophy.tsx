import { Lock, Circle, ExternalLink, Clock } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const timelineEvents = [
  { year: "1985", title: "David Chaum publishes on digital cash", description: "Foundational cryptographic protocols for anonymous electronic payments" },
  { year: "1988", title: "The Crypto Anarchist Manifesto", description: "Tim May distributes his manifesto at the Crypto '88 conference" },
  { year: "1991", title: "PGP released", description: "Phil Zimmermann publishes Pretty Good Privacy, faces federal investigation" },
  { year: "1992", title: "Cypherpunks mailing list founded", description: "Eric Hughes, Tim May and John Gilmore establish the community" },
  { year: "1993", title: "A Cypherpunk's Manifesto", description: "Eric Hughes publishes the defining statement of cypherpunk philosophy" },
  { year: "1997", title: "Adam Back creates Hashcash", description: "Proof-of-work system, later foundational to Bitcoin" },
  { year: "2002", title: "Tor Project begins", description: "Anonymous communication network development starts at Naval Research Lab" },
  { year: "2008", title: "Bitcoin whitepaper", description: "Satoshi Nakamoto publishes \"Bitcoin: A Peer-to-Peer Electronic Cash System\"" },
  { year: "2014", title: "Monero launched", description: "Privacy-focused cryptocurrency with ring signatures and stealth addresses" },
];

const essentialReading = [
  {
    title: "A Cypherpunk's Manifesto",
    author: "Eric Hughes, 1993",
    url: "https://www.activism.net/cypherpunk/manifesto.html"
  },
  {
    title: "The Crypto Anarchist Manifesto",
    author: "Tim May, 1988",
    url: "https://www.activism.net/cypherpunk/crypto-anarchy.html"
  },
  {
    title: "Bitcoin: A Peer-to-Peer Electronic Cash System",
    author: "Satoshi Nakamoto, 2008",
    url: "https://bitcoin.org/bitcoin.pdf"
  },
  {
    title: "The Cyphernomicon",
    author: "Tim May, 1994 — Comprehensive FAQ on crypto anarchy",
    url: "https://nakamotoinstitute.org/static/docs/cyphernomicon.txt"
  }
];

const Philosophy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">The Philosophy</h1>
            <p className="text-xl text-muted-foreground">
              Privacy infrastructure built on cypherpunk principles and crypto-anarchist ideals
            </p>
          </div>

          {/* Cypherpunk Section */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Cypherpunk</h2>
                <p className="text-sm text-muted-foreground">The Builders • Est. late 1980s</p>
              </div>
            </div>

            <blockquote className="border-l-4 border-primary pl-6 py-4 mb-6 bg-secondary/30 rounded-r-lg">
              <p className="italic text-muted-foreground mb-2">
                "Privacy is necessary for an open society in the electronic age. Privacy is not secrecy. A private matter is something one doesn't want the whole world to know, but a secret matter is something one doesn't want anybody to know. Privacy is the power to selectively reveal oneself to the world."
              </p>
              <cite className="text-sm">— Eric Hughes, A Cypherpunk's Manifesto, 1993</cite>
            </blockquote>

            <div className="space-y-4 text-muted-foreground">
              <p>
                The cypherpunk movement emerged in the late 1980s and early 1990s—a loose coalition of cryptographers, programmers and privacy advocates united by a single conviction: strong encryption should be freely available to individuals, not monopolised by states and corporations.
              </p>
              <p>
                The name blends "cipher" (encryption) with "cyberpunk", reflecting both technical focus and countercultural attitude. Key figures included Eric Hughes, Tim May, John Gilmore and later Julian Assange and Hal Finney. They communicated via the Cypherpunks mailing list, sharing code, ideas and paranoia in equal measure.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 my-6">
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-1">PGP</h4>
                <p className="text-sm text-muted-foreground">Pretty Good Privacy, email encryption for the masses</p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-1">Tor</h4>
                <p className="text-sm text-muted-foreground">Anonymous communication network</p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-1">BitTorrent</h4>
                <p className="text-sm text-muted-foreground">Decentralised file sharing</p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-1">Bitcoin</h4>
                <p className="text-sm text-muted-foreground">Peer-to-peer electronic cash</p>
              </div>
            </div>

            <p className="text-muted-foreground">
              <strong className="text-foreground">Cypherpunks write code.</strong> That's the ethos. Not petitions, not lobbying, not manifestos alone—but working software deployed into the world. "Cypherpunks write code" became the movement's rallying cry. Privacy through technology, not legislation. Systems that work regardless of legal jurisdiction.
            </p>
          </section>

          <Separator className="my-12" />

          {/* Crypto Anarchism Section */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-lg bg-foreground/10 flex items-center justify-center">
                <Circle className="h-6 w-6 fill-current" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Crypto Anarchism</h2>
                <p className="text-sm text-muted-foreground">The Philosophy • Articulated 1988</p>
              </div>
            </div>

            <blockquote className="border-l-4 border-muted-foreground pl-6 py-4 mb-6 bg-secondary/30 rounded-r-lg">
              <p className="italic text-muted-foreground mb-2">
                "Computer technology is on the verge of providing the ability for individuals and groups to communicate and interact with each other in a totally anonymous manner... These developments will alter completely the nature of government regulation, the ability to tax and control economic interactions, the ability to keep information secret, and will even alter the nature of trust and reputation."
              </p>
              <cite className="text-sm">— Tim May, The Crypto Anarchist Manifesto, 1988</cite>
            </blockquote>

            <div className="space-y-4 text-muted-foreground">
              <p>
                Crypto anarchism is the political philosophy that emerged from cypherpunk practice. First articulated by Tim May in his 1988 manifesto (distributed at a hacker conference on printed sheets), it makes a simple but radical claim: cryptographic tools will inevitably undermine the state's ability to surveil, tax and regulate.
              </p>
              <p>
                This isn't advocacy—it's prediction. May wasn't campaigning for anarchism; he was observing that strong encryption, anonymous digital cash and pseudonymous communication would make centralised control technically infeasible. The tools would exist. People would use them. Governments couldn't stop mathematics.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 my-6">
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-1">Anonymous transactions</h4>
                <p className="text-sm text-muted-foreground">Commerce without identity</p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-1">Pseudonymous reputation</h4>
                <p className="text-sm text-muted-foreground">Trust without names</p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-1">Encrypted communication</h4>
                <p className="text-sm text-muted-foreground">Speech without interception</p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-1">Decentralised systems</h4>
                <p className="text-sm text-muted-foreground">Infrastructure without control points</p>
              </div>
            </div>

            <p className="text-muted-foreground">
              May predicted assassination markets, untraceable information trading and the emergence of "crypto-anarchy" as a parallel economy. Some predictions proved accurate (darknet markets and cryptocurrency). Others remain unrealised or took different forms. But the core insight holds: cryptography shifts power from institutions to individuals.
            </p>
          </section>

          <Separator className="my-12" />

          {/* The Distinction */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">The Distinction</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cypherpunks</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p>
                    The builders. Focus on creating tools—encryption software, anonymous networks and digital cash systems. Politically diverse. United by the belief that working code matters more than ideology. <em>"Don't argue. Deploy."</em>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Crypto Anarchists</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p>
                    The theorists. Focus on what these tools mean for power structures. Predict (and often welcome) the erosion of state control. See cryptography as inherently political, regardless of the builder's intent.
                  </p>
                </CardContent>
              </Card>
            </div>
            <p className="mt-6 text-muted-foreground">
              Most crypto anarchists are cypherpunks—they build the tools they theorise about. Not all cypherpunks accept the anarchist conclusions; some build privacy tools while believing in regulated society. The tools don't care about your politics.
            </p>
          </section>

          <Separator className="my-12" />

          {/* Timeline */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Timeline</h2>
            <div className="space-y-6">
              {timelineEvents.map((event, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-16 rounded bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{event.year}</span>
                    </div>
                    {idx < timelineEvents.length - 1 && (
                      <div className="w-px h-full bg-border mt-2" />
                    )}
                  </div>
                  <div className="pb-6">
                    <h4 className="font-semibold">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Separator className="my-12" />

          {/* Where We Stand */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Where We Stand</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                0xNull Marketplace builds privacy infrastructure. We operate in the cypherpunk tradition: working systems over theoretical arguments. Anonymous VPS hosting, cryptocurrency swaps and disposable phone numbers—tools that function regardless of jurisdiction.
              </p>
              <p>
                We don't advocate for any particular political outcome. We observe that these tools exist, that demand for privacy exists, and that we can provide services at the intersection. What you do with privacy is your business. Literally.
              </p>
              <p>
                Our services comply with the acceptable use policies of our infrastructure partners. We're not a shield for illegal activity—we're a layer of privacy on top of legitimate infrastructure. The same privacy that protects dissidents protects you from marketing databases. The same anonymity that enables whistleblowers enables you to sign up for a service without surrendering your phone number.
              </p>
              <p className="font-semibold text-foreground">
                Privacy is a prerequisite for autonomy. That's not a political statement. It's an architectural one.
              </p>
            </div>
          </section>

          <Separator className="my-12" />

          {/* In Summary */}
          <section className="mb-16">
            <Card className="bg-secondary/30">
              <CardContent className="py-8">
                <h2 className="text-2xl font-bold mb-4">In Summary</h2>
                <p className="text-lg text-muted-foreground">
                  We build privacy infrastructure because the technology permits it and because privacy is a prerequisite for individual autonomy. No KYC, no accounts, no surveillance. Just cryptography and commerce.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Essential Reading */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Essential Reading</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {essentialReading.map((reading, idx) => (
                <Card key={idx} className="hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-1">{reading.title}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{reading.author}</p>
                    <Button variant="outline" size="sm" asChild>
                      <a href={reading.url} target="_blank" rel="noopener noreferrer">
                        Read
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Philosophy;
