import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Coins, Download, RefreshCw, Target, Smartphone, Monitor, ExternalLink } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { SEORichText } from "@/components/SEORichText";

type Step = "landing" | "get-crypto" | "get-wallet" | "get-xmr" | "ready";

const GetStarted = () => {
  useSEO({
    title: 'How to Use Anonymous Crypto Prediction Markets | Get Started – 0xNull',
    description: 'Learn how to use anonymous crypto prediction markets on 0xNull. No KYC, no accounts, Monero payments, and full privacy from the start.',
  });
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("landing");
  const [hasCrypto, setHasCrypto] = useState<boolean | null>(null);

  const handleHasCrypto = (has: boolean) => {
    setHasCrypto(has);
    // Always start with wallet, regardless of crypto status
    setCurrentStep("get-wallet");
  };

  const getStepNumber = () => {
    if (currentStep === "get-wallet") return 1;
    if (currentStep === "get-crypto") return 2; // Only shown if no crypto
    if (currentStep === "get-xmr") return hasCrypto ? 2 : 3;
    return 0;
  };

  const getTotalSteps = () => (hasCrypto ? 2 : 3);

  const renderProgressIndicator = () => {
    if (currentStep === "landing" || currentStep === "ready") return null;
    
    const stepNum = getStepNumber();
    const total = getTotalSteps();
    
    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-2 w-12 rounded-full transition-colors ${
              i + 1 <= stepNum ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-2">
          Step {stepNum} of {total}
        </span>
      </div>
    );
  };

  const renderLanding = () => (
    <div className="text-center space-y-8 max-w-2xl mx-auto">
      <div className="space-y-4">
        <Badge variant="secondary" className="text-sm">
          Get Started in Minutes
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold">
          Do you have crypto?
        </h1>
        <p className="text-xl text-muted-foreground">
          Let's get you set up to bet with privacy. No accounts, no KYC.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button
          size="lg"
          variant="outline"
          className="text-lg px-8 py-6"
          onClick={() => handleHasCrypto(false)}
        >
          <Coins className="mr-2 h-5 w-5" />
          No, I need crypto
        </Button>
        <Button
          size="lg"
          className="text-lg px-8 py-6"
          onClick={() => handleHasCrypto(true)}
        >
          Yes, I have crypto
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      <div className="pt-8">
        <button
          onClick={() => setCurrentStep("ready")}
          className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
        >
          Already have XMR? Skip to betting →
        </button>
      </div>
    </div>
  );

  const renderGetCrypto = () => (
    <div className="space-y-8 max-w-2xl mx-auto">
      {renderProgressIndicator()}
      
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Coins className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">
          Buy crypto without KYC
        </h1>
        <p className="text-lg text-muted-foreground">
          Get Bitcoin, USDT, or other crypto with no identity verification.
        </p>
      </div>

      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <Button
            size="lg"
            className="w-full text-lg py-6"
            onClick={() => window.open("https://trocador.app/?ref=mkaShKWUZA", "_blank")}
          >
            Go to Trocador
            <ExternalLink className="ml-2 h-5 w-5" />
          </Button>
          
          <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-sm text-center">
              <span className="font-semibold text-amber-400">Tip:</span> Click the{" "}
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">Buy/Sell</span>{" "}
              tab at the top right to buy crypto with fiat
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 text-center">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-medium">No account required</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-medium">Card or bank transfer</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-medium">Takes 5-10 minutes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={() => setCurrentStep("get-xmr")}
        >
          I have crypto now
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );

  const renderGetWallet = () => (
    <div className="space-y-8 max-w-2xl mx-auto">
      {renderProgressIndicator()}
      
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Download className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">
          Download Cake Wallet
        </h1>
        <p className="text-lg text-muted-foreground">
          Cake Wallet is the easiest way to hold and send Monero (XMR).
          <br />Available on iOS, Android, and desktop.
        </p>
      </div>

      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button
              size="lg"
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => window.open("https://apps.apple.com/app/cake-wallet/id1334702542", "_blank")}
            >
              <Smartphone className="h-6 w-6" />
              <span>iOS</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => window.open("https://play.google.com/store/apps/details?id=com.cakewallet.cake_wallet", "_blank")}
            >
              <Smartphone className="h-6 w-6" />
              <span>Android</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => window.open("https://cakewallet.com", "_blank")}
            >
              <Monitor className="h-6 w-6" />
              <span>Desktop</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 text-center">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-medium">Free to download</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-medium">You control your keys</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-medium">Built-in exchange</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={() => setCurrentStep(hasCrypto ? "get-xmr" : "get-crypto")}
        >
          I have Cake Wallet
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );

  const renderGetXMR = () => (
    <div className="space-y-8 max-w-2xl mx-auto">
      {renderProgressIndicator()}
      
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <RefreshCw className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">
          Swap to Monero
        </h1>
        <p className="text-lg text-muted-foreground">
          Exchange your crypto for XMR using our built-in swap.
          <br />Best rates, no account needed.
        </p>
      </div>

      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <Button
            size="lg"
            className="w-full text-lg py-6"
            onClick={() => navigate("/swaps")}
          >
            Swap to XMR
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <div className="mt-8 space-y-4">
            <h3 className="font-semibold text-center">How it works</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <p>Choose what you're sending (BTC, ETH, USDT, etc.)</p>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <p>Paste your Cake Wallet XMR address</p>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  3
                </div>
                <p>Send → Receive XMR in minutes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={() => setCurrentStep("ready")}
        >
          I have XMR → Start Betting
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );

  const renderReady = () => (
    <div className="space-y-8 max-w-2xl mx-auto text-center">
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
          <Check className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold">
          You're ready
        </h1>
        <p className="text-xl text-muted-foreground">
          Scan a QR code. Send XMR. That's it.
          <br />No account. No KYC. No limits.
        </p>
      </div>

      <div className="pt-4">
        <Button
          size="lg"
          className="text-lg px-8 py-6"
          onClick={() => navigate("/predictions")}
        >
          <Target className="mr-2 h-5 w-5" />
          Browse Markets
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate("/esports-predictions")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">🎮 Esports</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>CS2, League, Dota 2 & more</CardDescription>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate("/sports-predictions")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">⚽ Sports</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Football, Basketball, Tennis</CardDescription>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate("/predictions/sports/combat")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">🥊 Combat</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>UFC, Boxing, MMA</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case "landing":
        return renderLanding();
      case "get-crypto":
        return renderGetCrypto();
      case "get-wallet":
        return renderGetWallet();
      case "get-xmr":
        return renderGetXMR();
      case "ready":
        return renderReady();
      default:
        return renderLanding();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 md:py-20">
        {renderStep()}
      </main>
      
      {/* SEO Rich Text Section */}
      <SEORichText 
        title="How to Use Anonymous Crypto Prediction Markets on 0xNull"
        content="<p>Getting started with 0xNull is simple, private, and requires no KYC. The platform is designed so users can access anonymous prediction markets, crypto services, and digital utilities without creating accounts or submitting personal information.</p><p>To begin using 0xNull's anonymous crypto prediction markets, users only need a supported cryptocurrency wallet. There is no registration process, no identity verification, and no data tracking. All interactions are crypto-native, with support for privacy-focused assets like Monero to ensure confidential transactions.</p><p>Once connected, users can explore sports predictions, crypto predictions, esports markets, anonymous services, and crypto swaps—all from a single privacy-first ecosystem. Every action on 0xNull is designed to minimize data exposure while maintaining transparent market mechanics.</p><p>Whether you want to place a prediction, swap cryptocurrencies, or access anonymous services, 0xNull removes traditional barriers and prioritizes user sovereignty. There are no accounts to manage, no centralized custody, and no surveillance-based restrictions.</p><p>Get started with 0xNull today and experience anonymous, no-KYC prediction markets and crypto services—built for privacy by default.</p>"
      />
      
      <Footer />
    </div>
  );
};

export default GetStarted;
