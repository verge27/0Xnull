import { Link, useNavigate } from 'react-router-dom';
import { Shield, ShoppingBag, User, Package, LogOut, Search, Heart, MessageCircle, AlertTriangle, Menu, RefreshCw, Server, Smartphone, Bot, Sparkles, Key, Copy, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { usePrivateKeyAuth } from '@/hooks/usePrivateKeyAuth';
import { NavLink } from './NavLink';
import { TokenBadge } from '@/components/TokenManager';
import { useState, FormEvent, useEffect } from 'react';
import { getWishlist, getConversations } from '@/lib/data';
import { toast } from 'sonner';

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const { privateKeyUser, signOut: pkSignOut, isAuthenticated: isPkAuthenticated, storedPrivateKey, clearStoredPrivateKey, savePrivateKey } = usePrivateKeyAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistCount, setWishlistCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [keyPopoverOpen, setKeyPopoverOpen] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);

  // Use stored private key if available
  useEffect(() => {
    if (storedPrivateKey && !keyInput) {
      setKeyInput(storedPrivateKey);
    }
  }, [storedPrivateKey]);

  // Check if authenticated via either method
  const isAuthenticated = !!user || isPkAuthenticated;

  useEffect(() => {
    setWishlistCount(getWishlist().length);
    const conversations = getConversations();
    setUnreadCount(conversations.reduce((sum, c) => sum + c.unreadCount, 0));
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  const copyKey = () => {
    if (keyInput.length === 64) {
      navigator.clipboard.writeText(keyInput);
      setKeyCopied(true);
      toast.success('Private key copied!');
      setTimeout(() => setKeyCopied(false), 2000);
    }
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <Shield className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-bold text-gradient hidden sm:inline">0xNull</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search for anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border"
              />
            </div>
          </form>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="secondary" size="icon" className="sm:hidden border border-primary/50 animate-pulse">
                  <Menu className="w-5 h-5 text-primary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-primary" />
                    <span className="text-gradient">0xNull</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-6">
                  <Link to="/browse" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    <span>Browse</span>
                  </Link>
                  <Link to="/swaps" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <RefreshCw className="w-5 h-5 text-primary" />
                    <span>Swaps</span>
                  </Link>
                  <Link to="/vps" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <Server className="w-5 h-5 text-primary" />
                    <span>VPS</span>
                  </Link>
                  <Link to="/phone" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <Smartphone className="w-5 h-5 text-primary" />
                    <span>eSIM</span>
                  </Link>
                  <Link to="/ai" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <Bot className="w-5 h-5 text-primary" />
                    <span>AI</span>
                  </Link>
                  <Link to="/therapy" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <Heart className="w-5 h-5 text-primary" />
                    <span>Therapy</span>
                  </Link>
                  <Link to="/voice" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span>Voice Clone</span>
                  </Link>
                  <Link to="/safety" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    <span>Safety</span>
                  </Link>
                  {isAuthenticated && (
                    <Link to="/sell" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                      <Package className="w-5 h-5 text-primary" />
                      <span>Sell</span>
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Desktop Navigation */}
            <Link to="/browse">
              <Button variant="ghost" className="gap-2 hidden sm:inline-flex">
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden md:inline">Browse</span>
              </Button>
            </Link>

            <Link to="/swaps">
              <Button variant="ghost" className="gap-2 hidden sm:inline-flex">
                <span className="hidden md:inline">Swaps</span>
              </Button>
            </Link>

            <Link to="/vps">
              <Button variant="ghost" className="gap-2 hidden sm:inline-flex">
                <span className="hidden md:inline">VPS</span>
              </Button>
            </Link>

            <Link to="/phone">
              <Button variant="ghost" className="gap-2 hidden sm:inline-flex">
                <span className="hidden md:inline">eSIM</span>
              </Button>
            </Link>

            <Link to="/ai">
              <Button variant="ghost" className="gap-2 hidden sm:inline-flex">
                <span className="hidden md:inline">AI</span>
              </Button>
            </Link>

            <Link to="/voice">
              <Button variant="ghost" className="gap-2 hidden sm:inline-flex">
                <Sparkles className="w-4 h-4" />
                <span className="hidden md:inline">Voice Clone</span>
              </Button>
            </Link>

            <Link to="/safety">
              <Button variant="ghost" className="gap-2 hidden sm:inline-flex">
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden md:inline">Safety</span>
              </Button>
            </Link>

            {/* Token Balance Badge */}
            <TokenBadge />

            <Link to="/wishlist">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="w-4 h-4" />
                {wishlistCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {wishlistCount}
                  </Badge>
                )}
              </Button>
            </Link>
            
            {isAuthenticated && (
              <>
                <Link to="/messages">
                  <Button variant="ghost" size="icon" className="relative">
                    <MessageCircle className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link to="/orders">
                  <Button variant="ghost" size="icon">
                    <Package className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/sell">
                  <Button variant="secondary" className="hidden sm:inline-flex">
                    Sell
                  </Button>
                </Link>
                
                {/* Show user info based on auth type */}
                {privateKeyUser && (
                  <div className="flex items-center gap-2">
                    <Dialog open={keyPopoverOpen} onOpenChange={setKeyPopoverOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="gap-1 font-mono text-xs h-7 px-2"
                        >
                          <Key className="w-3 h-3" />
                          {privateKeyUser.keyId}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Your Private Key</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Key ID</Label>
                            <div className="font-mono text-lg text-primary">Anon_{privateKeyUser.keyId}</div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              {storedPrivateKey ? 'Your stored private key' : 'Enter private key to copy'}
                            </Label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                type="password"
                                placeholder="64-character key"
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                                className="font-mono text-xs"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={copyKey}
                                disabled={keyInput.length !== 64}
                                className={keyCopied ? 'text-green-500' : ''}
                              >
                                {keyCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          {!storedPrivateKey && keyInput.length === 64 && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => savePrivateKey(keyInput)}
                              className="w-full gap-2"
                            >
                              <Key className="h-3 w-3" />
                              Save key to storage
                            </Button>
                          )}
                          {storedPrivateKey && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                clearStoredPrivateKey();
                                setKeyInput('');
                              }}
                              className="w-full gap-2"
                            >
                              <Trash2 className="h-3 w-3" />
                              Clear stored key
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" onClick={() => pkSignOut()} className="hidden sm:inline-flex">
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                {user && (
                  <>
                    <Link to="/settings">
                      <Button variant="ghost" size="icon">
                        <User className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => signOut()} className="hidden sm:inline-flex">
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </>
            )}

            {!isAuthenticated && (
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
