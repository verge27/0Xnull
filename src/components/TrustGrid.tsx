import { Key, ShieldCheck, Globe, FileSignature, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

import { TOR_ADDRESS } from '@/lib/privateNetworks';

export { TOR_ADDRESS };

const items = [
  {
    icon: Key,
    title: 'No accounts, ever',
    body: 'There is no email, no password and no recovery flow. A 0xn_ token is the only credential, and rate limits attach to the token rather than your IP.',
    to: '/docs#token',
  },
  {
    icon: FileSignature,
    title: 'Warrant canary',
    body: 'A dated statement about what we have and have not been compelled to do, refreshed on a fixed schedule. Its absence is the signal.',
    to: '/canary',
  },
  {
    icon: ShieldCheck,
    title: 'Escrow with a dead man\'s switch',
    body: 'Marketplace stakes sit in escrow with a timed release, so a vanished operator cannot strand funds indefinitely.',
    to: '/docs#escrow',
  },
  {
    icon: Globe,
    title: 'Tor and I2P mirrors',
    body: 'Reachable as a Tor onion service and as an I2P service. Same tokens, same balances. Predictions is not available over either private transport.',
    to: '/tor-guide',
  },
  {
    icon: Lock,
    title: 'Client-side encryption',
    body: 'Shipping details and messages are PGP-encrypted in your browser. The server stores ciphertext it cannot read.',
    to: '/docs#crypto',
  },
];

export const TrustGrid = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {items.map((item) => {
      const Icon = item.icon;
      return (
        <Link
          key={item.title}
          to={item.to}
          className="rounded-lg border border-border/60 bg-card/50 p-6 backdrop-blur transition-colors hover:border-primary/40"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3" aria-hidden="true">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">{item.title}</h3>
          <p className="text-sm text-muted-foreground">{item.body}</p>
        </Link>
      );
    })}
  </div>
);
