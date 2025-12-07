import { useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Volume2, Play, Pause, Download, Loader2, Mic, Shield, Zap, Globe } from "lucide-react";
import { toast } from "sonner";
import ChatWidget from "@/components/ChatWidget";

const voices = [
  { id: "bella", name: "Bella", description: "Warm and friendly" },
  { id: "nicole", name: "Nicole", description: "Clear and professional" },
  { id: "sarah", name: "Sarah", description: "Soft and gentle" },
  { id: "sky", name: "Sky", description: "Bright and energetic" },
  { id: "adam", name: "Adam", description: "Deep and confident" },
  { id: "michael", name: "Michael", description: "Calm and authoritative" },
];

const features = [
  {
    icon: Shield,
    title: "Privacy First",
    description: "No accounts, no tracking. Pay with crypto and stay anonymous.",
  },
  {
    icon: Zap,
    title: "Instant Generation",
    description: "High-quality voice synthesis in seconds, not minutes.",
  },
  {
    icon: Globe,
    title: "Multiple Voices",
    description: "Choose from a variety of natural-sounding AI voices.",
  },
  {
    icon: Mic,
    title: "Voice Cloning",
    description: "Coming soon: Clone any voice with just 10 seconds of audio.",
  },
];

const Voice = () => {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("bella");
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateSpeech = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text");
      return;
    }

    if (text.length > 5000) {
      toast.error("Text must be under 5000 characters");
      return;
    }

    setIsLoading(true);
    setAudioUrl(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nanogpt-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text, voice }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      toast.success("Audio generated successfully");
    } catch (error) {
      console.error("TTS error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate speech");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "voice-output.mp3";
    a.click();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <Badge variant="outline" className="mb-4">
                <Volume2 className="h-3 w-3 mr-1" />
                AI Voice Synthesis
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Private Text-to-Speech
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Convert text to natural-sounding speech. No accounts, no tracking.
                Pay with crypto and maintain your privacy.
              </p>
            </div>
          </div>
        </section>

        {/* TTS Interface */}
        <section className="py-12 container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Generate Speech
              </CardTitle>
              <CardDescription>
                Enter your text below and select a voice to generate audio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Textarea
                  placeholder="Enter the text you want to convert to speech..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[150px] resize-none"
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {text.length}/5000 characters
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Voice</label>
                <Select value={voice} onValueChange={setVoice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        <span className="font-medium">{v.name}</span>
                        <span className="text-muted-foreground ml-2">
                          — {v.description}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={generateSpeech}
                disabled={isLoading || !text.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Generate Speech
                  </>
                )}
              </Button>

              {audioUrl && (
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={togglePlayback}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-0 transition-all" />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={downloadAudio}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Features */}
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.title}>
                  <CardContent className="pt-6">
                    <feature.icon className="h-8 w-8 text-primary mb-4" />
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-12 container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Pay As You Go</h2>
          <div className="max-w-md mx-auto text-center">
            <Card>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold mb-2">$0.002</p>
                <p className="text-muted-foreground mb-4">per 1,000 characters</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary">XMR</Badge>
                  <Badge variant="secondary">BTC</Badge>
                  <Badge variant="secondary">ETH</Badge>
                  <Badge variant="secondary">USDT</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
};

export default Voice;
