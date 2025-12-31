import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { getSportLabel } from '@/hooks/useSportsCategories';
import { getLeagueOrder, REGION_DISPLAY_NAMES, type LeagueRegion } from '@/lib/soccerLeagueOrder';
import { useMemo } from 'react';

interface SportsLeagueSelectProps {
  leagues: string[];
  selectedLeague: string | null;
  onSelect: (league: string | null) => void;
  disabled?: boolean;
}

export function SportsLeagueSelect({ leagues, selectedLeague, onSelect, disabled }: SportsLeagueSelectProps) {
  // Group leagues by region
  const groupedLeagues = useMemo(() => {
    const groups: Record<LeagueRegion, string[]> = {} as any;
    
    leagues.forEach(league => {
      const info = getLeagueOrder(league);
      if (!groups[info.region]) {
        groups[info.region] = [];
      }
      groups[info.region].push(league);
    });
    
    // Define display order for regions
    const regionOrder: LeagueRegion[] = [
      'europe_top5', 'europe_other', 'uk_cups', 'europe_cups',
      'americas', 'americas_cups', 'asia_oceania', 'africa',
      'international', 'unknown'
    ];
    
    return regionOrder
      .filter(region => groups[region] && groups[region].length > 0)
      .map(region => ({
        region,
        label: REGION_DISPLAY_NAMES[region],
        leagues: groups[region],
      }));
  }, [leagues]);

  if (leagues.length === 0) {
    return null;
  }

  return (
    <Select
      value={selectedLeague || 'all'}
      onValueChange={(v) => onSelect(v === 'all' ? null : v)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[220px] bg-background">
        <SelectValue placeholder="Select league" />
      </SelectTrigger>
      <SelectContent className="bg-background border border-border z-50 max-h-[400px]">
        <SelectItem value="all">All Leagues</SelectItem>
        <SelectItem value="by_league">📋 Group by Region</SelectItem>
        
        {groupedLeagues.map(({ region, label, leagues: regionLeagues }) => (
          <SelectGroup key={region}>
            <SelectLabel className="text-xs text-muted-foreground px-2 py-1.5">
              {label}
            </SelectLabel>
            {regionLeagues.map(league => (
              <SelectItem key={league} value={league} className="pl-4">
                {getSportLabel(league)}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
