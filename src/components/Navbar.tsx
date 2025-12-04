import { Link, useNavigate } from 'react-router-dom';
import { Shield, ShoppingBag, User, Package, LogOut, Search, Heart, MessageCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { NavLink } from './NavLink';
import { useState, FormEvent, useEffect } from 'react';
import { getWishlist, getConversations } from '@/lib/data';

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistCount, setWishlistCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

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

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <Shield className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-bold text-gradient hidden sm:inline">Tari Market</span>
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

            <Link to="/ai">
              <Button variant="ghost" className="gap-2 hidden sm:inline-flex">
                <span className="hidden md:inline">AI</span>
              </Button>
            </Link>

            <Link to="/safety">
              <Button variant="ghost" className="gap-2 hidden sm:inline-flex">
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden md:inline">Safety</span>
              </Button>
            </Link>

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
            
            {user && (
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

            {!user && (
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
