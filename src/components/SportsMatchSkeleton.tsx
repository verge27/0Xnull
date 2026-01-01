import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SportsMatchSkeletonProps {
  count?: number;
}

export function SportsMatchSkeleton({ count = 6 }: SportsMatchSkeletonProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Teams */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-6 w-8" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-8" />
            </div>
            {/* Date/time */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SportsRegionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-5 w-5" />
            </div>
          </div>
          <div className="border-t border-border p-4">
            <SportsMatchSkeleton count={3} />
          </div>
        </Card>
      ))}
    </div>
  );
}