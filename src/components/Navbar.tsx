import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, ShoppingBag, User, Package, LogOut, Search, Heart, MessageCircle, Menu, Key, Copy, Check, Trash2, TrendingUp, Bot, Server, ChevronDown, Gamepad2, Trophy, Bitcoin, RefreshCw, Smartphone, Mic, Rocket, Receipt, Wallet, Zap, Sparkles, BookOpen, Gavel, Landmark, Terminal, Globe, FileText, Briefcase, X, ArrowLeftRight } from 'lucide-react';
import { useToken } from '@/hooks/useToken';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { usePrivateKeyAuth } from '@/hooks/usePrivateKeyAuth';
import { useMultibetSlip } from '@/hooks/useMultibetSlip';
import { TokenBadge } from '@/components/TokenManager';
import { NavbarIdentitySection, useNavbarIdentity } from '@/components/NavbarIdentity';
import { TokenStatusWidget } from '@/components/TokenStatusWidget';

import { useState, FormEvent, useEffect } from 'react';
import { getWishlist, getConversations } from '@/lib/data';
import { toast } from 'sonner';

const TokenDashboardBadge = () => <TokenStatusWidget />;


/** Mirrors the homepage service cards exactly (icons, labels, order, destinations). */
const MOBILE_NAV = [
  { to: '/', label: 'Home', icon: Shield },
  { to: '/ai', label: 'AI & Voice', icon: Bot },
  { to: '/phone', label: 'Phone & eSIM', icon: Smartphone },
  { to: '/swaps', label: 'Swaps', icon: ArrowLeftRight },
  { to: '/ramp', label: 'Fiat On/Off Ramp', icon: Wallet },
  { to: '/work', label: 'Work', icon: Briefcase },
  { to: '/vps', label: 'VPS', icon: Server },
];

const MobileWalletRow = ({ onNavigate }: { onNavigate: () => void }) => {
  const { token, balance, hasToken } = useToken();

  if (!hasToken || !token) {
    return (
      <Button asChild size="sm" className="w-full">
        <Link to="/get-started" onClick={onNavigate}>
          <Rocket className="w-4 h-4 mr-1.5" aria-hidden="true" />
          Get Started
        </Link>
      </Button>
    );
  }

  const truncated = `${token.slice(0, 6)}…${token.slice(-4)}`;
  return (
    <Link
      to="/dashboard"
      onClick={onNavigate}
      className="flex items-center gap-2 min-w-0 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors"
    >
      <Key className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
      <code className="font-mono text-xs text-muted-foreground truncate min-w-0">{truncated}</code>
      <span className="font-mono text-sm font-semibold ml-auto flex-shrink-0">${balance.toFixed(2)}</span>
    </Link>
  );
};


