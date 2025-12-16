import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSportLabel } from '@/hooks/useSportsCategories';

interface SportsLeagueSelectProps {
  leagues: string[];
  selectedLeague: string | null;
  onSelect: (league: string | null) => void;
  disabled?: boolean;
}

export function SportsLeagueSelect({ leagues, selectedLeague, onSelect, disabled }: SportsLeagueSelectProps) {
  if (leagues.length === 0) {
    return null;
  }

  return (
    <Select
      value={selectedLeague || 'all'}
      onValueChange={(v) => onSelect(v === 'all' ? null : v)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[200px] bg-background">
        <SelectValue placeholder="Select league" />
      </SelectTrigger>
      <SelectContent className="bg-background border border-border z-50">
        <SelectItem value="all">All Leagues</SelectItem>
        {leagues.map(league => (
          <SelectItem key={league} value={league}>
            {getSportLabel(league)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
