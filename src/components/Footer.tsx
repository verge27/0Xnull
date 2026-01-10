import { Link } from 'react-router-dom';
import { Shield, ExternalLink, Github, MessageSquare } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const SIMPLEX_LINK = 'https://smp18.simplex.im/g#o0awCwkgXWzbKUyPb5Z-hOOWZAoghJl2SfyzOHv4Uas';
const TOR_ADDRESS = 'onullluix4iaj77wbqf52dhdiey4kaucdoqfkaoolcwxvcdxz5j6duid.onion';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/30 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold text-gradient">0xNull</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              No logs. No accounts. Privacy by default.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Marketplace</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/browse" className="text-muted-foreground hover:text-foreground transition-colors">
                  Browse
                </Link>
              </li>
              <li>
                <Link to="/sell" className="text-muted-foreground hover:text-foreground transition-colors">
                  Sell
                </Link>
              </li>
            </ul>
          </div>

          {/* Predictions */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Predictions</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/esports-predictions" className="text-muted-foreground hover:text-foreground transition-colors">
                  Esports
                </Link>
              </li>
              <li>
                <Link to="/sports-predictions" className="text-muted-foreground hover:text-foreground transition-colors">
                  Sports
                </Link>
              </li>
              <li>
                <Link to="/predictions/sports/combat" className="text-muted-foreground hover:text-foreground transition-colors pl-2">
                  └ Combat
                </Link>
              </li>
              <li>
                <Link to="/predictions" className="text-muted-foreground hover:text-foreground transition-colors">
                  Crypto
                </Link>
              </li>
            </ul>
          </div>

          {/* AI */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">AI</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/voice" className="text-muted-foreground hover:text-foreground transition-colors">
                  Voice
                </Link>
              </li>
              <li>
                <Link to="/kokoro" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2">
                  Kokoro
                  <span className="text-[10px] bg-amber-600 text-black font-medium px-1.5 py-0.5 rounded">Soon</span>
                </Link>
              </li>
              <li>
                <Link to="/creators" className="text-muted-foreground hover:text-foreground transition-colors">
                  Creators
                </Link>
              </li>
            </ul>
          </div>

          {/* Infrastructure */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Infrastructure</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/swaps" className="text-muted-foreground hover:text-foreground transition-colors">
                  Swaps
                </Link>
              </li>
              <li>
                <Link to="/vps" className="text-muted-foreground hover:text-foreground transition-colors">
                  VPS
                </Link>
              </li>
              <li>
                <Link to="/phone" className="text-muted-foreground hover:text-foreground transition-colors">
                  eSIM
                </Link>
              </li>
              <li>
                <Link to="/vpn-resources" className="text-muted-foreground hover:text-foreground transition-colors">
                  VPN
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* SimpleX Support Section */}
        <div className="border-t border-border mt-8 pt-8 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-primary" aria-hidden="true" />
            <h3 className="font-semibold text-sm">Contact Us on SimpleX</h3>
          </div>
          <div className="p-3 bg-white rounded-xl mb-3">
            <QRCodeSVG 
              value={SIMPLEX_LINK}
              size={120}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            End-to-end encrypted. No email. Privacy by default.
          </p>
          
          {/* Tor Address */}
          <div className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">Tor:</span>{' '}
            <a 
              href={`http://${TOR_ADDRESS}`}
              className="font-mono text-xs hover:text-foreground transition-colors break-all"
            >
              {TOR_ADDRESS}
            </a>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/api-docs" className="hover:text-foreground transition-colors">API</Link>
            <Link to="/verify" className="hover:text-foreground transition-colors">Verify & Canary</Link>
            <a 
              href="https://kycnot.me/service/0xnull"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              KYCNOT.ME
            </a>
            <a 
              href="https://github.com/verge27/0Xnull"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Github className="w-3 h-3" />
              GitHub
            </a>
            <Link to="/support" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
          <p>© {new Date().getFullYear()} 0xNull. All transactions in XMR.</p>
        </div>
      </div>
    </footer>
  );
};