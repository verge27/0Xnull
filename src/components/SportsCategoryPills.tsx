import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CATEGORY_META, SPORT_LABELS, SportsCategories } from '@/hooks/useSportsCategories';

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
  onSelectSport 
}: SportsCategoryPillsProps) {
  // Order categories with priority for popular ones, exclude 'other'
  const orderedCategories = [
    'soccer',
    'cricket', 
    'mma',
    'boxing',
    'basketball',
    'football',
    'hockey',
    'golf',
    'rugby',
  ].filter(c => categories.includes(c));

  // Get sports from 'other' category to show on second line
  const otherSports = allCategories['other'] || [];

  return (
    <div className="space-y-2">
      {/* Main categories row */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          <Button
            variant={selectedCategory === null && selectedSport === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => { onSelectCategory(null); onSelectSport(null); }}
            className={cn(
              "rounded-full px-4",
              selectedCategory === null && selectedSport === null && "bg-primary text-primary-foreground"
            )}
          >
            🔥 All
          </Button>
          {orderedCategories.map(category => {
            const meta = CATEGORY_META[category];
            const isSelected = selectedCategory === category;
            
            return (
              <Button
                key={category}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => { onSelectCategory(category); onSelectSport(null); }}
                className={cn(
                  "rounded-full px-4 whitespace-nowrap",
                  isSelected && "bg-primary text-primary-foreground"
                )}
              >
                {meta?.emoji} {meta?.label || category}
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Other sports row */}
      {otherSports.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {otherSports.map(sport => {
              const isSelected = selectedSport === sport;
              const label = SPORT_LABELS[sport] || sport.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              
              return (
                <Button
                  key={sport}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { onSelectCategory(null); onSelectSport(sport); }}
                  className={cn(
                    "rounded-full px-3 text-xs whitespace-nowrap",
                    isSelected && "bg-primary text-primary-foreground"
                  )}
                >
                  {label}
                </Button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}
