import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Swords, ChevronRight, HelpCircle, ArrowRight } from 'lucide-react';

const combatCategories = [
  {
    id: 'all',
    title: 'All Combat',
    description: 'All combat sports markets',
    href: '/predictions/sports/combat',
  },
  {
    id: 'mma',
    title: 'MMA',
    description: 'UFC, Bellator, PFL',
    href: '/predictions/sports/combat/mma',
  },
  {
    id: 'boxing',
    title: 'Boxing',
    description: 'Professional boxing',
    href: '/predictions/sports/combat/boxing',
  },
  {
    id: 'eastern',
    title: 'Eastern',
    description: 'ONE, Road FC, Top Dog',
    href: '/predictions/sports/combat/eastern',
  },
  {
    id: 'slap',
    title: 'Slap',
    description: 'Power Slap, Punchdown',
    href: '/predictions/sports/combat/slap',
  },
];

export default function CombatSports() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = searchParams.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'all') {
      navigate('/predictions/sports/combat', { replace: true });
    } else {
      navigate(`/predictions/sports/combat/${value}`, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/predict" className="hover:text-foreground">Predictions</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/sports-predictions" className="hover:text-foreground">Sports</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Combat</span>
          </div>

          {/* Hero */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-500/10 mb-6">
              <Swords className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-4xl font-bold mb-3">Combat Sports</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              MMA • Boxing • Eastern Fighting • Slap
            </p>
          </div>

          {/* Category Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="mma">MMA</TabsTrigger>
              <TabsTrigger value="boxing">Boxing</TabsTrigger>
              <TabsTrigger value="eastern">Eastern</TabsTrigger>
              <TabsTrigger value="slap">Slap</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid gap-4">
                {combatCategories.filter(c => c.id !== 'all').map((category) => (
                  <Link key={category.href} to={category.href}>
                    <Card className="hover:border-red-500/50 transition-all cursor-pointer group">
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <Swords className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{category.title}</h3>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-red-500 transition-colors" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="mma">
              <Card className="bg-secondary/30">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">MMA markets coming soon</p>
                  <p className="text-sm text-muted-foreground">UFC, Bellator, PFL, and more</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="boxing">
              <Card className="bg-secondary/30">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">Boxing markets coming soon</p>
                  <p className="text-sm text-muted-foreground">Professional boxing events</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="eastern">
              <div className="text-center py-4">
                <Link to="/predictions/sports/combat/eastern">
                  <Button className="bg-red-600 hover:bg-red-700">
                    Go to Eastern Combat Markets →
                  </Button>
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="slap">
              <div className="text-center py-4">
                <Link to="/predictions/sports/combat/slap">
                  <Button className="bg-red-600 hover:bg-red-700">
                    Go to Slap Fighting Markets →
                  </Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Links */}
          <div className="mt-12 grid sm:grid-cols-2 gap-4">
            <Card className="bg-secondary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">🥋 Eastern Combat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  ONE Championship, Top Dog FC, Road FC, and more underground fighting
                </p>
                <Link to="/predictions/sports/combat/eastern">
                  <Button variant="outline" size="sm">View Markets →</Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="bg-secondary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">👋 Slap Fighting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Power Slap, Punchdown, and Slap Fighting Championship
                </p>
                <Link to="/predictions/sports/combat/slap">
                  <Button variant="outline" size="sm">View Markets →</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Banners */}
          <div className="mt-8 space-y-3">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Need XMR to place bets?</p>
              <Link to="/swaps" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Get XMR <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 border border-secondary flex items-center justify-between">
              <p className="text-sm text-muted-foreground">New to parimutuel betting?</p>
              <Link to="/how-betting-works" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                <HelpCircle className="w-4 h-4" /> Learn How It Works
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
