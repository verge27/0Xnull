import { Link as LinkIcon, ExternalLink, Globe, Shield, Download, AlertTriangle, CheckCircle } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitLinkForm } from "@/components/SubmitLinkForm";

const externalLinks = [
  {
    name: "Ahmia",
    url: "https://ahmia.fi/",
    onionAddress: "juhanurmihxlp77nkq76byazcldy2hlmovfu2epvl5ankdibsot4csyd.onion",
    description: "A search engine for indexing Tor onion services and hidden content.",
    category: "Search Engine",
    tags: ["Tor", "Onion", "Search Engine", "Privacy"],
    isRecommended: true
  },
  {
    name: "BBC News",
    url: "https://www.bbc.com/news",
    onionAddress: "bbcnewsd73hkzno2ini43t4gblxvycyac5aw4gnv7t2rccijh7745uqd.onion",
    description: "International edition mirror.",
    category: "News",
    tags: ["News", "Tor", "Mirror"],
    isRecommended: false
  },
  {
    name: "CIA",
    url: "https://www.cia.gov",
    onionAddress: "ciadotgov4sjwlzihbbgxnqg3xiyrg7so2r2o3lt5wz5ypk4sxyjstad.onion",
    description: "Official anonymous tip channel. Verify the onion address on cia.gov.",
    category: "Infrastructure",
    tags: ["Tor", "Official", "Whistleblowing"],
    isRecommended: false
  },
  {
    name: "Darknetlist",
    url: "https://darknetlist.is/",
    description: "A directory of darknet markets and privacy-focused services.",
    category: "Directory",
    tags: ["Darknet", "Privacy", "Directory"],
    isRecommended: true
  },
  {
    name: "Dread",
    url: "http://dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion/",
    onionAddress: "dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion",
    description: "A Reddit-like dark web discussion forum for darknet market news and community talk.",
    category: "Forum",
    tags: ["Darknet", "Forum", "Community", "Privacy"],
    isRecommended: false
  },
  {
    name: "DuckDuckGo",
    url: "https://duckduckgo.com",
    onionAddress: "duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion",
    description: "Searches the clearnet via Tor. Address published on DDG's official help pages.",
    category: "Search Engine",
    tags: ["Tor", "Search Engine", "Privacy"],
    isRecommended: false
  },
  {
    name: "Facebook",
    url: "https://facebook.com",
    onionAddress: "facebookwkhpilnemxj7asaniu7vnjjbiltxjqhye3mhbshg7kx5tfyd.onion",
    description: "Official Meta mirror. Network-layer privacy only — Meta still logs you.",
    category: "Comms",
    tags: ["Tor", "Mirror", "Social"],
    isRecommended: false
  },
  {
    name: "Just Another Library",
    url: "http://libraryfyuybp7oyidyya3ah5xvwgyx6weauoini7zyz555litmmumad.onion/",
    onionAddress: "libraryfyuybp7oyidyya3ah5xvwgyx6weauoini7zyz555litmmumad.onion",
    description: "Stick to public-domain material.",
    category: "Knowledge",
    tags: ["Tor", "Library", "Knowledge"],
    isRecommended: false
  },
  {
    name: "Mental Outlaw",
    url: "https://youtube.com/@mentaloutlaw?si=DzuNJpvBi5P6VZTk",
    description: "Privacy-focused tech commentary tutorials and security news.",
    category: "YouTube Channel",
    tags: ["Privacy", "Security", "YouTube", "Education"],
    isRecommended: true
  },
  {
    name: "NYT",
    url: "https://www.nytimes.com",
    onionAddress: "ej3kv4ebuugcmuwxctx5ic7zxh73rnxt42soo3tdneu2c2wu55j3vpyd.onion",
    description: "Paywall still applies.",
    category: "News",
    tags: ["News", "Tor", "Mirror"],
    isRecommended: false
  },
  {
    name: "ProPublica",
    url: "https://www.propublica.org",
    onionAddress: "p53lf57qovyuvwsc6xnrppyply3vtqm7l6pcobkmyqsiofyeznfu5uqd.onion",
    description: "First major outlet on Tor. Verify the onion address on propublica.org.",
    category: "News",
    tags: ["News", "Tor", "Mirror"],
    isRecommended: false
  },
  {
    name: "Proton Mail",
    url: "https://proton.me",
    onionAddress: "protonmailrmez3lotccipshtkleegetolb73fuirgj7r4o4vfu7ozyd.onion",
    description: "Published on Proton's official Tor access page.",
    category: "Comms",
    tags: ["Tor", "Email", "Privacy"],
    isRecommended: false
  },
  {
    name: "Reddit",
    url: "https://reddit.com",
    onionAddress: "reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion",
    description: "Official mirror.",
    category: "Comms",
    tags: ["Tor", "Forum", "Social"],
    isRecommended: false
  },
  {
    name: "Riseup",
    url: "https://riseup.net",
    description: "Publishes per-service onions on their Tor docs page. Verify via riseup.net.",
    category: "Comms",
    tags: ["Tor", "Email", "Privacy"],
    isRecommended: false
  },
  {
    name: "Sci-Hub",
    url: "https://en.wikipedia.org/wiki/Sci-Hub",
    description: "Onion address rotates. Check Ahmia for current mirrors.",
    category: "Knowledge",
    tags: ["Tor", "Research", "Knowledge"],
    isRecommended: false
  },
  {
    name: "SecureDrop",
    url: "https://securedrop.org",
    description: "Per-organization instances with unique onions. Pull addresses from securedrop.org.",
    category: "Whistleblowing",
    tags: ["Whistleblowing", "Privacy", "Journalism"],
    isRecommended: false
  },
  {
    name: "The Tor Project",
    url: "https://www.torproject.org",
    onionAddress: "2gzyxa5ihm7nsggfxnu52rck2vv4rvmdlkiu3zzui5du4xyclen53wid.onion",
    description: "Docs, downloads and Tor Metrics access without clearnet exit.",
    category: "Infrastructure",
    tags: ["Tor", "Browser", "Privacy"],
    isRecommended: false
  },
  {
    name: "Torch",
    url: "http://xmh57jrknzkhv6y3ls3ubitzfqnkrwxhopf5aygthi7d6rplyvk3noyd.onion/",
    onionAddress: "xmh57jrknzkhv6y3ls3ubitzfqnkrwxhopf5aygthi7d6rplyvk3noyd.onion",
    description: "Oldest index with ~1M+ sites. Unfiltered so expect more noise.",
    category: "Search Engine",
    tags: ["Tor", "Search Engine", "Darknet"],
    isRecommended: false
  },
  {
    name: "vx-underground",
    url: "https://vx-underground.org/",
    description: "The largest collection of malware source code, samples and papers on the internet.",
    category: "Research Archive",
    tags: ["Malware", "Security", "Research", "Papers"],
    isRecommended: false
  }
];

