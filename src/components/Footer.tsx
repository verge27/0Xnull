import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/30 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold text-gradient">Tari Market</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              The privacy-first marketplace for grey market goods and discreet purchases.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/browse" className="text-muted-foreground hover:text-foreground transition-colors">
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link to="/sell" className="text-muted-foreground hover:text-foreground transition-colors">
                  Start Selling
                </Link>
              </li>
              <li>
                <Link to="/safety" className="text-muted-foreground hover:text-foreground transition-colors">
                  Safety Guide
                </Link>
              </li>
              <li>
                <Link to="/philosophy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Philosophy
                </Link>
              </li>
              <li>
                <Link to="/vpn-resources" className="text-muted-foreground hover:text-foreground transition-colors">
                  VPN Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Tari Market. All transactions conducted in XMR.</p>
        </div>
      </div>
    </footer>
  );
};
