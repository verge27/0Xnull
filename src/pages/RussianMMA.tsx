import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpCircle, ExternalLink, Calendar, MapPin, Tv, Youtube, MessageCircle, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { usePromotions, useFeaturedFights, useUpcomingEvents, Promotion, Event, Matchup } from '@/hooks/useRussianMMA';
import { MyBets } from '@/components/MyBets';
import { usePredictionBets } from '@/hooks/usePredictionBets';
import { ResolutionBadge } from '@/components/ResolutionBadge';
import { CreateFightMarketDialog } from '@/components/CreateFightMarketDialog';
import { BetSlipPanel } from '@/components/BetSlipPanel';
import { MultibetDepositModal } from '@/components/MultibetDepositModal';
import { useMultibetSlip } from '@/hooks/useMultibetSlip';
import { fixName, getCountryFlag, Region, regionLabels, getPromotionRegion } from '@/lib/nameFixes';
import russianMmaBackground from '@/assets/russian-mma-background.jpg';

const RussianMMA = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [regionFilter, setRegionFilter] = useState<Region>('all');
  const { data: promotions, isLoading: loadingPromotions } = usePromotions();
  const { data: featured, isLoading: loadingFeatured } = useFeaturedFights();
  const { data: events, isLoading: loadingEvents } = useUpcomingEvents(regionFilter);
  const { bets, checkBetStatus, submitPayoutAddress } = usePredictionBets();
  const betSlip = useMultibetSlip();
  const [multibetDepositOpen, setMultibetDepositOpen] = useState(false);

  // Group promotions by region
  const groupedPromotions = promotions?.reduce((acc, promo) => {
    const region = getPromotionRegion(promo.id);
    if (!acc[region]) acc[region] = [];
    acc[region].push(promo);
    return acc;
  }, {} as Record<Region, Promotion[]>);

  return (
    <div 
      className="min-h-screen bg-background relative"
      style={{ 
        backgroundImage: `url(${russianMmaBackground})`,
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 bg-black/80 pointer-events-none" />
      
      <div className="relative z-10">
        <Navbar />
        
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-red-500 via-red-400 to-orange-500 bg-clip-text text-transparent drop-shadow-2xl">
                Eastern Combat Markets
              </h1>
              <p className="text-xl md:text-2xl text-white/90 font-medium">
                Underground • Eastern Europe • Asia
              </p>
            </div>
          </div>
        </section>

      {/* Region Filter Tabs */}
      <div className="container mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(Object.keys(regionLabels) as Region[]).map((region) => (
            <Button
              key={region}
              variant={regionFilter === region ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRegionFilter(region)}
              className={regionFilter === region ? 'bg-red-600 hover:bg-red-700' : 'border-red-900/50 hover:bg-red-950'}
            >
              {regionLabels[region]}
            </Button>
          ))}
        </div>
      </div>

      {/* How It Works Banner */}
      <div className="container mb-8">
        <Link 
          to="/how-betting-works" 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-muted/50 rounded-lg px-4 py-3"
        >
          <HelpCircle className="h-4 w-4" />
          <span>New to parimutuel betting? Learn how it works</span>
        </Link>
      </div>

      <div className="container pb-16 space-y-12">
        {/* Watch Section - Clickable Card */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Youtube className="h-6 w-6 text-red-500" />
            Watch Top Dog FC
          </h2>
          <div className="max-w-2xl space-y-3">
            <a 
              href="https://youtube.com/channel/UCAeCwHL4T91FKoYiFXHy0-g"
              target="_blank" 
              rel="noopener noreferrer"
              className="block group"
            >
              <Card className="overflow-hidden border-red-900/30 bg-card/50 hover:border-red-600/50 transition-all">
                <div className="relative aspect-video w-full bg-gradient-to-br from-black via-red-950/80 to-black overflow-hidden">
                  <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]" />
                  <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-red-800/30 rounded-full blur-2xl" />
                  <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="mb-4 bg-red-600 rounded-full p-4 group-hover:scale-110 transition-transform">
                      <Youtube className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                      Top Dog Fighting
                    </h3>
                    <p className="text-red-400 font-semibold mb-1">
                      Bare-Knuckle Boxing • POP-MMA • Freak Fights
                    </p>
                    <p className="text-muted-foreground text-sm">
                      1.5M+ Subscribers • Click to watch
                    </p>
                  </div>
                </div>
              </Card>
            </a>
            <div className="flex flex-wrap gap-3">
              <a 
                href="https://yewtu.be/channel/UCAeCwHL4T91FKoYiFXHy0-g"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-2 border-purple-900/50 hover:border-purple-600/50">
                  <ExternalLink className="h-4 w-4 text-purple-400" />
                  Tor Alternate (Invidious)
                </Button>
              </a>
              <a 
                href="https://t.me/topdogfighting" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-2 border-blue-900/50 hover:border-blue-600/50">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  Telegram
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Next Event Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Next Event</h2>
          {loadingFeatured ? (
            <Skeleton className="h-48" />
          ) : featured?.upcoming?.event ? (
            <Card className="border-red-900/30 bg-gradient-to-br from-card to-red-950/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl text-red-400">{fixName(featured.upcoming.event)}</CardTitle>
                    <ResolutionBadge resolution={featured.upcoming.resolution} />
                  </div>
                  <Badge className="bg-red-600">{featured.upcoming.status || 'Coming Soon'}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {featured.upcoming.date}
                  </span>
                  {featured.upcoming.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {featured.upcoming.location}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {featured.upcoming.stream && (
                  <p className="text-sm text-muted-foreground">{featured.upcoming.stream}</p>
                )}
                {featured.upcoming.ppv_url && (
                  <a 
                    href={featured.upcoming.ppv_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full bg-red-600 hover:bg-red-700 gap-2">
                      <Tv className="h-4 w-4" />
                      Watch on PPV
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-red-900/30 bg-card/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                No upcoming events announced. Check back soon!
              </CardContent>
            </Card>
          )}
        </section>

        {/* Past Results Section */}
        {featured?.past_results && featured.past_results.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Past Results</h2>
            <div className="space-y-3">
              {featured.past_results.map((result, idx) => (
                <Card key={idx} className="border-red-900/30 bg-card/50">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-red-400">{fixName(result.event)}</p>
                        <p className="text-sm text-muted-foreground">{result.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.video_url && (
                          <a 
                            href={result.video_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline" className="gap-1 border-red-700 text-red-400 hover:bg-red-950">
                              <Youtube className="h-4 w-4" />
                              Watch
                            </Button>
                          </a>
                        )}
                        <Badge variant="outline" className="border-green-700 text-green-400">Completed</Badge>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm text-foreground">{result.result}</p>
                      {result.note && (
                        <p className="text-xs text-muted-foreground mt-1">{result.note}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50">
            <TabsTrigger value="upcoming">Events</TabsTrigger>
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="mybets">My Bets</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {loadingEvents ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : events && events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <EventCard key={event.event_id} event={event} />
                ))}
              </div>
            ) : (
              <Card className="border-red-900/30 bg-card/50">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No upcoming events{regionFilter !== 'all' ? ` in ${regionLabels[regionFilter]}` : ''}. Check back soon!
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="markets" className="mt-6">
            <Card className="border-red-900/30 bg-card/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                Active markets for Eastern fighting will appear here. Create a market from an upcoming fight to get started!
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mybets" className="mt-6">
            <MyBets bets={bets} onStatusUpdate={checkBetStatus} onPayoutSubmit={submitPayoutAddress} />
          </TabsContent>
        </Tabs>

        {/* Promotions Section - Grouped by Region */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Promotions</h2>
          {loadingPromotions ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : groupedPromotions ? (
            <div className="space-y-8">
              {/* Russian Underground */}
              {groupedPromotions.russian && groupedPromotions.russian.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-red-400 flex items-center gap-2">
                    🇷🇺 Russian Underground
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {groupedPromotions.russian.map((promo) => (
                      <PromotionCard key={promo.id} promotion={promo} />
                    ))}
                  </div>
                </div>
              )}

              {/* Eastern Europe */}
              {groupedPromotions.eastern_europe && groupedPromotions.eastern_europe.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-red-400 flex items-center gap-2">
                    🇵🇱 Eastern Europe
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {groupedPromotions.eastern_europe.map((promo) => (
                      <PromotionCard key={promo.id} promotion={promo} />
                    ))}
                  </div>
                </div>
              )}

              {/* Asia */}
              {groupedPromotions.asia && groupedPromotions.asia.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-red-400 flex items-center gap-2">
                    🌏 Asia
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {groupedPromotions.asia.map((promo) => (
                      <PromotionCard key={promo.id} promotion={promo} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {/* Fallback static promotions */}
              <PromotionCardStatic
                name="TOP DOG FC"
                type="🥊 Bare-Knuckle"
                description="1.5M+ YouTube subs"
                extra="PPV on topdogfc.tv"
                resolution="auto"
                country="Russia"
                youtube="https://www.youtube.com/@TopDogFighting"
                telegram="https://t.me/topdogfighting"
              />
              <PromotionCardStatic
                name="HARDCORE FC"
                type="🥋 MMA + Fist"
                description="VK Exclusive"
                extra="Post-event edits"
                resolution="manual"
                country="Russia"
                youtube="https://www.youtube.com/@HardcoreFC"
                vk="https://vk.com/hardcorefc"
              />
              <PromotionCardStatic
                name="PUNCH CLUB"
                type="🎪 Freak Fights"
                description="Phone booth fights"
                extra="Car Jitsu • Shipping containers"
                resolution="manual"
                country="Russia"
              />
            </div>
          )}
        </section>
      </div>

      <Footer />

      {/* Multibet Slip */}
      <BetSlipPanel
        items={betSlip.items}
        isOpen={betSlip.isOpen}
        onOpenChange={betSlip.setIsOpen}
        onRemove={betSlip.removeFromBetSlip}
        onUpdateAmount={betSlip.updateAmount}
        onClear={betSlip.clearBetSlip}
        onReorder={betSlip.reorderItems}
        onUndo={betSlip.undoRemove}
        lastRemoved={betSlip.lastRemoved}
        calculatePotentialPayout={betSlip.calculatePotentialPayout}
        calculateTotalPotentialPayout={betSlip.calculateTotalPotentialPayout}
        onCheckout={async (payoutAddress) => {
          if (betSlip.activeSlip && betSlip.activeSlip.status === 'awaiting_deposit') {
            setMultibetDepositOpen(true);
            return betSlip.activeSlip;
          }
          const slip = await betSlip.checkout(payoutAddress);
          if (slip) {
            setMultibetDepositOpen(true);
          }
          return slip;
        }}
        totalUsd={betSlip.totalUsd}
        isCheckingOut={betSlip.isCheckingOut}
        activeSlip={betSlip.activeSlip}
        onViewActiveSlip={() => setMultibetDepositOpen(true)}
      />

      <MultibetDepositModal
        open={multibetDepositOpen}
        onOpenChange={setMultibetDepositOpen}
        slip={betSlip.activeSlip}
        onCheckStatus={betSlip.checkSlipStatus}
        onUpdatePayoutAddress={betSlip.updatePayoutAddress}
        onConfirmed={() => {
          betSlip.clearBetSlip();
        }}
      />
      </div>
    </div>
  );
};


const EventCard = ({ event }: { event: Event }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedMatchup, setSelectedMatchup] = useState<{ fighter1: string; fighter2: string } | null>(null);
  const matchups = event.matchups || [];
  const displayMatchups = expanded ? matchups : matchups.slice(0, 3);

  return (
    <>
      <Card className="border-red-900/30 bg-card/50">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getCountryFlag(event.country)}</span>
              <CardTitle>{fixName(event.event_name)}</CardTitle>
              <ResolutionBadge resolution={event.resolution} showLabel={false} />
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {event.date_raw || event.date}
              </div>
            </div>
          </div>
          {event.promotion_name && (
            <p className="text-sm text-red-400">{fixName(event.promotion_name)}</p>
          )}
          {event.tapology_url && (
            <a 
              href={event.tapology_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-red-400"
            >
              View on Tapology
            </a>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Matchups */}
          {matchups.length > 0 && (
            <div className="space-y-2">
              {displayMatchups.map((matchup, idx) => {
                const fighter1 = matchup.fighter_1?.name || matchup.fighter1 || 'TBA';
                const fighter2 = matchup.fighter_2?.name || matchup.fighter2 || 'TBA';
                return (
                  <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm gap-2">
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-right pr-2">{fixName(fighter1)}</span>
                      <span className="text-red-400 font-bold px-2">vs</span>
                      <span className="pl-2">{fixName(fighter2)}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-red-700 text-red-400 hover:bg-red-950 gap-1 shrink-0"
                      onClick={() => setSelectedMatchup({ fighter1, fighter2 })}
                    >
                      <Plus className="h-3 w-3" />
                      Market
                    </Button>
                  </div>
                );
              })}
              {matchups.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setExpanded(!expanded)}
                  className="w-full text-muted-foreground hover:text-foreground gap-1"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show {matchups.length - 3} more matchups
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            {event.tapology_url && (
              <a href={event.tapology_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" className="w-full border-red-700 text-red-400 hover:bg-red-950 gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Full Card
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedMatchup && (
        <CreateFightMarketDialog
          open={!!selectedMatchup}
          onOpenChange={(open) => !open && setSelectedMatchup(null)}
          fighter1={selectedMatchup.fighter1}
          fighter2={selectedMatchup.fighter2}
          eventName={event.event_name}
          eventDate={event.date_raw || event.date}
          resolution={event.resolution}
          promotionName={event.promotion_name}
        />
      )}
    </>
  );
};

const PromotionCard = ({ promotion }: { promotion: Promotion }) => (
  <Card className="border-red-900/30 bg-card/50 hover:border-red-700/50 transition-colors">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{getCountryFlag(promotion.country)}</span>
          <CardTitle className="text-lg">{fixName(promotion.name)}</CardTitle>
        </div>
        <ResolutionBadge resolution={promotion.resolution} showLabel={false} />
      </div>
      <p className="text-sm text-red-400">{promotion.type}</p>
    </CardHeader>
    <CardContent className="space-y-3">
      {promotion.description && (
        <p className="text-sm text-muted-foreground">{promotion.description}</p>
      )}
      {promotion.resolution && (
        <p className="text-xs text-muted-foreground">
          {promotion.resolution === 'auto' 
            ? '✓ Auto-resolve (24-48h)' 
            : '⚑ Manual review (1-7 days)'}
        </p>
      )}
      <div className="flex gap-2 flex-wrap">
        {promotion.youtube && (
          <>
            <a href={`https://www.youtube.com/channel/${promotion.youtube}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1">
                <Youtube className="h-4 w-4" />
                YouTube
              </Button>
            </a>
            <a href={`https://yewtu.be/channel/${promotion.youtube}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1 border-purple-900/50 hover:border-purple-600/50">
                <ExternalLink className="h-4 w-4 text-purple-400" />
                Tor Alt
              </Button>
            </a>
          </>
        )}
        {promotion.telegram && (
          <a href={promotion.telegram} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1">
              <MessageCircle className="h-4 w-4" />
              Telegram
            </Button>
          </a>
        )}
        {promotion.vk && (
          <a href={promotion.vk} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1">
              <ExternalLink className="h-4 w-4" />
              VK
            </Button>
          </a>
        )}
        {promotion.website && (
          <a href={promotion.website} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1">
              <ExternalLink className="h-4 w-4" />
              Website
            </Button>
          </a>
        )}
      </div>
    </CardContent>
  </Card>
);

const PromotionCardStatic = ({ 
  name, 
  type, 
  description, 
  extra, 
  resolution,
  country,
  youtube, 
  telegram, 
  vk 
}: { 
  name: string; 
  type: string; 
  description: string; 
  extra?: string; 
  resolution?: 'auto' | 'manual';
  country?: string;
  youtube?: string; 
  telegram?: string; 
  vk?: string; 
}) => (
  <Card className="border-red-900/30 bg-card/50 hover:border-red-700/50 transition-colors">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{getCountryFlag(country)}</span>
          <CardTitle className="text-lg">{name}</CardTitle>
        </div>
        <ResolutionBadge resolution={resolution} showLabel={false} />
      </div>
      <p className="text-sm text-red-400">{type}</p>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">{description}</p>
      {extra && <p className="text-sm text-muted-foreground">{extra}</p>}
      {resolution && (
        <p className="text-xs text-muted-foreground">
          {resolution === 'auto' 
            ? '✓ Auto-resolve (24-48h)' 
            : '⚑ Manual review (1-7 days)'}
        </p>
      )}
      <div className="flex gap-2 flex-wrap">
        {youtube && (
          <>
            <a href={youtube} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1">
                <Youtube className="h-4 w-4" />
                YouTube
              </Button>
            </a>
            <a href={youtube.replace('youtube.com', 'yewtu.be').replace('www.youtube.com', 'yewtu.be')} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1 border-purple-900/50 hover:border-purple-600/50">
                <ExternalLink className="h-4 w-4 text-purple-400" />
                Tor Alt
              </Button>
            </a>
          </>
        )}
        {telegram && (
          <a href={telegram} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1">
              <MessageCircle className="h-4 w-4" />
              Telegram
            </Button>
          </a>
        )}
        {vk && (
          <a href={vk} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1">
              <ExternalLink className="h-4 w-4" />
              VK
            </Button>
          </a>
        )}
      </div>
    </CardContent>
  </Card>
);

export default RussianMMA;
