import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpCircle, ExternalLink, Calendar, MapPin, Tv, Youtube, MessageCircle } from 'lucide-react';
import { usePromotions, useFeaturedFights, useUpcomingEvents, Promotion, Event } from '@/hooks/useRussianMMA';
import { MyBets } from '@/components/MyBets';
import { usePredictionBets } from '@/hooks/usePredictionBets';
import russianMmaBackground from '@/assets/russian-mma-background.jpg';

const RussianMMA = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const { data: promotions, isLoading: loadingPromotions } = usePromotions();
  const { data: featured, isLoading: loadingFeatured } = useFeaturedFights();
  const { data: events, isLoading: loadingEvents } = useUpcomingEvents();
  const { bets, checkBetStatus, submitPayoutAddress } = usePredictionBets();

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
                Russian Underground Fighting
              </h1>
              <p className="text-xl md:text-2xl text-white/90 font-medium">
                Bare-Knuckle Boxing • POP-MMA • Freak Fights
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
            Watch Live
          </h2>
          <a 
            href="https://www.youtube.com/channel/UCAeCwHL4T91FKoYiFXHy0-g" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block group"
          >
            <Card className="overflow-hidden border-red-900/30 bg-card/50 hover:border-red-600/50 transition-all">
              <div className="relative aspect-[21/9] w-full bg-gradient-to-br from-black via-red-950/80 to-black overflow-hidden">
                {/* Gritty overlay pattern */}
                <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]" />
                
                {/* Red glow effects */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-red-800/30 rounded-full blur-2xl" />
                
                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="mb-4">
                    <Youtube className="h-16 w-16 text-red-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-2 text-white">
                    Watch Top Dog FC Fights
                  </h3>
                  <p className="text-lg text-red-400 font-semibold mb-1">
                    Bare-Knuckle Boxing • POP-MMA • Freak Fights
                  </p>
                  <p className="text-muted-foreground mb-6">
                    1.5M+ Subscribers
                  </p>
                  <Button size="lg" className="bg-red-600 hover:bg-red-700 gap-2 group-hover:scale-105 transition-transform">
                    <Youtube className="h-5 w-5" />
                    Watch on YouTube
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          </a>
        </section>

        {/* Highlights Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Youtube className="h-6 w-6 text-red-500" />
            Recent Highlights
          </h2>
          <div className="max-w-2xl">
            <div className="aspect-video rounded-lg overflow-hidden border border-red-900/30">
              <iframe 
                src="https://www.youtube.com/embed/videoseries?list=UUAeCwHL4T91FKoYiFXHy0-g"
                width="100%" 
                height="100%"
                frameBorder="0" 
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title="Top Dog FC Videos"
                className="w-full h-full"
              />
            </div>
            <a 
              href="https://www.youtube.com/channel/UCAeCwHL4T91FKoYiFXHy0-g" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-3 inline-block"
            >
              <Button variant="outline" size="sm" className="gap-2 border-red-700 text-red-400 hover:bg-red-950">
                <ExternalLink className="h-3 w-3" />
                View Full Channel
              </Button>
            </a>
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
                  <CardTitle className="text-xl text-red-400">{featured.upcoming.event}</CardTitle>
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
                        <p className="font-semibold text-red-400">{result.event}</p>
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
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
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
                  No upcoming events. Check back soon!
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="markets" className="mt-6">
            <Card className="border-red-900/30 bg-card/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                Active markets for Russian MMA will appear here. Create a market from an upcoming fight to get started!
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
              {/* Fallback static promotions */}
              <PromotionCardStatic
                name="TOP DOG FC"
                type="🥊 Bare-Knuckle"
                description="1.5M+ YouTube subs"
                extra="PPV on topdogfc.tv"
                youtube="https://www.youtube.com/@TopDogFighting"
                telegram="https://t.me/topdogfighting"
              />
              <PromotionCardStatic
                name="HARDCORE FC"
                type="🥋 MMA + Fist"
                description="VK Exclusive"
                extra="Post-event edits"
                youtube="https://www.youtube.com/@HardcoreFC"
                vk="https://vk.com/hardcorefc"
              />
              <PromotionCardStatic
                name="PUNCH CLUB"
                type="🎪 Freak Fights"
                description="Phone booth fights"
                extra="Car Jitsu • Shipping containers"
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


const EventCard = ({ event }: { event: Event }) => (
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
    <CardContent>
      <Button variant="outline" className="w-full border-red-700 text-red-400 hover:bg-red-950">
        Create Market for Event
      </Button>
    </CardContent>
  </Card>
);

const PromotionCard = ({ promotion }: { promotion: Promotion }) => (
  <Card className="border-red-900/30 bg-card/50 hover:border-red-700/50 transition-colors">
    <CardHeader>
      <CardTitle className="text-lg">{promotion.name}</CardTitle>
      <p className="text-sm text-red-400">{promotion.type}</p>
    </CardHeader>
    <CardContent className="space-y-3">
      {promotion.country && (
        <p className="text-sm text-muted-foreground">{promotion.country}</p>
      )}
      <div className="flex gap-2 flex-wrap">
        {promotion.youtube && (
          <a href={`https://www.youtube.com/channel/${promotion.youtube}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1">
              <Youtube className="h-4 w-4" />
              YouTube
            </Button>
          </a>
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
  youtube, 
  telegram, 
  vk 
}: { 
  name: string; 
  type: string; 
  description: string; 
  extra?: string; 
  youtube?: string; 
  telegram?: string; 
  vk?: string; 
}) => (
  <Card className="border-red-900/30 bg-card/50 hover:border-red-700/50 transition-colors">
    <CardHeader>
      <CardTitle className="text-lg">{name}</CardTitle>
      <p className="text-sm text-red-400">{type}</p>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">{description}</p>
      {extra && <p className="text-sm text-muted-foreground">{extra}</p>}
      <div className="flex gap-2 flex-wrap">
        {youtube && (
          <a href={youtube} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1">
              <Youtube className="h-4 w-4" />
              YouTube
            </Button>
          </a>
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
