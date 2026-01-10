import { useState, useEffect } from 'react';
import { Key, Copy, Check, AlertTriangle, RefreshCw, LogIn, LogOut, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateKeypair, truncateKey, isValidPrivateKey, getPubkeyFromPrivate } from '@/lib/creatorCrypto';
import { toast } from 'sonner';

const STORAGE_KEY = '0xnull_keypair';

interface StoredKeypair {
  publicKey: string;
  privateKey: string;
  createdAt: string;
}

export function KeypairGenerator() {
  const [keys, setKeys] = useState<StoredKeypair | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loginKey, setLoginKey] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('generate');

  // Load stored keypair on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StoredKeypair;
        if (parsed.publicKey && parsed.privateKey) {
          setKeys(parsed);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newKeys = generateKeypair();
      const storedKeys: StoredKeypair = {
        ...newKeys,
        createdAt: new Date().toISOString(),
      };
      setKeys(storedKeys);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedKeys));
      setIsGenerating(false);
      toast.success('New keypair generated and saved');
    }, 150);
  };

  const handleLogin = () => {
    const trimmedKey = loginKey.trim().toLowerCase();

    console.log('[KeypairGenerator] Login attempt. keyLength=', trimmedKey.length);

    if (!isValidPrivateKey(trimmedKey)) {
      console.warn('[KeypairGenerator] Invalid private key format (expected 128 hex characters)');
      return;
    }

    setIsLoggingIn(true);
    try {
      const publicKey = getPubkeyFromPrivate(trimmedKey);
      const storedKeys: StoredKeypair = {
        publicKey,
        privateKey: trimmedKey,
        createdAt: new Date().toISOString(),
      };
      setKeys(storedKeys);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedKeys));
      setLoginKey('');
      toast.success('Logged in successfully');
      console.log('[KeypairGenerator] Logged in successfully. pubkey=', publicKey);
    } catch (error) {
      console.error('[KeypairGenerator] Invalid private key:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setKeys(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Logged out');
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field === 'public' ? 'Public key' : 'Private key'} copied`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Logged in state
  if (keys) {
    return (
      <Card className="bg-secondary/30 border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <User className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Identity Active</CardTitle>
                <CardDescription>Your keypair is saved locally</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Public Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Public Key (Your ID)</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background/50 px-3 py-2 rounded text-sm font-mono truncate">
                {truncateKey(keys.publicKey, 12, 12)}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(keys.publicKey, 'public')}
              >
                {copiedField === 'public' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Private Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Private Key (Secret)</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background/50 px-3 py-2 rounded text-sm font-mono truncate">
                {truncateKey(keys.privateKey, 12, 12)}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(keys.privateKey, 'private')}
              >
                {copiedField === 'private' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-200/80">
              <strong>Keep your private key safe!</strong> Anyone with this key controls your account.
            </p>
          </div>

          {/* Generate New */}
          <Button 
            variant="outline" 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Generate New Identity
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Not logged in state
  return (
    <Card className="bg-secondary/30 border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Key className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Identity</CardTitle>
            <CardDescription>Generate or login with a cryptographic keypair</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="generate">New Identity</TabsTrigger>
            <TabsTrigger value="login">Login</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a new ed25519 keypair for anonymous authentication.
            </p>
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Generate New Keypair
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="login" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your private key to restore your identity.
            </p>
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Enter your private key (128 hex characters)"
                value={loginKey}
                onChange={(e) => setLoginKey(e.target.value)}
                className="font-mono text-sm"
              />
              <Button 
                onClick={handleLogin}
                disabled={isLoggingIn || !loginKey.trim()}
                className="w-full"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login with Private Key
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
