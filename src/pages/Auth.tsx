import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePrivateKeyAuth } from '@/hooks/usePrivateKeyAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { emailSchema, passwordSchema, displayNameSchema } from '@/lib/validation';
import { Key, Mail, Copy, AlertTriangle, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Auth = () => {
  const navigate = useNavigate();
  const { signUp, signIn, user } = useAuth();
  const { generateNewKeys, signInWithKey, privateKeyUser } = usePrivateKeyAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<{ privateKey: string; publicKey: string; keyId: string } | null>(null);
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);

  // Redirect if already logged in (either method)
  if (user || privateKeyUser) {
    navigate('/');
    return null;
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('signup-email') as string;
    const password = formData.get('signup-password') as string;
    const displayName = formData.get('display-name') as string;

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      displayNameSchema.parse(displayName);
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || 'Invalid input');
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, displayName);

    if (error) {
      toast.error(error.message || 'Failed to sign up');
    } else {
      toast.success('Account created successfully!');
      navigate('/');
    }

    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('signin-email') as string;
    const password = formData.get('signin-password') as string;

    try {
      emailSchema.parse(email);
      if (!password || password.length === 0) {
        throw new Error('Password is required');
      }
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || error.message || 'Invalid input');
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message || 'Failed to sign in');
    } else {
      toast.success('Welcome back!');
      navigate('/');
    }

    setIsLoading(false);
  };

  const handleGenerateKey = async () => {
    setIsLoading(true);
    const result = await generateNewKeys();
    if (result) {
      setGeneratedKey(result);
    }
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
            <CardTitle>Welcome to 0xNull Marketplace</CardTitle>
            <CardDescription>Choose how you want to authenticate</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="key">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="key" className="gap-1">
                  <Key className="w-3.5 h-3.5" />
                  Private Key
                </TabsTrigger>
                <TabsTrigger value="signin" className="gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="key" className="space-y-4">
                {!generatedKey ? (
                  <>
                    <div className="text-sm text-muted-foreground space-y-2 py-4">
                      <p>
                        <strong>Anonymous authentication:</strong> No email required. 
                        Your identity is your private key.
                      </p>
                      <p>
                        Generate a new keypair to create an anonymous account, 
                        or enter an existing private key to sign in.
                      </p>
                    </div>

                    <Button 
                      onClick={handleGenerateKey} 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Generating...' : 'Generate New Keypair'}
                    </Button>

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
                        <Input
                          id="private-key"
                          type="password"
                          placeholder="Enter your 64-character private key"
                          value={privateKeyInput}
                          onChange={(e) => setPrivateKeyInput(e.target.value)}
                          className="font-mono text-sm"
                        />
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
                  </>
                ) : (
                  <div className="space-y-4 py-4">
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
              </TabsContent>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="signin-password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input
                      id="display-name"
                      name="display-name"
                      type="text"
                      placeholder="CryptoTrader"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="signup-password"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Must be 8+ characters with uppercase, lowercase, and a number
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Sign Up'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
