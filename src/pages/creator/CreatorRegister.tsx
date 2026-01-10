import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Shield, Copy, Check, AlertTriangle, User, ArrowRight, Loader2, WifiOff, ShieldX, CheckCircle2, XCircle, Search, Trash2, RotateCcw, X, Import, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCreatorAuth } from '@/hooks/useCreatorAuth';
import { creatorApi } from '@/services/creatorApi';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

type Step = 'generate' | 'profile' | 'confirm';

type ErrorType = 'whitelist' | 'conflict' | 'network' | 'unknown' | null;

interface RegistrationError {
  type: ErrorType;
  message: string;
}

type WhitelistStatus = 'unchecked' | 'checking' | 'approved' | 'pending' | 'error';

const parseRegistrationError = (error: unknown): RegistrationError => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  const lowerMessage = message.toLowerCase();

  console.log('[CreatorRegister] parseRegistrationError:', message);

  // Conflict errors (409 - already registered)
  if (
    lowerMessage.includes('409') ||
    lowerMessage.includes('conflict') ||
    lowerMessage.includes('already registered') ||
    lowerMessage.includes('already exists') ||
    lowerMessage.includes('duplicate')
  ) {
    return {
      type: 'conflict',
      message:
        'This public key is already registered. Use “Sign in” with the same private key instead of registering again.',
    };
  }

  // Whitelist/authorization errors
  if (
    lowerMessage.includes('403') ||
    lowerMessage.includes('whitelist') ||
    lowerMessage.includes('not approved') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('forbidden')
  ) {
    return {
      type: 'whitelist',
      message:
        'Your public key is not yet whitelisted. Please send your public key to an admin for approval before registering.',
    };
  }

  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('cors') ||
    lowerMessage.includes('failed to fetch') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('proxy error')
  ) {
    return {
      type: 'network',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
    };
  }

  // Unknown error
  return {
    type: 'unknown',
    message: message || 'An unexpected error occurred. Please try again.',
  };
};

type KeypairMode = 'generate' | 'import';

