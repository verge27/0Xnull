import { ShieldCheck, ShieldAlert, ShieldQuestion, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VerdictCardProps {
  likelySkips3ds: boolean | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  psp: string | null;
  targetUrl: string;
  timestamp: string;
}

export const VerdictCard = ({ likelySkips3ds, confidence, psp, targetUrl, timestamp }: VerdictCardProps) => {
  const isEnforced = likelySkips3ds === false;
  const isNotDetected = likelySkips3ds === true;
  const isInconclusive = likelySkips3ds === null;

  const verdictConfig = isEnforced
    ? { icon: ShieldCheck, label: '3DS Enforced', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' }
    : isNotDetected
    ? { icon: ShieldAlert, label: '3DS Not Detected', color: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10' }
    : { icon: ShieldQuestion, label: 'Inconclusive', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' };

  const confidenceColor =
    confidence === 'HIGH' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    : confidence === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    : 'bg-muted text-muted-foreground border-border';

  const Icon = verdictConfig.icon;

  return (
    <Card className={`${verdictConfig.border} ${verdictConfig.bg} border-2`}>
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Icon className={`w-16 h-16 ${verdictConfig.color} flex-shrink-0`} />
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <h2 className={`text-2xl font-bold ${verdictConfig.color}`}>{verdictConfig.label}</h2>
              <Badge variant="outline" className={confidenceColor}>
                {confidence} confidence
              </Badge>
            </div>
            {psp && (
              <p className="text-sm text-muted-foreground">
                PSP detected: <span className="text-foreground font-mono">{psp}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground font-mono truncate max-w-lg">{targetUrl}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center sm:justify-start">
              <Clock className="w-3 h-3" />
              {new Date(timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
