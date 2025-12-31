import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, DollarSign, TrendingUp, Percent, Clock, User, Briefcase } from "lucide-react";
import { toast } from "sonner";

interface MonthlyData {
  month: string;
  organic_xmr: number;
  referred_xmr: number;
  share_xmr: number;
}

interface EarningsData {
  partner: string;
  role: string;
  rate: string;
  compensation: {
    base_monthly_usd: number;
    bonus_monthly_usd: number;
    volume_share_rate: number;
    residual_months_after_exit: number;
  };
  volume_share_earnings: {
    total_volume_xmr: number;
    referred_volume_xmr: number;
    organic_volume_xmr: number;
    partner_earnings_xmr: number;
  };
  monthly: MonthlyData[];
  payout_address: string;
  generated_at: string;
}

const PartnerEarnings = () => {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const response = await fetch("https://api.0xnull.io/api/marketing/partners/mostafa/earnings");
        if (!response.ok) {
          throw new Error("Failed to fetch earnings data");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load earnings data");
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  const copyAddress = () => {
    if (data?.payout_address) {
      navigator.clipboard.writeText(data.payout_address);
      setCopied(true);
      toast.success("Payout address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 12)}...${address.slice(-8)}`;
  };

  const formatXMR = (value: number) => {
    return value.toFixed(8);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-80 mb-2" />
          <Skeleton className="h-6 w-48 mb-8" />
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <p className="text-destructive">{error || "Failed to load earnings data"}</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Partner Earnings Dashboard</h1>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-lg font-medium text-foreground">{data.partner}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span>{data.role}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{data.rate}</p>
        </div>

        {/* Partner Earnings Highlight */}
        <Card className="border-emerald-500/30 bg-emerald-500/5 mb-8">
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-muted-foreground text-sm uppercase tracking-wider mb-2">Your Earnings</p>
              <p className="font-mono text-4xl md:text-5xl font-bold text-emerald-400">
                {formatXMR(data.volume_share_earnings.partner_earnings_xmr)} XMR
              </p>
              <p className="text-muted-foreground text-sm mt-2">From volume share</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Compensation Terms Card */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Compensation Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Base Monthly</span>
                <span className="font-semibold text-emerald-400">${data.compensation.base_monthly_usd.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Bonus Monthly</span>
                <span className="font-semibold text-emerald-400">${data.compensation.bonus_monthly_usd.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Volume Share Rate</span>
                <span className="font-semibold text-cyan-400">{(data.compensation.volume_share_rate * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Residual After Exit</span>
                <span className="font-semibold">{data.compensation.residual_months_after_exit} months</span>
              </div>
            </CardContent>
          </Card>

          {/* Volume Summary Card */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Volume Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Total Volume</span>
                <span className="font-mono text-sm">{formatXMR(data.volume_share_earnings.total_volume_xmr)} XMR</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Referred Volume</span>
                <span className="font-mono text-sm">{formatXMR(data.volume_share_earnings.referred_volume_xmr)} XMR</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Organic Volume</span>
                <span className="font-mono text-sm">{formatXMR(data.volume_share_earnings.organic_volume_xmr)} XMR</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-emerald-500/10 rounded-lg px-3 -mx-3">
                <span className="font-semibold text-foreground">Partner Earnings</span>
                <span className="font-mono font-bold text-emerald-400">{formatXMR(data.volume_share_earnings.partner_earnings_xmr)} XMR</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Breakdown Table */}
        <Card className="border-border/50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              Monthly Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Month</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Organic XMR</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Referred XMR</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Partner Share XMR</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthly.map((row, index) => (
                    <tr key={index} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-medium">{row.month}</td>
                      <td className="py-3 px-4 text-right font-mono text-sm">{formatXMR(row.organic_xmr)}</td>
                      <td className="py-3 px-4 text-right font-mono text-sm">{formatXMR(row.referred_xmr)}</td>
                      <td className="py-3 px-4 text-right font-mono text-sm text-cyan-400">{formatXMR(row.share_xmr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.monthly.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No earnings yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Payout Address:</span>
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-2 font-mono text-sm bg-muted/30 px-3 py-1.5 rounded hover:bg-muted/50 transition-colors"
                >
                  <span className="text-foreground">{truncateAddress(data.payout_address)}</span>
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Last updated: {new Date(data.generated_at).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default PartnerEarnings;
