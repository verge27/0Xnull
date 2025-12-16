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
            <div className="aspect-video w-full">
              <iframe
                src="https://www.youtube.com/embed/live_stream?channel=UCAeCwHL4T91FKoYiFXHy0-g"
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-full h-full"
              />
            </div>
          </Card>
          <p className="text-sm text-muted-foreground mt-2">
            If no live stream is available, check the{' '}
            <a 
              href="https://www.youtube.com/channel/UCAeCwHL4T91FKoYiFXHy0-g" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-red-400 hover:underline"
            >
              channel
            </a>{' '}
            for recent uploads.
          </p>
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
              {featured.map((fight) => (
                <FeaturedFightCard key={fight.id} fight={fight} />
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
                  <EventCard key={event.id} event={event} />
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
        <CardTitle className="text-lg text-red-400">{fight.event_name}</CardTitle>
        {fight.stream_info && (
          <Badge variant="outline" className="border-red-700 text-red-400">
            <Tv className="h-3 w-3 mr-1" />
            {fight.stream_info.type}
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
      <div className="text-center space-y-2">
        <div className="font-semibold text-lg">
          {fight.fighter1.name}
          {fight.fighter1.record && (
            <span className="text-muted-foreground font-normal ml-2">({fight.fighter1.record})</span>
          )}
        </div>
        <div className="text-muted-foreground">vs</div>
        <div className="font-semibold text-lg">
          {fight.fighter2.name}
          {fight.fighter2.record && (
            <span className="text-muted-foreground font-normal ml-2">({fight.fighter2.record})</span>
          )}
        </div>
      </div>
      {(fight.fighter1.description || fight.fighter2.description) && (
        <div className="text-sm text-muted-foreground space-y-1">
          {fight.fighter1.description && <p>🎸 {fight.fighter1.description}</p>}
          {fight.fighter2.description && <p>🥊 {fight.fighter2.description}</p>}
        </div>
      )}
      {fight.stream_info?.url && (
        <a 
          href={fight.stream_info.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-red-400 hover:underline flex items-center gap-1"
        >
          📺 Watch: {fight.stream_info.url}
        </a>
      )}
      <Button className="w-full bg-red-600 hover:bg-red-700">
        {fight.market_id ? 'Bet Now' : 'Create Market'}
      </Button>
    </CardContent>
  </Card>
);

const EventCard = ({ event }: { event: Event }) => (
  <Card className="border-red-900/30 bg-card/50">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>{event.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{event.promotion}</p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {event.date}
          </div>
          {event.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.location}
            </div>
          )}
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {event.fight_card.map((matchup, idx) => (
          <div 
            key={idx} 
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <span className="font-medium">{matchup.fighter1.name}</span>
              <span className="text-muted-foreground mx-2">vs</span>
              <span className="font-medium">{matchup.fighter2.name}</span>
              {matchup.weight_class && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {matchup.weight_class}
                </Badge>
              )}
            </div>
            <Button size="sm" variant="outline" className="border-red-700 text-red-400 hover:bg-red-950">
              {matchup.market_id ? 'Bet' : 'Create Market'}
            </Button>
          </div>
        ))}
      </div>
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
      <p className="text-sm text-muted-foreground">{promotion.description}</p>
      {promotion.youtube_subscribers && (
        <p className="text-sm text-muted-foreground">{promotion.youtube_subscribers}</p>
      )}
      <div className="flex gap-2">
        {promotion.platforms.youtube && (
          <a href={promotion.platforms.youtube} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1">
              <Youtube className="h-4 w-4" />
              YouTube
            </Button>
          </a>
        )}
        {promotion.platforms.telegram && (
          <a href={promotion.platforms.telegram} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1">
              <MessageCircle className="h-4 w-4" />
              Telegram
            </Button>
          </a>
        )}
        {promotion.platforms.vk && (
          <a href={promotion.platforms.vk} target="_blank" rel="noopener noreferrer">
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
