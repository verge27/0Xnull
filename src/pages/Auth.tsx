import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivateKeyAuth } from '@/hooks/usePrivateKeyAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { Key, Copy, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Auth = () => {
  const navigate = useNavigate();
  const { generateNewKeys, signInWithKey, privateKeyUser, isSolvingPoW } = usePrivateKeyAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<{ privateKey: string; publicKey: string; keyId: string } | null>(null);
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);
  const [powProgress, setPowProgress] = useState(0);

  // Redirect if already logged in
  // But NOT if we're showing the confirmation screen after key generation
  if (privateKeyUser && !generatedKey) {
    navigate('/');
    return null;
  }

  const handleGenerateKey = async () => {
    setIsLoading(true);
    setPowProgress(0);
    const result = await generateNewKeys((hashes) => {
      // Estimate progress based on typical solve time (~100k-500k hashes)
      setPowProgress(Math.min(95, Math.floor((hashes / 300000) * 100)));
    });
    if (result) {
      setGeneratedKey(result);
    }
    setPowProgress(100);
    setIsLoading(false);
  };

  const handleKeySignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const success = await signInWithKey(privateKeyInput);
    if (success) {
      navigate('/');
    }
    setIsLoading(false);
  };

  const copyPrivateKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey.privateKey);
      setKeyCopied(true);
      toast.success('Private key copied!');
      setTimeout(() => setKeyCopied(false), 3000);
    }
  };

  const handleContinueAfterGenerate = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Welcome to 0xNull Marketplace
            </CardTitle>
            <CardDescription>
              Anonymous authentication — no email required. Your identity is your private key.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!generatedKey ? (
              <div className="space-y-6">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Generate a new keypair to create an anonymous account, 
                    or enter an existing private key to sign in.
                  </p>
                </div>

                <Button 
                  onClick={handleGenerateKey} 
                  className="w-full" 
                  disabled={isLoading || isSolvingPoW}
                >
                  {isSolvingPoW ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Solving puzzle...
                    </span>
                  ) : isLoading ? (
                    'Creating account...'
                  ) : (
                    'Generate New Keypair'
                  )}
                </Button>

                {isSolvingPoW && (
                  <div className="space-y-2">
                    <Progress value={powProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      Proof of Work: {powProgress}% (prevents spam accounts)
                    </p>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or sign in with existing key
                    </span>
                  </div>
                </div>

                <form onSubmit={handleKeySignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="private-key">Private Key</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="private-key"
                        type="password"
                        placeholder="Enter your 64-character private key"
                        value={privateKeyInput}
                        onChange={(e) => setPrivateKeyInput(e.target.value)}
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (privateKeyInput.length === 64) {
                            navigator.clipboard.writeText(privateKeyInput);
                            toast.success('Private key copied!');
                          }
                        }}
                        disabled={privateKeyInput.length !== 64}
                        title="Copy key"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    variant="secondary" 
                    className="w-full" 
                    disabled={isLoading || privateKeyInput.length !== 64}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In with Key'}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-200">
                    <strong>Save this key now!</strong> It cannot be recovered. 
                    Anyone with this key controls your account.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label>Your Key ID</Label>
                  <div className="font-mono text-lg text-primary">
                    Anon_{generatedKey.keyId}
                  </div>
                </div>

                <div>
                  <Label>Private Key (keep secret!)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      readOnly
                      value={generatedKey.privateKey}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyPrivateKey}
                      className={keyCopied ? 'text-green-500' : ''}
                    >
                      {keyCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleContinueAfterGenerate} 
                  className="w-full"
                  disabled={!keyCopied}
                >
                  {keyCopied ? 'Continue to Marketplace' : 'Copy key first to continue'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
