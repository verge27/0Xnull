import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Shield, Copy, Check, AlertTriangle, User, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreatorAuth } from '@/hooks/useCreatorAuth';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

type Step = 'generate' | 'profile' | 'confirm';

const CreatorRegister = () => {
  const navigate = useNavigate();
  const { generatedKeypair, generateNewKeypair, register } = useCreatorAuth();
  
  const [step, setStep] = useState<Step>('generate');
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [savedKey, setSavedKey] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerate = () => {
    generateNewKeypair();
    setCopiedPublic(false);
    setCopiedPrivate(false);
    setSavedKey(false);
  };

  const copyToClipboard = async (text: string, type: 'public' | 'private') => {
    await navigator.clipboard.writeText(text);
    if (type === 'public') {
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2000);
    } else {
      setCopiedPrivate(true);
      setTimeout(() => setCopiedPrivate(false), 2000);
    }
    toast.success(`${type === 'public' ? 'Public' : 'Private'} key copied`);
  };

  const handleContinueToProfile = () => {
    if (!savedKey) {
      toast.error('Please confirm you have saved your private key');
      return;
    }
    setStep('profile');
  };

  const handleCreateProfile = () => {
    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }
    setStep('confirm');
  };

  const handleConfirmRegistration = async () => {
    if (!generatedKeypair) return;
    
    setIsSubmitting(true);
    try {
      await register(generatedKeypair.privateKey, displayName, bio || undefined);
      toast.success('Creator account created successfully!');
      navigate('/creator/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Become a Creator</h1>
          <p className="text-muted-foreground">
            Create your cryptographic identity. No email, no password, no KYC.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {(['generate', 'profile', 'confirm'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? 'bg-[#FF6600] text-white'
                    : i < ['generate', 'profile', 'confirm'].indexOf(step)
                    ? 'bg-[#FF6600]/20 text-[#FF6600]'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && (
                <div
                  className={`w-16 h-0.5 ${
                    i < ['generate', 'profile', 'confirm'].indexOf(step)
                      ? 'bg-[#FF6600]'
                      : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Generate Keypair */}
        {step === 'generate' && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[#FF6600]" />
                Generate Your Identity
              </CardTitle>
              <CardDescription>
                Your identity is a cryptographic keypair. The private key proves you own this account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!generatedKeypair ? (
                <Button
                  onClick={handleGenerate}
                  className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
                  size="lg"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Generate New Identity
                </Button>
              ) : (
                <>
                  {/* Public Key */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Your Public Key (Creator ID)
                    </label>
                    <div className="relative">
                      <Input
                        readOnly
                        value={generatedKeypair.publicKey}
                        className="font-mono text-xs pr-10 bg-muted/50"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => copyToClipboard(generatedKeypair.publicKey, 'public')}
                      >
                        {copiedPublic ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-xs text-blue-400 font-medium">
                        📤 Send this to admin for whitelist approval before continuing.
                      </p>
                    </div>
                  </div>

                  {/* Private Key */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Private Key (SECRET!)
                    </label>
                    <div className="relative">
                      <Input
                        readOnly
                        value={generatedKeypair.privateKey}
                        className="font-mono text-xs pr-10 bg-destructive/10 border-destructive/50"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => copyToClipboard(generatedKeypair.privateKey, 'private')}
                      >
                        {copiedPrivate ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                      <p className="text-xs text-destructive font-medium">
                        🔐 SAVE THIS NOW - Cannot be recovered. This is your login.
                      </p>
                    </div>
                  </div>

                  {/* Confirmation */}
                  <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                    <Checkbox
                      id="saved"
                      checked={savedKey}
                      onCheckedChange={(checked) => setSavedKey(checked as boolean)}
                      className="mt-0.5"
                    />
                    <label htmlFor="saved" className="text-sm cursor-pointer">
                      I have saved my private key in a secure location. I understand it cannot be recovered.
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleGenerate}
                      className="flex-1"
                    >
                      Regenerate
                    </Button>
                    <Button
                      onClick={handleContinueToProfile}
                      disabled={!savedKey}
                      className="flex-1 bg-[#FF6600] hover:bg-[#FF6600]/90"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Create Profile */}
        {step === 'profile' && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#FF6600]" />
                Create Your Profile
              </CardTitle>
              <CardDescription>
                Choose how you want to appear to your audience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name *</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your creator name"
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your audience about yourself..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {bio.length}/500
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('generate')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateProfile}
                  disabled={!displayName.trim()}
                  className="flex-1 bg-[#FF6600] hover:bg-[#FF6600]/90"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && generatedKeypair && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#FF6600]" />
                Confirm Your Identity
              </CardTitle>
              <CardDescription>
                Sign with your private key to prove ownership and create your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground">Creator ID</span>
                  <p className="font-mono text-sm break-all">
                    {generatedKeypair.publicKey.slice(0, 16)}...{generatedKeypair.publicKey.slice(-16)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Display Name</span>
                  <p className="font-medium">{displayName}</p>
                </div>
                {bio && (
                  <div>
                    <span className="text-xs text-muted-foreground">Bio</span>
                    <p className="text-sm">{bio}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('profile')}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmRegistration}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#FF6600] hover:bg-[#FF6600]/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Login Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Button
            variant="link"
            className="p-0 h-auto text-[#FF6600]"
            onClick={() => navigate('/creator/login')}
          >
            Sign in with your private key
          </Button>
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default CreatorRegister;
