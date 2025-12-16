import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CATEGORY_META } from '@/hooks/useSportsCategories';

interface SportsCategoryPillsProps {
  categories: string[];
  selectedCategory: string | null;
  onSelect: (category: string | null) => void;
}

export function SportsCategoryPills({ categories, selectedCategory, onSelect }: SportsCategoryPillsProps) {
  // Order categories with priority for popular ones, other at the end
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
    'other',
  ].filter(c => categories.includes(c));

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(null)}
          className={cn(
            "rounded-full px-4",
            selectedCategory === null && "bg-primary text-primary-foreground"
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
              onClick={() => onSelect(category)}
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
  );
}
