import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { TrendingUp, Gamepad2, Trophy, Bitcoin, ChevronRight, Swords } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const categories = [
  {
    id: 'esports',
    title: 'Esports',
    description: 'Bet on competitive gaming matches',
    icon: Gamepad2,
    color: 'text-purple-500',
    subCategories: [
      { name: 'All Games', href: '/esports-predictions' },
      { name: 'StarCraft II', href: '/starcraft' },
    ],
  },
  {
    id: 'sports',
    title: 'Sports',
    description: 'Traditional sports betting markets',
    icon: Trophy,
    color: 'text-green-500',
    subCategories: [
      { name: 'All Sports', href: '/sports-predictions' },
      { name: 'Combat', href: '/predictions/sports/combat' },
      { name: 'Cricket', href: '/cricket-predictions' },
    ],
  },
  {
    id: 'crypto',
    title: 'Crypto',
    description: 'Predict price movements',
    icon: Bitcoin,
    color: 'text-orange-500',
    subCategories: [
      { name: 'All Crypto', href: '/predictions' },
    ],
  },
];

export default function PredictionsHub() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = searchParams.get('tab') || 'esports';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/predict?tab=${value}`, { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-3">Predictions</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Bet on esports, sports, and crypto with XMR. No accounts, no KYC.
            </p>
          </div>

          {/* Category Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="esports" className="gap-2">
                <Gamepad2 className="w-4 h-4" />
                Esports
              </TabsTrigger>
              <TabsTrigger value="sports" className="gap-2">
                <Trophy className="w-4 h-4" />
                Sports
              </TabsTrigger>
              <TabsTrigger value="crypto" className="gap-2">
                <Bitcoin className="w-4 h-4" />
                Crypto
              </TabsTrigger>
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id}>
                <div className="grid gap-4">
                  {category.subCategories.map((sub) => (
                    <Link key={sub.href} to={sub.href}>
                      <Card className="hover:border-primary/50 transition-all cursor-pointer group">
                        <CardContent className="flex items-center justify-between py-4">
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center`}>
                              <category.icon className={`h-5 w-5 ${category.color}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold">{sub.name}</h3>
                              <p className="text-sm text-muted-foreground">View markets →</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Quick Links */}
          <div className="mt-12 grid sm:grid-cols-3 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.id} className="bg-secondary/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${category.color}`} />
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                    </div>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {category.subCategories.map((sub) => (
                        <Link key={sub.href} to={sub.href}>
                          <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                            {sub.name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Help Link */}
          <div className="mt-8 text-center">
            <Link to="/how-betting-works">
              <Button variant="link" className="text-muted-foreground">
                New to prediction markets? Learn how it works →
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
