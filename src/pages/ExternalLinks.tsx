import { Link as LinkIcon, ExternalLink, Globe, Shield, Download } from "lucide-react";
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
    name: "Darknetlist",
    url: "https://darknetlist.is/",
    description: "A directory of darknet markets and privacy-focused services.",
    category: "Directory",
    tags: ["Darknet", "Privacy", "Directory"],
    isRecommended: true
  },
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
    name: "Dread",
    url: "http://dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion/",
    onionAddress: "dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion",
    description: "A Reddit-like dark web discussion forum for darknet market news and community talk.",
    category: "Forum",
    tags: ["Darknet", "Forum", "Community", "Privacy"],
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
