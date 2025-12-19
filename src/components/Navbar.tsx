import { Link, useNavigate } from 'react-router-dom';
import { Shield, ShoppingBag, User, Package, LogOut, Search, Heart, MessageCircle, Menu, Key, Copy, Check, Trash2, TrendingUp, Bot, Server, ChevronDown, Gamepad2, Trophy, Bitcoin, RefreshCw, Smartphone, Mic, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { usePrivateKeyAuth } from '@/hooks/usePrivateKeyAuth';
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

  useEffect(() => {
    if (storedPrivateKey && !keyInput) {
      setKeyInput(storedPrivateKey);
    }
  }, [storedPrivateKey]);

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

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="secondary" size="icon" className="sm:hidden border border-primary/50 animate-pulse">
                  <Menu className="w-5 h-5 text-primary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-primary" />
                    <span className="text-gradient">0xNull</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 mt-6">
                  {/* Marketplace */}
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Marketplace</div>
                  <Link to="/browse" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    <span>Browse</span>
                  </Link>
                  {isAuthenticated && (
                    <>
                      <Link to="/sell" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                        <Package className="w-5 h-5 text-primary" />
                        <span>Sell</span>
                      </Link>
                      <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                        <Package className="w-5 h-5 text-primary" />
                        <span>My Orders</span>
                      </Link>
                    </>
                  )}

                  {/* Predictions */}
                  <div className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Predictions</div>
                  <Link to="/esports-predictions" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <Gamepad2 className="w-5 h-5 text-purple-500" />
                    <span>Esports</span>
                  </Link>
                  <Link to="/sports-predictions" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <Trophy className="w-5 h-5 text-green-500" />
                    <span>Sports</span>
                  </Link>
                  <Link to="/predictions/sports/combat" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors pl-8">
                    <span className="text-muted-foreground">Combat</span>
                  </Link>
                  <Link to="/predictions" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <Bitcoin className="w-5 h-5 text-orange-500" />
                    <span>Crypto</span>
                  </Link>

                  {/* AI */}
                  <div className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI</div>
                  <Link to="/ai" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <Bot className="w-5 h-5 text-primary" />
                    <span>AI Hub</span>
                  </Link>
                  <Link to="/voice" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors pl-8">
                    <span className="text-muted-foreground">Voice</span>
                  </Link>
                  <Link to="/therapy" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors pl-8">
                    <span className="text-muted-foreground">Therapy</span>
                  </Link>
                  <Link to="/kokoro" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors pl-8">
                    <span className="text-muted-foreground">Kokoro</span>
                    <span className="text-[10px] bg-amber-500/90 text-white px-1.5 py-0.5 rounded">Soon</span>
                  </Link>

                  {/* Infrastructure */}
                  <div className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Infrastructure</div>
                  <Link to="/swaps" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <RefreshCw className="w-5 h-5 text-primary" />
                    <span>Swaps</span>
                  </Link>
                  <Link to="/vps" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <Server className="w-5 h-5 text-blue-500" />
                    <span>VPS</span>
                  </Link>
                  <Link to="/phone" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <Smartphone className="w-5 h-5 text-green-500" />
                    <span>eSIM</span>
                  </Link>

                  {/* Get Started */}
                  <div className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Here?</div>
                  <Link to="/get-started" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/30">
                    <Rocket className="w-5 h-5 text-primary" />
                    <span className="font-medium">Get Started</span>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Desktop Navigation - 4 Main Dropdowns */}
            
            {/* Marketplace Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1 hidden sm:inline-flex">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden md:inline">Marketplace</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-popover">
                <DropdownMenuItem asChild>
                  <Link to="/browse" className="cursor-pointer">Browse Listings</Link>
                </DropdownMenuItem>
                {isAuthenticated && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/sell" className="cursor-pointer">Sell</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="cursor-pointer">My Orders</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Predictions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1 hidden sm:inline-flex">
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden md:inline">Predictions</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-popover">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Esports</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/esports-predictions" className="cursor-pointer">All Esports</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Sports</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/sports-predictions" className="cursor-pointer">All Sports</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/predictions/sports/combat" className="cursor-pointer">Combat</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Crypto</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/predictions" className="cursor-pointer">Crypto Markets</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* AI Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1 hidden sm:inline-flex">
                  <Bot className="w-4 h-4" />
                  <span className="hidden md:inline">AI</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-popover">
                <DropdownMenuItem asChild>
                  <Link to="/ai" className="cursor-pointer">AI Hub</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/voice" className="cursor-pointer">Voice Cloning</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/therapy" className="cursor-pointer">AI Therapy</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/kokoro" className="cursor-pointer flex items-center justify-between">
                    Kokoro Companion
                    <span className="text-[10px] bg-amber-500/90 text-white px-1.5 py-0.5 rounded ml-2">Soon</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Infra Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1 hidden sm:inline-flex">
                  <Server className="w-4 h-4" />
                  <span className="hidden md:inline">Infra</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-popover">
                <DropdownMenuItem asChild>
                  <Link to="/infra" className="cursor-pointer">Infrastructure Hub</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/swaps" className="cursor-pointer">Crypto Swaps</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/vps" className="cursor-pointer">Anonymous VPS</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/phone" className="cursor-pointer">eSIM & Phone</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Get Started Button */}
            <Link to="/get-started" className="hidden sm:block">
              <Button variant="outline" size="sm" className="gap-1 border-primary/50 bg-primary/10 hover:bg-primary/20">
                <Rocket className="w-4 h-4" />
                <span className="hidden lg:inline">Get Started</span>
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
                <Link to="/orders" className="hidden sm:block">
                  <Button variant="ghost" size="icon">
                    <Package className="w-4 h-4" />
                  </Button>
                </Link>
                
                {/* Show user info based on auth type */}
                {privateKeyUser && (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="gap-1 font-mono text-xs h-7 px-2"
                      onClick={() => setKeyPopoverOpen(true)}
                    >
                      <Key className="w-3 h-3" />
                      {privateKeyUser.keyId}
                    </Button>
                    <Dialog open={keyPopoverOpen} onOpenChange={setKeyPopoverOpen}>
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
                <Button variant="default" size="sm" className="hidden sm:inline-flex">
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
