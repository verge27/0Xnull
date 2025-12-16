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
import { usePromotions, useFeaturedFights, useUpcomingEvents, Promotion, FeaturedFight, Event } from '@/hooks/useRussianMMA';
import { MyBets } from '@/components/MyBets';
import { usePredictionBets } from '@/hooks/usePredictionBets';

const RussianMMA = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const { data: promotions, isLoading: loadingPromotions } = usePromotions();
  const { data: featured, isLoading: loadingFeatured } = useFeaturedFights();
  const { data: events, isLoading: loadingEvents } = useUpcomingEvents();
  const { bets, checkBetStatus, submitPayoutAddress } = usePredictionBets();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/40 via-background to-background" />
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5 bg-cover bg-center" />
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-red-500 via-red-400 to-orange-500 bg-clip-text text-transparent">
              Russian Underground Fighting
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
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
        {/* Video Stream Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Tv className="h-6 w-6 text-red-500" />
            Live Stream
          </h2>
          <Card className="overflow-hidden border-red-900/30 bg-card/50">
            <div className="aspect-video w-full relative bg-black/50">
              <iframe
                src="https://www.youtube-nocookie.com/embed/live_stream?channel=UCAeCwHL4T91FKoYiFXHy0-g"
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-full h-full absolute inset-0"
                loading="lazy"
              />
              {/* Fallback overlay - shows if iframe fails to load */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-950/90 to-black/90 pointer-events-none opacity-0 [iframe:not([src])~&]:opacity-100">
                <Tv className="h-16 w-16 text-red-500 mb-4" />
                <p className="text-lg font-semibold mb-2">Video Unavailable</p>
                <p className="text-sm text-muted-foreground mb-4">Stream may be blocked in your region</p>
              </div>
            </div>
            <div className="p-4 flex flex-wrap gap-3 items-center justify-between bg-muted/30">
              <p className="text-sm text-muted-foreground">
                Video not loading? Open directly:
              </p>
              <div className="flex gap-2">
                <a 
                  href="https://www.youtube.com/channel/UCAeCwHL4T91FKoYiFXHy0-g/live" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="outline" className="gap-2 border-red-700 text-red-400 hover:bg-red-950">
                    <Youtube className="h-4 w-4" />
                    Live Stream
                  </Button>
                </a>
                <a 
                  href="https://www.youtube.com/channel/UCAeCwHL4T91FKoYiFXHy0-g" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="outline" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Channel
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        </section>

        {/* Featured Fights Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Featured Fights</h2>
          {loadingFeatured ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : featured && featured.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {featured.map((fight, idx) => (
                <FeaturedFightCard key={idx} fight={fight} />
              ))}
            </div>
          ) : (
            <Card className="border-red-900/30 bg-card/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                No featured fights at the moment. Check back soon!
              </CardContent>
            </Card>
          )}
        </section>

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
  );
};

const FeaturedFightCard = ({ fight }: { fight: FeaturedFight }) => (
  <Card className="border-red-900/30 bg-gradient-to-br from-card to-red-950/20 hover:border-red-700/50 transition-colors">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg text-red-400">{fight.event}</CardTitle>
        {fight.stream && (
          <Badge variant="outline" className="border-red-700 text-red-400">
            <Tv className="h-3 w-3 mr-1" />
            PPV
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {fight.date}
        </span>
        {fight.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {fight.location}
          </span>
        )}
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {fight.main_event && (
        <div className="text-center space-y-2">
          <div className="font-semibold text-lg">
            {fight.main_event.fighter_1.name}
            {fight.main_event.fighter_1.record && (
              <span className="text-muted-foreground font-normal ml-2">({fight.main_event.fighter_1.record})</span>
            )}
          </div>
          <div className="text-muted-foreground">vs</div>
          <div className="font-semibold text-lg">
            {fight.main_event.fighter_2.name}
            {fight.main_event.fighter_2.record && (
              <span className="text-muted-foreground font-normal ml-2">({fight.main_event.fighter_2.record})</span>
            )}
          </div>
          {(fight.main_event.fighter_1.note || fight.main_event.fighter_2.note) && (
            <div className="text-sm text-muted-foreground space-y-1 mt-2">
              {fight.main_event.fighter_1.note && <p>🎸 {fight.main_event.fighter_1.note}</p>}
              {fight.main_event.fighter_2.note && <p>🥊 {fight.main_event.fighter_2.note}</p>}
            </div>
          )}
        </div>
      )}
      {fight.stream && (
        <a 
          href={fight.stream.split(' ')[0]} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-red-400 hover:underline flex items-center gap-1"
        >
          📺 Watch: {fight.stream}
        </a>
      )}
      <Button className="w-full bg-red-600 hover:bg-red-700">
        Create Market
      </Button>
    </CardContent>
  </Card>
);

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
