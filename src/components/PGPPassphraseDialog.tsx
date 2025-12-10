import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Lock, Shield } from 'lucide-react';
import { usePGP } from '@/hooks/usePGP';
import { useToast } from '@/hooks/use-toast';

interface PGPPassphraseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked?: () => void;
}

export function PGPPassphraseDialog({ open, onOpenChange, onUnlocked }: PGPPassphraseDialogProps) {
  const { checkHasKeys, generateKeys, unlockKeys, restoreSession } = usePGP();
  const { toast } = useToast();
  const [mode, setMode] = useState<'checking' | 'create' | 'unlock'>('checking');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      // First try to restore from session
      if (restoreSession()) {
        onOpenChange(false);
        onUnlocked?.();
        return;
      }

      // Check if user has keys
      checkHasKeys().then(hasKeys => {
        setMode(hasKeys ? 'unlock' : 'create');
      });
    }
  }, [open, checkHasKeys, restoreSession, onOpenChange, onUnlocked]);

  const handleCreate = async () => {
    if (passphrase.length < 8) {
      toast({
        title: 'Passphrase too short',
        description: 'Please use at least 8 characters',
        variant: 'destructive'
      });
      return;
    }

    if (passphrase !== confirmPassphrase) {
      toast({
        title: 'Passphrases do not match',
        description: 'Please make sure both passphrases match',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    const success = await generateKeys(passphrase);
    setLoading(false);

    if (success) {
      toast({
        title: 'PGP keys created',
        description: 'Your messages are now end-to-end encrypted'
      });
      setPassphrase('');
      setConfirmPassphrase('');
      onOpenChange(false);
      onUnlocked?.();
    } else {
      toast({
        title: 'Failed to create keys',
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  };

  const handleUnlock = async () => {
    setLoading(true);
    const success = await unlockKeys(passphrase);
    setLoading(false);

    if (success) {
      toast({
        title: 'Keys unlocked',
        description: 'You can now read and send encrypted messages'
      });
      setPassphrase('');
      onOpenChange(false);
      onUnlocked?.();
    } else {
      toast({
        title: 'Wrong passphrase',
        description: 'Please check your passphrase and try again',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {mode === 'create' ? 'Set Up Encryption' : 'Unlock Messages'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a passphrase to protect your encryption keys. This passphrase is used to encrypt your private key.'
              : 'Enter your passphrase to unlock your encrypted messages.'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'checking' ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : mode === 'create' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passphrase">Passphrase</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="passphrase"
                  type="password"
                  placeholder="Enter a strong passphrase"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters. This cannot be recovered if lost!
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassphrase">Confirm Passphrase</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassphrase"
                  type="password"
                  placeholder="Confirm your passphrase"
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={loading || !passphrase || !confirmPassphrase}
              className="w-full"
            >
              {loading ? 'Creating keys...' : 'Create Encryption Keys'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unlockPassphrase">Passphrase</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="unlockPassphrase"
                  type="password"
                  placeholder="Enter your passphrase"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
              </div>
            </div>

            <Button
              onClick={handleUnlock}
              disabled={loading || !passphrase}
              className="w-full"
            >
              {loading ? 'Unlocking...' : 'Unlock Messages'}
            </Button>
          </div>
        )}

        <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">🔐 End-to-End Encryption</p>
          <p>Your messages are encrypted with PGP. Only you and the recipient can read them.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
