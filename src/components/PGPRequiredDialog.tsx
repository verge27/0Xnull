import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Key, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PGPRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'buyer_missing' | 'seller_missing' | 'buyer_locked';
  onUnlock?: () => void;
}

export function PGPRequiredDialog({ open, onOpenChange, type, onUnlock }: PGPRequiredDialogProps) {
  const navigate = useNavigate();

  const content = {
    buyer_missing: {
      title: 'PGP Keys Required',
      description: 'You need to set up PGP encryption before making purchases. This ensures your shipping address is encrypted and only the seller can read it.',
      action: 'Set Up PGP Keys',
      icon: Key,
      onAction: () => {
        onOpenChange(false);
        navigate('/settings');
      }
    },
    seller_missing: {
      title: 'Seller Not Ready',
      description: 'This seller has not set up PGP encryption yet. For your privacy protection, purchases can only be made from sellers with encrypted communication enabled.',
      action: 'Browse Other Listings',
      icon: ShieldAlert,
      onAction: () => {
        onOpenChange(false);
        navigate('/browse');
      }
    },
    buyer_locked: {
      title: 'Unlock Your PGP Keys',
      description: 'Your PGP keys are locked. Please enter your passphrase to encrypt your shipping address.',
      action: 'Unlock Keys',
      icon: Key,
      onAction: () => {
        onOpenChange(false);
        onUnlock?.();
      }
    }
  };

  const { title, description, action, icon: Icon, onAction } = content[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-destructive/10">
              <Icon className="w-6 h-6 text-destructive" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onAction}>
            {type === 'buyer_missing' && <Settings className="w-4 h-4 mr-2" />}
            {action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
