import { useState, useEffect } from 'react';
import { Key, Copy, Check, LogIn, LogOut, User, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { generateKeypair, truncateKey, isValidPrivateKey, getPubkeyFromPrivate } from '@/lib/creatorCrypto';
import { toast } from 'sonner';

const STORAGE_KEY = '0xnull_keypair';

interface StoredKeypair {
  publicKey: string;
  privateKey: string;
  createdAt: string;
}

export function useNavbarIdentity() {
  const [keys, setKeys] = useState<StoredKeypair | null>(null);

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

  const generate = () => {
    const newKeys = generateKeypair();
    const storedKeys: StoredKeypair = {
      ...newKeys,
      createdAt: new Date().toISOString(),
    };
    setKeys(storedKeys);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedKeys));
    toast.success('New identity generated');
    return storedKeys;
  };

  const login = (privateKey: string) => {
    const trimmedKey = privateKey.trim().toLowerCase();
    if (!isValidPrivateKey(trimmedKey)) {
      toast.error('Invalid private key (128 hex chars required)');
      return false;
    }
    try {
      const publicKey = getPubkeyFromPrivate(trimmedKey);
      const storedKeys: StoredKeypair = {
        publicKey,
        privateKey: trimmedKey,
        createdAt: new Date().toISOString(),
      };
      setKeys(storedKeys);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedKeys));
      toast.success('Logged in');
      return true;
    } catch {
      toast.error('Invalid private key');
      return false;
    }
  };

  const logout = () => {
    setKeys(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Logged out');
  };

  return { keys, generate, login, logout, isLoggedIn: !!keys };
}

interface NavbarIdentitySectionProps {
  keys: StoredKeypair | null;
  onGenerate: () => void;
  onLogin: (key: string) => boolean;
  onLogout: () => void;
}

export function NavbarIdentitySection({ keys, onGenerate, onLogin, onLogout }: NavbarIdentitySectionProps) {
  const [loginKey, setLoginKey] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleLogin = () => {
    if (onLogin(loginKey)) {
      setLoginKey('');
      setShowLogin(false);
    }
  };

  if (keys) {
    return (
      <>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-2">
          <User className="w-3 h-3 text-green-500" />
          Identity Active
        </DropdownMenuLabel>
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-1 mb-1">
            <code className="text-[10px] font-mono text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded flex-1 truncate">
              {truncateKey(keys.publicKey, 8, 8)}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                copyToClipboard(keys.publicKey, 'public');
              }}
            >
              {copiedField === 'public' ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                copyToClipboard(keys.privateKey, 'private');
              }}
            >
              {copiedField === 'private' ? (
                <>
                  <Check className="h-3 w-3 mr-1 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Key className="h-3 w-3 mr-1" />
                  Copy Key
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onLogout();
              }}
            >
              <LogOut className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-2">
        <Key className="w-3 h-3" />
        Identity
      </DropdownMenuLabel>
      <div className="px-2 py-1.5 space-y-2">
        {showLogin ? (
          <>
            <Input
              type="password"
              placeholder="Private key (128 hex)"
              value={loginKey}
              onChange={(e) => setLoginKey(e.target.value)}
              className="h-7 text-xs font-mono"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') handleLogin();
              }}
            />
            <div className="flex gap-1">
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogin();
                }}
                disabled={!loginKey.trim()}
              >
                <LogIn className="h-3 w-3 mr-1" />
                Login
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowLogin(false);
                  setLoginKey('');
                }}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <div className="flex gap-1">
            <Button
              variant="default"
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onGenerate();
              }}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              New
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowLogin(true);
              }}
            >
              <LogIn className="h-3 w-3 mr-1" />
              Login
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
