import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Loader2, Eye, EyeOff, Shield, CheckCircle2, XCircle, Search, Import } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreatorAuth } from '@/hooks/useCreatorAuth';
import { isValidPrivateKey, getPubkeyFromPrivate } from '@/lib/creatorCrypto';
import { creatorApi } from '@/services/creatorApi';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

type AccountStatus = 'unchecked' | 'checking' | 'registered' | 'not_registered' | 'error';

const CreatorLogin = () => {
  const navigate = useNavigate();
  const { login } = useCreatorAuth();
  
  const [privateKey, setPrivateKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>('unchecked');
  const [statusMessage, setStatusMessage] = useState('');
  const [derivedPublicKey, setDerivedPublicKey] = useState<string | null>(null);

  const handleKeyChange = (value: string) => {
    // Only allow hex characters
    const cleaned = value.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
    setPrivateKey(cleaned);
    setAccountStatus('unchecked');
    setStatusMessage('');
    setDerivedPublicKey(null);
  };

  const checkAccountStatus = async () => {
    const cleanKey = privateKey.trim().toLowerCase();
    
    if (!isValidPrivateKey(cleanKey)) {
      toast.error('Invalid private key format. Expected 128 hex characters.');
      return;
    }

    setAccountStatus('checking');
    setStatusMessage('');

    try {
      const publicKey = getPubkeyFromPrivate(cleanKey);
      setDerivedPublicKey(publicKey);
      
      // Check if account exists by trying to get a challenge
      // If we can get a challenge, the account exists
      await creatorApi.getChallenge(publicKey);
      setAccountStatus('registered');
      setStatusMessage('Account found! You can sign in.');
      toast.success('Account found!');
    } catch (error) {
      console.error('Check status error:', error);
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (message.includes('404') || message.includes('not found') || message.includes('no creator')) {
        setAccountStatus('not_registered');
        setStatusMessage('No account found for this key. You may need to register first.');
        toast.info('No account found for this key');
      } else if (message.includes('403') || message.includes('forbidden') || message.includes('whitelist')) {
        setAccountStatus('not_registered');
        setStatusMessage('Key not whitelisted. You may need to get approved first.');
        toast.info('Key not whitelisted');
      } else {
        setAccountStatus('error');
        setStatusMessage(`Unable to check account status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        toast.error('Failed to check account status');
      }
    }
  };

  const handleLogin = async () => {
    const cleanKey = privateKey.trim().toLowerCase();
    
    if (!isValidPrivateKey(cleanKey)) {
      toast.error('Invalid private key format. Expected 128 hex characters.');
      return;
    }

    setIsLoading(true);
    try {
      await login(cleanKey);
      toast.success('Welcome back!');
      navigate('/creator/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      const message = error instanceof Error ? error.message : 'Login failed';
      
      if (message.includes('404') || message.includes('not found')) {
        toast.error('No account found. Please register first.');
        setAccountStatus('not_registered');
        setStatusMessage('No account found for this key.');
      } else {
        toast.error(message || 'Login failed. Check your private key.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isKeyValid = isValidPrivateKey(privateKey);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Creator Login</h1>
          <p className="text-muted-foreground">
            Already have a keypair? Sign in with your private key.
          </p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Import className="w-5 h-5 text-[#FF6600]" />
              Enter Your Private Key
            </CardTitle>
            <CardDescription>
              Paste the 128-character private key you saved during registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Private Key</label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={privateKey}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  placeholder="Paste your 128-character private key..."
                  className={`font-mono text-xs pr-10 ${
                    privateKey && !isKeyValid ? 'border-destructive' : ''
                  }`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowKey(!showKey)}
                  aria-label={showKey ? 'Hide private key' : 'Show private key'}
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className={`${
                  privateKey.length === 128 
                    ? 'text-green-500' 
                    : privateKey.length > 0 
                    ? 'text-yellow-500' 
                    : 'text-muted-foreground'
                }`}>
                  {privateKey.length}/128 characters
                </span>
                {isKeyValid && (
                  <span className="text-green-500">✓ Valid format</span>
                )}
              </div>
            </div>

            {/* Account Status */}
            {accountStatus === 'registered' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <p className="text-sm text-green-400 font-medium">{statusMessage}</p>
                </div>
              </div>
            )}

            {accountStatus === 'not_registered' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-amber-500" />
                  <p className="text-sm text-amber-400 font-medium">{statusMessage}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                  onClick={() => navigate('/creator/register')}
                >
                  Go to Registration
                </Button>
              </div>
            )}

            {accountStatus === 'error' && (
              <div className="bg-muted/50 border border-border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">{statusMessage}</p>
              </div>
            )}

            <div className="bg-muted/30 rounded-lg p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#FF6600] mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Privacy First</p>
                <p>
                  Your private key never leaves your browser. All signing happens locally.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={checkAccountStatus}
                disabled={!isKeyValid || accountStatus === 'checking' || isLoading}
                className="flex-1"
              >
                {accountStatus === 'checking' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Check Status
                  </>
                )}
              </Button>
              <Button
                onClick={handleLogin}
                disabled={!isKeyValid || isLoading}
                className="flex-1 bg-[#FF6600] hover:bg-[#FF6600]/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Need to create an account?{' '}
              <Button
                variant="link"
                className="p-0 h-auto text-[#FF6600]"
                onClick={() => navigate('/creator/register')}
              >
                Register as a creator
              </Button>
            </p>
          </CardContent>
        </Card>

        {/* No Forgot Password */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>
            Lost your private key? Unfortunately, there's no way to recover it.
          </p>
          <p className="mt-1">
            Your cryptographic identity is controlled solely by your private key.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreatorLogin;
