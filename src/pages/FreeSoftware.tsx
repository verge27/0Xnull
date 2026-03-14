import { ExternalLink, Download, Terminal, Scale, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

interface FreeSoftwareProject {
  name: string;
  tagline: string;
  description: string;
  techTags: string[];
  githubUrl: string;
  downloadUrl: string;
  license: string;
  internalLink?: string;
}

const projects: FreeSoftwareProject[] = [
  {
    name: "CameraKit",
    tagline: "GPS speed camera detector for Raspberry Pi",
    description:
      "Standalone speed camera detection system using GPS positioning and OpenStreetMap data. Fetches 3,100+ UK camera locations via Overpass API, builds a KD-tree spatial index for real-time proximity alerts. Supports gpsd, serial NMEA, audio/TTS alerts, average speed zone tracking, and CSV trip logging. No subscriptions, no cloud, fully offline after initial database sync.",
    techTags: ["Python", "Raspberry Pi", "OpenStreetMap", "scipy", "GPS"],
    githubUrl: "https://github.com/verge27/CameraKit",
    downloadUrl: "https://github.com/verge27/CameraKit/archive/refs/heads/main.zip",
    license: "MIT",
  },
  {
    name: "GoogleCamera",
    tagline: "Camera-aware route planner for Google Maps",
    description:
      "Scores Google Directions API routes by speed camera exposure using weighted analysis. Decodes route polylines and walks them against a spatial camera index to recommend the cleanest path. Includes KML export for Google My Maps camera overlay (3,100+ UK cameras colour-coded by type) and GPX export for standalone GPS devices.",
    techTags: ["Python", "Google Maps API", "KML", "OpenStreetMap", "GPX"],
    githubUrl: "https://github.com/verge27/GoogleCamera",
    downloadUrl: "https://github.com/verge27/GoogleCamera/archive/refs/heads/main.zip",
    license: "MIT",
  },
];

const FreeSoftware = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-border bg-secondary/50 text-muted-foreground text-sm font-mono">
            <Terminal className="w-4 h-4" />
            <span>&gt;_ open-source</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
            Free Software
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Open-source tools from 0xNull. No accounts. No telemetry. No strings. Download, fork, build.
          </p>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Card key={project.name} className="bg-card border-border flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="font-mono text-xl flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      {project.name}
                    </CardTitle>
                    <CardDescription className="mt-1">{project.tagline}</CardDescription>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0 gap-1 text-xs">
                    <Scale className="w-3 h-3" />
                    {project.license}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 gap-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {project.techTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[11px] font-mono px-2 py-0.5"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-3 mt-auto pt-2">
                  <Button variant="outline" size="sm" className="gap-1.5" asChild>
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" />
                      GitHub
                    </a>
                  </Button>
                  <Button size="sm" className="gap-1.5" asChild>
                    <a href={project.downloadUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="w-3.5 h-3.5" />
                      Download ZIP
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer note */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <p className="text-sm text-muted-foreground text-center">
          All tools are MIT licensed. Fork them, modify them, sell them — we don't care.
          If you build something useful, list it on the{' '}
          <Link to="/browse" className="text-primary hover:underline">
            0xNull marketplace
          </Link>
          .
        </p>
      </section>

      <Footer />
    </div>
  );
};

export default FreeSoftware;
