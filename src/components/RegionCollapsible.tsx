import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronsUpDown, ChevronsDownUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegionCollapsibleProps {
  region: string;
  displayName: string;
  matchCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function RegionCollapsible({ 
  region, 
  displayName, 
  matchCount, 
  isExpanded, 
  onToggle, 
  children 
}: RegionCollapsibleProps) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">
                {displayName}
              </span>
              <Badge variant="secondary" className="text-xs">
                {matchCount} {matchCount === 1 ? 'match' : 'matches'}
              </Badge>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-180"
            )} />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="border-t border-border p-4">
            {children}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

interface ExpandCollapseButtonsProps {
  regions: string[];
  onExpandAll: (regions: string[]) => void;
  onCollapseAll: () => void;
  expandedCount: number;
}

export function ExpandCollapseButtons({ 
  regions, 
  onExpandAll, 
  onCollapseAll, 
  expandedCount 
}: ExpandCollapseButtonsProps) {
  const allExpanded = expandedCount === regions.length;
  const noneExpanded = expandedCount === 0;
  
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onExpandAll(regions)}
        disabled={allExpanded}
        className="h-8 text-xs gap-1"
      >
        <ChevronsUpDown className="h-3.5 w-3.5" />
        Expand All
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onCollapseAll}
        disabled={noneExpanded}
        className="h-8 text-xs gap-1"
      >
        <ChevronsDownUp className="h-3.5 w-3.5" />
        Collapse All
      </Button>
    </div>
  );
}