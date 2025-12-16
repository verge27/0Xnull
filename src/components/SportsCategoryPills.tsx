import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CATEGORY_META, SPORT_LABELS, type SportsCategories } from '@/hooks/useSportsCategories';

interface SportsCategoryPillsProps {
  categories: string[];
  allCategories: SportsCategories;
  selectedCategory: string | null;
  selectedSport: string | null;
  onSelectCategory: (category: string | null) => void;
  onSelectSport: (sport: string | null) => void;
}

export function SportsCategoryPills({
  categories,
  allCategories,
  selectedCategory,
  selectedSport,
  onSelectCategory,
  onSelectSport,
}: SportsCategoryPillsProps) {
  // Order categories with priority for popular ones, exclude 'other'
  // Include 'combat' as fallback if mma/boxing transformation didn't happen
  const orderedCategories = [
    'soccer',
    'cricket',
    'mma',
    'boxing',
    'combat',
    'basketball',
    'football',
    'hockey',
    'golf',
    'rugby',
  ].filter((c) => categories.includes(c));

  // Show sports from "other" as second-row pills (no "Other" category pill)
  const otherSports = allCategories['other'] || [];

  return (
    <div className="space-y-2">
      {/* Main categories row (simple scroller: avoids Radix ScrollArea drag/click conflicts) */}
      <div className="w-full overflow-x-auto">
        <div className="flex gap-2 pb-2 min-w-max">
          <Button
            type="button"
            variant={selectedCategory === null && selectedSport === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              onSelectCategory(null);
              onSelectSport(null);
            }}
            className={cn(
              'rounded-full px-4',
              selectedCategory === null && selectedSport === null && 'bg-primary text-primary-foreground',
            )}
          >
            🔥 All
          </Button>

          {orderedCategories.map((category) => {
            const meta = CATEGORY_META[category];
            const isSelected = selectedCategory === category;

            return (
              <Button
                key={category}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  onSelectCategory(category);
                  onSelectSport(null);
                }}
                className={cn(
                  'rounded-full px-4 whitespace-nowrap',
                  isSelected && 'bg-primary text-primary-foreground',
                )}
              >
                {meta?.emoji} {meta?.label || category}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Other sports row */}
      {otherSports.length > 0 && (
        <div className="w-full overflow-x-auto">
          <div className="flex gap-2 pb-2 min-w-max">
            {otherSports.map((sport) => {
              const isSelected = selectedSport === sport;
              const label =
                SPORT_LABELS[sport] ||
                sport.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

              return (
                <Button
                  key={sport}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    onSelectCategory(null);
                    onSelectSport(sport);
                  }}
                  className={cn(
                    'rounded-full px-3 text-xs whitespace-nowrap',
                    isSelected && 'bg-primary text-primary-foreground',
                  )}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