const ExternalLinks = () => {
  useSEO();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-3">External Links</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
              Curated privacy and darknet resources outside the 0xNull ecosystem
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">Focus: External privacy tools and directories</Badge>
            </div>
          </div>

          {/* External Links */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Recommended External Resources</h2>
            <div className="grid gap-6">
              {externalLinks.map((link, index) => (
                <Card key={index} className={`hover:border-primary/50 transition-colors ${link.isRecommended ? 'border-primary/30 bg-primary/5' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <LinkIcon className="h-5 w-5 text-primary" />
                          {link.name}
                          {link.isRecommended && <Badge className="bg-primary text-primary-foreground">Recommended</Badge>}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">{link.category}</Badge>
                        <Button variant="outline" size="sm" asChild>
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            Visit {link.name}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="mt-2">{link.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <h4 className="text-sm font-semibold mb-3">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {link.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    {link.onionAddress && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <h4 className="text-sm font-semibold mb-2">Tor Onion Address:</h4>
                        <code className="block text-xs bg-muted px-2 py-1 rounded break-all mb-2">
                          {link.onionAddress}
                        </code>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`http://${link.onionAddress}`} target="_blank" rel="noopener noreferrer">
                            Visit via Tor
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tor Access Explainer */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">How to Access Tor Links</h2>
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Visiting .onion addresses safely
                </CardTitle>
                <CardDescription>
                  Links ending in .onion only work inside the Tor network. A normal browser cannot open them. Use Tor Browser to reach these services without revealing your IP address or location.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tor Browser routes your traffic through multiple encrypted relays and strips identifying information at the network edge. It is the standard way to access darknet resources and is free to download.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <a
                      href="https://www.torproject.org/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Tor Browser
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <RouterLink to="/tor-guide">
                      Read our Tor Guide
                    </RouterLink>
                  </Button>
                </div>

                {/* Safety disclaimer */}
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Stay safe on Tor</h4>
                      <p className="text-sm text-muted-foreground">
                        Darknet resources can contain scams, malware or illegal offers. 0xNull does not control these sites and is not responsible for their content. Use Tor for privacy research, but never share real personal information, exchange funds without verification or assume every onion service is trustworthy.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Safety checklist */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Quick safety checklist</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Keep Tor Browser updated to the latest release</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Avoid logging into personal accounts or using your real identity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Do not download files or run scripts from unfamiliar onion sites</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Keep the browser window at default size to resist fingerprinting</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Use bridges or a VPN if your network blocks Tor connections</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Submit a link */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Suggest a Resource</h2>
            <SubmitLinkForm />
          </section>

          {/* Disclaimer */}
          <Card className="bg-secondary/30">
            <CardContent className="py-8">
              <h3 className="text-lg font-bold mb-4">Disclaimer</h3>
              <p className="text-sm text-muted-foreground">
                These links lead to external sites not operated by 0xNull. We share them because they align with our privacy-first values, but we cannot guarantee their content, uptime or security. Always do your own research before trusting any external service with funds or personal information.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ExternalLinks;
