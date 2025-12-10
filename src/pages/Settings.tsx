import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { usePGP } from '@/hooks/usePGP';
import { settingsSchema } from '@/lib/validation';
import { Shield, Download, Key, Copy, Check, AlertTriangle, Upload, FileKey, QrCode, Fingerprint } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { PGPPassphraseDialog } from '@/components/PGPPassphraseDialog';
import * as openpgp from 'openpgp';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Settings = () => {
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const { isUnlocked, checkHasKeys, restoreSession } = usePGP();
  const [displayName, setDisplayName] = useState('');
  const [xmrAddress, setXmrAddress] = useState('');
  const [pgpKeys, setPgpKeys] = useState<{ publicKey: string; encryptedPrivateKey: string } | null>(null);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [copied, setCopied] = useState<'public' | 'private' | 'fingerprint' | null>(null);
  const [showPGPDialog, setShowPGPDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'passphrase'>('upload');
  const [importedKeys, setImportedKeys] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [importPassphrase, setImportPassphrase] = useState('');
  const [importing, setImporting] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const publicKeyInputRef = useRef<HTMLInputElement>(null);
  const privateKeyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setXmrAddress(profile.xmr_address || '');
    }
  }, [profile]);

  // Fetch PGP keys and calculate fingerprint
  useEffect(() => {
    const fetchKeys = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('pgp_public_key, pgp_encrypted_private_key')
          .eq('id', user.id)
          .maybeSingle();
        
        if (data?.pgp_public_key) {
          setPgpKeys({
            publicKey: data.pgp_public_key,
            encryptedPrivateKey: data.pgp_encrypted_private_key || ''
          });
          
          // Calculate fingerprint
          try {
            const key = await openpgp.readKey({ armoredKey: data.pgp_public_key });
            const fp = key.getFingerprint().toUpperCase();
            // Format as groups of 4 characters
            const formatted = fp.match(/.{1,4}/g)?.join(' ') || fp;
            setFingerprint(formatted);
          } catch (e) {
            console.error('Failed to calculate fingerprint:', e);
          }
        }
      } catch (e) {
        console.error('Failed to fetch PGP keys:', e);
      } finally {
        setLoadingKeys(false);
      }
    };

    fetchKeys();
    restoreSession();
  }, [user, restoreSession]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSave = async () => {
    try {
      settingsSchema.parse({
        displayName,
        xmrAddress: xmrAddress || ''
      });
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || 'Invalid input');
      return;
    }

    const { error } = await updateProfile({
      display_name: displayName,
      xmr_address: xmrAddress || null
    });
    
    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved successfully!');
    }
  };

  const handleCopy = async (type: 'public' | 'private' | 'fingerprint') => {
    let text = '';
    if (type === 'fingerprint') {
      if (!fingerprint) return;
      text = fingerprint;
    } else {
      if (!pgpKeys) return;
      text = type === 'public' ? pgpKeys.publicKey : pgpKeys.encryptedPrivateKey;
    }
    await navigator.clipboard.writeText(text);
    setCopied(type);
    const label = type === 'public' ? 'Public key' : type === 'private' ? 'Private key' : 'Fingerprint';
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (type: 'public' | 'private') => {
    if (!pgpKeys) return;
    
    const text = type === 'public' ? pgpKeys.publicKey : pgpKeys.encryptedPrivateKey;
    const filename = type === 'public' ? 'tarimarket-public.asc' : 'tarimarket-private-encrypted.asc';
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`${type === 'public' ? 'Public' : 'Private'} key downloaded`);
  };

  const handleFileUpload = async (type: 'public' | 'private', file: File) => {
    try {
      const text = await file.text();
      
      if (type === 'public') {
        // Validate it's a valid public key
        try {
          await openpgp.readKey({ armoredKey: text });
          setImportedKeys(prev => ({ ...prev, publicKey: text, privateKey: prev?.privateKey || '' }));
          toast.success('Public key loaded');
        } catch {
          toast.error('Invalid public key file');
        }
      } else {
        // Validate it's a valid private key
        try {
          await openpgp.readPrivateKey({ armoredKey: text });
          setImportedKeys(prev => ({ ...prev, privateKey: text, publicKey: prev?.publicKey || '' }));
          toast.success('Private key loaded');
        } catch {
          toast.error('Invalid private key file');
        }
      }
    } catch (e) {
      toast.error('Failed to read file');
    }
  };

  const handleImportKeys = async () => {
    if (!importedKeys?.publicKey || !importedKeys?.privateKey || !user) {
      toast.error('Please upload both public and private keys');
      return;
    }

    if (!importPassphrase) {
      toast.error('Please enter your passphrase');
      return;
    }

    setImporting(true);

    try {
      // Verify the passphrase works with the private key
      const privateKey = await openpgp.readPrivateKey({ armoredKey: importedKeys.privateKey });
      
      // Check if key is encrypted and try to decrypt with passphrase
      if (!privateKey.isDecrypted()) {
        try {
          await openpgp.decryptKey({
            privateKey,
            passphrase: importPassphrase
          });
        } catch {
          toast.error('Wrong passphrase for this private key');
          setImporting(false);
          return;
        }
      }

      // Store keys in database
      const { error } = await supabase
        .from('profiles')
        .update({
          pgp_public_key: importedKeys.publicKey,
          pgp_encrypted_private_key: importedKeys.privateKey
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Keys imported successfully!');
      setShowImportDialog(false);
      setImportedKeys(null);
      setImportPassphrase('');
      setImportStep('upload');
      
      // Refresh page to show new keys
      window.location.reload();
    } catch (e) {
      console.error('Import error:', e);
      toast.error('Failed to import keys');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <h1 className="text-4xl font-bold">Settings</h1>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your public profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
            </div>

            <div>
              <Label htmlFor="xmrAddress">XMR Address</Label>
              <Input
                id="xmrAddress"
                value={xmrAddress}
                onChange={(e) => setXmrAddress(e.target.value)}
                placeholder="Your Monero address"
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground mt-1">
                This is where you'll receive payments for your sales
              </p>
            </div>

            <Button onClick={handleSave} className="w-full">
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* PGP Encryption Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              PGP Encryption
            </CardTitle>
            <CardDescription>
              Manage your end-to-end encryption keys for secure messaging
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingKeys ? (
              <p className="text-muted-foreground">Loading keys...</p>
            ) : pgpKeys ? (
              <>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-500">Encryption Enabled</p>
                    <p className="text-sm text-muted-foreground">
                      Your messages are encrypted with PGP. Only you and the recipient can read them.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Public Key */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Public Key
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQRDialog(true)}
                      >
                        <QrCode className="w-4 h-4 mr-1" />
                        QR
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy('public')}
                      >
                        {copied === 'public' ? (
                          <Check className="w-4 h-4 mr-1" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload('public')}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg p-3 font-mono text-xs overflow-auto max-h-24">
                    {pgpKeys.publicKey.substring(0, 200)}...
                  </div>
                  
                  {/* Fingerprint */}
                  {fingerprint && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2 text-xs">
                          <Fingerprint className="w-3.5 h-3.5 text-primary" />
                          Key Fingerprint
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => handleCopy('fingerprint')}
                        >
                          {copied === 'fingerprint' ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <p className="font-mono text-xs tracking-wider text-primary/80 break-all">
                        {fingerprint}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Verify this fingerprint matches when sharing your key to ensure authenticity.
                      </p>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Share this key with others so they can send you encrypted messages.
                  </p>
                </div>

                <Separator />

                {/* Private Key */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-500" />
                      Private Key (Encrypted)
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy('private')}
                      >
                        {copied === 'private' ? (
                          <Check className="w-4 h-4 mr-1" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload('private')}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg p-3 font-mono text-xs overflow-auto max-h-24">
                    {pgpKeys.encryptedPrivateKey.substring(0, 200)}...
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-500">
                      <strong>Keep this safe!</strong> This key is encrypted with your passphrase. 
                      Back it up securely - if lost, you won't be able to read old messages.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium mb-1">No encryption keys set up</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Set up PGP encryption to secure your messages
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setShowPGPDialog(true)}>
                    <Key className="w-4 h-4 mr-2" />
                    Create New Keys
                  </Button>
                  <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Backup
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PGPPassphraseDialog
        open={showPGPDialog}
        onOpenChange={setShowPGPDialog}
        onUnlocked={() => {
          window.location.reload();
        }}
      />

      {/* Import Keys Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => {
        setShowImportDialog(open);
        if (!open) {
          setImportStep('upload');
          setImportedKeys(null);
          setImportPassphrase('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileKey className="w-5 h-5 text-primary" />
              Import PGP Keys
            </DialogTitle>
            <DialogDescription>
              Restore your encryption keys from a backup
            </DialogDescription>
          </DialogHeader>

          {importStep === 'upload' ? (
            <div className="space-y-4">
              {/* Public Key Upload */}
              <div className="space-y-2">
                <Label>Public Key File</Label>
                <input
                  ref={publicKeyInputRef}
                  type="file"
                  accept=".asc,.txt,.pub,.key"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('public', file);
                  }}
                />
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => publicKeyInputRef.current?.click()}
                >
                  {importedKeys?.publicKey ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-green-500" />
                      Public key loaded
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose public key file (.asc)
                    </>
                  )}
                </Button>
              </div>

              {/* Private Key Upload */}
              <div className="space-y-2">
                <Label>Private Key File (Encrypted)</Label>
                <input
                  ref={privateKeyInputRef}
                  type="file"
                  accept=".asc,.txt,.key"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('private', file);
                  }}
                />
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => privateKeyInputRef.current?.click()}
                >
                  {importedKeys?.privateKey ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-green-500" />
                      Private key loaded
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose private key file (.asc)
                    </>
                  )}
                </Button>
              </div>

              <Button
                className="w-full"
                disabled={!importedKeys?.publicKey || !importedKeys?.privateKey}
                onClick={() => setImportStep('passphrase')}
              >
                Continue
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="importPassphrase">Enter Your Passphrase</Label>
                <Input
                  id="importPassphrase"
                  type="password"
                  placeholder="The passphrase used to encrypt this key"
                  value={importPassphrase}
                  onChange={(e) => setImportPassphrase(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the passphrase you used when you originally created these keys.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setImportStep('upload')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleImportKeys}
                  disabled={importing || !importPassphrase}
                  className="flex-1"
                >
                  {importing ? 'Importing...' : 'Import Keys'}
                </Button>
              </div>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p>
              <strong>Tip:</strong> Import the same keys you exported earlier. 
              Your passphrase must match the original.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Public Key QR Code
            </DialogTitle>
            <DialogDescription>
              Scan this code to import the public key on another device
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {pgpKeys?.publicKey && (
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG 
                  value={pgpKeys.publicKey} 
                  size={256}
                  level="L"
                  includeMargin={false}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center max-w-[280px]">
              This QR code contains your full public key. Others can scan it to encrypt messages for you.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleCopy('public')}
            >
              {copied === 'public' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              Copy Key
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleDownload('public')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
