import { utilizationColor } from '@/lib/lending';

interface UtilizationBarProps {
  percent: number;
  showLabel?: boolean;
}

export const UtilizationBar = ({ percent, showLabel = true }: UtilizationBarProps) => {
  const color = utilizationColor(percent);
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-muted-foreground w-12 text-right">{percent.toFixed(1)}%</span>
      )}
    </div>
  );
};
