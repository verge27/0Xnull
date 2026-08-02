import { Key, Coins, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const steps = [
  {
    icon: Coins,
    label: 'Get XMR',
    body: 'Swap any coin into Monero, or buy it directly. No account at either end.',
    href: '/swaps',
    cta: 'Open swaps',
  },
  {
    icon: Key,
    label: 'Fund a token',
    body: 'A 0xn_ token is issued instantly. Send XMR to its address and the balance appears in USD.',
    href: '/dashboard',
    cta: 'Get a token',
  },
  {
    icon: Zap,
    label: 'Use anything',
    body: 'The same token pays for every metered service. No signup step at any of them.',
    href: '#catalog',
    cta: 'See the catalog',
  },
];

export const OnboardingStrip = () => (
  <div className="grid gap-4 md:grid-cols-3">
    {steps.map((step, i) => {
      const Icon = step.icon;
      const content = (
        <div className="h-full rounded-lg border border-border/60 bg-card/50 p-6 backdrop-blur transition-colors hover:border-primary/40">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-sm text-primary">0{i + 1}</span>
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold">{step.label}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{step.body}</p>
          <span className="text-sm text-primary font-medium">{step.cta} →</span>
        </div>
      );
      return step.href.startsWith('#') ? (
        <a key={step.label} href={step.href}>{content}</a>
      ) : (
        <Link key={step.label} to={step.href}>{content}</Link>
      );
    })}
  </div>
);
