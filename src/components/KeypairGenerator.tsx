import { useState } from 'react';
import { Key, Copy, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateKeypair, truncateKey } from '@/lib/creatorCrypto';
import { toast } from 'sonner';

interface GeneratedKeys {
  publicKey: string;
  privateKey: string;
}

export function KeypairGenerator() {
  const [keys, setKeys] = useState<GeneratedKeys | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Small delay for visual feedback
    setTimeout(() => {
      const newKeys = generateKeypair();
      setKeys(newKeys);
      setIsGenerating(false);
      toast.success('New keypair generated');
    }, 150);
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

  return (
    <Card className="bg-secondary/30 border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Key className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Generate Identity</CardTitle>
            <CardDescription>Create a cryptographic keypair for anonymous authentication</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!keys ? (
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
        ) : (
          <div className="space-y-4">
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
                <strong>Save your private key!</strong> It cannot be recovered. Anyone with this key controls the account.
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
              Generate New
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
