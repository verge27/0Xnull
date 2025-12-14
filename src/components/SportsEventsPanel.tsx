import { useState, useEffect } from 'react';
import { useSportsEvents, getSportLabel, getSportEmoji, type SportsEvent } from '@/hooks/useSportsEvents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RefreshCw, Calendar, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface SportsEventsPanelProps {
  onMarketsCreated: () => void;
  existingMarketIds: string[];
}

const SPORTS = ['nfl', 'premier_league', 'ufc'] as const;

export function SportsEventsPanel({ onMarketsCreated, existingMarketIds }: SportsEventsPanelProps) {
  const { events, loading, error, fetchEvents, createSportsMarket, autoCreateMarketsForNext24Hours } = useSportsEvents();
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [teamSelectDialog, setTeamSelectDialog] = useState<{ open: boolean; event: SportsEvent | null }>({
    open: false,
    event: null,
  });
  const [creating, setCreating] = useState(false);
  const [autoCreating, setAutoCreating] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSportChange = (sport: string) => {
    setSelectedSport(sport);
    if (sport === 'all') {
      fetchEvents();
    } else {
      fetchEvents(sport);
    }
  };

  const handleCreateMarket = async (event: SportsEvent, team: string) => {
    setCreating(true);
    const success = await createSportsMarket(event, team);
    setCreating(false);
    setTeamSelectDialog({ open: false, event: null });
    if (success) {
      onMarketsCreated();
    }
  };

  const handleAutoCreate = async () => {
    setAutoCreating(true);
    const { created, skipped } = await autoCreateMarketsForNext24Hours(existingMarketIds);
    setAutoCreating(false);
    
    if (created > 0) {
      toast.success(`Created ${created} markets for upcoming games`);
      onMarketsCreated();
    } else if (skipped > 0) {
      toast.info('All markets for upcoming games already exist');
    } else {
      toast.info('No games ending in the next 24 hours');
    }
  };

  const formatGameTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const formatted = date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    });
    return `${formatted} UTC`;
  };

  const getEventMarketStatus = (event: SportsEvent) => {
    const homeSlug = event.home_team.toLowerCase().replace(/\s+/g, '_');
    const awaySlug = event.away_team.toLowerCase().replace(/\s+/g, '_');
    const homeExists = existingMarketIds.includes(`sports_${event.event_id}_${homeSlug}`);
    const awayExists = existingMarketIds.includes(`sports_${event.event_id}_${awaySlug}`);
    
    if (homeExists && awayExists) return 'both';
    if (homeExists || awayExists) return 'partial';
    return 'none';
  };

  // Group events by sport
  const groupedEvents = events.reduce((acc, event) => {
    if (!acc[event.sport]) acc[event.sport] = [];
    acc[event.sport].push(event);
    return acc;
  }, {} as Record<string, SportsEvent[]>);

  const filteredEvents = selectedSport === 'all' 
    ? events 
    : events.filter(e => e.sport === selectedSport);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Sports Events
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoCreate}
              disabled={autoCreating || loading}
            >
              <Zap className={`w-4 h-4 mr-2 ${autoCreating ? 'animate-pulse' : ''}`} />
              {autoCreating ? 'Creating...' : 'Auto-Create 24h'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchEvents(selectedSport === 'all' ? undefined : selectedSport)}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedSport} onValueChange={handleSportChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            {SPORTS.map(sport => (
              <TabsTrigger key={sport} value={sport}>
                {getSportEmoji(sport)} {getSportLabel(sport)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedSport} className="mt-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading events...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No upcoming events</div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {filteredEvents.map(event => {
                  const marketStatus = getEventMarketStatus(event);
                  const now = Date.now() / 1000;
                  const isLive = event.commence_timestamp <= now;
                  
                  return (
                    <div
                      key={event.event_id}
                      className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span>{getSportEmoji(event.sport)}</span>
                          <Badge variant="outline" className="text-xs">
                            {getSportLabel(event.sport)}
                          </Badge>
                          {isLive && (
                            <Badge className="bg-red-600 text-xs animate-pulse">LIVE</Badge>
                          )}
                          {marketStatus === 'both' && (
                            <Badge variant="secondary" className="text-xs">Markets Active</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatGameTime(event.commence_timestamp)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {event.away_team} <span className="text-muted-foreground">@</span> {event.home_team}
                        </div>
                        
                        {marketStatus !== 'both' && !isLive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTeamSelectDialog({ open: true, event })}
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Create Market
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Team Selection Dialog */}
        <Dialog 
          open={teamSelectDialog.open} 
          onOpenChange={(open) => setTeamSelectDialog({ open, event: open ? teamSelectDialog.event : null })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Sports Market</DialogTitle>
              <DialogDescription>
                Select which team you want to create a "Will they win?" market for.
              </DialogDescription>
            </DialogHeader>
            
            {teamSelectDialog.event && (
              <div className="space-y-4">
                <div className="text-center text-sm text-muted-foreground">
                  {getSportEmoji(teamSelectDialog.event.sport)} {getSportLabel(teamSelectDialog.event.sport)} •{' '}
                  {formatGameTime(teamSelectDialog.event.commence_timestamp)}
                </div>
                
                <div className="grid gap-3">
                  <Button
                    variant="outline"
                    className="h-16 text-lg justify-start px-6"
                    onClick={() => handleCreateMarket(teamSelectDialog.event!, teamSelectDialog.event!.home_team)}
                    disabled={creating || existingMarketIds.includes(
                      `sports_${teamSelectDialog.event.event_id}_${teamSelectDialog.event.home_team.toLowerCase().replace(/\s+/g, '_')}`
                    )}
                  >
                    <span className="mr-3">🏠</span>
                    {teamSelectDialog.event.home_team}
                    {existingMarketIds.includes(
                      `sports_${teamSelectDialog.event.event_id}_${teamSelectDialog.event.home_team.toLowerCase().replace(/\s+/g, '_')}`
                    ) && <Badge variant="secondary" className="ml-auto">Exists</Badge>}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-16 text-lg justify-start px-6"
                    onClick={() => handleCreateMarket(teamSelectDialog.event!, teamSelectDialog.event!.away_team)}
                    disabled={creating || existingMarketIds.includes(
                      `sports_${teamSelectDialog.event.event_id}_${teamSelectDialog.event.away_team.toLowerCase().replace(/\s+/g, '_')}`
                    )}
                  >
                    <span className="mr-3">✈️</span>
                    {teamSelectDialog.event.away_team}
                    {existingMarketIds.includes(
                      `sports_${teamSelectDialog.event.event_id}_${teamSelectDialog.event.away_team.toLowerCase().replace(/\s+/g, '_')}`
                    ) && <Badge variant="secondary" className="ml-auto">Exists</Badge>}
                  </Button>
                </div>
                
                {creating && (
                  <div className="text-center text-sm text-muted-foreground">
                    Creating market...
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
