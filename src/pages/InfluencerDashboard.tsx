import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, type VoucherStats, type VoucherLeaderboardEntry } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  Coins, 
  Trophy,
  Copy,
  Check,
  ArrowLeft,
  ExternalLink,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: boolean;
  subtext?: string;
}

function StatCard({ label, value, icon, highlight, subtext }: StatCardProps) {
  return (
    <Card className={`border-border/50 ${highlight ? 'bg-primary/5 border-primary/30' : 'bg-card/80'}`}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        <div className={`text-2xl font-bold ${highlight ? 'text-primary' : ''}`}>
          {value}
        </div>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface ShareableLinkProps {
  code: string;
}

function ShareableLinks({ code }: ShareableLinkProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  
  const baseUrl = window.location.origin;
  const links = [
    { label: 'Sports', path: '/sports-predictions' },
    { label: 'Esports', path: '/esports-predictions' },
    { label: 'Crypto', path: '/predictions' },
  ];

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader>
        <CardTitle className="text-lg">Your Referral Links</CardTitle>
        <CardDescription>
          Share these links with your audience - they'll automatically get your 17% fee discount
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {links.map((link) => {
          const fullUrl = `${baseUrl}${link.path}?voucher=${code}`;
          const isCopied = copiedUrl === fullUrl;
          
          return (
            <div 
              key={link.path} 
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30"
            >
              <span className="text-sm font-medium min-w-[60px]">{link.label}</span>
              <code className="text-xs text-muted-foreground flex-1 truncate font-mono">
                {fullUrl}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyLink(fullUrl)}
                className="shrink-0"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface LeaderboardProps {
  highlightCode: string;
}

function Leaderboard({ highlightCode }: LeaderboardProps) {
  const [leaders, setLeaders] = useState<VoucherLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await api.getVoucherLeaderboard();
        setLeaders(data.leaderboard);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankDisplay = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">Influencer Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Influencer Leaderboard
        </CardTitle>
        <CardDescription>
          Top performers by volume
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border/30">
              <TableHead className="w-[60px]">Rank</TableHead>
              <TableHead>Influencer</TableHead>
              <TableHead className="text-right">Volume (XMR)</TableHead>
              <TableHead className="text-right">Earnings (XMR)</TableHead>
              <TableHead className="text-right">Users</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaders.map((leader, i) => {
              const isHighlighted = leader.code === highlightCode;
              return (
                <TableRow 
                  key={leader.code} 
                  className={`border-border/30 ${isHighlighted ? 'bg-primary/5' : ''}`}
                >
                  <TableCell className="font-medium">
                    {getRankDisplay(i)}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{leader.influencer}</span>
                    {isHighlighted && (
                      <Badge variant="secondary" className="ml-2 text-xs">you</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {leader.volume_xmr.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-500">
                    {leader.earnings_xmr.toFixed(6)}
                  </TableCell>
                  <TableCell className="text-right">
                    {leader.users}
                  </TableCell>
                </TableRow>
              );
            })}
            {leaders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No leaderboard data yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function InfluencerDashboard() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<VoucherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!code) {
        setError('No voucher code provided');
        setLoading(false);
        return;
      }

      try {
        const data = await api.getVoucherStats(code);
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setError('Dashboard not found');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 bg-card/80">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error || 'Dashboard not found'}</p>
            <Button variant="outline" onClick={() => navigate('/influencer')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Try Another Code
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/influencer')}
                className="p-0 h-auto"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl md:text-3xl font-bold">
                {stats.influencer}'s Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <code className="px-3 py-1 rounded bg-muted/50 border border-border/30 font-mono text-sm tracking-widest">
                {stats.code}
              </code>
              {stats.active ? (
                <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
          </div>
          <p className="text-muted-foreground text-sm md:text-right">
            Share this code for 17% fee savings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Unique Users"
            value={stats.stats.unique_users}
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard
            label="Total Bets"
            value={stats.stats.total_bets}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatCard
            label="Volume (XMR)"
            value={stats.stats.total_volume_xmr.toFixed(4)}
            icon={<Coins className="h-4 w-4" />}
          />
          <StatCard
            label="Your Earnings"
            value={`${stats.stats.total_influencer_earnings.toFixed(6)} XMR`}
            icon={<Wallet className="h-4 w-4 text-green-500" />}
            highlight
            subtext={stats.stats.pending_payout > 0 ? `${stats.stats.pending_payout.toFixed(6)} XMR pending` : undefined}
          />
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-border/50 bg-card/80">
            <CardContent className="pt-6">
              <div className="text-muted-foreground text-sm mb-1">Total Wins (XMR)</div>
              <div className="text-xl font-bold">{stats.stats.total_wins_xmr.toFixed(4)}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80">
            <CardContent className="pt-6">
              <div className="text-muted-foreground text-sm mb-1">User Rebates Given</div>
              <div className="text-xl font-bold text-green-500">{stats.stats.total_user_rebates.toFixed(6)} XMR</div>
            </CardContent>
          </Card>
        </div>

        {/* Shareable Links */}
        <ShareableLinks code={stats.code} />

        {/* Leaderboard */}
        <Leaderboard highlightCode={stats.code} />

        {/* Payout Info */}
        <Card className="border-border/50 bg-muted/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Wallet className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Payout Information</p>
                <p className="text-sm text-muted-foreground">
                  To set or update your payout address, contact admin via{' '}
                  <a href="mailto:admin@0xnull.io" className="text-primary hover:underline">
                    admin@0xnull.io
                  </a>
                  {' '}or SimpleX Chat.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