const CreatorRegister = () => {
  const navigate = useNavigate();
  const { generatedKeypair, generateNewKeypair, importKeypair, clearKeypair, hasStoredKeypair, register } = useCreatorAuth();
  
  const [step, setStep] = useState<Step>('generate');
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [savedKey, setSavedKey] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationError, setRegistrationError] = useState<RegistrationError | null>(null);
  const [whitelistStatus, setWhitelistStatus] = useState<WhitelistStatus>('unchecked');
  const [whitelistMessage, setWhitelistMessage] = useState<string>('');
  const [showRestoredNotice, setShowRestoredNotice] = useState(true);
  
  // Import mode state
  const [keypairMode, setKeypairMode] = useState<KeypairMode>('generate');
  const [importPrivateKey, setImportPrivateKey] = useState('');
  const [showImportKey, setShowImportKey] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportKeypair = async () => {
    setImportError(null);
    const trimmedKey = importPrivateKey.trim().toLowerCase();
    
    if (!trimmedKey) {
      setImportError('Please enter your private key');
      return;
    }
    
    if (!/^[a-f0-9]{128}$/.test(trimmedKey)) {
      setImportError('Invalid format. Private key must be 128 hexadecimal characters.');
      return;
    }
    
    try {
      const keypair = importKeypair(trimmedKey);
      setImportPrivateKey('');
      console.log('[CreatorRegister] Private key imported, pubkey:', keypair.publicKey.slice(0, 16) + '...');

      // Auto-check whitelist status
      if (keypair?.publicKey) {
        setWhitelistStatus('checking');
        setWhitelistMessage('');
        try {
          const result = await creatorApi.checkWhitelist(keypair.publicKey);
          if (result.whitelisted) {
            setWhitelistStatus('approved');
            setWhitelistMessage('Your public key is approved! You can proceed with registration.');
            console.log('[CreatorRegister] Public key is whitelisted');
          } else {
            setWhitelistStatus('pending');
            setWhitelistMessage(result.message || 'Your public key is not yet approved. Please contact admin via SimpleX.');
            console.warn('[CreatorRegister] Public key not whitelisted');
          }
        } catch (checkError) {
          console.error('[CreatorRegister] Whitelist check failed:', checkError);
          setWhitelistStatus('error');
          setWhitelistMessage('Unable to check whitelist status. Please try again or proceed with registration.');
        }
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to import key');
      console.error('[CreatorRegister] Import key error:', error);
    }
  };

  const checkWhitelistStatus = async () => {
    if (!generatedKeypair) return;

    setWhitelistStatus('checking');
    setWhitelistMessage('');

    console.log('[CreatorRegister] Checking whitelist for pubkey:', generatedKeypair.publicKey.slice(0, 16) + '...');

    try {
      const result = await creatorApi.checkWhitelist(generatedKeypair.publicKey);
      if (result.whitelisted) {
        setWhitelistStatus('approved');
        setWhitelistMessage('Your public key is approved! You can proceed with registration.');
        console.log('[CreatorRegister] Public key is whitelisted');
      } else {
        setWhitelistStatus('pending');
        setWhitelistMessage(result.message || 'Your public key is not yet approved. Please contact admin via SimpleX.');
        console.warn('[CreatorRegister] Public key not whitelisted');
      }
    } catch (error) {
      console.error('[CreatorRegister] Whitelist check failed:', error);
      setWhitelistStatus('error');
      setWhitelistMessage('Unable to check whitelist status. Please try again or proceed with registration.');
    }
  };

  const handleGenerate = () => {
    generateNewKeypair();
    setCopiedPublic(false);
    setCopiedPrivate(false);
    setSavedKey(false);
    setWhitelistStatus('unchecked');
    setWhitelistMessage('');
    setShowRestoredNotice(true);
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
    console.log('[CreatorRegister] Copied', type, 'key to clipboard');
  };

  const handleContinueToProfile = () => {
    if (!savedKey) {
      console.warn('[CreatorRegister] User tried to continue without confirming saved key');
      return;
    }
    console.log('[CreatorRegister] Advancing to profile step');
    setStep('profile');
  };

  const handleCreateProfile = () => {
    if (!displayName.trim()) {
      console.warn('[CreatorRegister] Display name is required');
      return;
    }
    console.log('[CreatorRegister] Advancing to confirm step');
    setStep('confirm');
  };

  const handleConfirmRegistration = async () => {
    if (!generatedKeypair) return;

    console.log('[CreatorRegister] Starting registration for pubkey:', generatedKeypair.publicKey.slice(0, 16) + '...');

    setIsSubmitting(true);
    setRegistrationError(null);

    try {
      await register(generatedKeypair.privateKey, displayName, bio || undefined);
      console.log('[CreatorRegister] Registration successful!');
      toast.success('Creator account created successfully!');
      navigate('/creator/dashboard');
    } catch (error) {
      console.error('[CreatorRegister] Registration failed:', error);
      const parsedError = parseRegistrationError(error);

      // If 409 conflict (already registered), auto-redirect to login with prefilled key
      if (parsedError.type === 'conflict') {
        console.log('[CreatorRegister] 409 conflict - redirecting to login with prefilled key');
        sessionStorage.setItem('creator_prefill_key', generatedKeypair.privateKey);
        navigate('/creator/login');
        return;
      }

      setRegistrationError(parsedError);
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
                <div className="space-y-4">
                  {/* Mode Toggle */}
                  <div className="flex rounded-lg border border-border/50 p-1 bg-muted/30">
                    <button
                      type="button"
                      onClick={() => {
                        setKeypairMode('generate');
                        setImportError(null);
                      }}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        keypairMode === 'generate'
                          ? 'bg-[#FF6600] text-white'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Key className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                      Generate New
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setKeypairMode('import');
                        setImportError(null);
                      }}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        keypairMode === 'import'
                          ? 'bg-[#FF6600] text-white'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Import className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                      Import Existing
                    </button>
                  </div>

                  {keypairMode === 'generate' ? (
                    <Button
                      onClick={handleGenerate}
                      className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
                      size="lg"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Generate New Identity
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Your Private Key</label>
                        <div className="relative">
                          <Input
                            type={showImportKey ? 'text' : 'password'}
                            value={importPrivateKey}
                            onChange={(e) => {
                              setImportPrivateKey(e.target.value);
                              setImportError(null);
                            }}
                            placeholder="Enter your 128-character private key..."
                            className={`font-mono text-xs pr-10 ${importError ? 'border-destructive' : ''}`}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowImportKey(!showImportKey)}
                            aria-label={showImportKey ? 'Hide private key' : 'Show private key'}
                          >
                            {showImportKey ? (
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {importError && (
                          <p className="text-xs text-destructive">{importError}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          If you already have an approved keypair, paste your private key here.
                        </p>
                      </div>
                      <Button
                        onClick={handleImportKeypair}
                        className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
                        disabled={!importPrivateKey.trim()}
                      >
                        <Import className="w-4 h-4 mr-2" />
                        Import Private Key
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Restored Keypair Notice */}
                  {hasStoredKeypair && showRestoredNotice && (
                    <Alert className="relative border-blue-500/50 bg-blue-500/10 pr-10">
                      <RotateCcw className="h-4 w-4 text-blue-500" />
                      <AlertTitle className="text-blue-400">Restored Keypair</AlertTitle>
                      <AlertDescription className="text-blue-400/80">
                        This keypair was restored from your previous session. If you want to start fresh, click "Clear & Start Fresh" below.
                      </AlertDescription>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-7 w-7 text-blue-400 hover:bg-blue-500/10"
                        onClick={() => setShowRestoredNotice(false)}
                        aria-label="Dismiss"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </Alert>
                  )}
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
                    {/* Whitelist Status Check */}
                    {whitelistStatus === 'approved' ? (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <p className="text-xs text-green-400 font-medium">
                            ✅ {whitelistMessage}
                          </p>
                        </div>
                      </div>
                    ) : whitelistStatus === 'pending' ? (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-amber-500" />
                          <p className="text-xs text-amber-400 font-medium">
                            ⏳ {whitelistMessage}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                            onClick={() => window.open('https://simplex.chat/contact#/?v=2-7&smp=smp%3A%2F%2FenEkec4hlR3UtKx2NMpOUK_K4ZuDxjWBO1d9Y7YXXy4%3D%40smp14.simplex.im%2FzPXIhGKAhSsWPtQVEiQvXvqQ27HaVCss%23%2F%3Fv%3D1-3%26dh%3DMCowBQYDK2VuAyEAn8fKbHOG24kMr9y5TkzKMYNTTdI60txZjq1Wg3PEk3E%253D%26srv%3Daspkyu2sopsnizbyfabtsicikr2s4r3ti35jogbceez4wxqovh77b2ad.onion&data=%7B%22groupLinkId%22%3A%223xzimhfYFqYT5wY-9HZ1QA%3D%3D%22%7D', '_blank')}
                          >
                            Contact Admin
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                            onClick={checkWhitelistStatus}
                          >
                            <Search className="w-3 h-3 mr-1" />
                            Check Again
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 space-y-2">
                        <p className="text-xs text-blue-400 font-medium">
                          📤 Send this to admin for whitelist approval before continuing.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                            onClick={() => window.open('https://simplex.chat/contact#/?v=2-7&smp=smp%3A%2F%2FenEkec4hlR3UtKx2NMpOUK_K4ZuDxjWBO1d9Y7YXXy4%3D%40smp14.simplex.im%2FzPXIhGKAhSsWPtQVEiQvXvqQ27HaVCss%23%2F%3Fv%3D1-3%26dh%3DMCowBQYDK2VuAyEAn8fKbHOG24kMr9y5TkzKMYNTTdI60txZjq1Wg3PEk3E%253D%26srv%3Daspkyu2sopsnizbyfabtsicikr2s4r3ti35jogbceez4wxqovh77b2ad.onion&data=%7B%22groupLinkId%22%3A%223xzimhfYFqYT5wY-9HZ1QA%3D%3D%22%7D', '_blank')}
                          >
                            Contact Admin
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                            onClick={checkWhitelistStatus}
                            disabled={whitelistStatus === 'checking'}
                          >
                            {whitelistStatus === 'checking' ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Checking...
                              </>
                            ) : (
                              <>
                                <Search className="w-3 h-3 mr-1" />
                                Check Status
                              </>
                            )}
                          </Button>
                        </div>
                        {whitelistStatus === 'error' && whitelistMessage && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {whitelistMessage}
                          </p>
                        )}
                      </div>
                    )}
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

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        clearKeypair();
                        setWhitelistStatus('unchecked');
                        setWhitelistMessage('');
                        setSavedKey(false);
                        setShowRestoredNotice(true);
                      }}
                      className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                      size="sm"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear & Start Fresh
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGenerate}
                      className="flex-1"
                      size="sm"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Regenerate
                    </Button>
                  </div>

                  <Button
                    onClick={handleContinueToProfile}
                    disabled={!savedKey}
                    className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
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
              {/* Error Display */}
              {registrationError && (
                <Alert 
                  variant={registrationError.type === 'whitelist' || registrationError.type === 'conflict' || registrationError.type === 'network' ? 'default' : 'destructive'}
                  className={`relative pr-10 ${registrationError.type === 'whitelist' 
                    ? 'border-amber-500/50 bg-amber-500/10' 
                    : registrationError.type === 'conflict'
                    ? 'border-border bg-muted/30'
                    : registrationError.type === 'network'
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : ''
                  }`}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7 text-muted-foreground hover:bg-muted/30"
                    onClick={() => setRegistrationError(null)}
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  {registrationError.type === 'whitelist' ? (
                    <ShieldX className="h-4 w-4 text-amber-500" />
                  ) : registrationError.type === 'network' ? (
                    <WifiOff className="h-4 w-4 text-blue-500" />
                  ) : registrationError.type === 'conflict' ? (
                    <CheckCircle2 className="h-4 w-4 text-foreground" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertTitle className={
                    registrationError.type === 'whitelist' 
                      ? 'text-amber-500' 
                      : registrationError.type === 'network'
                      ? 'text-blue-500'
                      : ''
                  }>
                    {registrationError.type === 'whitelist' 
                      ? 'Not Whitelisted' 
                      : registrationError.type === 'conflict'
                      ? 'Already Registered'
                      : registrationError.type === 'network'
                      ? 'Connection Error'
                      : 'Registration Failed'}
                  </AlertTitle>
                  <AlertDescription className={
                    registrationError.type === 'whitelist' 
                      ? 'text-amber-400' 
                      : registrationError.type === 'network'
                      ? 'text-blue-400'
                      : ''
                  }>
                    {registrationError.message}

                    {registrationError.type === 'conflict' && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate('/creator/login')}
                        >
                          Go to Sign In
                        </Button>
                      </div>
                    )}

                    {registrationError.type === 'whitelist' && generatedKeypair && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs">Your public key to share:</p>
                        <code className="block text-xs bg-background/50 p-2 rounded break-all">
                          {generatedKeypair.publicKey}
                        </code>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedKeypair.publicKey);
                              console.log('[CreatorRegister] Copied public key from error panel');
                            }}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy Public Key
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                            onClick={() =>
                              window.open(
                                'https://simplex.chat/contact#/?v=2-7&smp=smp%3A%2F%2FenEkec4hlR3UtKx2NMpOUK_K4ZuDxjWBO1d9Y7YXXy4%3D%40smp14.simplex.im%2FzPXIhGKAhSsWPtQVEiQvXvqQ27HaVCss%23%2F%3Fv%3D1-3%26dh%3DMCowBQYDK2VuAyEAn8fKbHOG24kMr9y5TkzKMYNTTdI60txZjq1Wg3PEk3E%253D%26srv%3Daspkyu2sopsnizbyfabtsicikr2s4r3ti35jogbceez4wxqovh77b2ad.onion&data=%7B%22groupLinkId%22%3A%223xzimhfYFqYT5wY-9HZ1QA%3D%3D%22%7D',
                                '_blank'
                              )
                            }
                          >
                            Contact Admin via SimpleX
                          </Button>
                        </div>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

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
