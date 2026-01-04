import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Volume2, Play, Pause, Download, Loader2, Mic, Shield, Zap, Globe, Upload, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ChatWidget from "@/components/ChatWidget";
import { useToken } from "@/hooks/useToken";
import { api, type Voice, TIER_CONFIG } from "@/services/api";
import voiceBackground from "@/assets/voice-background.webp";

const tiers = [
  { id: "free", name: "Free", price: "Free", description: "100 chars max", maxChars: 100 },
  { id: "standard", name: "Standard", price: "$0.15/1k", description: "Fast", maxChars: 5000 },
  { id: "ultra", name: "Ultra", price: "$0.25/1k", description: "Best", maxChars: 5000 },
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
    description: "Clone any voice with just 10 seconds of audio ($2.00).",
  },
];

const VoicePage = () => {
  useSEO();
  const { hasToken, token, refreshBalance } = useToken();
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("");
  const [tier, setTier] = useState<"free" | "standard" | "ultra">("free");
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Voices from API
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);

  // Voice cloning state
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [cloneFile, setCloneFile] = useState<File | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [clonePreviewUrl, setClonePreviewUrl] = useState<string | null>(null);
  const cloneAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const isPremium = tier !== "free";
  const selectedVoice = voices.find(v => v.id === voice);
  const isClonedVoice = selectedVoice?.is_custom === true;
  const currentTierConfig = TIER_CONFIG[tier];
  const maxChars = currentTierConfig.maxChars;

  // Fetch voices and clones from API
  useEffect(() => {
    const fetchVoices = async () => {
      setIsLoadingVoices(true);
      try {
        // Fetch preset voices
        const result = await api.getVoices();
        let allVoices: Voice[] = result.voices || [];
        
        // Also fetch user's cloned voices if they have a token
        if (token) {
          try {
            const clonesResult = await api.getClones(token);
            if (clonesResult.clones && clonesResult.clones.length > 0) {
              // Map clones to voice format - use elevenlabs_id as the voice ID
              const clonedVoices = clonesResult.clones.map((c: any) => ({
                id: c.elevenlabs_id || String(c.id), // Use elevenlabs_id for TTS
                name: c.name,
                description: 'Cloned voice',
                provider: 'elevenlabs',
                is_custom: true
              }));
              allVoices = [...clonedVoices, ...allVoices];
            }
          } catch (e) {
            console.error("Failed to fetch clones:", e);
          }
        }
        
        setVoices(allVoices);
        // Set default voice to first preset
        const firstPreset = allVoices.find((v: Voice) => !v.is_custom);
        if (firstPreset && !voice) {
          setVoice(firstPreset.id);
        }
      } catch (error) {
        console.error("Failed to fetch voices:", error);
      } finally {
        setIsLoadingVoices(false);
      }
    };
    fetchVoices();
  }, [token]);

  // Refresh voices after cloning
  const refreshVoices = async () => {
    try {
      // Fetch preset voices
      const result = await api.getVoices();
      let allVoices: Voice[] = result.voices || [];
      
      // Also fetch user's cloned voices
      if (token) {
        try {
          const clonesResult = await api.getClones(token);
          if (clonesResult.clones && clonesResult.clones.length > 0) {
            // Map clones to voice format - use elevenlabs_id as the voice ID
            const clonedVoices = clonesResult.clones.map((c: any) => ({
              id: c.elevenlabs_id || String(c.id),
              name: c.name,
              description: 'Cloned voice',
              provider: 'elevenlabs',
              is_custom: true
            }));
            allVoices = [...clonedVoices, ...allVoices];
          }
        } catch (e) {
          console.error("Failed to fetch clones:", e);
        }
      }
      
      setVoices(allVoices);
    } catch (error) {
      console.error("Failed to refresh voices:", error);
    }
  };

  const calculateCost = (charCount: number, selectedTier: "free" | "standard" | "ultra") => {
    if (selectedTier === "free") return 0;
    const rate = selectedTier === "standard" ? 0.15 : 0.25;
    return (charCount / 1000) * rate;
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    setEstimatedCost(calculateCost(newText.length, tier));
  };

  const handleTierChange = (newTier: "free" | "standard" | "ultra") => {
    setTier(newTier);
    setEstimatedCost(calculateCost(text.length, newTier));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("audio/")) {
        toast.error("Please upload an audio file");
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File must be under 10MB");
        return;
      }
      setCloneFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setClonePreviewUrl(url);
    }
  };

  const togglePreviewPlayback = () => {
    if (!cloneAudioRef.current) return;
    if (isPreviewPlaying) {
      cloneAudioRef.current.pause();
    } else {
      cloneAudioRef.current.play();
    }
    setIsPreviewPlaying(!isPreviewPlaying);
  };

  const handleCloneVoice = async () => {
    if (!cloneFile || !cloneName.trim()) {
      toast.error("Please provide a name and audio file");
      return;
    }

    if (!hasToken || !token) {
      toast.error("Voice cloning requires a token. Create one to continue.");
      return;
    }

    setIsCloning(true);

    try {
      const result = await api.createClone(token, cloneName.trim(), cloneFile);
      
      // Refresh balance after clone
      await refreshBalance();
      
      // Refresh voices list
      await refreshVoices();
      setVoice(result.clone_id);
      toast.success(`Voice "${result.name}" cloned! Cost: $2.00`);
      
      // Reset and close dialog
      setCloneDialogOpen(false);
      setCloneName("");
      setCloneFile(null);
      setClonePreviewUrl(null);
    } catch (error) {
      console.error("Clone error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to clone voice";
      
      if (errorMessage === 'INSUFFICIENT_BALANCE') {
        toast.error("Insufficient balance. Voice cloning costs $2.00. Please top up your account.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsCloning(false);
    }
  };

  const generateSpeech = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text");
      return;
    }

    if (text.length > maxChars) {
      toast.error(`Text must be under ${maxChars} characters for ${tier} tier`);
      return;
    }

    if (!voice) {
      toast.error("Please select a voice");
      return;
    }

    // Cloned voices always require premium tier
    if (isClonedVoice && tier === "free") {
      toast.error("Cloned voices require Standard or Ultra tier");
      handleTierChange("standard");
      return;
    }

    // Premium tiers require token
    if (isPremium && !hasToken) {
      toast.error("Premium tiers require a token. Create one to continue.");
      return;
    }

    setIsLoading(true);
    setAudioUrl(null);

    try {
      const result = await api.generateSpeech(text, voice, tier, token || undefined);
      
      // Refresh balance after paid generation
      if (isPremium) {
        await refreshBalance();
      }
      
      // Create audio URL from base64
      const audioDataUrl = `data:audio/${result.format};base64,${result.audio}`;
      setAudioUrl(audioDataUrl);
      
      const costDollars = result.cost_cents / 100;
      if (costDollars > 0) {
        toast.success(`Audio generated! Cost: $${costDollars.toFixed(3)}`);
      } else {
        toast.success("Audio generated!");
      }
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
    <div className="min-h-screen flex flex-col relative">
      {/* Background image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${voiceBackground})`, zIndex: -2 }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-background/40 via-background/50 to-background/70" style={{ zIndex: -1 }} />
      
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
                Convert text to natural-sounding speech. Clone any voice for $2.
                No accounts, no tracking.
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
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="min-h-[150px] resize-none"
                  maxLength={maxChars}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>
                    {isPremium && text.length > 0 && (
                      <>Est. cost: <span className="text-primary font-medium">${estimatedCost.toFixed(3)}</span></>
                    )}
                  </span>
                  <span>{text.length}/{maxChars} characters</span>
                </div>
              </div>

              {/* Tier Selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">Quality Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  {tiers.map((t) => (
                    <Button
                      key={t.id}
                      variant={tier === t.id ? "default" : "outline"}
                      className="h-auto py-3 flex-col items-center relative"
                      onClick={() => handleTierChange(t.id as "free" | "standard" | "ultra")}
                      disabled={isClonedVoice && t.id === "free"}
                    >
                      {t.id !== "free" && !hasToken && (
                        <Badge variant="secondary" className="absolute -top-2 -right-2 text-[10px]">
                          Token
                        </Badge>
                      )}
                      <span className="font-semibold text-sm">{t.name}</span>
                      <Badge variant={t.id === "free" ? "outline" : "secondary"} className="text-[10px] mt-1">
                        {t.price}
                      </Badge>
                    </Button>
                  ))}
                </div>
                {isClonedVoice && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Cloned voices require Standard or Ultra tier
                  </p>
                )}
              </div>

              {/* Voice Selector with Clone Button */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Voice</label>
                  <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                        <Plus className="h-3 w-3" />
                        Clone Voice
                        <Badge variant="secondary" className="ml-1 text-[10px]">$2</Badge>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          Clone a Voice
                        </DialogTitle>
                        <DialogDescription>
                          Upload 10+ seconds of clear audio to clone any voice. Cost: $2.00
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        {!hasToken && (
                          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
                            Voice cloning requires a token. Click "Get Started" in the header to create one.
                          </div>
                        )}

                        <div>
                          <label className="text-sm font-medium mb-2 block">Voice Name</label>
                          <Input
                            placeholder="e.g., My Voice, Morgan Freeman..."
                            value={cloneName}
                            onChange={(e) => setCloneName(e.target.value)}
                            maxLength={50}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">Audio Sample</label>
                          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={handleFileChange}
                              className="hidden"
                              id="audio-upload"
                            />
                            <label htmlFor="audio-upload" className="cursor-pointer">
                              {cloneFile ? (
                                <div className="space-y-2">
                                  <Mic className="h-8 w-8 mx-auto text-primary" />
                                  <p className="text-sm font-medium">{cloneFile.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(cloneFile.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">
                                    Click to upload audio file
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    MP3, WAV, M4A • Max 10MB • 10+ seconds recommended
                                  </p>
                                </div>
                              )}
                            </label>
                          </div>
                        </div>

                        {clonePreviewUrl && (
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <audio
                              ref={cloneAudioRef}
                              src={clonePreviewUrl}
                              onEnded={() => setIsPreviewPlaying(false)}
                              className="hidden"
                            />
                            <Button variant="outline" size="sm" onClick={togglePreviewPlayback}>
                              {isPreviewPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <span className="text-sm text-muted-foreground">Preview audio</span>
                          </div>
                        )}

                        <Button
                          onClick={handleCloneVoice}
                          disabled={!cloneFile || !cloneName.trim() || isCloning || !hasToken}
                          className="w-full"
                        >
                          {isCloning ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Cloning...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Clone Voice - $2.00
                            </>
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Select value={voice} onValueChange={setVoice} disabled={isLoadingVoices}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingVoices ? "Loading voices..." : "Select a voice"} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Preset voices */}
                    {voices.filter(v => !v.is_custom).map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        <div className="flex items-center gap-2">
                          <span>{v.name}</span>
                          <span className="text-xs text-muted-foreground">{v.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                    
                    {/* Cloned voices */}
                    {voices.filter(v => v.is_custom).length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                          Your Cloned Voices
                        </div>
                        {voices.filter(v => v.is_custom).map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-3 w-3 text-primary" />
                              <span>{v.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={generateSpeech}
                disabled={isLoading || !text.trim() || !voice}
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
                    {isPremium && text.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        ~${estimatedCost.toFixed(3)}
                      </Badge>
                    )}
                  </>
                )}
              </Button>

              {audioUrl && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={togglePlayback}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={downloadAudio}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {isPlaying ? "Playing..." : "Ready to play"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Features */}
        <section className="py-12 container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="border-border/50">
                <CardHeader>
                  <feature.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
};

export default VoicePage;
