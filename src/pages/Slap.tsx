import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpCircle, ExternalLink, Calendar, Tv, Youtube, Users } from 'lucide-react';
import { useSlapPromotions, useSlapFeatured, useSlapStrikers, useSlapEvents, Striker, SlapEvent, SlapPromotion } from '@/hooks/useSlapFighting';
import { MyBets } from '@/components/MyBets';
import { usePredictionBets } from '@/hooks/usePredictionBets';

const Slap = () => {
  const [activeTab, setActiveTab] = useState('events');
  const { data: promotions, isLoading: loadingPromotions } = useSlapPromotions();
  const { data: featured, isLoading: loadingFeatured } = useSlapFeatured();
  const { data: strikers, isLoading: loadingStrikers } = useSlapStrikers();
  const { data: events, isLoading: loadingEvents } = useSlapEvents();
  const { bets, checkBetStatus, submitPayoutAddress } = usePredictionBets();

  return (
    <div className="min-h-screen bg-background relative bg-gradient-to-br from-black via-red-950/20 to-black">
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/70 pointer-events-none" />
      
      <div className="relative z-10">
        <Navbar />
        
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-900/30 via-transparent to-transparent" />
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-red-500 via-red-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-2xl">
                Slap Fighting
              </h1>
              <p className="text-xl md:text-2xl text-white/90 font-medium">
                Power Slap • Punchdown • Open Palm Combat
              </p>
            </div>
          </div>
        </section>

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
          {/* Watch Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Tv className="h-6 w-6 text-red-500" />
              Watch Power Slap
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <a 
                href="https://youtube.com/powerslap" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block group"
              >
                <Card className="overflow-hidden border-red-900/30 bg-card/50 hover:border-red-600/50 transition-all h-full">
                  <div className="relative aspect-video w-full bg-gradient-to-br from-black via-red-950/80 to-black overflow-hidden">
                    <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]" />
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl" />
                    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8">
                      <Youtube className="h-12 w-12 text-red-500 group-hover:scale-110 transition-transform mb-4" />
                      <h3 className="text-2xl font-bold mb-2 text-white">Power Slap on YouTube</h3>
                      <p className="text-muted-foreground">Official Channel</p>
                    </div>
                  </div>
                </Card>
              </a>
              <a 
                href="https://rumble.com/c/powerslap" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block group"
              >
                <Card className="overflow-hidden border-red-900/30 bg-card/50 hover:border-red-600/50 transition-all h-full">
                  <div className="relative aspect-video w-full bg-gradient-to-br from-black via-green-950/50 to-black overflow-hidden">
                    <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]" />
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-green-600/20 rounded-full blur-3xl" />
                    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8">
                      <Tv className="h-12 w-12 text-green-500 group-hover:scale-110 transition-transform mb-4" />
                      <h3 className="text-2xl font-bold mb-2 text-white">Power Slap on Rumble</h3>
                      <p className="text-muted-foreground">Live Streams</p>
                    </div>
                  </div>
                </Card>
              </a>
            </div>
          </section>

          {/* Video Embed Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Youtube className="h-6 w-6 text-red-500" />
              Recent Fights
            </h2>
            <div className="max-w-3xl">
              <div className="aspect-video rounded-lg overflow-hidden border border-red-900/30">
                <iframe 
                  src="https://www.youtube.com/embed/videoseries?list=UUmN7dud0yMDhG1AWTH7nnGQ"
                  width="100%" 
                  height="100%"
                  frameBorder="0" 
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title="Power Slap Videos"
                  className="w-full h-full"
                />
              </div>
            </div>
          </section>

          {/* Featured Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Next Event</h2>
            {loadingFeatured ? (
              <Skeleton className="h-48" />
            ) : featured?.upcoming?.event ? (
              <Card className="border-red-900/30 bg-gradient-to-br from-card to-red-950/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-red-400">{featured.upcoming.event}</CardTitle>
                    <Badge className="bg-red-600">{featured.upcoming.status || 'Coming Soon'}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {featured.upcoming.date}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {featured.upcoming.stream && (
                    <p className="text-sm text-muted-foreground">{featured.upcoming.stream}</p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {featured.upcoming.rumble_url && (
                      <a href={featured.upcoming.rumble_url} target="_blank" rel="noopener noreferrer">
                        <Button className="bg-green-700 hover:bg-green-800 gap-2">
                          <Tv className="h-4 w-4" />
                          Watch on Rumble
                        </Button>
                      </a>
                    )}
                    {featured.upcoming.youtube_url && (
                      <a href={featured.upcoming.youtube_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="gap-2 border-red-700 text-red-400 hover:bg-red-950">
                          <Youtube className="h-4 w-4" />
                          Watch on YouTube
                        </Button>
                      </a>
                    )}
                  </div>
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

          {/* Past Results */}
          {featured?.past_results && featured.past_results.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Recent Results</h2>
              <div className="space-y-3">
                {featured.past_results.map((result, idx) => (
                  <Card key={idx} className="border-red-900/30 bg-card/50">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-red-400">{result.event}</p>
                          <p className="text-sm text-muted-foreground">{result.date}</p>
                        </div>
                        <Badge variant="outline" className="border-green-700 text-green-400">Completed</Badge>
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

          {/* Notable Strikers Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Users className="h-6 w-6 text-red-500" />
              Notable Strikers
            </h2>
            {loadingStrikers ? (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : strikers && strikers.length > 0 ? (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {strikers.map((striker) => (
                  <StrikerCard key={striker.id} striker={striker} />
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Fallback strikers */}
                <StrikerCardStatic nickname="THE DUMPLING" name="Vasily Kamotsky" description="Viral Russian sensation" />
                <StrikerCardStatic nickname="WOLVERINE" name="Ron Bata" description="LHW Champion" />
                <StrikerCardStatic nickname="PRETTY BOY" name="Isiah Quinones" description="Top contender" />
              </div>
            )}
          </section>

          {/* Tabs Section */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="markets">Markets</TabsTrigger>
              <TabsTrigger value="mybets">My Bets</TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="mt-6">
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
                    No upcoming events. Check back soon!
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="markets" className="mt-6">
              <Card className="border-red-900/30 bg-card/50">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Active markets for Slap Fighting will appear here. Create a market from an upcoming fight to get started!
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mybets" className="mt-6">
              <MyBets bets={bets} onStatusUpdate={checkBetStatus} onPayoutSubmit={submitPayoutAddress} />
            </TabsContent>
          </Tabs>

          {/* Promotions Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Promotions</h2>
            {loadingPromotions ? (
              <div className="grid md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : promotions && promotions.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-4">
                {promotions.map((promo) => (
                  <PromotionCard key={promo.id} promotion={promo} />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {/* Fallback promotions */}
                <PromotionCardStatic
                  name="POWER SLAP"
                  type="👋 Official League"
                  description="Dana White's slap fighting promotion"
                  youtube="https://youtube.com/powerslap"
                  rumble="https://rumble.com/c/powerslap"
                />
                <PromotionCardStatic
                  name="PUNCHDOWN"
                  type="🥊 Polish League"
                  description="European slap fighting"
                />
                <PromotionCardStatic
                  name="SLAP FIGHTING CHAMPIONSHIP"
                  type="🏆 SFC"
                  description="Independent slap events"
                />
              </div>
            )}
          </section>
        </div>

        <Footer />
      </div>
    </div>
  );
};

const StrikerCard = ({ striker }: { striker: Striker }) => (
  <Card className="border-red-900/30 bg-card/50 hover:border-red-700/50 transition-colors">
    <CardContent className="pt-6">
      <div className="text-center">
        <p className="text-lg font-bold text-red-400">{striker.nickname || striker.name}</p>
        {striker.nickname && (
          <p className="text-sm text-foreground">{striker.name}</p>
        )}
        {striker.division && (
          <p className="text-xs text-muted-foreground mt-1">{striker.division}</p>
        )}
        {striker.description && (
          <p className="text-sm text-muted-foreground mt-2">{striker.description}</p>
        )}
      </div>
    </CardContent>
  </Card>
);

const StrikerCardStatic = ({ nickname, name, description }: { nickname: string; name: string; description: string }) => (
  <Card className="border-red-900/30 bg-card/50 hover:border-red-700/50 transition-colors">
    <CardContent className="pt-6">
      <div className="text-center">
        <p className="text-lg font-bold text-red-400">{nickname}</p>
        <p className="text-sm text-foreground">{name}</p>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      </div>
    </CardContent>
  </Card>
);

const EventCard = ({ event }: { event: SlapEvent }) => (
  <Card className="border-red-900/30 bg-card/50">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>{event.event_name}</CardTitle>
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
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {event.date_raw || event.date}
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      {event.matchups && event.matchups.length > 0 && (
        <div className="space-y-2">
          {event.matchups.map((matchup, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex-1">
                <span className="font-medium">{matchup.fighter1}</span>
                <span className="mx-2 text-muted-foreground">vs</span>
                <span className="font-medium">{matchup.fighter2}</span>
                {matchup.title_fight && (
                  <Badge variant="outline" className="ml-2 border-yellow-600 text-yellow-400">Title</Badge>
                )}
              </div>
              <Button size="sm" variant="outline" className="border-red-700 text-red-400 hover:bg-red-950">
                Create Market
              </Button>
            </div>
          ))}
        </div>
      )}
      {(!event.matchups || event.matchups.length === 0) && (
        <Button variant="outline" className="w-full border-red-700 text-red-400 hover:bg-red-950">
          Create Market for Event
        </Button>
      )}
    </CardContent>
  </Card>
);

const PromotionCard = ({ promotion }: { promotion: SlapPromotion }) => (
  <Card className="border-red-900/30 bg-card/50 hover:border-red-700/50 transition-colors">
    <CardHeader>
      <CardTitle className="text-lg">{promotion.name}</CardTitle>
      <p className="text-sm text-red-400">{promotion.type}</p>
    </CardHeader>
    <CardContent className="space-y-3">
      {promotion.description && (
        <p className="text-sm text-muted-foreground">{promotion.description}</p>
      )}
      <div className="flex gap-2 flex-wrap">
        {promotion.youtube && (
          <a href={promotion.youtube} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1">
              <Youtube className="h-4 w-4" />
              YouTube
            </Button>
          </a>
        )}
        {promotion.rumble && (
          <a href={promotion.rumble} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1">
              <Tv className="h-4 w-4" />
              Rumble
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
  youtube, 
  rumble 
}: { 
  name: string; 
  type: string; 
  description: string;
  youtube?: string; 
  rumble?: string; 
}) => (
  <Card className="border-red-900/30 bg-card/50 hover:border-red-700/50 transition-colors">
    <CardHeader>
      <CardTitle className="text-lg">{name}</CardTitle>
      <p className="text-sm text-red-400">{type}</p>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="flex gap-2 flex-wrap">
        {youtube && (
          <a href={youtube} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1">
              <Youtube className="h-4 w-4" />
              YouTube
            </Button>
          </a>
        )}
        {rumble && (
          <a href={rumble} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1">
              <Tv className="h-4 w-4" />
              Rumble
            </Button>
          </a>
        )}
      </div>
    </CardContent>
  </Card>
);

export default Slap;
