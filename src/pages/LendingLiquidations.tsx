import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HealthFactorBadge } from '@/components/lending/HealthFactorBadge';
import { lendingApi, parseAmount, formatUsd } from '@/lib/lending';
import { ArrowLeft, AlertTriangle, RefreshCw, ShieldAlert, Bot } from 'lucide-react';

interface LiquidatablePosition {
  token_hash: string;
  collateral: string;
  collateral_usd: string;
  debt: string;
  debt_usd: string;
  health_factor: string;
  liquidation_bonus: string;
}

const LendingLiquidations = () => {
  const [positions, setPositions] = useState<LiquidatablePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await lendingApi.getLiquidatable();
      setPositions(data.positions || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load liquidation data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Link to="/lending" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> All Markets
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Liquidation Monitor</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Positions with health factor below 1.0 are eligible for liquidation.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchData(); }} disabled={loading} className="gap-1">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Info banner */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="py-4 flex items-start gap-3">
            <Bot className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Automated Liquidations</p>
              <p>Liquidations are executed automatically by the protocol's liquidation bot. This dashboard is informational only — no manual action is needed.</p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2 mb-6">
            <AlertTriangle className="w-4 h-4" />
            {error}
            <Button variant="ghost" size="sm" onClick={fetchData} className="ml-auto gap-1">
              <RefreshCw className="w-3 h-3" /> Retry
            </Button>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!loading && positions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-3">Token (Anonymized)</th>
                  <th className="text-right py-3 px-3">Collateral</th>
                  <th className="text-right py-3 px-3">Debt</th>
                  <th className="text-right py-3 px-3">Health Factor</th>
                  <th className="text-right py-3 px-3">Liquidation Bonus</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="py-3 px-3 font-mono text-xs">{p.token_hash}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="font-mono">{p.collateral}</div>
                      <div className="text-xs text-muted-foreground">{formatUsd(parseAmount(p.collateral_usd))}</div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="font-mono">{p.debt}</div>
                      <div className="text-xs text-muted-foreground">{formatUsd(parseAmount(p.debt_usd))}</div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <HealthFactorBadge value={parseAmount(p.health_factor)} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-green-400">
                      {p.liquidation_bonus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && positions.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No liquidatable positions</p>
            <p className="text-sm mt-1">All positions are currently healthy.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default LendingLiquidations;
