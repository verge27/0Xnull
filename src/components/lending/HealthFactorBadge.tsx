import { healthFactorColor } from '@/lib/lending';

interface HealthFactorBadgeProps {
  value: number;
  size?: 'sm' | 'md';
}

export const HealthFactorBadge = ({ value, size = 'md' }: HealthFactorBadgeProps) => {
  const color = healthFactorColor(value);
  const label = value >= 100 ? '∞' : value.toFixed(2);
  const textSize = size === 'sm' ? 'text-sm' : 'text-lg';

  return (
    <span className={`${color} ${textSize} font-mono font-bold`}>
      {label}
    </span>
  );
};