export const Navbar = () => {
  const { user, signOut } = useAuth();
  const { privateKeyUser, signOut: pkSignOut, isAuthenticated: isPkAuthenticated, storedPrivateKey, clearStoredPrivateKey, savePrivateKey } = usePrivateKeyAuth();
  const identity = useNavbarIdentity();
  const betSlip = useMultibetSlip();
  const navigate = useNavigate();
  const location = useLocation();
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
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0" aria-label="0xNull Home">
            <Shield className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" aria-hidden="true" />
            <span className="text-2xl font-bold text-gradient hidden sm:inline">0xNull</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                aria-label="Search 0xNull services, markets and listings"
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
                <Button variant="secondary" size="icon" className="sm:hidden border border-primary/50 animate-pulse" aria-label="Open navigation menu">
                  <Menu className="w-5 h-5 text-primary" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[min(86vw,360px)] max-w-none h-[100dvh] p-0 flex flex-col gap-0 bg-card border-r border-border [&>button:last-child]:hidden"
                style={{
                  paddingTop: 'env(safe-area-inset-top)',
                  paddingBottom: 'env(safe-area-inset-bottom)',
                }}
              >
                <SheetHeader className="px-4 pt-4 pb-3 border-b border-border space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <SheetTitle className="flex items-center gap-2">
                      <Shield className="w-6 h-6 text-primary" aria-hidden="true" />
                      <span className="text-gradient text-xl font-bold">0xNull</span>
                    </SheetTitle>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Close navigation menu">
                        <X className="w-5 h-5" aria-hidden="true" />
                      </Button>
                    </SheetClose>
                  </div>
                  <MobileWalletRow onNavigate={() => setMobileMenuOpen(false)} />
                </SheetHeader>

                <nav className="flex-1 overflow-y-auto px-3 py-3">
                  {MOBILE_NAV.map((item, index) => {
                    const active =
                      item.to === '/'
                        ? location.pathname === '/'
                        : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                    return (
                      <div key={item.to}>
                        {index === 1 && (
                          <div className="px-3 pt-4 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Services
                          </div>
                        )}
                        <Link
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          aria-current={active ? 'page' : undefined}
                          className={`flex items-center gap-3 h-[52px] px-3 rounded-lg transition-colors ${
                            active
                              ? 'bg-primary/10 border border-primary/40 text-foreground'
                              : 'border border-transparent hover:bg-secondary/50 text-foreground/90'
                          }`}
                        >
                          <item.icon className="w-5 h-5 text-primary flex-shrink-0" aria-hidden="true" />
                          <span className="font-medium truncate">{item.label}</span>
                        </Link>
                      </div>
                    );
                  })}
                </nav>
              </SheetContent>

            </Sheet>

            {/* Desktop Navigation - Reordered: Predictions, AI, Infra, Marketplace */}
            
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
              <DropdownMenuItem asChild>
                <Link to="/flash" className="cursor-pointer flex items-center gap-2">
                  <Zap className="w-3 h-3 text-purple-500" />
                  Flash (5min)
                  <span className="text-[10px] bg-purple-500/20 text-purple-400 font-medium px-1.5 py-0.5 rounded ml-auto">NEW</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Governance</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/governance-predictions" className="cursor-pointer flex items-center gap-2">
                  <Gavel className="w-3 h-3 text-amber-500" />
                  All Governance
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/my-slips" className="cursor-pointer">My Slips</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/payouts" className="cursor-pointer">Payout History</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

            {/* Lending Link */}
            <Button variant="ghost" className="gap-1 hidden sm:inline-flex" asChild>
              <Link to="/lending">
                <Landmark className="w-4 h-4" />
                <span className="hidden md:inline">Lending</span>
              </Link>
            </Button>

            {/* Swaps Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1 hidden sm:inline-flex">
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden md:inline">Swaps</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-popover border-border z-50">
                <DropdownMenuItem asChild>
                  <Link to="/buy" className="cursor-pointer">Buy (no KYC)</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/swaps" className="cursor-pointer">Swap</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/cashout" className="cursor-pointer">Cash out</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Blog Link */}
            <Button variant="ghost" className="gap-1 hidden sm:inline-flex" asChild>
              <Link to="/blog">
                <BookOpen className="w-4 h-4" />
                <span className="hidden md:inline">Blog</span>
              </Link>
            </Button>

            {/* Docs Link */}
            <Button variant="ghost" className="gap-1 hidden sm:inline-flex" asChild>
              <Link to="/docs">
                <FileText className="w-4 h-4" />
                <span className="hidden md:inline">Docs</span>
              </Link>
            </Button>


            {/* Free Software Link */}
            <Button variant="ghost" className="gap-1 hidden sm:inline-flex" asChild>
              <Link to="/free-software">
                <Terminal className="w-4 h-4" />
                <span className="hidden md:inline">Free Software</span>
              </Link>
            </Button>

            {/* Companions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1 hidden sm:inline-flex">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden md:inline">Companions</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-popover">
                <DropdownMenuItem asChild>
                  <Link to="/creators" className="cursor-pointer flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Browse Creators
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/creator/register" className="cursor-pointer">Become a Creator</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/fan/dashboard" className="cursor-pointer">Fan Dashboard</Link>
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
                  <Link to="/ai" className="cursor-pointer">AI Hub</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/voice" className="cursor-pointer">Voice Cloning</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/infra" className="cursor-pointer">Infrastructure Hub</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/vps" className="cursor-pointer">Anonymous VPS</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/phone" className="cursor-pointer">eSIM & Phone</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/work" className="cursor-pointer flex items-center gap-2">
                    <Briefcase className="w-3 h-3 text-primary" />
                    Work Paid in XMR
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/external-links" className="cursor-pointer flex items-center gap-2">
                    <Globe className="w-3 h-3 text-primary" />
                    External Links
                  </Link>
                </DropdownMenuItem>
                <NavbarIdentitySection 
                  keys={identity.keys}
                  onGenerate={identity.generate}
                  onLogin={identity.login}
                  onLogout={identity.logout}
                />
              </DropdownMenuContent>
            </DropdownMenu>

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
                <NavbarIdentitySection 
                  keys={identity.keys}
                  onGenerate={identity.generate}
                  onLogin={identity.login}
                  onLogout={identity.logout}
                />
              </DropdownMenuContent>
            </DropdownMenu>


            {/* Token Dashboard + Badge */}
            <TokenDashboardBadge />

            {/* Bet Slip Counter */}
            {betSlip.items.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => betSlip.setIsOpen(true)}
                aria-label="Open bet slip"
              >
                <Receipt className="w-4 h-4" />
                <Badge 
                  key={betSlip.items.length}
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary animate-[pulse_0.5s_ease-in-out]"
                >
                  {betSlip.items.length}
                </Badge>
              </Button>
            )}

            {/* Marketplace indicator + Wishlist - Only show on marketplace pages when authenticated */}
            {isAuthenticated && (location.pathname.startsWith('/browse') || 
              location.pathname.startsWith('/listing') || 
              location.pathname.startsWith('/wishlist') || 
              location.pathname.startsWith('/checkout') ||
              location.pathname.startsWith('/sell') ||
              location.pathname.startsWith('/orders')) && (
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary hidden sm:inline-flex">
                  <ShoppingBag className="w-3 h-3 mr-1" />
                  Marketplace
                </Badge>
                <Link to="/wishlist">
                  <Button variant="ghost" size="icon" className="relative" aria-label="View wishlist">
                    <Heart className="w-4 h-4" />
                    {wishlistCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {wishlistCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </div>
            )}
            
            {isAuthenticated && (
              <>
                <Link to="/messages">
                  <Button variant="ghost" size="icon" className="relative" aria-label="Open messages">
                    <MessageCircle className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link to="/orders" className="hidden sm:block">
                  <Button variant="ghost" size="icon" aria-label="View orders">
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
                                aria-label="Copy private key"
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
                    <Button variant="ghost" size="icon" onClick={() => pkSignOut()} className="hidden sm:inline-flex" aria-label="Sign out">
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                {user && (
                  <>
                    <Link to="/settings">
                      <Button variant="ghost" size="icon" aria-label="Account settings">
                        <User className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => signOut()} className="hidden sm:inline-flex" aria-label="Sign out">
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
};
