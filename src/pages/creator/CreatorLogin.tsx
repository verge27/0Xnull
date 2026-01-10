import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Loader2, Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreatorAuth } from '@/hooks/useCreatorAuth';
import { isValidPrivateKey } from '@/lib/creatorCrypto';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const CreatorLogin = () => {
  const navigate = useNavigate();
  const { login } = useCreatorAuth();
  
  const [privateKey, setPrivateKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      toast.error(error instanceof Error ? error.message : 'Login failed. Check your private key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyChange = (value: string) => {
    // Only allow hex characters
    const cleaned = value.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
    setPrivateKey(cleaned);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Creator Login</h1>
          <p className="text-muted-foreground">
            Sign in with your private key to access your creator dashboard.
          </p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-[#FF6600]" />
              Enter Your Private Key
            </CardTitle>
            <CardDescription>
              Your private key is used to cryptographically prove your identity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Textarea
                  value={privateKey}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  placeholder="Paste your 128-character private key..."
                  className={`font-mono text-xs min-h-[100px] pr-10 resize-none ${
                    privateKey && !isValidPrivateKey(privateKey) 
                      ? 'border-destructive' 
                      : ''
                  }`}
                  style={{ fontFamily: 'monospace' }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
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
                {privateKey && isValidPrivateKey(privateKey) && (
                  <span className="text-green-500">✓ Valid format</span>
                )}
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#FF6600] mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Privacy First</p>
                <p>
                  Your private key never leaves your browser. All signing happens locally.
                  We only send signatures to verify your identity.
                </p>
              </div>
            </div>

            <Button
              onClick={handleLogin}
              disabled={!isValidPrivateKey(privateKey) || isLoading}
              className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
              size="lg"
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

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Button
                variant="link"
                className="p-0 h-auto text-[#FF6600]"
                onClick={() => navigate('/creator/register')}
              >
                Create one now
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
