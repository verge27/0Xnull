import { getTeamLogo } from '@/lib/teamLogos';
import { cn } from '@/lib/utils';

interface TeamLogoProps {
  teamName: string | null | undefined;
  sport: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function TeamLogo({ teamName, sport, size = 'md', className }: TeamLogoProps) {
  const logoUrl = getTeamLogo(teamName, sport);
  
  if (!logoUrl) {
    // Fallback: first letter of team name
    const initial = teamName ? teamName.charAt(0).toUpperCase() : '?';
    return (
      <div 
        className={cn(
          sizeClasses[size],
          'rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground',
          className
        )}
      >
        {initial}
      </div>
    );
  }
  
  return (
    <img
      src={logoUrl}
      alt={teamName}
      className={cn(sizeClasses[size], 'object-contain', className)}
      onError={(e) => {
        // Hide image on error, show fallback
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}
